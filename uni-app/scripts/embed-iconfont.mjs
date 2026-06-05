/**
 * 将 iconfont.ttf 嵌入 src/styles/iconfont-runner.scss（base64，微信小程序可用）
 *
 * 优先读取：iconfont/iconfont.ttf（下载包）
 * 否则读取：src/static/fonts/duimai-iconfont.ttf
 *
 * 用法：把 iconfont.cn 下载的 iconfont.ttf 放到 uni-app/iconfont/ 后执行
 *   node scripts/embed-iconfont.mjs
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const fromDownload = join(root, 'iconfont/iconfont.ttf')
const targetTtf = join(root, 'src/static/fonts/duimai-iconfont.ttf')
const outPath = join(root, 'src/styles/iconfont-runner.scss')

let source = fromDownload
if (existsSync(fromDownload)) {
  mkdirSync(dirname(targetTtf), { recursive: true })
  copyFileSync(fromDownload, targetTtf)
  console.log('Copied', fromDownload, '->', targetTtf)
} else if (existsSync(targetTtf)) {
  source = targetTtf
  console.log('Using', targetTtf)
} else {
  console.error(
    '未找到字体文件。请将 iconfont.cn 下载的 iconfont.ttf 放到 uni-app/iconfont/ 或 src/static/fonts/duimai-iconfont.ttf',
  )
  process.exit(1)
}

const b64 = readFileSync(source).toString('base64')
const scss = `/* 选手端 iconfont（由 scripts/embed-iconfont.mjs 生成，font-family 与 iconfont.cn 一致） */
@font-face {
  font-family: "iconfont";
  src: url("data:font/ttf;charset=utf-8;base64,${b64}") format("truetype");
  font-weight: normal;
  font-style: normal;
}

.iconfont {
  font-family: "iconfont" !important;
  font-style: normal;
  font-weight: normal;
  line-height: 1;
  -webkit-font-smoothing: antialiased;
}
`

writeFileSync(outPath, scss, 'utf8')
console.log('OK:', outPath, `(${b64.length} base64 chars)`)
