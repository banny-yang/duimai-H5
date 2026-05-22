import { SheetModal } from "@/components/modals/SheetModal";
import { MOCK_PICKUP_GUIDE } from "@/mock/data";
import type { RunnerProfile } from "@/types";

interface Props {
  open: boolean;
  runner: RunnerProfile;
  onClose: () => void;
  onViewMap?: () => void;
}

export function PickupGuideSheet({ open, runner, onClose, onViewMap }: Props) {
  const g = MOCK_PICKUP_GUIDE;

  return (
    <SheetModal open={open} title={g.title} onClose={onClose}>
      <div className="rounded-xl border border-primary/20 bg-primary-surface px-3 py-3 mb-4">
        <p className="text-sm font-bold text-ink">{runner.name}</p>
        <p className="text-lg font-black text-primary-deeper mt-0.5">{runner.bib}</p>
        <p className="text-xs text-secondary mt-1">{g.location}</p>
        <p className="text-2xs text-primary-dark font-semibold mt-1">{g.hours}</p>
      </div>
      <ul className="space-y-2.5 mb-4">
        {g.items.map((item) => (
          <li key={item} className="flex gap-2 text-sm text-ink/80 leading-snug">
            <span className="text-primary shrink-0">·</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-slate-500 mb-4">{g.mapHint}</p>
      {onViewMap && (
        <button
          type="button"
          onClick={() => {
            onClose();
            onViewMap();
          }}
          className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm active:bg-primary-dark shadow-primary-sm"
        >
          查看领物点位置（赛道地图）
        </button>
      )}
    </SheetModal>
  );
}
