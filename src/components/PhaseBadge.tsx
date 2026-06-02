import { phaseLabel } from "@/lib/event-phase";
import type { H5Phase } from "@/types";

interface Props {
  phase: H5Phase;
}

export function PhaseBadge({ phase }: Props) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/20 bg-primary-surface px-2.5 py-1 text-2xs font-semibold text-primary-dark">
      <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
      {phaseLabel(phase)}
    </span>
  );
}
