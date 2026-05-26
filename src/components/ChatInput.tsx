import { useCallback, useEffect, useRef, useState } from "react";
import { VoiceRecordOverlay } from "@/components/VoiceRecordOverlay";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { clampVoiceDurationMs } from "@/lib/voice-message";
import { cn } from "@/lib/cn";

export interface VoiceMessagePayload {
  blob: Blob;
  durationMs: number;
}

interface Props {
  onSendText: (text: string) => void;
  onVoiceMessage: (payload: VoiceMessagePayload) => void;
  disabled?: boolean;
}

type InputMode = "text" | "voice";

export function ChatInput({ onSendText, onVoiceMessage, disabled }: Props) {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [cancelSlide, setCancelSlide] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const holdBtnRef = useRef<HTMLButtonElement>(null);
  const capturePointerIdRef = useRef<number | null>(null);
  const voice = useVoiceRecorder();
  const pointerActiveRef = useRef(false);
  const cancelSlideRef = useRef(false);
  const startYRef = useRef(0);

  const hasText = text.length > 0;
  const canSend = hasText && !disabled;
  const isRecording = voice.phase === "recording";
  const voiceMode = inputMode === "voice";

  const submit = () => {
    const v = text.trim();
    if (!v || disabled) return;
    onSendText(v);
    setText("");
  };

  const cancelRecording = useCallback(() => {
    pointerActiveRef.current = false;
    cancelSlideRef.current = false;
    setCancelSlide(false);
    voice.cancel();
  }, [voice]);

  const endPointer = useCallback(async () => {
    if (!pointerActiveRef.current) return;
    pointerActiveRef.current = false;

    if (cancelSlideRef.current) {
      cancelRecording();
      return;
    }

    const durationMs = clampVoiceDurationMs(voice.elapsedMs);
    const blob = await voice.stop();
    if (!blob) {
      if (voice.phase === "idle") {
        setVoiceError("说话时间太短，请按住至少 0.5 秒");
      }
      return;
    }

    setVoiceError(null);
    onVoiceMessage({ blob, durationMs });
  }, [cancelRecording, onVoiceMessage, voice]);

  const onHoldPointerDown = useCallback(
    async (clientY: number) => {
      if (disabled || isRecording) return;
      setVoiceError(null);
      startYRef.current = clientY;
      cancelSlideRef.current = false;
      setCancelSlide(false);
      pointerActiveRef.current = true;
      const ok = await voice.start();
      if (!ok) {
        pointerActiveRef.current = false;
        if (voice.phase === "denied") {
          setVoiceError("请允许使用麦克风");
          voice.resetDenied();
        } else if (voice.phase === "unsupported") {
          setVoiceError("当前浏览器不支持语音输入");
        }
      }
    },
    [disabled, isRecording, voice],
  );

  const onHoldPointerMove = useCallback(
    (clientY: number) => {
      if (!pointerActiveRef.current || !isRecording) return;
      const slide = startYRef.current - clientY > 60;
      cancelSlideRef.current = slide;
      setCancelSlide(slide);
    },
    [isRecording],
  );

  const releaseCapture = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const id = capturePointerIdRef.current;
    if (id != null) {
      try {
        e.currentTarget.releasePointerCapture(id);
      } catch {
        /* ignore */
      }
      capturePointerIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isRecording || voice.elapsedMs < voice.maxMs) return;
    void endPointer();
  }, [isRecording, voice.elapsedMs, voice.maxMs, endPointer]);

  useEffect(() => {
    if (!isRecording) return;

    const onWindowPointerEnd = () => {
      void endPointer();
    };
    const onHidden = () => {
      if (document.hidden) cancelRecording();
    };

    window.addEventListener("pointerup", onWindowPointerEnd, { passive: true });
    window.addEventListener("pointercancel", onWindowPointerEnd, { passive: true });
    document.addEventListener("visibilitychange", onHidden);

    return () => {
      window.removeEventListener("pointerup", onWindowPointerEnd);
      window.removeEventListener("pointercancel", onWindowPointerEnd);
      document.removeEventListener("visibilitychange", onHidden);
    };
  }, [isRecording, endPointer, cancelRecording]);

  return (
    <>
      <VoiceRecordOverlay
        visible={isRecording}
        elapsedMs={voice.elapsedMs}
        maxMs={voice.maxMs}
        cancelHint={cancelSlide}
        onCancel={isRecording ? cancelRecording : undefined}
      />

      <div className="border-t border-secondary-border bg-white safe-bottom px-3 py-2.5 z-30 relative">
        {voiceError && (
          <p className="mb-2 text-2xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5">
            {voiceError}
          </p>
        )}

        {voiceMode ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="切换到键盘输入"
              disabled={disabled || isRecording}
              className={cn(
                "shrink-0 w-10 h-11 rounded-xl flex items-center justify-center text-lg border border-secondary-border bg-secondary-bg",
                disabled || isRecording ? "opacity-50" : "active:bg-secondary-border",
              )}
              onClick={() => {
                if (isRecording) return;
                setInputMode("text");
                setVoiceError(null);
                requestAnimationFrame(() => inputRef.current?.focus());
              }}
            >
              ⌨️
            </button>
            <button
              ref={holdBtnRef}
              type="button"
              disabled={disabled}
              className={cn(
                "flex-1 h-11 rounded-xl border-2 font-bold text-[15px] select-none touch-none transition-all",
                isRecording
                  ? "border-primary bg-primary/10 text-primary scale-[0.98]"
                  : "border-secondary-border bg-secondary-bg text-ink active:bg-secondary-border",
              )}
              onPointerDown={(e) => {
                if (disabled) return;
                e.preventDefault();
                capturePointerIdRef.current = e.pointerId;
                try {
                  e.currentTarget.setPointerCapture(e.pointerId);
                } catch {
                  /* ignore */
                }
                void onHoldPointerDown(e.clientY);
              }}
              onPointerMove={(e) => onHoldPointerMove(e.clientY)}
              onPointerUp={(e) => {
                releaseCapture(e);
                void endPointer();
              }}
              onPointerCancel={(e) => {
                releaseCapture(e);
                void endPointer();
              }}
              onContextMenu={(e) => e.preventDefault()}
            >
              {isRecording ? "松开 结束" : "按住 说话"}
            </button>
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <button
              type="button"
              aria-label="切换到语音输入"
              disabled={disabled}
              className={cn(
                "shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all",
                disabled
                  ? "bg-secondary-border text-secondary cursor-not-allowed"
                  : "bg-primary/10 text-primary active:bg-primary active:text-white",
              )}
              onClick={() => {
                setInputMode("voice");
                setVoiceError(null);
              }}
            >
              🎤
            </button>
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => e.key === "Enter" && canSend && submit()}
              placeholder="输入问题…"
              disabled={disabled}
              className={cn(
                "flex-1 min-h-12 rounded-2xl border-2 px-4 text-[15px] text-ink font-medium transition-colors",
                "focus:outline-none disabled:bg-secondary-bg",
                focused || hasText ? "border-primary" : "border-secondary-border",
              )}
            />
            <button
              type="button"
              onClick={submit}
              disabled={!canSend}
              className={cn(
                "shrink-0 h-12 px-5 rounded-2xl text-sm font-bold transition-all duration-150",
                canSend
                  ? "bg-primary text-white shadow-primary-sm active:bg-primary-dark active:scale-95"
                  : "bg-secondary-border text-secondary cursor-not-allowed",
              )}
            >
              发送
            </button>
          </div>
        )}
      </div>
    </>
  );
}
