# Supabase 与 Auth（顺路拼车）

本应用已改为 **邮箱 + 密码** 注册/登录，不再使用 Magic Link，**无需**再配置邮件模板里的 Magic Link / PKCE 回调。

若将来需要「忘记密码」等 **Supabase Auth 邮件**，可在控制台 **Authentication → Email Templates** 中编辑，项目 ref 见 `.env.local` 中的 `NEXT_PUBLIC_SUPABASE_URL`。

其他数据库迁移说明见 [`README.md`](../README.md)。
