import { SheetModal } from "@/components/modals/SheetModal";
import { ROUTE_POINTS } from "@/mock/data";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function RouteMapSheet({ open, onClose }: Props) {
  return (
    <SheetModal open={open} title="赛道补给地图" onClose={onClose}>
      <p className="text-xs text-slate-500 mb-4">示意赛道（模拟数据），补给站标注公里数</p>
      <div className="relative rounded-xl bg-slate-100 p-4 min-h-[220px]">
        <div className="absolute left-6 top-4 bottom-4 w-1 bg-primary/25 rounded-full" />
        <ul className="relative space-y-4 pl-10">
          {ROUTE_POINTS.map((p, i) => (
            <li key={p.km} className="relative">
              <span
                className={`absolute -left-[1.65rem] top-0.5 w-3 h-3 rounded-full border-2 border-white ${
                  p.label.includes("补给") ? "bg-primary" : "bg-primary-dark"
                }`}
              />
              <div className="flex justify-between text-sm">
                <span className="font-semibold">{p.label}</span>
                <span className="text-slate-500">{p.km === 42.195 ? "42.195" : p.km} km</span>
              </div>
              {p.label.includes("补给") && (
                <p className="text-2xs text-primary-dark mt-0.5">💧 饮水 · 医疗 · 香蕉</p>
              )}
              {i < ROUTE_POINTS.length - 1 && (
                <div className="h-4 border-l border-dashed border-slate-300 ml-1" />
              )}
            </li>
          ))}
        </ul>
      </div>
      <p className="text-2xs text-center text-slate-400 mt-3">正式版将接入赛事官方赛道 GIS</p>
    </SheetModal>
  );
}
