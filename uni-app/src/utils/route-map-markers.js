export const MARKER_TYPE_LABELS = {
  start: '起点',
  finish: '终点',
  aid: '补给',
  medical: '医疗',
  cp: '检查点',
  other: '点位',
}

const MARKER_COLORS = {
  start: '#10b981',
  finish: '#7c3aed',
  aid: '#0891b2',
  medical: '#dc2626',
  cp: '#d97706',
  other: '#64748b',
}

export function markerIconPath(type, heatLevel) {
  const t = type ?? 'other'
  let color = MARKER_COLORS[t] ?? MARKER_COLORS.other
  if (heatLevel === 'warning') color = '#ea580c'
  if (heatLevel === 'critical') color = '#dc2626'
  return color
}

export function amapNavigationUrl(lng, lat, name) {
  return `https://uri.amap.com/marker?position=${lng},${lat}&name=${encodeURIComponent(name)}`
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** 高德 Marker label HTML */
export function markerLabelHtml(m, selected, heatLevel) {
  const type = m.type ?? 'other'
  let bg = MARKER_COLORS[type] ?? MARKER_COLORS.other
  const color = '#ffffff'
  if (heatLevel === 'warning') bg = '#ea580c'
  if (heatLevel === 'critical') bg = '#dc2626'
  const text = escapeHtml((m.label || '').trim() || MARKER_TYPE_LABELS[type] || '点位')
  const ring = selected ? 'box-shadow:0 0 0 2px #fff,0 0 0 4px #0891b2;' : ''
  const pulse = heatLevel === 'critical' ? 'animation:pulse 1s infinite;' : ''
  const warn = heatLevel === 'warning' ? 'box-shadow:0 0 0 2px #f97316;' : ''
  return `<div style="background:${bg};color:${color};padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600;white-space:nowrap;${ring}${pulse}${warn}">${selected ? '▶ ' : ''}${text}</div>`
}
