# 腾讯云点播接入

## 已确认的公开编号

- AppID：`1459516471`
- 测试视频 FileID：`5001834813653184018`

AppID 和 FileID 不是密码。不要把播放密钥、SecretId 或 SecretKey 发给任何人。

## Vercel 环境变量

进入 Vercel 项目 → Environment Variables，添加：

```text
TENCENT_VOD_APP_ID
1459516471
```

```text
TENCENT_VOD_PLAYBACK_KEY
填写腾讯云“默认分发配置”中的播放密钥
```

测试原始视频时：

```text
TENCENT_VOD_AUDIO_VIDEO_TYPE
Original
```

完成“转自适应码流”后，改为：

```text
TENCENT_VOD_AUDIO_VIDEO_TYPE
RawAdaptive
```

并添加腾讯云任务显示的自适应码流模板 ID：

```text
TENCENT_VOD_ADAPTIVE_DEFINITION
模板ID数字
```

保存环境变量后重新部署。

## 绑定课程视频

1. 老师登录网站。
2. 打开 `/admin#course-videos`。
3. 选择课程章节和视频小节。
4. 粘贴腾讯云数字 FileID。
5. 点击 `Save video`。

学生只有在登录并获得对应章节权限后才能获取一小时有效的播放签名。
