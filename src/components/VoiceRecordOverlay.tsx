import { cn } from "@/lib/cn";

interface Props {
  visible: boolean;
  elapsedMs: number;
  maxMs: number;
  cancelHint?: boolean;
  onCancel?: () => void;
}

export function VoiceRecordOverlay({
  visible,
  elapsedMs,
  maxMs,
  cancelHint,
  onCancel,
}: Props) {
  if (!visible) return null;

  const sec = Math.floor(elapsedMs / 1000);
  const maxSec = Math.floor(maxMs / 1000);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-end pb-24 px-4 pointer-events-none">
      <div
        className={cn(
          "pointer-events-auto px-6 py-4 rounded-2xl shadow-lg text-center min-w-[220px] max-w-sm",
          cancelHint ? "bg-destructive/90 text-white" : "bg-ink/85 text-white",
        )}
      >
        <p className="text-sm font-bold">
          {cancelHint ? "松开手指即可取消" : "松开发送 · 上滑取消"}
        </p>
        <p className="text-xs mt-1 opacity-90">
          {sec}s / {maxSec}s
        </p>
        {!cancelHint && (
          <div className="flex justify-center gap-1 mt-3 h-6 items-end">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="w-1 bg-white/80 rounded-full animate-pulse"
                style={{
                  height: `${12 + (i % 3) * 8}px`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>
      {onCancel && (
        <button
          type="button"
          className="pointer-events-auto mt-4 px-8 py-2.5 rounded-full bg-white text-ink text-sm font-bold shadow-md border border-slate-200 active:scale-95"
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onCancel();
          }}
        >
          取消录音
        </button>
      )}
    </div>
  );
}
