import { phaseLabel } from "@/lib/event-phase";
import type { H5Phase } from "@/types";

interface Props {
  phase: H5Phase;
}

export function PhaseBadge({ phase }: Props) {
  return (
    <span className="shrink-0 text-2xs font-semibold px-2.5 py-1 rounded-full border bg-primary-surface text-primary-deeper border-primary/25">
      {phaseLabel(phase)}
    </span>
  );
}
