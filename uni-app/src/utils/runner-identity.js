const STORAGE_KEY = 'duimai_h5_runner_identity'

function readAll() {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY)
    if (!raw) return []
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isValidEntry)
  } catch {
    return []
  }
}

function isValidEntry(v) {
  return (
    v &&
    typeof v.eventGuid === 'string' &&
    typeof v.bibNumber === 'string' &&
    typeof v.idCardSuffix === 'string' &&
    /^\d{6}$/.test(v.idCardSuffix)
  )
}

export function getStoredIdentity(eventGuid) {
  const key = eventGuid.trim().toLowerCase()
  return readAll().find((e) => e.eventGuid.trim().toLowerCase() === key) ?? null
}

export function saveStoredIdentity(identity) {
  const list = readAll().filter(
    (e) => e.eventGuid.trim().toLowerCase() !== identity.eventGuid.trim().toLowerCase(),
  )
  list.push(identity)
  uni.setStorageSync(STORAGE_KEY, JSON.stringify(list))
}

export function clearStoredIdentity(eventGuid) {
  const key = eventGuid.trim().toLowerCase()
  const list = readAll().filter((e) => e.eventGuid.trim().toLowerCase() !== key)
  if (list.length === 0) uni.removeStorageSync(STORAGE_KEY)
  else uni.setStorageSync(STORAGE_KEY, JSON.stringify(list))
}
