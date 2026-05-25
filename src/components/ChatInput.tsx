import { useCallback, useRef, useState } from "react";
import { transcribeSpeech } from "@/api/runner-api";
import { VoiceRecordOverlay } from "@/components/VoiceRecordOverlay";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/cn";

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: Props) {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [cancelSlide, setCancelSlide] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const voice = useVoiceRecorder();
  const pointerActiveRef = useRef(false);
  const startYRef = useRef(0);

  const hasText = text.length > 0;
  const canSend = hasText && !disabled && !transcribing;
  const voiceBusy = transcribing || voice.phase === "recording";
  const voiceDisabled = disabled || voiceBusy;

  const submit = () => {
    const v = text.trim();
    if (!v || disabled) return;
    onSend(v);
    setText("");
    setPreviewText(null);
  };

  const confirmPreview = () => {
    const v = previewText?.trim();
    if (!v || disabled) return;
    onSend(v);
    setPreviewText(null);
    setText("");
  };

  const runTranscribe = useCallback(async (blob: Blob) => {
    setTranscribing(true);
    setVoiceError(null);
    try {
      const res = await transcribeSpeech(blob);
      const t = res.text?.trim();
      if (!t) {
        setVoiceError("未识别到有效语音，请重试");
        return;
      }
      setPreviewText(t);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "语音识别失败，请改用文字输入";
      setVoiceError(msg);
    } finally {
      setTranscribing(false);
    }
  }, []);

  const endPointer = useCallback(async () => {
    if (!pointerActiveRef.current) return;
    pointerActiveRef.current = false;

    if (cancelSlide) {
      voice.cancel();
      setCancelSlide(false);
      return;
    }

    const blob = await voice.stop();
    if (blob) {
      await runTranscribe(blob);
    } else {
      setVoiceError("说话时间太短，请按住至少 1 秒");
    }
  }, [cancelSlide, runTranscribe, voice]);

  const onVoicePointerDown = async (clientY: number) => {
    if (voiceDisabled) return;
    setVoiceError(null);
    setPreviewText(null);
    startYRef.current = clientY;
    setCancelSlide(false);
    pointerActiveRef.current = true;
    const ok = await voice.start();
    if (!ok) {
      pointerActiveRef.current = false;
      if (voice.phase === "denied") {
        setVoiceError("请允许使用麦克风，或使用文字输入");
        voice.resetDenied();
      } else if (voice.phase === "unsupported") {
        setVoiceError("当前浏览器不支持语音输入");
      }
    }
  };

  const onVoicePointerMove = (clientY: number) => {
    if (!pointerActiveRef.current || voice.phase !== "recording") return;
    setCancelSlide(startYRef.current - clientY > 60);
  };

  return (
    <>
      <VoiceRecordOverlay
        visible={voice.phase === "recording" || transcribing}
        elapsedMs={voice.elapsedMs}
        maxMs={voice.maxMs}
        cancelHint={cancelSlide}
      />

      <div className="border-t border-secondary-border bg-white safe-bottom px-3 py-2.5 z-30 relative">
        {previewText != null && (
          <div className="mb-2 p-3 rounded-xl border-2 border-primary/30 bg-primary/5 space-y-2">
            <p className="text-2xs text-secondary font-medium">语音识别结果（可编辑）</p>
            <textarea
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-secondary-border px-3 py-2 text-[15px] text-ink resize-none focus:outline-none focus:border-primary"
            />
            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 h-10 rounded-xl border border-secondary-border text-sm font-medium"
                onClick={() => setPreviewText(null)}
              >
                取消
              </button>
              <button
                type="button"
                className="flex-1 h-10 rounded-xl bg-primary text-white text-sm font-bold"
                disabled={!previewText.trim() || disabled}
                onClick={confirmPreview}
              >
                发送
              </button>
            </div>
          </div>
        )}

        {voiceError && (
          <p className="mb-2 text-2xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5">
            {voiceError}
          </p>
        )}

        {transcribing && (
          <p className="mb-2 text-2xs text-primary font-medium text-center">正在识别语音…</p>
        )}

        <div className="flex items-end gap-2">
          <button
            type="button"
            aria-label="按住说话"
            disabled={voiceDisabled}
            className={cn(
              "shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all select-none touch-none",
              voice.phase === "recording"
                ? "bg-primary text-white scale-110 shadow-primary-sm"
                : voiceDisabled
                  ? "bg-secondary-border text-secondary cursor-not-allowed"
                  : "bg-primary/10 text-primary active:bg-primary active:text-white",
            )}
            onPointerDown={(e) => {
              e.preventDefault();
              (e.target as HTMLElement).setPointerCapture(e.pointerId);
              void onVoicePointerDown(e.clientY);
            }}
            onPointerMove={(e) => onVoicePointerMove(e.clientY)}
            onPointerUp={(e) => {
              (e.target as HTMLElement).releasePointerCapture(e.pointerId);
              void endPointer();
            }}
            onPointerCancel={() => void endPointer()}
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
            placeholder="输入问题，由 AI 助手回答"
            disabled={disabled || voiceBusy}
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
      </div>
    </>
  );
}
