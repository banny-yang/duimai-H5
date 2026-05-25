export type RouteMapMarkerType = "start" | "finish" | "aid" | "medical" | "cp" | "other";

export interface RouteMapMarker {
  id: string;
  label: string;
  lng: number;
  lat: number;
  type?: RouteMapMarkerType;
  km?: number;
}

export interface EventCategory {
  key: string;
  label: string;
}

export const defaultEventCategories = (): EventCategory[] => [
  { key: "full", label: "全程马拉松" },
  { key: "half", label: "半程马拉松" },
  { key: "mini", label: "欢乐跑" },
];

export interface EventRouteLine {
  id: string;
  name: string;
  distanceKm?: number;
  categories?: string[];
  source: "draw" | "geojson";
  center?: [number, number];
  zoom?: number;
  path: [number, number][];
  geojson?: unknown;
  markers: RouteMapMarker[];
}

export interface EventRouteMapBundle {
  version: number;
  defaultRouteId: string;
  categories: EventCategory[];
  routes: EventRouteLine[];
}

export function migrateToBundle(raw: unknown): EventRouteMapBundle {
  if (!raw || typeof raw !== "object") {
    return {
      version: 2,
      defaultRouteId: "full",
      categories: defaultEventCategories(),
      routes: [],
    };
  }
  const o = raw as Record<string, unknown>;
  if (Array.isArray(o.routes)) {
    const b = o as unknown as EventRouteMapBundle;
    return {
      version: 2,
      defaultRouteId: b.defaultRouteId || b.routes[0]?.id || "full",
      categories:
        b.categories?.length ? b.categories : defaultEventCategories(),
      routes: b.routes ?? [],
    };
  }
  const line = o as unknown as EventRouteLine;
  return {
    version: 2,
    defaultRouteId: line.id || "default",
    categories: defaultEventCategories(),
    routes: [
      {
        id: line.id || "default",
        name: line.name || "默认线路",
        distanceKm: line.distanceKm,
        categories: line.categories ?? [],
        source: line.source ?? "draw",
        center: line.center,
        zoom: line.zoom ?? 13,
        path: line.path ?? [],
        geojson: line.geojson,
        markers: line.markers ?? [],
      },
    ],
  };
}

export function findLine(bundle: EventRouteMapBundle, routeId: string) {
  return bundle.routes.find((r) => r.id === routeId);
}

export function resolveLineForCategory(
  bundle: EventRouteMapBundle,
  category?: string | null,
): EventRouteLine | undefined {
  if (!bundle.routes.length) return undefined;
  if (category) {
    const cat = category.trim().toLowerCase();
    const matched = bundle.routes.find((r) =>
      r.categories?.some((c) => c.toLowerCase() === cat),
    );
    if (matched) return matched;
  }
  return findLine(bundle, bundle.defaultRouteId) ?? bundle.routes[0];
}

export function categoryLabel(
  categories: EventCategory[],
  key?: string | null,
): string {
  if (!key) return "—";
  const hit = categories.find((c) => c.key === key);
  return hit?.label ?? key;
}
