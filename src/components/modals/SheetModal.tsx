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
      <div className="relative w-full max-h-[85dvh] overflow-y-auto overscroll-contain rounded-t-2xl bg-white safe-bottom">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
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
