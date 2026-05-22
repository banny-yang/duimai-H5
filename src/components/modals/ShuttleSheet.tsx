import { SheetModal } from "@/components/modals/SheetModal";
import { MOCK_SHUTTLE } from "@/mock/data";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ShuttleSheet({ open, onClose }: Props) {
  return (
    <SheetModal open={open} title="交通接驳与物资" onClose={onClose}>
      <p className="text-xs text-slate-600 mb-4">{MOCK_SHUTTLE.summary}</p>
      <ul className="space-y-3">
        {MOCK_SHUTTLE.items.map((item) => (
          <li
            key={item.title}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
          >
            <p className="text-sm font-bold text-[#1A1A1A]">{item.title}</p>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.detail}</p>
            {item.time && (
              <p className="text-2xs text-primary-dark font-semibold mt-1.5">{item.time}</p>
            )}
          </li>
        ))}
      </ul>
    </SheetModal>
  );
}
