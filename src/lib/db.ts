import Database from "better-sqlite3";
import path from "path";
import { nanoid } from "nanoid";

const DB_PATH = path.join(process.cwd(), "data", "ride-along.db");

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    initTables(_db);
  }
  return _db;
}

function initTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      dest_name TEXT NOT NULL,
      dest_lat REAL NOT NULL,
      dest_lng REAL NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS participants (
      id TEXT PRIMARY KEY,
      activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL,
      nickname TEXT NOT NULL,
      location_name TEXT,
      location_lat REAL,
      location_lng REAL,
      has_car INTEGER NOT NULL DEFAULT 0,
      seats INTEGER NOT NULL DEFAULT 0,
      assigned_driver TEXT REFERENCES participants(id) ON DELETE SET NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      UNIQUE(activity_id, user_id)
    );
  `);
}

export interface Activity {
  id: string;
  name: string;
  dest_name: string;
  dest_lat: number;
  dest_lng: number;
  created_at: number;
}

export interface Participant {
  id: string;
  activity_id: string;
  user_id: string;
  nickname: string;
  location_name: string | null;
  location_lat: number | null;
  location_lng: number | null;
  has_car: number;
  seats: number;
  assigned_driver: string | null;
  created_at: number;
}

export function createActivity(
  name: string,
  destName: string,
  destLat: number,
  destLng: number
): Activity {
  const db = getDb();
  const id = nanoid(10);
  db.prepare(
    `INSERT INTO activities (id, name, dest_name, dest_lat, dest_lng) VALUES (?, ?, ?, ?, ?)`
  ).run(id, name, destName, destLat, destLng);
  return db.prepare(`SELECT * FROM activities WHERE id = ?`).get(id) as Activity;
}

export function getActivity(id: string): Activity | undefined {
  const db = getDb();
  return db.prepare(`SELECT * FROM activities WHERE id = ?`).get(id) as
    | Activity
    | undefined;
}

export function getParticipants(activityId: string): Participant[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM participants WHERE activity_id = ? ORDER BY created_at ASC`
    )
    .all(activityId) as Participant[];
}

export function joinActivity(
  activityId: string,
  userId: string,
  nickname: string
): Participant {
  const db = getDb();
  const id = nanoid(10);
  const existing = db
    .prepare(
      `SELECT * FROM participants WHERE activity_id = ? AND user_id = ?`
    )
    .get(activityId, userId) as Participant | undefined;
  if (existing) {
    if (existing.nickname !== nickname) {
      db.prepare(`UPDATE participants SET nickname = ? WHERE id = ?`).run(
        nickname,
        existing.id
      );
    }
    return db
      .prepare(`SELECT * FROM participants WHERE id = ?`)
      .get(existing.id) as Participant;
  }
  db.prepare(
    `INSERT INTO participants (id, activity_id, user_id, nickname) VALUES (?, ?, ?, ?)`
  ).run(id, activityId, userId, nickname);
  return db.prepare(`SELECT * FROM participants WHERE id = ?`).get(id) as Participant;
}

export function updateParticipant(
  participantId: string,
  updates: {
    location_name?: string;
    location_lat?: number;
    location_lng?: number;
    has_car?: number;
    seats?: number;
    nickname?: string;
  }
): Participant | undefined {
  const db = getDb();
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      sets.push(`${key} = ?`);
      values.push(value);
    }
  }
  if (sets.length === 0) {
    return db
      .prepare(`SELECT * FROM participants WHERE id = ?`)
      .get(participantId) as Participant | undefined;
  }
  values.push(participantId);
  db.prepare(`UPDATE participants SET ${sets.join(", ")} WHERE id = ?`).run(
    ...values
  );
  // If participant switched from driver to passenger, unassign anyone riding with them
  if (updates.has_car === 0) {
    db.prepare(
      `UPDATE participants SET assigned_driver = NULL WHERE assigned_driver = ?`
    ).run(participantId);
  }
  return db
    .prepare(`SELECT * FROM participants WHERE id = ?`)
    .get(participantId) as Participant | undefined;
}

export function assignRide(
  passengerId: string,
  driverId: string | null
): void {
  const db = getDb();
  db.prepare(`UPDATE participants SET assigned_driver = ? WHERE id = ?`).run(
    driverId,
    passengerId
  );
}

export function bulkAssignRides(
  assignments: { passengerId: string; driverId: string }[]
): void {
  const db = getDb();
  const stmt = db.prepare(
    `UPDATE participants SET assigned_driver = ? WHERE id = ?`
  );
  const tx = db.transaction(
    (items: { passengerId: string; driverId: string }[]) => {
      for (const { passengerId, driverId } of items) {
        stmt.run(driverId, passengerId);
      }
    }
  );
  tx(assignments);
}

export function clearAssignments(activityId: string): void {
  const db = getDb();
  db.prepare(
    `UPDATE participants SET assigned_driver = NULL WHERE activity_id = ? AND has_car = 0`
  ).run(activityId);
}
