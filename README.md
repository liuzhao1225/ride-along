# 顺路拼车 · Ride Along

熟人活动场景下的拼车协调 Web 应用：创建活动、选择目的地、参与者填写出发地与车辆信息，支持自动顺路匹配与地图路线预览。

## 功能

- **登录**：Supabase **邮箱 + 密码**（注册需昵称、邮箱、密码与确认密码），会话由 Supabase Auth 管理  
- **活动**：创建活动（名称 + 高德地图选点）、通过活动 ID 或链接加入  
- **参与者**：昵称、出发地、是否有车与座位数、上车/下车、自动分配  
- **匹配**：基于 Haversine 距离的贪心最小绕路分配（`src/lib/matching.ts`）  
- **地图**：高德 JS API — 地点搜索、路线展示（需配置 Key）

## 技术栈

- Next.js（App Router）· React 19 · Tailwind CSS 4 · **Supabase**（Postgres + Auth）  
- 地图：高德开放平台 [Web 端 JS API](https://lbs.amap.com/)

## 数据库

与同项目其他应用**共用**同一 Supabase 项目；本应用表名均以 **`ride_along_`** 开头，避免冲突：

- `ride_along_activities`
- `ride_along_participants`

任选其一在远程库创建表并启用 RLS（**同一迁移不要重复执行**，已存在表时会报错）：

1. **SQL Editor**：打开 [Supabase SQL Editor](https://supabase.com/dashboard/project/xbizawjeqrjiuxasmzzv/sql)，粘贴 [`supabase/migrations/20260330180000_init.sql`](supabase/migrations/20260330180000_init.sql) 全文并运行。
2. **Management API**（需 [Account Personal Access Token](https://supabase.com/dashboard/account/tokens)，与 anon / service role 不同）：  
   `SUPABASE_ACCESS_TOKEN=sbp_... pnpm db:apply`
3. **数据库直连**（Settings → Database 复制 **URI**，含数据库密码）：  
   `DATABASE_URL=postgresql://... pnpm db:apply:pg`

## 本地开发

```bash
pnpm install
pnpm dev
```

浏览器访问 <http://localhost:3000>。

## 环境变量

复制 `.env.example` 为 `.env.local` 并填写：

| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | 服务端专用（仅服务端读写，勿提交到前端） |
| `NEXT_PUBLIC_AMAP_KEY` | 高德 **Web 端（JS API）** Key |
| `NEXT_PUBLIC_AMAP_SECURITY_CODE` | 若控制台启用了安全密钥则填写 |

高德控制台需将站点域名加入 **JS API 安全设置**（开发可加 `localhost`）。

### 邮箱 + 密码（Supabase 控制台）

1. **Authentication → Providers → Email**：启用 **Email** 与 **密码登录**（SignInWithPassword / SignUp）。
2. **Confirm email**：若希望注册后立即能登录，保持关闭；若开启，新用户需先确认邮箱。
3. **密码策略**：在 **Authentication → Providers → Email** 的 **Password requirements** 中设置。若不想强制大小写+数字+符号，选 **No required characters**（或较低档位），否则注册失败时 Supabase 会校验复杂度。
4. **忘记密码**：当前应用未实现「重置密码」流程；如需，可后续在 Supabase 邮件模板中启用并接入 `resetPasswordForEmail`。

## 脚本

```bash
pnpm dev      # 开发
pnpm build    # 生产构建
pnpm start    # 生产启动（默认端口 3000，可用 next start -p <端口>）
pnpm lint     # ESLint
```

## 生产部署注意

- `NEXT_PUBLIC_*` 须在 **`pnpm build` 之前** 存在于构建环境。  
- `SUPABASE_SERVICE_ROLE_KEY` 仅用于服务器端 Route Handler，请勿暴露给浏览器。
