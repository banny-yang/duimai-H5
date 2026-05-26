import { useEffect, useRef, useState } from "react";
import {
  calcVoiceBubbleWidthPx,
  clampVoiceDurationMs,
  formatVoiceDurationLabel,
} from "@/lib/voice-message";
import { cn } from "@/lib/cn";

interface Props {
  audioUrl?: string;
  durationMs: number;
  transcribing?: boolean;
  failed?: boolean;
  /** 历史记录无本地音频，仅展示时长条 */
  playbackDisabled?: boolean;
}

const WAVE_HEIGHTS = [10, 16, 12, 18, 14];

function VoiceWaveBars({ playing }: { playing: boolean }) {
  return (
    <span className="flex items-center justify-end gap-[3px] flex-1 min-w-[40px] h-5 overflow-hidden">
      {WAVE_HEIGHTS.map((h, i) => (
        <span
          key={i}
          className={cn(
            "voice-wave-bar w-[3px] rounded-full bg-white/90",
            playing && "voice-wave-bar--playing",
          )}
          style={{
            height: `${h}px`,
            animationDelay: playing ? `${i * 0.12}s` : undefined,
          }}
        />
      ))}
    </span>
  );
}

export function VoiceMessageBubble({
  audioUrl,
  durationMs,
  transcribing,
  failed,
  playbackDisabled = false,
}: Props) {
  const [playing, setPlaying] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(
    () => (typeof window !== "undefined" ? window.innerWidth : 375),
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const safeMs = clampVoiceDurationMs(durationMs);
  const widthPx = calcVoiceBubbleWidthPx(safeMs, viewportWidth);
  const durationLabel = formatVoiceDurationLabel(safeMs);
  const canPlay = !failed && !transcribing && !playbackDisabled && !!audioUrl;

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [audioUrl]);

  useEffect(() => {
    if (!canPlay && playing) setPlaying(false);
  }, [canPlay, playing]);

  const togglePlay = () => {
    if (!canPlay) return;
    let audio = audioRef.current;
    if (!audio && audioUrl) {
      audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => setPlaying(false);
      audio.onpause = () => setPlaying(false);
    }
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      void audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  };

  const showPlayingAnim = playing && canPlay;

  return (
    <button
      type="button"
      onClick={togglePlay}
      disabled={failed || (!canPlay && !transcribing)}
      style={{ width: widthPx }}
      className={cn(
        "user-bubble inline-flex items-center gap-1.5 rounded-2xl rounded-br-md",
        "h-10 pl-2 pr-2.5 shrink-0 transition-[width] duration-200",
        (transcribing || failed) && "opacity-90",
        !canPlay && !transcribing && !failed && "cursor-default",
      )}
      aria-label={
        playbackDisabled
          ? `语音 ${durationLabel}`
          : playing
            ? "暂停播放"
            : "播放语音"
      }
    >
      <span
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0",
          showPlayingAnim ? "bg-white/30" : "bg-white/20",
        )}
      >
        {transcribing ? "…" : showPlayingAnim ? "❚❚" : playbackDisabled ? "🎤" : "▶"}
      </span>

      <VoiceWaveBars playing={showPlayingAnim} />

      <span
        className={cn(
          "text-xs text-white font-semibold tabular-nums shrink-0 leading-none",
          "min-w-[1.5rem] text-right",
          failed && "text-[10px] font-medium min-w-0",
        )}
      >
        {failed ? "失败" : transcribing ? "…" : durationLabel}
      </span>
    </button>
  );
}
