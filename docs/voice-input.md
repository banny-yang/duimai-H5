# H5 语音输入

## 流程

按住麦克风 → 录音 → `POST /api/runner/chat/speech-to-text` → 预览编辑 → `POST /api/runner/chat`。

## 配置方式（推荐：运营平台）

1. 登录 **平台运营后台** → 侧栏 **生态 → 语音输入**（`/admin/runner-stt-config`）
2. 填写阿里云 NLS **AppKey**、**AccessKey**，选择引擎，保存
3. 配置写入 `platform_config`（`runner_stt`）并缓存 Redis，**8091 选手服务即时生效**，无需重启

## 环境变量兜底（可选）

未在平台入库时，可使用 `application.yml` / 环境变量：

| 变量 | 说明 |
|------|------|
| `ALIYUN_NLS_APP_KEY` | NLS 项目 AppKey |
| `ALIYUN_ACCESS_KEY_ID` | RAM AccessKey ID |
| `ALIYUN_ACCESS_KEY_SECRET` | RAM AccessKey Secret |
| `RUNNER_STT_PROVIDER` | `aliyun-nls` 或 `dashscope` |
| `DASHSCOPE_API_KEY` | webm 兜底 |
| `RUNNER_STT_MOCK` | 本地模拟（不调云） |

示例见 `java-project/scripts/stt.local.env.example`。

```bash
cd java-project
cp scripts/stt.local.env.example scripts/stt.local.env
# 编辑 stt.local.env 填入 AppKey 与 AccessKey
set -a && source scripts/stt.local.env && set +a
# 再启动 8091
```

也可写入 `duimai-frontend-service` 启动脚本或 IDE 环境变量。

## 本地联调

1. 启动 8091 + `cd duimai-H5 && npm run dev`
2. 配置上述环境变量或 `RUNNER_STT_MOCK=true`
3. **localhost / HTTPS** 打开 H5，绑定参赛号后按住 🎤 测试

## 格式说明

- iOS 多为 `m4a/aac`，走 NLS 效果最佳
- Android Chrome 多为 `webm`：已配置 `DASHSCOPE_API_KEY` 时自动兜底；否则依赖 NLS 对 opus 的兼容性
