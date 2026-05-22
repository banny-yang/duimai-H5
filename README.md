# 对麦智能 · 选手端 H5

轻量选手端移动端页面（Vite + React + Tailwind），已对接 **duimai-frontend-service**（8091）；后端不可用时自动降级为本地演示数据。

## UI 优化（见 `optimization.md` 及 PM 迭代）

- 赛前通知条：青色喇叭图标 + 可点击打开「领物须知」
- 金刚区四卡静态一致，按压时青色边框反馈
- 对话区常驻时间戳；头像与强调色统一电光青
- 黄金三色矩阵：Primary 电光青 · Secondary 蓝灰 · Alert 赛事红（CSS 变量 + Tailwind）
- 金刚区单色线框图标；AI 气泡微渐变光晕；SOS 高定红球体呼吸光晕
- 输入有字时发送钮高亮青色 + 阴影

## 功能概览

- **首页 Hub**：动态赛前/赛中通知栏、四大金刚区快捷键
- **AI 对话流**：免登录问候、快捷联想气泡、语音输入（模拟 STT）、SSE 打字机式回复（模拟）
- **结构化卡片**：补给站导航卡、领物条形码卡
- **SOS**：右下角浮窗长按 3 秒、GPS/电量模拟、伤情三选一、5 秒无操作默认最高级别

## 开发

先启动选手端后端（8091）：

```bash
cd duimai-ai-java-project
hot-reload-frontend-start.bat
```

再启动 H5：

```bash
cd duimai-h5
npm install
npm run dev
```

浏览器打开 http://localhost:5180（Vite 将 `/api` 代理到 `http://localhost:8091`）

### 对接 API

| 能力 | 接口 |
|------|------|
| 进入赛事 / JWT | `GET /api/runner/session/enter?eventGuid=` |
| 通知条 | `GET /api/runner/session/notice` |
| 我的参赛信息 | `GET /api/runner/profile/me` |
| AI 对话 | `POST /api/runner/chat` |
| SOS | `POST /api/runner/sos` |

选手端每次 AI 对话会自动写入 `conversation_session` / `conversation_message`（`channel=h5`），供平台统计，见 `duimai-ai-java-project/H5_CONVERSATION_RECORD.md`。

### URL 格式（路径携带赛事 GUID）

示例（由主办方控制台生成）：

```
http://localhost:5180/57c01d8b-55a3-11f1-b8af-562bf5f97a91
```

| 部分 | 说明 |
|------|------|
| 路径 `/{event_guid}` | **必填**，赛事公开 UUID |
| `?phase=race` | 可选，强制赛中 UI（覆盖赛事状态） |

旧版 `/?event_guid=` 会自动跳转到 `/{guid}`。

生产环境可设置 `VITE_API_BASE_URL=https://your-host/api`。

## 构建

```bash
npm run build
npm run preview
```

首包控制在轻量范围，无重度 UI 库依赖。
