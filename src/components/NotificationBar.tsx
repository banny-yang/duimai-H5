import type { EventInfo, RacePhase } from "@/types";



interface Props {

  event: EventInfo;

  onClick?: (phase: RacePhase) => void;

}



function MegaphoneIcon({ className }: { className?: string }) {

  return (

    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>

      <path d="M11 5L6 9H3a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h3l5 4V5zm2.5 1.5a6.5 6.5 0 0 1 0 11 1 1 0 0 0 .2 1.4 1 1 0 0 0 1.4-.2 8.5 8.5 0 0 0 0-13.2 1 1 0 0 0-1.4.2 1 1 0 0 0 .2 1.4z" />

    </svg>

  );

}



export function NotificationBar({ event, onClick }: Props) {

  const text = event.phase === "pre" ? event.preNotice : event.raceNotice;

  const isPre = event.phase === "pre";

  const hint =

    event.actionHint ?? (isPre ? "点击查看领物须知 ›" : "点击查看赛道与补给 ›");



  return (

    <button

      type="button"

      onClick={() => onClick?.(event.phase)}

      className="notice-bar mx-3 mt-1.5 w-[calc(100%-1.5rem)] flex items-center gap-2.5 rounded-r-lg px-2.5 py-2.5 text-left active:opacity-90 transition-opacity"

    >

      <span className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-primary/10 text-primary-dark/70">

        <MegaphoneIcon className="w-4 h-4" />

      </span>

      <div className="flex-1 min-w-0">

        <p className="text-xs font-semibold text-ink leading-snug line-clamp-2">{text}</p>

        <p className="text-2xs text-primary-dark font-medium mt-0.5">{hint}</p>

      </div>

    </button>

  );

}


