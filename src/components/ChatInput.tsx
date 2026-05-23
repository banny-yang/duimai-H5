import { useRef, useState } from "react";
import { cn } from "@/lib/cn";

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: Props) {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasText = text.length > 0;
  const canSend = hasText && !disabled;

  const submit = () => {
    const v = text.trim();
    if (!v || disabled) return;
    onSend(v);
    setText("");
  };

  return (
    <div className="border-t border-secondary-border bg-white safe-bottom px-3 py-2.5 z-30 relative">
      <div className="flex items-end gap-2">
        <button
          type="button"
          aria-label="语音输入暂未开通"
          disabled
          title="语音输入暂未开通"
          className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl bg-secondary-border text-secondary cursor-not-allowed"
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
    </div>
  );
}
