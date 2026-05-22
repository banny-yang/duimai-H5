import type { RacePhase } from "@/types";

interface Props {
  phase: RacePhase;
}

export function PhaseBadge({ phase }: Props) {
  return (
    <span className="shrink-0 text-2xs font-semibold px-2.5 py-1 rounded-full border bg-primary-surface text-primary-deeper border-primary/25">
      {phase === "race" ? "赛中" : "赛前"}
    </span>
  );
}
