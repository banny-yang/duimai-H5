const KEY_PREFIX = 'duimai_offline_pack_'

export function readOfflinePack(eventGuid) {
  try {
    const raw = uni.getStorageSync(KEY_PREFIX + eventGuid)
    if (!raw) return null
    return typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch {
    return null
  }
}

export function writeOfflinePack(eventGuid, pack) {
  try {
    uni.setStorageSync(KEY_PREFIX + eventGuid, JSON.stringify(pack))
  } catch {
    /* quota */
  }
}
