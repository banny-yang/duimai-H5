import type { BibCardData } from "@/types";

interface Props {
  data: BibCardData;
}

export function BibPickupCard({ data }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm text-sm">
      <div className="px-3 py-2 border-b border-slate-100 font-semibold text-slate-800">
        🎫 领物凭证 · {data.name}
      </div>
      <div className="px-3 py-3 flex gap-3 items-center">
        <div className="flex-1">
          <p className="text-2xs text-slate-500">参赛号</p>
          <p className="text-xl font-black text-primary">{data.bib}</p>
          <p className="mt-2 text-2xs text-slate-500">领物窗口</p>
          <p className="text-base font-bold">{data.counter}</p>
        </div>
        <div className="shrink-0 w-24 h-16 rounded border border-dashed border-slate-300 flex flex-col items-center justify-center bg-slate-50">
          <div className="w-full h-8 bg-[repeating-linear-gradient(90deg,#000_0_2px,#fff_2px_4px)] opacity-80" />
          <span className="text-2xs text-slate-400 mt-1 font-mono">{data.barcode}</span>
        </div>
      </div>
      <p className="px-3 pb-3 text-2xs text-slate-500">志愿者扫描条形码即可发放参赛包</p>
    </div>
  );
}
