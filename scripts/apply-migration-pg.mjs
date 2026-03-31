/**
 * 通过 Postgres 连接串在远程 Supabase 上执行 migrations 里的 SQL。
 * 在控制台 Settings → Database 复制 URI（含数据库密码，与 API keys 不同）。
 *
 * 用法：
 *   DATABASE_URL=postgresql://postgres.xxx:PASSWORD@... node scripts/apply-migration-pg.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATION = path.join(
  __dirname,
  "..",
  "supabase",
  "migrations",
  "20260330180000_init.sql"
);

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error(
    "缺少 DATABASE_URL。在 Supabase 控制台 Settings → Database 复制连接 URI，然后：\n" +
      "  DATABASE_URL=postgresql://... node scripts/apply-migration-pg.mjs"
  );
  process.exit(1);
}

const sql = fs.readFileSync(MIGRATION, "utf8");
const client = new pg.Client({ connectionString });

try {
  await client.connect();
  await client.query(sql);
  console.log("OK: migration applied");
} catch (err) {
  console.error(err);
  process.exit(1);
} finally {
  await client.end();
}
