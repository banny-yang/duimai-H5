import { useCallback, useRef, useState } from "react";

const HOLD_MS = 3000;

interface Props {
  onTriggered: () => void;
}

/** 高定赛事红 · 球体渐变 + 呼吸光晕 */
export function SosFloatingButton({ onTriggered }: Props) {
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(0);

  const clear = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setProgress(0);
  }, []);

  const startHold = useCallback(() => {
    clear();
    startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const p = Math.min(1, (Date.now() - startRef.current) / HOLD_MS);
      setProgress(p);
      if (p >= 1) {
        clear();
        onTriggered();
      }
    }, 50);
  }, [clear, onTriggered]);

  return (
    <div
      className="fixed z-40 right-3 flex flex-col items-center pointer-events-none"
      style={{ bottom: "calc(11.5rem + env(safe-area-inset-bottom, 0px))" }}
    >
      {progress > 0 && progress < 1 && (
        <span className="pointer-events-none mb-1 text-2xs text-alert font-bold whitespace-nowrap bg-white/95 px-2 py-0.5 rounded-full shadow-sm border border-secondary-border">
          继续按住 {Math.ceil((1 - progress) * 3)}s
        </span>
      )}
      <div
        className={`pointer-events-auto rounded-full ${progress > 0 ? "" : "animate-sos-breathe"}`}
        style={{
          padding: progress > 0 ? 3 : 0,
          background:
            progress > 0
              ? `conic-gradient(white ${progress * 360}deg, transparent 0)`
              : undefined,
        }}
      >
        <button
          type="button"
          aria-label="SOS 紧急求助，长按三秒触发"
          className="sos-sphere w-[3.75rem] h-[3.75rem] rounded-full text-white font-black text-sm flex items-center justify-center touch-none select-none ring-4 ring-white"
          onPointerDown={(e) => {
            e.preventDefault();
            startHold();
          }}
          onPointerUp={clear}
          onPointerLeave={clear}
          onPointerCancel={clear}
        >
          SOS
        </button>
      </div>
      <span className="pointer-events-none mt-1.5 text-[10px] text-secondary font-semibold">
        长按3秒
      </span>
    </div>
  );
}
