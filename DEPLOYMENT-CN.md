# 后台系统上线说明

这个项目是 `platform-app`，它不是普通静态网页，不能像之前一样只拖一个 zip 到 Netlify Drop。

它需要：

- 一个可以运行 Next.js 后台的网站平台
- 一个 PostgreSQL 数据库
- 环境变量
- 初始化数据库

## 推荐上线方式

第一版建议用：

- Vercel 部署 Next.js 后台
- Neon / Supabase / Vercel Postgres 作为 PostgreSQL 数据库

如果继续用 Netlify，也可以，但要用 Netlify 的 Next.js 部署，不是静态拖拽部署。

## 需要设置的环境变量

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/ibchemni"
DATABASE_URL_UNPOOLED="postgresql://USER:PASSWORD@HOST:5432/ibchemni"
SESSION_SECRET="一长串随机密码"
TEACHER_EMAIL="ibchemistryni@163.com"
TEACHER_PASSWORD="你的老师后台登录密码"
```

`SESSION_SECRET` 可以随便生成一长串，例如 32 位以上的随机英文数字。

## 上线后的初始化

现在 build 命令会自动运行：

```bash
prisma db push
tsx scripts/seed.ts
```

作用：

- `prisma db push` 创建数据库表
- `seed.ts` 创建老师账号，并导入 22 个 SL / HL 章节课程

## 老师怎么用

上线后进入：

```text
/login
```

用：

```text
邮箱：ibchemistryni@163.com
密码：TEACHER_PASSWORD 里设置的密码
```

登录后进入：

```text
/admin
```

你可以：

- 创建学生账号
- 设置学生临时密码
- 选择学生
- 选择某一章课程
- 点击 Open access 开通权限
- 点击 Close access 关闭权限

## 学生怎么用

学生进入：

```text
/login
```

用你给她的邮箱和临时密码登录。

登录后进入：

```text
/dashboard
```

她只能看到你给她开通的章节。

## 后面要接的视频和资料

- 视频放腾讯云 VOD
- PDF 放腾讯云 COS
- 数据库里只保存 VOD ID 和 COS 文件 key
- 学生有权限时，系统再生成安全播放/下载链接
