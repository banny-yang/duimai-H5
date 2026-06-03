import { MARKER_TYPE_LABELS } from './route-map-markers.js'

function haversineKm(a, b) {
  const toRad = (d) => (d * Math.PI) / 180
  const [lng1, lat1] = a
  const [lng2, lat2] = b
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const s1 = Math.sin(dLat / 2)
  const s2 = Math.sin(dLng / 2)
  const h = s1 * s1 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * s2 * s2
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)))
}

function estimateKmAlongPath(path, lng, lat) {
  if (path.length < 2) return null
  let bestIdx = 0
  let bestDist = Infinity
  for (let i = 0; i < path.length; i++) {
    const dx = path[i][0] - lng
    const dy = path[i][1] - lat
    const d = dx * dx + dy * dy
    if (d < bestDist) {
      bestDist = d
      bestIdx = i
    }
  }
  let km = 0
  for (let i = 1; i <= bestIdx; i++) {
    km += haversineKm(path[i - 1], path[i])
  }
  return Math.round(km * 1000) / 1000
}

function formatKm(km) {
  if (km == null || Number.isNaN(km)) return '—'
  if (Math.abs(km - 42.195) < 0.01) return '42.195 km'
  if (km === 0) return '0 km'
  return `${km % 1 === 0 ? km.toFixed(0) : km.toFixed(2)} km`
}

export function buildRouteMapListItems(line) {
  const markers = line?.markers ?? []
  if (markers.length === 0) return []
  const path = line?.path ?? []
  const items = markers.map((m) => {
    const type = m.type ?? 'other'
    const km =
      m.km != null && !Number.isNaN(m.km) ? m.km : estimateKmAlongPath(path, m.lng, m.lat)
    return {
      id: m.id,
      label: m.label?.trim() || MARKER_TYPE_LABELS[type] || '点位',
      type,
      typeLabel: MARKER_TYPE_LABELS[type] ?? '点位',
      km,
      kmText: formatKm(km),
      lng: m.lng,
      lat: m.lat,
    }
  })
  items.sort((a, b) => {
    if (a.km != null && b.km != null) return a.km - b.km
    if (a.km != null) return -1
    if (b.km != null) return 1
    return 0
  })
  return items
}
