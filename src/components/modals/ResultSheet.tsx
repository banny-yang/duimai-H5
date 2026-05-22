import { SheetModal } from "@/components/modals/SheetModal";
import { MOCK_RESULT } from "@/mock/data";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ResultSheet({ open, onClose }: Props) {
  const r = MOCK_RESULT;
  return (
    <SheetModal open={open} title="成绩与计时查询" onClose={onClose}>
      <div className="text-center py-4">
        <p className="text-2xs text-slate-500">净成绩</p>
        <p className="text-4xl font-black text-primary tabular-nums">{r.netTime}</p>
        <p className="text-xs text-slate-500 mt-1">枪声 {r.finishTime} · {r.status}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-2">
        <div className="rounded-xl bg-slate-50 p-3 text-center">
          <p className="text-2xs text-slate-500">总排名</p>
          <p className="text-xl font-bold">{r.rankOverall}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 text-center">
          <p className="text-2xs text-slate-500">性别排名</p>
          <p className="text-xl font-bold">{r.rankGender}</p>
        </div>
      </div>
      <p className="text-2xs text-center text-slate-400 mt-4">冲线后数据自动同步（模拟）</p>
    </SheetModal>
  );
}
