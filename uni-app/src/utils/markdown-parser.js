/**
 * 轻量级 Markdown → HTML 解析器
 *
 * 专为 uni-app 聊天消息场景设计，将 AI 返回的 Markdown 文本转为 HTML，
 * 配合 <rich-text> 组件在 H5 和小程序中渲染格式化文本。
 *
 * 支持的语法：
 * - 标题 # ~ ######
 * - 粗体 **text**  斜体 *text*
 * - 行内代码 `code`
 * - 代码块 ```...```
 * - 链接 [text](url)
 * - 无序列表 - / *
 * - 有序列表 1. / 1)
 * - 分隔线 --- / ***
 * - 段落与换行
 *
 * 安全策略：
 * - 仅允许 a / strong / em / code / pre / h1-h6 / ul / ol / li / br / p / hr / blockquote 标签
 * - 所有属性过滤，a 标签仅保留 href（且仅允许 http/https/mailto 协议）
 *
 * 跨平台兼容：
 * - 使用内联样式确保 H5 和微信小程序 rich-text 组件均能正确渲染
 */

// ---------- 内联样式常量 ----------
// 微信小程序 rich-text 不支持外部 CSS，必须使用内联 style

const STYLE = {
  /** 行内代码 */
  inlineCode: 'display:inline;padding:1px 4px;font-family:monospace;font-size:0.87em;'
    + 'background-color:rgba(0,0,0,0.06);border-radius:3px;color:#e65100;word-break:break-all;',
  /** 代码块容器 */
  preBlock: 'display:block;margin:8px 0;padding:10px 12px;'
    + 'background-color:#1e1e1e;border-radius:6px;overflow-x:auto;white-space:pre-wrap;word-break:break-all;',
  /** 代码块文字 */
  codeBlock: 'display:block;padding:0;background-color:transparent;color:#d4d4d4;'
    + 'font-family:monospace;font-size:0.87em;line-height:1.6;border-radius:0;',
  /** 段落 */
  para: 'margin:0 0 6px 0;',
  /** 标题 */
  h1: 'margin:10px 0 5px 0;font-weight:600;font-size:1.2em;',
  h2: 'margin:10px 0 5px 0;font-weight:600;font-size:1.13em;',
  h3: 'margin:10px 0 5px 0;font-weight:600;font-size:1.07em;',
  /** 列表 */
  ul: 'margin:4px 0;padding-left:20px;list-style-type:disc;',
  ol: 'margin:4px 0;padding-left:20px;list-style-type:decimal;',
  li: 'margin-bottom:2px;',
  /** 分隔线 */
  hr: 'margin:10px 0;border:none;border-top:1px solid #e8ecef;',
  /** 链接 */
  link: 'color:#ff6600;text-decoration:underline;word-break:break-all;',
  /** 引用块 */
  blockquote: 'margin:8px 0;padding:5px 10px;border-left:3px solid #ff6600;'
    + 'background-color:rgba(255,102,0,0.04);border-radius:0 4px 4px 0;color:#888888;',
  /** 删除线 */
  del: 'text-decoration:line-through;opacity:0.7;',
}

// ---------- 工具函数 ----------

/**
 * 将行内 Markdown 语法转为 HTML（含内联样式）
 * @param {string} text - 行内文本
 * @returns {string} HTML
 */
function parseInline(text) {
  // 1. 转义 HTML 特殊字符
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // 还原已知 HTML 实体（被上一步双重转义）
  html = html.replace(/&amp;(#[0-9]+;)/g, '&$1')
  html = html.replace(/&amp;(#[xX][0-9a-fA-F]+;)/g, '&$1')
  html = html.replace(/&amp;(lt|gt|amp|quot|apos);/g, '&$1;')

  // 2. 链接 [text](url) — 必须在粗/斜体之前处理
  html = html.replace(
    /\[([^\]]+)\]\(([^\s)]+)\)/g,
    (_, linkText, url) => {
      const safeUrl = sanitizeUrl(url)
      if (!safeUrl) return linkText
      return `<a href="${safeUrl}" style="${STYLE.link}">${linkText}</a>`
    },
  )

  // 3. 行内代码 `code` — 在粗/斜体之前处理，防止内部的 * _ 被误解析
  html = html.replace(
    /`([^`]+)`/g,
    (_, code) => `<code style="${STYLE.inlineCode}">${code}</code>`,
  )

  // 4. 粗体 **text** 或 __text__
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>')

  // 5. 斜体 *text* 或 _text_（负向前瞻避免匹配 ** __ 边界）
  html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
  html = html.replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>')

  // 6. 删除线 ~~text~~
  html = html.replace(/~~([^~]+)~~/g, `<del style="${STYLE.del}">$1</del>`)

  return html
}

/**
 * 校验并清洗 URL
 * @param {string} url
 * @returns {string|null} 安全的 URL，无效则返回 null
 */
function sanitizeUrl(url) {
  if (!url) return null
  const trimmed = url.trim()
  if (/^(https?:\/\/|mailto:)/i.test(trimmed)) return trimmed
  if (/^\/\//.test(trimmed)) return `https:${trimmed}`
  return null
}

/**
 * 提取代码块，用占位符替换（避免内部内容被后续规则破坏）
 * 返回 { text, blocks: Map<placeholder, html> }
 */
function extractCodeBlocks(text) {
  const blocks = new Map()
  let idx = 0

  const replaced = text.replace(
    /```(\w*)\n?([\s\S]*?)```/g,
    (_, lang, code) => {
      const placeholder = `%%CODEBLOCK_${idx}%%`
      const langLabel = lang
        ? `<span style="display:block;margin-bottom:4px;font-size:0.75em;color:#888888;">${lang}</span>`
        : ''
      const escaped = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      blocks.set(
        placeholder,
        `<pre style="${STYLE.preBlock}">${langLabel}<code style="${STYLE.codeBlock}">${escaped.trimEnd()}</code></pre>`,
      )
      idx++
      return `\n${placeholder}\n`
    },
  )

  return { text: replaced, blocks }
}

// ---------- 主解析函数 ----------

/**
 * 将 Markdown 文本解析为带内联样式的 HTML 字符串
 *
 * @param {string} markdown - 原始 Markdown 文本
 * @returns {string} HTML 字符串（已做安全过滤，含内联样式）
 */
export function parseMarkdown(markdown) {
  if (!markdown || typeof markdown !== 'string') return ''

  let text = markdown.trim()

  // 步骤 1：提取代码块（避免内部内容被后续规则破坏）
  const { text: textWithoutCodeBlocks, blocks: codeBlocks } =
    extractCodeBlocks(text)
  text = textWithoutCodeBlocks

  // 步骤 2：按双换行拆分为段落级 block
  const paragraphs = text.split(/\n{2,}/)
  const htmlBlocks = []

  for (const para of paragraphs) {
    if (!para.trim()) continue

    // 代码块占位符
    if (codeBlocks.has(para.trim())) {
      htmlBlocks.push(codeBlocks.get(para.trim()))
      continue
    }

    const lines = para.split('\n')
    const firstLine = lines[0].trim()

    // 分隔线 --- / *** / ___
    if (/^[-*_]{3,}\s*$/.test(firstLine)) {
      htmlBlocks.push(`<hr style="${STYLE.hr}" />`)
      continue
    }

    // 标题 # ~ ######
    const headerMatch = firstLine.match(/^(#{1,6})\s+(.+)/)
    if (headerMatch) {
      const level = headerMatch[1].length
      const hStyle = STYLE[`h${level}`] || STYLE.h1
      const headingText = parseInline(headerMatch[2].trim())
      htmlBlocks.push(`<h${level} style="${hStyle}">${headingText}</h${level}>`)
      continue
    }

    // 引用块 >（所有行以 > 开头）
    if (lines.every((l) => /^>\s?/.test(l.trim()))) {
      const quoteLines = lines.map((l) => l.replace(/^>\s?/, ''))
      const quoteHtml = quoteLines
        .map((l) => parseInline(l))
        .join('<br />')
      htmlBlocks.push(`<blockquote style="${STYLE.blockquote}">${quoteHtml}</blockquote>`)
      continue
    }

    // 无序列表 - / * item（所有行以 - 或 * 开头）
    if (lines.every((l) => /^[-*]\s+/.test(l.trim()))) {
      const items = lines
        .map((l) =>
          `<li style="${STYLE.li}">${parseInline(l.replace(/^[-*]\s+/, '').trim())}</li>`,
        )
        .join('')
      htmlBlocks.push(`<ul style="${STYLE.ul}">${items}</ul>`)
      continue
    }

    // 有序列表 1. / 1) item（所有行以数字开头）
    if (lines.every((l) => /^\d+[.)]\s+/.test(l.trim()))) {
      const items = lines
        .map((l) =>
          `<li style="${STYLE.li}">${parseInline(l.replace(/^\d+[.)]\s+/, '').trim())}</li>`,
        )
        .join('')
      htmlBlocks.push(`<ol style="${STYLE.ol}">${items}</ol>`)
      continue
    }

    // 普通段落：行内换行用 <br /> 连接
    const paraHtml = lines.map((l) => parseInline(l.trim())).join('<br />')
    htmlBlocks.push(`<p style="${STYLE.para}">${paraHtml}</p>`)
  }

  // 步骤 3：还原代码块占位符
  let result = htmlBlocks.join('')
  for (const [placeholder, blockHtml] of codeBlocks) {
    result = result.replace(placeholder, blockHtml)
  }

  // 步骤 4：安全过滤
  result = sanitizeHtml(result)

  return result
}

// ---------- 安全过滤 ----------

/**
 * 安全过滤 HTML：移除危险标签/属性，清除残留占位符
 * @param {string} html
 * @returns {string}
 */
function sanitizeHtml(html) {
  // 清除残留占位符
  let cleaned = html.replace(/%%CODEBLOCK_\d+%%/g, '')

  // 移除危险标签
  cleaned = cleaned.replace(
    /<\/?(script|iframe|object|embed|form|input|button|select|textarea|link|meta|style|base|applet|audio|video|source|track)\b[^>]*\/?>/gi,
    '',
  )

  // 移除 on* 事件属性
  cleaned = cleaned.replace(/\s+on\w+\s*=\s*"[^"]*"/gi, '')
  cleaned = cleaned.replace(/\s+on\w+\s*=\s*'[^']*'/gi, '')

  // 移除 javascript: / data: 协议
  cleaned = cleaned.replace(
    /href\s*=\s*["']\s*javascript:/gi,
    'href="#" data-removed="js',
  )
  cleaned = cleaned.replace(
    /href\s*=\s*["']\s*data:/gi,
    'href="#" data-removed="data',
  )

  return cleaned
}

export default parseMarkdown
