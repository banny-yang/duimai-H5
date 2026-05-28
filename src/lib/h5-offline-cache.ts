import type { H5Branding, H5QuickQuestions } from "@/api/runner-api";

const KEY_PREFIX = "duimai_offline_pack_";

export interface OfflinePackCache {
  eventGuid: string;
  eventName: string;
  phase: string;
  cachedAt: string;
  quickQuestions: H5QuickQuestions | null;
  faqSnippets: string[];
  branding?: H5Branding | null;
}

export function readOfflinePack(eventGuid: string): OfflinePackCache | null {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + eventGuid);
    if (!raw) return null;
    return JSON.parse(raw) as OfflinePackCache;
  } catch {
    return null;
  }
}

export function writeOfflinePack(eventGuid: string, pack: OfflinePackCache): void {
  try {
    localStorage.setItem(KEY_PREFIX + eventGuid, JSON.stringify(pack));
  } catch {
    /* quota */
  }
}
