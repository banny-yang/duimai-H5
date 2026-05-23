import { useCallback, useRef, useState } from "react";

const HOLD_MS = 3000;

interface Props {
  onTriggered: () => void;
  /** 未绑定选手身份（访客）时禁用 */
  disabled?: boolean;
  onDisabledTap?: () => void;
}

/** 高定赛事红 · 球体渐变 + 呼吸光晕；未验证身份时为灰色不可触发 */
export function SosFloatingButton({
  onTriggered,
  disabled = false,
  onDisabledTap,
}: Props) {
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(0);

  const clear = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setProgress(0);
  }, []);

  const startHold = useCallback(() => {
    if (disabled) return;
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
  }, [clear, disabled, onTriggered]);

  const handleDisabledTap = useCallback(() => {
    onDisabledTap?.();
  }, [onDisabledTap]);

  return (
    <div
      className="fixed z-40 right-3 flex flex-col items-center pointer-events-none"
      style={{ bottom: "calc(11.5rem + env(safe-area-inset-bottom, 0px))" }}
    >
      {!disabled && progress > 0 && progress < 1 && (
        <span className="pointer-events-none mb-1 text-2xs text-alert font-bold whitespace-nowrap bg-white/95 px-2 py-0.5 rounded-full shadow-sm border border-secondary-border">
          继续按住 {Math.ceil((1 - progress) * 3)}s
        </span>
      )}
      <div
        className={`pointer-events-auto rounded-full ${
          disabled ? "" : progress > 0 ? "" : "animate-sos-breathe"
        }`}
        style={{
          padding: !disabled && progress > 0 ? 3 : 0,
          background:
            !disabled && progress > 0
              ? `conic-gradient(white ${progress * 360}deg, transparent 0)`
              : undefined,
        }}
      >
        <button
          type="button"
          disabled={disabled}
          aria-label={
            disabled
              ? "SOS 紧急求助未开放，请先完成身份验证"
              : "SOS 紧急求助，长按三秒触发"
          }
          aria-disabled={disabled}
          className={
            disabled
              ? "w-[3.75rem] h-[3.75rem] rounded-full bg-slate-200 text-slate-400 font-black text-sm flex items-center justify-center touch-none select-none ring-4 ring-white shadow-sm cursor-not-allowed"
              : "sos-sphere w-[3.75rem] h-[3.75rem] rounded-full text-white font-black text-sm flex items-center justify-center touch-none select-none ring-4 ring-white"
          }
          onClick={disabled ? handleDisabledTap : undefined}
          onPointerDown={(e) => {
            if (disabled) return;
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
      <span
        className={`pointer-events-none mt-1.5 text-[10px] font-semibold ${
          disabled ? "text-slate-400" : "text-secondary"
        }`}
      >
        {disabled ? "需身份验证" : "长按3秒"}
      </span>
    </div>
  );
}
