/**
 * 在远程 Supabase 上执行 migrations 里的 SQL。
 * 需要 Supabase 账号的 Personal Access Token（与 anon/service key 不同）：
 * https://supabase.com/dashboard/account/tokens
 *
 * 用法：
 *   SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/apply-migration-to-supabase.mjs
 *
 * 或设置 DATABASE_URL（数据库直连 URI，见控制台 Settings → Database）：
 *   DATABASE_URL=postgresql://postgres.xxx:PASSWORD@... node scripts/apply-migration-pg.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_REF = "xbizawjeqrjiuxasmzzv";
const MIGRATION = path.join(
  __dirname,
  "..",
  "supabase",
  "migrations",
  "20260330180000_init.sql"
);

const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error(
    "缺少 SUPABASE_ACCESS_TOKEN。在 https://supabase.com/dashboard/account/tokens 创建 PAT 后：\n" +
      "  SUPABASE_ACCESS_TOKEN=sbp_... node scripts/apply-migration-to-supabase.mjs"
  );
  process.exit(1);
}

const query = fs.readFileSync(MIGRATION, "utf8");

const res = await fetch(
  `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  }
);

const text = await res.text();
if (!res.ok) {
  console.error(res.status, text);
  process.exit(1);
}
console.log("OK:", res.status, text || "(empty body)");
