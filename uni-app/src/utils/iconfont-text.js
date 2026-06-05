import { ICON_GLYPH } from '@/config/iconfont-glyphs.js'

/** 小程序用：避免独立 Iconfont 组件被「代码依赖分析」过滤 */
export function getIconGlyph(name) {
  return ICON_GLYPH[name] || ''
}

export function iconfontStyle(size, color) {
  const style = { fontSize: size, lineHeight: '1' }
  if (color) style.color = color
  return style
}
