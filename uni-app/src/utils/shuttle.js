export const PHASE_LABELS = {
  pre: '赛前',
  race: '赛中',
  post: '赛后',
  all: '全阶段',
}

function normalizePhase(phase) {
  const p = String(phase ?? 'all')
    .trim()
    .toLowerCase()
  if (p === 'pre' || p === 'race' || p === 'post' || p === 'all') return p
  return 'all'
}

function normalizeItem(raw, index) {
  if (!raw || typeof raw !== 'object') return null
  const title = String(raw.title ?? raw.name ?? '').trim()
  if (!title) return null
  return {
    id: String(raw.id ?? `shuttle-${index}`).trim(),
    title,
    detail: String(raw.detail ?? raw.description ?? '').trim(),
    time: String(raw.time ?? raw.schedule ?? '').trim(),
    phase: normalizePhase(raw.phase),
    sortOrder: Number.isFinite(raw.sortOrder) ? raw.sortOrder : index,
  }
}

function normalizePickup(raw) {
  if (!raw || typeof raw !== 'object') {
    return {
      enabled: true,
      title: '领物须知',
      location: '',
      hours: '',
      items: [],
      mapHint: '',
    }
  }
  const items = Array.isArray(raw.items)
    ? raw.items.map((line) => String(line ?? '').trim()).filter(Boolean)
    : []
  return {
    enabled: raw.enabled !== false,
    title: String(raw.title ?? '领物须知').trim() || '领物须知',
    location: String(raw.location ?? '').trim(),
    hours: String(raw.hours ?? '').trim(),
    items,
    mapHint: String(raw.mapHint ?? raw.map_hint ?? '').trim(),
  }
}

/** 兼容后端 DTO 与历史 JSON 字段 */
export function normalizeShuttleConfig(raw) {
  if (raw == null) return null
  let src = raw
  if (typeof raw === 'string') {
    try {
      src = JSON.parse(raw)
    } catch {
      return null
    }
  }
  if (typeof src !== 'object') return null

  let nested = src.shuttleConfig ?? src.shuttle_config ?? src.data
  if (typeof nested === 'string') {
    try {
      nested = JSON.parse(nested)
    } catch {
      nested = null
    }
  }
  if (nested && typeof nested === 'object' && !Array.isArray(src.items)) {
    src = nested
  }

  const rawItems = src.items ?? src.shuttleItems ?? src.list ?? []
  const items = (Array.isArray(rawItems) ? rawItems : [])
    .map((item, i) => normalizeItem(item, i))
    .filter(Boolean)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  return {
    enabled: src.enabled !== false,
    summary: String(src.summary ?? '').trim(),
    items,
    pickup: normalizePickup(src.pickup),
  }
}

export function filterShuttleItemsByPhase(items, phase) {
  return (items || []).filter((item) => {
    const p = item.phase ?? 'all'
    return p === 'all' || p === phase
  })
}

/** 是否有可展示的交通接驳条目（不含仅领物配置） */
export function hasShuttleItems(config) {
  if (!config || config.enabled === false) return false
  return !!config.summary?.trim() || (config.items?.length ?? 0) > 0
}

/** 与 React H5 `shuttle-utils.isShuttleVisible` 一致 */
export function isShuttleVisible(config) {
  if (!config || config.enabled === false) return false
  return (
    !!config.summary?.trim() ||
    (config.items?.length ?? 0) > 0 ||
    config.pickup?.enabled !== false
  )
}

export function isPickupVisible(config) {
  if (!config || config.enabled === false) return false
  const p = config.pickup
  if (!p || p.enabled === false) return false
  return !!(p.location?.trim() || p.hours?.trim() || (p.items?.length ?? 0) > 0)
}
