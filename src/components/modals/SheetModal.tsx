import type { ReactNode } from "react";

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function SheetModal({ open, title, onClose, children }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center max-w-md mx-auto">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="关闭" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-2xl max-h-[85dvh] overflow-y-auto safe-bottom">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">{title}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 text-xl leading-none px-2">
            ×
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
