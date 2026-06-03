export const defaultEventCategories = () => [
  { key: 'full', label: '全程马拉松' },
  { key: 'half', label: '半程马拉松' },
  { key: 'mini', label: '欢乐跑' },
]

export function migrateToBundle(raw) {
  if (!raw || typeof raw !== 'object') {
    return {
      version: 2,
      defaultRouteId: 'full',
      categories: defaultEventCategories(),
      routes: [],
    }
  }
  if (Array.isArray(raw.routes)) {
    const b = raw
    return {
      version: 2,
      defaultRouteId: b.defaultRouteId || b.routes[0]?.id || 'full',
      categories: b.categories?.length ? b.categories : defaultEventCategories(),
      routes: b.routes ?? [],
    }
  }
  const line = raw
  return {
    version: 2,
    defaultRouteId: line.id || 'default',
    categories: defaultEventCategories(),
    routes: [
      {
        id: line.id || 'default',
        name: line.name || '默认线路',
        distanceKm: line.distanceKm,
        categories: line.categories ?? [],
        source: line.source ?? 'draw',
        center: line.center,
        zoom: line.zoom ?? 13,
        path: line.path ?? [],
        geojson: line.geojson,
        markers: line.markers ?? [],
      },
    ],
  }
}

export function findLine(bundle, routeId) {
  return bundle.routes.find((r) => r.id === routeId)
}

export function resolveLineForCategory(bundle, category) {
  if (!bundle.routes.length) return undefined
  if (category) {
    const cat = category.trim().toLowerCase()
    const matched = bundle.routes.find((r) =>
      r.categories?.some((c) => c.toLowerCase() === cat),
    )
    if (matched) return matched
  }
  return findLine(bundle, bundle.defaultRouteId) ?? bundle.routes[0]
}

export function categoryLabel(categories, key) {
  if (!key) return '—'
  const hit = categories.find((c) => c.key === key)
  return hit?.label ?? key
}
