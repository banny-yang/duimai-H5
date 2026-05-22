import { useRef, useState } from "react";
import { cn } from "@/lib/cn";

interface Props {
  onSend: (text: string) => void;
  onVoiceResult?: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, onVoiceResult, disabled }: Props) {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const [recording, setRecording] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasText = text.length > 0;
  const canSend = hasText && !disabled;

  const submit = () => {
    const v = text.trim();
    if (!v || disabled) return;
    onSend(v);
    setText("");
  };

  const handleVoice = () => {
    if (disabled || recording) return;
    setRecording(true);
    window.setTimeout(() => {
      setRecording(false);
      const mock = "最近的补给点在哪？";
      onVoiceResult?.(mock);
      onSend(mock);
    }, 2000);
  };

  return (
    <div className="border-t border-secondary-border bg-white safe-bottom px-3 py-2.5 z-30 relative">
      <div className="flex items-end gap-2">
        <button
          type="button"
          aria-label="语音输入"
          disabled={disabled}
          onClick={handleVoice}
          className={cn(
            "shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl text-white",
            recording ? "bg-alert scale-110" : "bg-primary active:bg-primary-dark",
            "disabled:bg-secondary-border disabled:text-secondary",
          )}
        >
          {recording ? "···" : "🎤"}
        </button>
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => e.key === "Enter" && canSend && submit()}
          placeholder="打字提问或点麦克风"
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
      {recording && (
        <p className="text-center text-2xs text-alert font-medium mt-1.5 animate-pulse">
          正在聆听…（模拟语音转文字）
        </p>
      )}
    </div>
  );
}
