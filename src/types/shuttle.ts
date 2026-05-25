export type ShuttlePhase = "pre" | "race" | "post" | "all";

export interface ShuttleItem {
  id: string;
  title: string;
  detail: string;
  time?: string;
  phase?: ShuttlePhase;
  sortOrder?: number;
}

export interface PickupGuide {
  enabled?: boolean;
  title: string;
  location: string;
  hours: string;
  items: string[];
  mapHint: string;
}

export interface EventShuttleConfig {
  enabled?: boolean;
  summary: string;
  items: ShuttleItem[];
  pickup: PickupGuide;
}

export const PHASE_LABELS: Record<ShuttlePhase, string> = {
  pre: "赛前",
  race: "赛中",
  post: "赛后",
  all: "全阶段",
};
