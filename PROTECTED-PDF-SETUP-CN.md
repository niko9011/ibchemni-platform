# 受保护 PDF 资料配置

## 1. 创建腾讯云 COS 存储桶

- 地域建议选择广州 `ap-guangzhou`。
- 访问权限必须选择“私有读写”。
- 不要把存储桶或资料文件设置为公有读。

## 2. 配置跨域访问 CORS

在存储桶的“安全管理 / 跨域访问 CORS”中添加规则：

- 来源 Origin：`https://ibchemistryni.com`
- 操作 Methods：`PUT`、`GET`、`HEAD`
- Allow-Headers：`*`
- Expose-Headers：`ETag`
- 缓存时间 Max-Age：`600`

## 3. 创建最小权限 CAM 子用户

不要使用主账号永久密钥。为网站创建单独的 CAM 子用户，只授权该存储桶中
`course-resources/*` 路径的 `PutObject` 和 `GetObject` 权限。

## 4. 在 Vercel 添加环境变量

```text
TENCENT_COS_SECRET_ID=子用户 SecretId
TENCENT_COS_SECRET_KEY=子用户 SecretKey
TENCENT_COS_BUCKET=完整存储桶名称（包含 APPID）
TENCENT_COS_REGION=ap-guangzhou
```

四项均选择 Production 和 Preview。保存后重新部署。

## 5. 创建 S1 Part 1 资料卡

部署成功后打开（把“你的SETUP_TOKEN”替换为 Vercel 中保存的值）：

```text
https://ibchemistryni.com/api/setup?step=hl-s1-part1-resources&token=你的SETUP_TOKEN
```

看到 `"ok":true` 后，进入 Teacher Admin 的 “Upload protected course PDFs”。

## 6. 上传资料

按照资料卡名称逐一选择 PDF 上传。上传完成后，学生须登录且拥有对应章节权限，
才能获得 5 分钟有效的临时打开链接。

付费 PDF 不要上传到 GitHub，也不要放进网站 `public` 文件夹。

