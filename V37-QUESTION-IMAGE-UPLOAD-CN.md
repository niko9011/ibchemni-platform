# V37 Question Hub 直接上传图片

本版本把 Question Hub 的“粘贴图片链接”升级为直接选择图片上传：

- 学生登录后，可在提交问题时从手机相册或电脑选择图片。
- 老师可在后台发布答案时直接上传题图、解题过程或示意图。
- 选择图片后会先显示预览；支持 JPG、PNG、WebP，单张不超过 10 MB。
- 学生原图保存在腾讯云 COS，只有老师登录后台后可以打开。
- 老师发布的题目图片通过网站安全读取，并继续兼容以前填写的图片 URL。

## 上线方法

把本版本完整上传到现有 GitHub 仓库并等待 Vercel 显示 Ready。此次没有数据库字段变更，不需要再次运行 `question-media` 初始化。

图片上传继续使用已有的以下 Vercel 环境变量：

- `TENCENT_COS_SECRET_ID`
- `TENCENT_COS_SECRET_KEY`
- `TENCENT_COS_BUCKET`
- `TENCENT_COS_REGION`

腾讯云 COS 跨域规则需要允许网站域名发起 `PUT` 请求，并允许 `Content-Type` 请求头。若原有后台 PDF 直传已经可用，通常无需修改。
