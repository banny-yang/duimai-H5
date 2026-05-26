import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

interface Props {
  audioUrl: string;
  durationMs: number;
  transcribing?: boolean;
  failed?: boolean;
}

function formatDuration(ms: number) {
  const s = Math.max(1, Math.round(ms / 1000));
  const m = Math.floor(s / 60);
  const rest = s % 60;
  if (m > 0) return `${m}'${String(rest).padStart(2, "0")}"`;
  return `${s}"`;
}

export function VoiceMessageBubble({ audioUrl, durationMs, transcribing, failed }: Props) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (failed) return;
    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => setPlaying(false);
      audio.onpause = () => setPlaying(false);
    }
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      void audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  };

  return (
    <button
      type="button"
      onClick={togglePlay}
      disabled={failed}
      className={cn(
        "user-bubble inline-flex items-center gap-2.5 rounded-2xl rounded-br-md px-3 py-2.5 min-w-[88px] max-w-[220px]",
        (transcribing || failed) && "opacity-90",
      )}
      aria-label={playing ? "暂停播放" : "播放语音"}
    >
      <span
        className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0",
          playing ? "bg-white/30" : "bg-white/20",
        )}
      >
        {transcribing ? "…" : playing ? "❚❚" : "▶"}
      </span>
      <span className="flex flex-col items-start gap-0.5 min-w-0">
        <span className="flex items-end gap-0.5 h-5">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={cn(
                "w-0.5 rounded-full bg-white/85",
                playing ? "animate-pulse" : "",
              )}
              style={{
                height: `${10 + (i % 3) * 6}px`,
                animationDelay: `${i * 0.12}s`,
              }}
            />
          ))}
        </span>
        <span className="text-2xs text-white/90 font-medium leading-none">
          {failed ? "识别失败" : transcribing ? "识别中…" : formatDuration(durationMs)}
        </span>
      </span>
    </button>
  );
}
