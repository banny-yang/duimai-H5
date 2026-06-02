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
      className="emergency-notice-bar mx-3 mt-2 box-border flex w-[calc(100%-1.5rem)] max-w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left transition-transform active:scale-[0.995]"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500 text-white shadow-sm">
        <MegaphoneIcon className="h-4 w-4" />
      </span>
      <div className="emergency-notice-marquee-mask">
        <NoticeMarquee
          text={marqueeText}
          alwaysScroll
          className="text-sm font-semibold tracking-tight text-slate-800"
          edgeFadeClass="from-white"
        />
      </div>
    </button>
  );
}

export function NotificationBar({ event, onClick }: Props) {
  const isEmergency = event.emergencyActive && !!event.emergencyNotice?.trim();
  const text = isEmergency ? event.emergencyNotice!.trim() : phaseNoticeText(event);
  const marqueeText = text.replace(/\s+/g, " ").trim();

  if (isEmergency) {
    return <EmergencyNoticeBar text={text} onClick={() => onClick?.(event.phase)} />;
  }

  if (!marqueeText) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => onClick?.(event.phase)}
      aria-label={`赛事公告：${marqueeText}`}
      className="notice-bar flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-opacity active:opacity-90"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
        <MegaphoneIcon className="h-4 w-4" />
      </span>
      <div className="emergency-notice-marquee-mask min-h-5 flex-1">
        <NoticeMarquee
          text={marqueeText}
          alwaysScroll
          className="text-xs font-semibold text-ink"
          edgeFadeClass="from-[var(--primary-surface)]"
        />
      </div>
    </button>
  );
}
