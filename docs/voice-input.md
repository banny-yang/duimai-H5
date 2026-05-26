# H5 语音输入

## 流程（微信式）

1. 点击输入栏左侧 **麦克风** → 输入区切换为 **「按住 说话」** 条（⌨️ 可切回键盘）。
2. 松开后：聊天列表立即出现 **语音气泡**（可点击播放；气泡宽度与时长 1–60 秒成正比，参考微信）。
3. 单条最长 **60 秒**，录满后自动发送。
4. 后台 `POST /api/runner/chat/speech-to-text` 转写完成后，**自动** `POST /api/runner/chat` 发送文字给 AI（`inputSource: voice`、`voiceDurationMs`），运营端对话记录会标记为 **语音转写**。

后端由 **8091 选手服务** 转发至 Dify：

- `POST {Dify API 根地址}/audio-to-text`
- `Authorization: Bearer app-xxxxxxxx`（运营平台「Dify 配置」中的应用 API Key）
- `multipart/form-data` 字段 `file`（mp3 / wav / m4a / webm 等）

## 配置

### 1. Dify 控制台（必做）

| 步骤 | 操作 |
|------|------|
| STT 模型 | **设置 → 模型供应商**：配置语音识别（Speech2Text / STT）并设默认 |
| 应用功能 | 打开用于 H5 的 **聊天助手/Agent** → **功能（Function）** → 开启 **Speech to Text** |
| 发布 | **发布应用**（仅保存草稿不生效） |
| API Key | 复制该已发布应用的 **API Key**（`app-` 开头） |

若接口返回 `Speech to text is not enabled`：**对话用的 Agent Key 通常未开 STT**。请单独建一个只开 STT 的应用，将其 Key 填到对麦「语音转写应用 API Key」。

### 2. 对麦运营平台

1. **Dify 配置**（`/admin/dify-config`）：API 地址 + **语音转写应用 API Key**（推荐）；Agent Key 仅用于对话。
2. **语音输入**（`/admin/runner-stt-config`）：开启 H5 语音输入。

配置写入 `platform_config`，8090 / 8091 共用同一 MySQL。

**自检**：

```http
GET http://localhost:8091/api/runner/chat/speech-to-text/status
```

期望 `difyReady: true`，`difyAppKeyPrefix` 为 `app-xxxx***`。

## 本地联调

1. 启动 8090、8091，`cd duimai-h5 && npm run dev`
2. 运营平台保存 Dify 配置并开启语音输入
3. 或设置 `RUNNER_STT_MOCK=true`（8091）返回模拟文字，不调 Dify

## 录音格式

- **iOS / Safari**：多为 m4a，可直接上传 Dify。
- **电脑 Chrome / 安卓**：多为 webm；H5 会在上传前 **自动转成 16kHz WAV**，无需手动处理。

## 自建 Dify 路径

官方路径为 `audio-to-text`。若实例为 `audio/to-text`，在 8091 配置：

```yaml
duimai:
  stt:
    dify-audio-endpoint: audio/to-text
```
