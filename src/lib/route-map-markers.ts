import type { RouteMapMarker, RouteMapMarkerType } from "@/types/route-map";

export const MARKER_TYPE_LABELS: Record<RouteMapMarkerType, string> = {
  start: "起点",
  finish: "终点",
  aid: "补给",
  medical: "医疗",
  cp: "检查点",
  other: "点位",
};

const MARKER_COLORS: Record<RouteMapMarkerType, { bg: string; color: string }> = {
  start: { bg: "#10b981", color: "#ffffff" },
  finish: { bg: "#7c3aed", color: "#ffffff" },
  aid: { bg: "#0891b2", color: "#ffffff" },
  medical: { bg: "#dc2626", color: "#ffffff" },
  cp: { bg: "#d97706", color: "#ffffff" },
  other: { bg: "#64748b", color: "#ffffff" },
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type PoiHeatLevel = "normal" | "warning" | "critical";

function heatStyle(level?: PoiHeatLevel): string {
  if (level === "critical") {
    return "animation:pulse 1s infinite;box-shadow:0 0 0 2px #fff,0 0 8px #ef4444;";
  }
  if (level === "warning") {
    return "box-shadow:0 0 0 2px #f97316;";
  }
  return "";
}

export function markerLabelHtml(
  m: RouteMapMarker,
  selected: boolean,
  heatLevel?: PoiHeatLevel,
): string {
  const type = (m.type ?? "other") as RouteMapMarkerType;
  let { bg, color } = MARKER_COLORS[type] ?? MARKER_COLORS.other;
  if (heatLevel === "warning") {
    bg = "#ea580c";
  } else if (heatLevel === "critical") {
    bg = "#dc2626";
  }
  const text = escapeHtml(m.label?.trim() || MARKER_TYPE_LABELS[type]);
  const ring = selected
    ? "box-shadow:0 0 0 2px #fff,0 0 0 4px #0891b2;"
    : "";
  return `<div style="background:${bg};color:${color};padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600;white-space:nowrap;${ring}${heatStyle(heatLevel)}">${selected ? "▶ " : ""}${text}</div>`;
}

export function amapNavigationUrl(lng: number, lat: number, name: string): string {
  return `https://uri.amap.com/marker?position=${lng},${lat}&name=${encodeURIComponent(name)}`;
}
