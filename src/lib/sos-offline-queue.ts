import type { SosPayload } from "@/types";

const QUEUE_KEY = "duimai_sos_offline_queue";

export function enqueueOfflineSos(payload: SosPayload): void {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    const list: SosPayload[] = raw ? (JSON.parse(raw) as SosPayload[]) : [];
    list.push(payload);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(list.slice(-5)));
  } catch {
    /* ignore quota */
  }
}

export function peekOfflineSos(): SosPayload[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as SosPayload[]) : [];
  } catch {
    return [];
  }
}

export function clearOfflineSos(): void {
  localStorage.removeItem(QUEUE_KEY);
}
