const QUEUE_KEY = 'duimai_sos_offline_queue'

export function enqueueOfflineSos(payload) {
  try {
    const raw = uni.getStorageSync(QUEUE_KEY)
    const list = raw ? JSON.parse(raw) : []
    list.push(payload)
    uni.setStorageSync(QUEUE_KEY, JSON.stringify(list.slice(-5)))
  } catch {
    /* ignore */
  }
}
