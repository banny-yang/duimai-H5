# 对麦选手助手 · Uni-App



由 `duimai-h5`（React + Vite）完整迁移的 **Vue 3 + Uni-App** 工程，支持 H5、微信小程序、App。



与 **8091** 选手 API（`duimai-frontend-service`）对齐，功能与 React H5 一致。



## 功能清单



| 能力 | 状态 |

|------|------|

| 赛事列表 / GUID 直达 | ✅ |

| 会话进入、身份验证、本地恢复 | ✅ |

| 赛段 phase（日期 + `?phase=` 覆盖） | ✅ |

| 通知条（应急 / 赛前赛中赛后） | ✅ |

| 金刚区：参赛信息、赛道补给地图、接驳 | ✅ |
| 选手身份验证（参赛号 + 身份证后 6 位、本地记忆） | ✅ |
| 赛道补给地图（多线路、高德/原生地图、打点热力、导航） | ✅ |

| AI 对话、流式打字、快捷问题 | ✅ |

| 语音输入（小程序/App + STT 开关） | ✅ |

| WebSocket 人工回复 + inbox 兜底 | ✅ |

| 聊天最大化 | ✅ |

| SOS 长按 3 秒、GPS、倒计时、离线队列 | ✅ |

| 离线包缓存 | ✅ |

| 主办品牌色主题 | ✅ |

| 中英 `?lang=en` | ✅ |

| 隐私政策 / 用户协议 | ✅ |

| 原生地图 polyline + 打点列表（小程序/App） | ✅ |
| H5 高德地图 web-view | ✅ |



## 目录



| 路径 | 说明 |

|------|------|

| `src/pages/index.vue` | 赛事选择 |

| `src/pages/login/login.vue` | 第三方微信授权页（Cosmic Oracle 视觉，成功后关闭小程序） |

第三方接入详见 **[docs/第三方登录授权接入.md](./docs/第三方登录授权接入.md)**（唤起示例与 extraData 字段说明）。

| `src/pages/runner/runner.vue` | 选手主屏 |

| `src/utils/runner-api.js` | 选手 API |

| `src/utils/runner-chat-ws.js` | 人工回复 WebSocket |

| `src/components/runner/` | UI 组件 |
| `src/styles/h5-tokens.scss` | 设计令牌（与 React `index.css` 默认活力橙一致） |
| `src/styles/h5-runner.scss` | 选手端布局与聊天/金刚区/SOS 样式 |
| `src/utils/h5-brand-theme.js` | 主办品牌色 `blue` / `orange` / `green` |



## 视觉与 React H5 对齐

- 默认主题：**活力橙** `#ff6600`（非旧版蓝色 fallback）
- 全局类名与 React 一致：`runner-shell`、`chat-section`、`shortcut-card`、`sos-sphere` 等
- 图标：金刚区 SVG、`AiAvatar` / `UserAvatar`、聊天麦克风/发送 SVG（与 `duimai-h5/src` 同源路径）
- H5 桌面预览：`h5-root` 最大宽度 428px 居中，与 React `#root` 一致
- 对比：React `npm run dev`（5180）与 Uni `npm run dev`（5181）并排打开同一 `eventGuid`



## H5 高德地图

- 组件：`AmapRouteMapH5.vue`（直接挂载高德 JS API，与 React H5 相同；弹窗内不用 web-view，避免空白）
- 配置：`GET /api/runner/map/amap-client`
- 未配置 `apiKey` 时回退 `NativeRouteMapView`（`<map>`，仅小程序/App 体验较好）
- 备用页：`src/static/hybrid/amap-route-map.html`（旧 web-view 方案，已弃用）

### 控制台报错 `INVALID_USER_DOMAIN`

表示 **高德 Web 端 Key 的「域名白名单」里没有你当前打开的地址**（与 Uni-App 代码无关）。

1. 打开 [高德开放平台控制台](https://console.amap.com/dev/key/app) → 对应应用 → 找到 **服务平台为「Web端(JS API)」** 的 Key（不要用 Android/iOS Key）。
2. 在 **域名白名单 / 安全设置** 中增加（按需多条，每行一个）：
   - `localhost`
   - `127.0.0.1`
   - `http://localhost:5181`（Uni-App H5 默认端口，以浏览器地址栏为准）
   - 生产环境：`https://你的选手端域名`
3. **本地调试**：高德官方建议可 **暂时清空白名单** 再测；保存后等 1～2 分钟生效。
4. 运营台需同时配置 **安全密钥**（`securityJsCode`），与 Key 配对；选手端接口 `GET /api/runner/map/amap-client` 会下发给前端。

配置入口（本仓库）：运营前端 → 高德地图配置（`platform_config.amap`），或 `duimai-platform` 默认 `duimai.amap.*`。

## 环境变量

选手端请求基址在 **`src/utils/api.js`** 中读取 `VITE_API_BASE_URL`（**编译时**写入包内，改 env 后必须重新 `npm run dev:mp-weixin` 或 `build:mp-weixin`）。

| 命令 | 读取的环境文件 | 微信开发者工具打开目录 |
|------|----------------|------------------------|
| `npm run dev:mp-weixin` | `.env.development` | `dist/dev/mp-weixin` |
| `npm run build:mp-weixin` | **`.env.production`**（不是 development） | `dist/build/mp-weixin` |

若报错 `request:invalid url "/api/..."`，说明 env 里配置了 H5 专用的 `/api`（小程序会忽略并改用 `runner-api-base.js` 兜底），或仍在使用**旧编译包**。请重新编译，并确认微信开发者工具打开的是对应目录（见上表）。选择赛事页底部会显示 **「API 基址：…」**，若不是完整 `http(s)://…` 地址，说明导入目录不对或未重新编译。

**排查步骤：**
1. 关闭微信开发者工具中的旧项目
2. 在 `duimai-h5/uni-app` 执行 `npm run dev:mp-weixin`（或 `build:mp-weixin`）
3. 重新导入 `dist/dev/mp-weixin`（或 `dist/build/mp-weixin`）
4. 工具 → **清缓存 → 全部清除** → 重新编译
5. 查看首页底部 **API 基址** 是否为 `http://localhost:8091/api`（dev）或 `https://…/api`（build）

**页面空白 / 控制台报错：**

### `webapi_getwxaasyncsecinfo:fail`（整页空白、看不到「选择赛事」）

常见原因：**未配置真实 AppID**，却声明了 `requiredPrivateInfos`（定位等隐私接口），开发者工具在启动时会拉取安全信息并失败。

**本地联调（本仓库默认）：**
- 已去掉 `requiredPrivateInfos`，测试号 / 空 AppID 可正常打开首页
- 重新编译：`npm run build:mp-weixin`，导入 `dist/build/mp-weixin`，**清缓存 → 全部清除**

**上线 / 真机 SOS 定位：** 在 `src/manifest.json` → `mp-weixin` 中配置：

```json
"appid": "wx你的AppID",
"permission": {
  "scope.userLocation": { "desc": "用于 SOS 紧急求助定位" },
  "scope.record": { "desc": "用于语音输入转文字" }
},
"requiredPrivateInfos": ["getLocation"]
```

并在微信公众平台配置用户隐私保护指引。

### `Error: timeout`（`lib: 3.15.x` / `3.16.x`）

多为**微信开发者工具 + 高版本基础库**的已知问题，与业务 API 无关。

1. **详情 → 本地设置 → 调试基础库** → 选 **3.14.6**（勿用 3.15+ / 3.16+）
2. 取消勾选 **「使用独立域进行调试」**（若已勾选）
3. 关闭 VPN/代理；公司网络可换手机热点试
4. **清缓存 → 全部清除** 后重启开发者工具

| 文件 | 用途 |
|------|------|
| `.env` | 全平台兜底（会被 development / production 覆盖） |
| `.env.development` | `dev:mp-weixin`、H5 开发 |
| `.env.production` | **`build:mp-weixin` 必配** |
| `src/config/runner-api-base.js` | env 仍为空时的小程序 HTTPS 兜底 |

**H5 开发**（`npm run dev`）：

```bash
VITE_API_BASE_URL=/api
```

`vite.config.js` 将 `/api` 代理到 `http://localhost:8091`。

**微信小程序**（`npm run dev:mp-weixin` / `build:mp-weixin`）：

```bash
# 必须为完整 HTTPS，不能使用 /api
VITE_API_BASE_URL=https://你的选手端域名/api
# 可选
# VITE_RUNNER_WS_BASE=wss://你的选手端域名/api
```

微信公众平台 → **开发管理 → 开发设置 → 服务器域名**：

- **request 合法域名**：`https://你的选手端域名`（不含 `/api` 路径）
- **socket 合法域名**（使用人工回复 WS 时）：`wss://你的选手端域名`

本地开发者工具可在 `manifest.json` 的 `mp-weixin.setting.urlCheck: false` 下临时跳过域名校验；真机与上线仍须配置合法域名。

### 微信小程序登录

| 场景 | 入口 | 登录后行为 |
|------|------|------------|
| **第三方授权** | `/pages/login/login`（可选 `?state=…`） | 回传身份 `extraData` → 关闭/返回调用方 |
| **选手页内** | `MpWechatLoginSheet` 底部弹窗 | 留在选手页，`POST /runner/session/wx-login`（需 eventGuid） |

第三方小程序唤起示例：

```javascript
wx.navigateToMiniProgram({
  appId: '对脉小程序AppID',
  path: '/pages/login/login?state=your-correlation-id',
  envVersion: 'release',
})
```

授权成功后回传 `extraData`（**不请求对脉服务端**）：

```json
{
  "ok": true,
  "code": "wx.login 临时凭证",
  "loginCode": "同上",
  "nickName": "昵称",
  "avatarUrl": "头像 URL",
  "state": "透传 state"
}
```

第三方在其**自有服务端**用 `code` 调用微信 `jscode2session` 换取 **openId**，并签发 **token**。

**静默放行**：本地已有微信资料时，自动 `wx.login` 取新 code 并回传。

选手页内流程：`getUserProfile` → `POST /runner/session/wx-login`（须带 `eventGuid`）。身份验证（SOS / 参赛信息）仍用参赛号 + 身份证后 6 位。

#### `getUserProfile:fail api scope is not declared in the privacy agreement`

表示调用了 `getUserProfile`，但**未在微信公众平台声明对应隐私类型**（或声明尚未生效）。

**后台配置（必做）：**

1. 登录 [微信公众平台](https://mp.weixin.qq.com) → **设置** → **服务内容声明** → **用户隐私保护指引**
2. 补充隐私类型：**收集你的昵称、头像**
3. 填写使用场景说明（如：用于展示选手端微信昵称与头像）
4. **提交审核**；通过后通常需 **约 1 小时** 才生效（部分账号需更久）
5. 确认 `src/manifest.json` 中 `mp-weixin.appid` 与后台小程序 AppID 一致

**代码侧（本仓库已适配）：**

- `manifest.json` 已开启 `__usePrivacyCheck__`
- 登录弹窗会先走微信隐私协议（`agreePrivacyAuthorization`），同意后再调用 `getUserProfile`

若已配置仍报错：清缓存重启开发者工具，或退出小程序重新进入后再试。

**8091 后端配置**（`duimai-frontend-service`）：

```yaml
wechat:
  mini-program:
    app-id: wx你的小程序AppID
    app-secret: 你的小程序AppSecret
    mock-enabled: false
```

开发联调可 `mock-enabled: true`（不请求微信服务器）。

**小程序端**：`manifest.json` → `mp-weixin.appid` 填同一 AppID。



## 命令



```bash

cd duimai-h5/uni-app

npm install

npm run dev              # H5 → http://localhost:5181

npm run dev:mp-weixin    # 微信小程序

npm run build

npm run build:mp-weixin

```



## 进入赛事



`/pages/runner/runner?eventGuid={guid}&phase=race&lang=en`



## 微信小程序

1. `src/manifest.json` → `mp-weixin.appid`（你的小程序 AppID）
2. API 地址：`.env.production` 或开发用的 `.env.development` 中设置 `VITE_API_BASE_URL`（见上文）
3. 微信后台配置 request / socket 合法域名（与 API 主机名一致）
4. 地图、定位、录音权限（已在 `manifest.json` 声明）



## 与 React H5 差异



- **H5 浏览器**：语音依赖 `uni.getRecorderManager`，部分浏览器仍建议用文字；React 版用 MediaRecorder。

- **地图**：H5 使用高德 web-view（与 React 一致）；小程序/App 使用原生 `<map>`。

- **图标**：H5 使用内联 `<svg>`；**微信小程序不支持 SVG**。小程序使用 **iconfont 字体**（`utils/iconfont-text.js` + `docs/iconfont.md`，字体来自 [iconfont.cn](https://www.iconfont.cn/)），H5 仍保留 SVG。



React 源码保留在 `duimai-h5/src/`，Web 部署不受影响。


