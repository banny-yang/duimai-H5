import { formatVoiceDurationLabel } from "@/lib/voice-message";
import { cn } from "@/lib/cn";

interface Props {
  durationMs?: number;
  className?: string;
  /** 用户气泡内浅色标签 */
  inverted?: boolean;
}

export function VoiceTranscribeTag({ durationMs, className, inverted }: Props) {
  const dur =
    durationMs != null && durationMs > 0 ? formatVoiceDurationLabel(durationMs) : null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[10px] font-semibold leading-none",
        inverted ? "text-white/85" : "text-primary-dark",
        className,
      )}
    >
      <span aria-hidden>🎤</span>
      语音转写{dur ? ` ${dur}` : ""}
    </span>
  );
}

export function isVoiceTranscribedMessage(message: {
  inputSource?: string;
  voicePlaybackDisabled?: boolean;
  audioUrl?: string;
  audioDurationMs?: number;
}): boolean {
  return (
    message.inputSource === "voice" ||
    !!message.voicePlaybackDisabled ||
    (!!message.audioUrl && (message.audioDurationMs ?? 0) > 0)
  );
}
