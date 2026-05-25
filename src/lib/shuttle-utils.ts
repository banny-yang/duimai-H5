import type { H5Phase } from "@/types";
import type { EventShuttleConfig, ShuttleItem, ShuttlePhase } from "@/types/shuttle";

export function filterShuttleItemsByPhase(
  items: ShuttleItem[],
  phase: H5Phase,
): ShuttleItem[] {
  return items.filter((item) => {
    const p = (item.phase ?? "all") as ShuttlePhase;
    return p === "all" || p === phase;
  });
}

export function isShuttleVisible(config: EventShuttleConfig | null | undefined): boolean {
  if (!config || config.enabled === false) return false;
  return (
    !!config.summary?.trim() ||
    (config.items?.length ?? 0) > 0 ||
    config.pickup?.enabled !== false
  );
}

export function isPickupVisible(config: EventShuttleConfig | null | undefined): boolean {
  if (!config || config.enabled === false) return false;
  const p = config.pickup;
  if (!p || p.enabled === false) return false;
  return !!(
    p.location?.trim() ||
    p.hours?.trim() ||
    (p.items?.length ?? 0) > 0
  );
}
