import type { SupplyCardData } from "@/types";

interface Props {
  data: SupplyCardData;
}

export function SupplyStationCard({ data }: Props) {
  return (
    <div className="rounded-xl border border-primary/20 bg-primary-surface overflow-hidden text-sm shadow-sm">
      <div
        className="px-3 py-2.5 text-white font-semibold leading-snug"
        style={{ background: "linear-gradient(90deg, #06b6d4 0%, #0e7490 100%)" }}
      >
        🏪 下一站点：{data.stationName}（距离您 {data.distance}）
      </div>
      <div className="px-3 py-2 space-y-1 text-ink/90">
        <p>💧 物资提供：{data.supplies}</p>
        <p>🚑 医疗配置：{data.medical}</p>
      </div>
      <a
        href={data.navUrl}
        target="_blank"
        rel="noreferrer"
        className="block mx-3 mb-3 py-2.5 rounded-lg bg-primary text-white text-center font-semibold active:bg-primary-dark shadow-primary-sm"
      >
        📍 点击一键唤起高德地图导航前往
      </a>
    </div>
  );
}
