import { useCallback, useEffect, useMemo, useState } from "react";
import { SheetModal } from "@/components/modals/SheetModal";
import { AmapRouteMapView } from "@/components/map/AmapRouteMapView";
import { RouteMapMarkerList } from "@/components/map/RouteMapMarkerList";
import {
  fetchAmapClientConfig,
  fetchEventRouteMapBundle,
  fetchMapPoiHeat,
  fetchProfile,
} from "@/api/runner-api";
import type { PoiHeatLevel } from "@/lib/route-map-markers";
import type { AmapClientConfig } from "@/lib/amap-loader";
import { buildRouteMapListItems } from "@/lib/route-map-list";
import {
  categoryLabel,
  findLine,
  resolveLineForCategory,
  type EventRouteLine,
  type EventRouteMapBundle,
} from "@/types/route-map";

interface Props {
  open: boolean;
  eventGuid: string;
  /** 选手组别，绑定身份后由 profile 传入 */
  runnerCategory?: string;
  onClose: () => void;
}

export function RouteMapSheet({ open, eventGuid, runnerCategory, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [bundle, setBundle] = useState<EventRouteMapBundle | null>(null);
  const [amapCfg, setAmapCfg] = useState<AmapClientConfig | null>(null);
  const [activeRouteId, setActiveRouteId] = useState<string>("");
  const [profileCategory, setProfileCategory] = useState<string | undefined>(runnerCategory);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [markerHeat, setMarkerHeat] = useState<Record<string, PoiHeatLevel>>({});

  useEffect(() => {
    setProfileCategory(runnerCategory);
  }, [runnerCategory]);

  const loadRouteData = useCallback(async () => {
    if (!eventGuid) return;
    setLoading(true);
    setLoadError(null);
    setSelectedMarkerId(null);
    try {
      let category = runnerCategory;
      if (!category) {
        try {
          const p = await fetchProfile();
          category = p.category;
          if (category) setProfileCategory(category);
        } catch {
          /* 访客无 profile */
        }
      }

      const [cfg, b] = await Promise.all([
        fetchAmapClientConfig(),
        fetchEventRouteMapBundle(eventGuid),
      ]);
      setAmapCfg({
        enabled: cfg.enabled,
        apiKey: cfg.apiKey,
        securityJsCode: cfg.securityJsCode,
      });
      setBundle(b);
      const auto = resolveLineForCategory(b, category);
      setActiveRouteId(auto?.id ?? b.defaultRouteId ?? b.routes[0]?.id ?? "");
    } catch (e) {
      setBundle(null);
      setAmapCfg({ enabled: false });
      setLoadError(e instanceof Error ? e.message : "加载赛道数据失败");
    } finally {
      setLoading(false);
    }
  }, [eventGuid, runnerCategory]);

  useEffect(() => {
    if (!open || !eventGuid) return;
    void loadRouteData();
  }, [open, eventGuid, loadRouteData]);

  useEffect(() => {
    if (!open || !eventGuid || !activeRouteId) return;
    let cancelled = false;
    const loadHeat = async () => {
      try {
        const rows = await fetchMapPoiHeat(eventGuid, activeRouteId);
        if (cancelled) return;
        const map: Record<string, PoiHeatLevel> = {};
        for (const r of rows) {
          map[r.markerId] = r.heatLevel;
        }
        setMarkerHeat(map);
      } catch {
        if (!cancelled) setMarkerHeat({});
      }
    };
    void loadHeat();
    const iv = window.setInterval(loadHeat, 15000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [open, eventGuid, activeRouteId]);

  const activeLine: EventRouteLine | null = useMemo(() => {
    if (!bundle) return null;
    return findLine(bundle, activeRouteId) ?? bundle.routes[0] ?? null;
  }, [bundle, activeRouteId]);

  const listItems = useMemo(() => buildRouteMapListItems(activeLine), [activeLine]);
  const showRouteSwitcher = (bundle?.routes.length ?? 0) > 1;

  const onRouteChange = (routeId: string) => {
    setActiveRouteId(routeId);
    setSelectedMarkerId(null);
  };

  return (
    <SheetModal open={open} title="赛道补给地图" onClose={onClose}>
      <p className="text-xs text-slate-500 mb-3">
        {profileCategory
          ? `已按组别「${categoryLabel(bundle?.categories ?? [], profileCategory)}」匹配线路，也可手动切换`
          : "选择参赛线路查看赛道路线与补给、打卡点"}
      </p>

      {loadError && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
          {loadError}
        </p>
      )}

      {showRouteSwitcher && bundle && (
        <div className="flex flex-wrap gap-2 mb-3">
          {bundle.routes.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`text-xs px-3 py-1.5 rounded-full border font-medium ${
                r.id === activeRouteId
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-slate-600 border-slate-200"
              }`}
              onClick={() => onRouteChange(r.id)}
            >
              {r.name}
              {r.distanceKm != null ? ` · ${r.distanceKm}km` : ""}
            </button>
          ))}
        </div>
      )}

      {activeLine && (
        <div className="flex flex-wrap gap-3 text-2xs text-slate-500 mb-2">
          <span>当前：{activeLine.name}</span>
          {activeLine.distanceKm != null && (
            <span>全程约 {activeLine.distanceKm} km</span>
          )}
          <span>
            赛道 {activeLine.path.length >= 2 ? "已配置" : "未绘制"} · 打点 {listItems.length} 个
          </span>
        </div>
      )}

      <AmapRouteMapView
        line={activeLine}
        amapCfg={amapCfg}
        parentLoading={loading}
        selectedMarkerId={selectedMarkerId}
        onMarkerSelect={setSelectedMarkerId}
        markerHeat={markerHeat}
      />

      <div className="mt-4">
        <p className="text-2xs text-slate-400 mb-2">
          补给站 / 打卡点列表（点击可在地图上定位）
        </p>
        <RouteMapMarkerList
          line={activeLine}
          loading={loading}
          selectedMarkerId={selectedMarkerId}
          onSelect={setSelectedMarkerId}
          markerHeat={markerHeat}
        />
      </div>

      <div className="flex flex-wrap gap-2 mt-3 text-[10px] text-slate-400">
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" /> 起点
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-violet-500" /> 终点
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-primary" /> 补给
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" /> 医疗
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500" /> 检查点
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-orange-500 ring-1 ring-orange-300" /> 咨询偏多
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> 热点预警
        </span>
      </div>
    </SheetModal>
  );
}
