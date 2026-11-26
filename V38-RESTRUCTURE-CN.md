# V38 站点重构说明（7 板块架构）

V38 = V37（Question Hub 图片上传）+ V35（quiz 嵌入）两条代码线的合并 + 最新 quiz 引擎（含 2026-11-25 新考纲题库）。

## 新的 7 板块导航

| # | 板块 | 路由 | 实现 |
|---|------|------|------|
| 1 | 老师简介 + 学生家长评价 | `/about`（Stories 入口在页内） | 沿用 V37 |
| 2 | Question Hub（学生提问、老师解答） | `/questions` | V37 版，支持题目截图上传（question-media API + COS） |
| 3 | Past Paper Questions（真题分章练习） | `/past-paper-questions` | 公开 iframe：quiz `#topic`（Topical SL/HL 全部题库） |
| 4 | Topical by Chapter（按章节，购买权限） | `/topical` | 服务端读取该学生 active enrollments → 生成 IBQ 访问码 → quiz 只解锁其购买章节（映射见 `lib/quiz-code.ts`） |
| 5 | Full Past Papers（成套整卷） | `/past-paper-sets` | 公开 iframe：quiz `#sets`（SL/HL Past Papers，Set 1–19） |
| 6 | Exam Sprint（大考冲刺） | `/exam-sprint` | P1B / P2 两个专项 tab，iframe `#p1b` / `#p2`（P1B 银行 = 2025–2026 真题 45 大题） |
| 7 | IA Programme（IA 系列课程） | `/ia` | 课程落地页（6 模块 + 报名 CTA），后续接 VOD 视频 |

辅助路由：`/video-tutor` → 重定向 `/dashboard`（保留旧入口）；首页卡片改为 8 项直达。

## quiz 引擎（public/ib-quiz-platform/）

- 来自最新 ib-quiz 仓库（commit c93a8f9）：175 章 4058 题 = Pre-IB + Topical SL/HL（含新考纲 16 套 600 题）+ P1B 银行（SL 21 / HL 24）+ 成套 38 套（74 卷）。
- 新增 URL 引导（app.js bootFromUrl）：`#topic/#sets/#p1b/#p2/#preib` 预选 tab；`?code=IBQ…` 静默应用班级访问码（平台 `/topical` 专用）。
- 章节映射（lib/quiz-code.ts）：购买章节产品 → 自动解锁对应老考纲章 + 新考纲套（含尚未导入的 S1/R2.2-SL，题目到位后立即生效）。

## 部署（GitHub → Vercel）

1. GitHub Desktop 克隆 `niko9011/ibchemni-platform`，把本包解压后的**全部文件**复制进仓库（覆盖同名，保留 `.git`），提交推送 `main`，Vercel 自动构建。
2. 环境变量沿用现有（DATABASE_URL、SESSION_SECRET、TEACHER_EMAIL/PASSWORD、COS/VOD keys）；**不要**重新跑 `/api/setup`（数据库已有数据）。
3. 腾讯云 CloudBase 控制台 → 授权域名：新增 `ibchemistryni.com`（现在只有 yt928gkgz5-star.github.io）——否则站内做题的云端成绩上报/学生账号在主站域名下静默失败。
4. 包体积约 220MB（quiz 题图为主），网页上传不行，务必用 GitHub Desktop。

## 已知边界

- `/topical` 的访问码在 iframe URL 中可见——学生理论上可把码抄给同学共用同一套解锁；与 quiz 站班级码同一安全级别，防作弊需后台。
- CloudBase 学生账号/成绩在两个域名（github.io 与 ibchemistryni.com）各自独立 localStorage，但云端按姓名合并。
