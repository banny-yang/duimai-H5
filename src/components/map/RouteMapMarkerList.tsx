import { amapNavigationUrl } from "@/lib/route-map-markers";
import { buildRouteMapListItems } from "@/lib/route-map-list";
import type { PoiHeatLevel } from "@/lib/route-map-markers";
import type { EventRouteLine } from "@/types/route-map";

interface Props {
  line: EventRouteLine | null;
  loading?: boolean;
  selectedMarkerId?: string | null;
  onSelect?: (id: string | null) => void;
  markerHeat?: Record<string, PoiHeatLevel>;
}

const TYPE_STYLE: Record<string, string> = {
  start: "bg-emerald-100 text-emerald-800",
  finish: "bg-violet-100 text-violet-800",
  aid: "bg-primary/15 text-primary-dark",
  medical: "bg-red-100 text-red-700",
  cp: "bg-amber-100 text-amber-800",
  other: "bg-slate-100 text-slate-600",
};

export function RouteMapMarkerList({
  line,
  loading,
  selectedMarkerId,
  onSelect,
  markerHeat = {},
}: Props) {
  const items = buildRouteMapListItems(line);

  if (loading) {
    return <p className="text-xs text-slate-400 text-center py-4">加载补给站列表…</p>;
  }

  if (!line) {
    return <p className="text-xs text-slate-500 text-center py-4">请选择线路</p>;
  }

  if (items.length === 0) {
    return (
      <p className="text-xs text-slate-500 text-center py-4">
        「{line.name}」暂无补给/打卡点
      </p>
    );
  }

  return (
    <ul className="space-y-2 max-h-44 overflow-y-auto">
      {items.map((p) => {
        const selected = p.id === selectedMarkerId;
        const heat = markerHeat[p.id] ?? "normal";
        const heatRing =
          heat === "critical"
            ? "ring-2 ring-red-500 animate-pulse"
            : heat === "warning"
              ? "ring-1 ring-orange-400"
              : "";
        const marker = line?.markers.find((m) => m.id === p.id);
        return (
          <li key={p.id}>
            <div
              className={`flex items-stretch gap-1 border rounded-lg overflow-hidden ${heatRing} ${
                selected ? "border-primary" : "border-slate-100"
              }`}
            >
              <button
                type="button"
                className={`flex-1 flex items-center justify-between gap-2 text-sm px-3 py-2 text-left transition-colors ${
                  selected ? "bg-primary/5" : "bg-white hover:bg-slate-50"
                }`}
                onClick={() => onSelect?.(selected ? null : p.id)}
              >
                <div className="min-w-0 flex items-center gap-2">
                  <span
                    className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded ${TYPE_STYLE[p.type] ?? TYPE_STYLE.other}`}
                  >
                    {p.typeLabel}
                  </span>
                  <span className="font-medium text-ink truncate">{p.label}</span>
                </div>
                <span className="shrink-0 text-slate-500 tabular-nums text-xs">{p.kmText}</span>
              </button>
              {marker && (
                <a
                  href={amapNavigationUrl(marker.lng, marker.lat, marker.label)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 px-2 flex items-center text-[10px] font-semibold text-primary border-l border-slate-100 bg-slate-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  导航
                </a>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
