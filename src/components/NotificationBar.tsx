import { NoticeMarquee } from "@/components/NoticeMarquee";
import type { EventInfo, H5Phase } from "@/types";

interface Props {
  event: EventInfo;
  onClick?: (phase: H5Phase) => void;
}

function MegaphoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M11 5L6 9H3a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h3l5 4V5zm2.5 1.5a6.5 6.5 0 0 1 0 11 1 1 0 0 0 .2 1.4 1 1 0 0 0 1.4-.2 8.5 8.5 0 0 0 0-13.2 1 1 0 0 0-1.4.2 1 1 0 0 0 .2 1.4z" />
    </svg>
  );
}

function phaseNoticeText(event: EventInfo): string {
  if (event.phase === "race") return event.raceNotice;
  if (event.phase === "post") return event.postNotice;
  return event.preNotice;
}

function EmergencyNoticeBar({ text, onClick }: { text: string; onClick?: () => void }) {
  const marqueeText = text.replace(/\s+/g, " ").trim();

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`应急通知：${marqueeText}`}
      className="emergency-notice-bar mx-3 mt-2 box-border flex w-[calc(100%-1.5rem)] max-w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-transform active:scale-[0.995]"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-rose-500 text-white shadow-sm">
        <MegaphoneIcon className="h-3.5 w-3.5" />
      </span>
      <div className="emergency-notice-marquee-mask">
        <NoticeMarquee
          text={marqueeText}
          alwaysScroll
          className="text-sm font-semibold tracking-tight text-slate-800"
        />
      </div>
    </button>
  );
}

export function NotificationBar({ event, onClick }: Props) {
  const isEmergency = event.emergencyActive && !!event.emergencyNotice?.trim();
  const text = isEmergency ? event.emergencyNotice!.trim() : phaseNoticeText(event);
  const hint =
    event.actionHint ??
    (event.phase === "pre"
      ? "点击查看领物须知 ›"
      : event.phase === "post"
        ? "点击查看接驳与赛后服务 ›"
        : "点击查看赛道与补给 ›");

  if (isEmergency) {
    return (
      <EmergencyNoticeBar text={text} onClick={() => onClick?.(event.phase)} />
    );
  }

  return (
    <button
      type="button"
      onClick={() => onClick?.(event.phase)}
      className="notice-bar mx-3 mt-1.5 flex w-[calc(100%-1.5rem)] items-center gap-2.5 rounded-r-lg px-2.5 py-2.5 text-left transition-opacity active:opacity-90"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary-dark/70">
        <MegaphoneIcon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-xs font-semibold leading-snug text-ink">{text}</p>
        <p className="mt-0.5 text-2xs font-medium text-primary-dark">{hint}</p>
      </div>
    </button>
  );
}
