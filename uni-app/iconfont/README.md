# iconfont 字体文件

1. 从 iconfont.cn 项目 **下载至本地**（Font class）。
2. 将压缩包里的 **`iconfont.ttf`** 放到本目录（与 `iconfont.source.css` 同级）。
3. 在项目根执行：

```bash
node scripts/embed-iconfont.mjs
npm run dev:mp-weixin
```

脚本会把 `iconfont/iconfont.ttf` 复制到 `src/static/fonts/duimai-iconfont.ttf` 并生成 `src/styles/iconfont-runner.scss`（base64，供微信小程序使用）。

Unicode 映射见 `src/config/iconfont-glyphs.js`（与 `iconfont.source.css` 一致）。
