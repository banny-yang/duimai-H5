# 选手端 iconfont（微信小程序）

H5 使用内联 SVG；**微信小程序**使用 iconfont 字体 + `<text class="iconfont">`（见 `utils/iconfont-text.js`，勿单独建 `Iconfont.vue` 组件，否则易被微信「代码依赖分析」过滤）。

当前项目已与 iconfont.cn 下载包对齐（见 `iconfont/iconfont.source.css`）。

## 更新字体（iconfont.cn 重新下载后）

1. 将下载包中的 **`iconfont.ttf`** 放到 `uni-app/iconfont/`。
2. 若 `iconfont.css` 中 `content` 有变化，同步修改 `src/config/iconfont-glyphs.js`。
3. 生成小程序用 base64 样式：

```bash
cd uni-app
node scripts/embed-iconfont.mjs
npm run dev:mp-weixin
```

4. 微信开发者工具：**清缓存 → 全部清除** → 重新编译。

## 图标对照

| 界面 | `getIconGlyph` 名称 | iconfont 类名 |
|------|-----------------|---------------|
| 语音 | `mic` | `icon-yuyin` |
| 键盘 | `keyboard` | `icon-wenzishuru` |
| 发送 | `send` / `send-fill` | `icon-fasong` |
| 参赛信息 | `info` | `icon-saishi` |
| 赛道地图 | `map` | `icon-ditu` |
| 交通接驳 | `shuttle` | `icon-gongjiao` |
| 通知喇叭 | `megaphone` | `icon-gonggao` |

## 在线字体（可选）

`.env.production`：

```bash
VITE_ICONFONT_URL=https://你的CDN/iconfont.ttf
```

须 **https**，并在微信后台配置 **downloadFile 合法域名**。`iconfont-glyphs.js` 须与线上一致。
