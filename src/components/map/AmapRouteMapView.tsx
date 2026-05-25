import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadAmapMap, type AmapClientConfig } from "@/lib/amap-loader";
import { markerLabelHtml } from "@/lib/route-map-markers";
import type { EventRouteLine, RouteMapMarker } from "@/types/route-map";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface Props {
  className?: string;
  line: EventRouteLine | null;
  amapCfg: AmapClientConfig | null;
  parentLoading?: boolean;
  selectedMarkerId?: string | null;
  onMarkerSelect?: (id: string | null) => void;
}

function canShowMap(amapCfg: AmapClientConfig | null, line: EventRouteLine | null): boolean {
  return (
    !!amapCfg?.enabled &&
    !!amapCfg.apiKey &&
    !!line &&
    (line.path.length >= 2 || line.markers.length > 0)
  );
}

function lineGeometryKey(line: EventRouteLine | null): string {
  if (!line) return "";
  return `${line.id}:${line.path.length}:${line.markers.map((m) => m.id).join(",")}`;
}

export function AmapRouteMapView({
  className,
  line,
  amapCfg,
  parentLoading,
  selectedMarkerId = null,
  onMarkerSelect,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerOverlayMapRef = useRef<Map<string, { overlay: any; data: RouteMapMarker }>>(
    new Map(),
  );
  const lastFitKeyRef = useRef("");
  const selectedMarkerIdRef = useRef(selectedMarkerId);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const geometryKey = useMemo(() => lineGeometryKey(line), [line]);

  useEffect(() => {
    selectedMarkerIdRef.current = selectedMarkerId;
  }, [selectedMarkerId]);

  const applyMarkerStyles = useCallback((selectedId: string | null) => {
    markerOverlayMapRef.current.forEach((entry, id) => {
      const selected = id === selectedId;
      entry.overlay.setzIndex(selected ? 200 : 100);
      entry.overlay.setLabel({
        content: markerLabelHtml(entry.data, selected),
        direction: "top",
      });
    });
  }, []);

  useEffect(() => {
    if (parentLoading) return;
    if (!canShowMap(amapCfg, line)) {
      setMapReady(false);
      setError(
        line && line.path.length < 2 && line.markers.length === 0
          ? "暂无该线路 GIS 数据，请联系赛事运营配置赛道"
          : "高德地图未配置或暂无线路数据",
      );
      return;
    }
    setError(null);

    let cancelled = false;
    (async () => {
      try {
        const AMap = await loadAmapMap(amapCfg!);
        if (cancelled || !containerRef.current || !line) return;

        if (mapRef.current) {
          mapRef.current.destroy();
          mapRef.current = null;
        }

        const center: [number, number] =
          line.center ??
          line.path[0] ?? [line.markers[0]?.lng ?? 104.06, line.markers[0]?.lat ?? 30.57];

        const map = new AMap.Map(containerRef.current, {
          zoom: line.zoom ?? 13,
          center,
          viewMode: "2D",
        });
        map.addControl(new AMap.Scale());
        mapRef.current = map;

        const overlays: any[] = [];
        if (line.path.length >= 2) {
          const pl = new AMap.Polyline({
            path: line.path.map(([lng, lat]) => [lng, lat]),
            strokeColor: "#0891b2",
            strokeWeight: 5,
            lineJoin: "round",
          });
          map.add(pl);
          overlays.push(pl);
        }

        for (const m of line.markers) {
          const selected = m.id === selectedMarkerIdRef.current;
          const marker = new AMap.Marker({
            position: [m.lng, m.lat],
            title: m.label,
            zIndex: selected ? 200 : 100,
            label: {
              content: markerLabelHtml(m, selected),
              direction: "top",
            },
            cursor: "pointer",
          });
          marker.on("click", () => {
            const next = selectedMarkerIdRef.current === m.id ? null : m.id;
            selectedMarkerIdRef.current = next;
            applyMarkerStyles(next);
            onMarkerSelect?.(next);
            if (next) {
              map.setCenter([m.lng, m.lat]);
            }
          });
          map.add(marker);
          overlays.push(marker);
          markerOverlayMapRef.current.set(m.id, { overlay: marker, data: m });
        }

        const fitKey = geometryKey;
        if (fitKey !== lastFitKeyRef.current) {
          lastFitKeyRef.current = fitKey;
          if (overlays.length > 0) {
            map.setFitView(overlays, false, [24, 24, 24, 24]);
          }
        }

        setMapReady(true);
      } catch (e) {
        if (!cancelled) {
          setMapReady(false);
          setError(e instanceof Error ? e.message : "地图加载失败");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [parentLoading, amapCfg, geometryKey, line, applyMarkerStyles, onMarkerSelect]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    applyMarkerStyles(selectedMarkerId);
    if (selectedMarkerId && line) {
      const m = line.markers.find((x) => x.id === selectedMarkerId);
      if (m) {
        mapRef.current.setCenter([m.lng, m.lat]);
      }
    }
  }, [selectedMarkerId, mapReady, line, applyMarkerStyles]);

  useEffect(() => {
    return () => {
      mapRef.current?.destroy();
      mapRef.current = null;
      markerOverlayMapRef.current.clear();
      lastFitKeyRef.current = "";
    };
  }, []);

  if (parentLoading) {
    return (
      <div
        className={
          className ??
          "w-full h-[280px] rounded-xl border border-slate-200 flex items-center justify-center text-sm text-slate-500"
        }
      >
        加载地图…
      </div>
    );
  }

  if (error) {
    return <p className="text-xs text-slate-500 text-center py-8 px-2">{error}</p>;
  }

  return (
    <div
      className={
        className ??
        "w-full h-[280px] rounded-xl border border-slate-200 overflow-hidden relative"
      }
    >
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
