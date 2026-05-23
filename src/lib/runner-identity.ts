/** 选手身份本地缓存（按赛事），不以 URL runnerId 作为验证标志 */
const STORAGE_KEY = "duimai_h5_runner_identity";

export interface StoredRunnerIdentity {
  eventGuid: string;
  bibNumber: string;
  /** 身份证后 6 位，用于再次进入时静默换发选手 JWT */
  idCardSuffix: string;
  savedAt: string;
}

function readAll(): StoredRunnerIdentity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidEntry);
  } catch {
    return [];
  }
}

function isValidEntry(v: unknown): v is StoredRunnerIdentity {
  if (!v || typeof v !== "object") return false;
  const o = v as StoredRunnerIdentity;
  return (
    typeof o.eventGuid === "string" &&
    typeof o.bibNumber === "string" &&
    typeof o.idCardSuffix === "string" &&
    /^\d{6}$/.test(o.idCardSuffix)
  );
}

export function getStoredIdentity(eventGuid: string): StoredRunnerIdentity | null {
  const key = eventGuid.trim().toLowerCase();
  return (
    readAll().find((e) => e.eventGuid.trim().toLowerCase() === key) ?? null
  );
}

export function saveStoredIdentity(identity: StoredRunnerIdentity): void {
  const list = readAll().filter(
    (e) => e.eventGuid.trim().toLowerCase() !== identity.eventGuid.trim().toLowerCase(),
  );
  list.push(identity);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function clearStoredIdentity(eventGuid: string): void {
  const key = eventGuid.trim().toLowerCase();
  const list = readAll().filter((e) => e.eventGuid.trim().toLowerCase() !== key);
  if (list.length === 0) localStorage.removeItem(STORAGE_KEY);
  else localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function hasStoredIdentity(eventGuid: string): boolean {
  return getStoredIdentity(eventGuid) != null;
}
