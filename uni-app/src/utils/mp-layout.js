/** 微信小程序：页面高度与窗口变化（流式 grid 布局，不再 fixed 锚定） */
export function isMpWeixinPlatform() {
  if (import.meta.env.UNI_PLATFORM === 'mp-weixin') return true
  try {
    return uni.getSystemInfoSync().uniPlatform === 'mp-weixin'
  } catch {
    return false
  }
}

export function getMpPageHeightPx() {
  if (!isMpWeixinPlatform()) return null
  try {
    const info = uni.getSystemInfoSync()
    const windowH = Number(info.windowHeight)
    if (windowH > 0) return Math.floor(windowH)
    const safe = info.safeArea
    if (safe?.height > 0) return Math.floor(safe.height)
  } catch {
    /* ignore */
  }
  return null
}

export function getMpPageLayoutStyle() {
  const h = getMpPageHeightPx()
  if (!h) return {}
  return {
    height: `${h}px`,
    minHeight: `${h}px`,
    maxHeight: `${h}px`,
  }
}

/** index 等页面：只保证最小高度，不锁死 overflow */
export function getMpPageMinHeightStyle() {
  const h = getMpPageHeightPx()
  if (!h) return {}
  return { minHeight: `${h}px` }
}

export function bindMpWindowResize(onResize) {
  if (!isMpWeixinPlatform() || typeof onResize !== 'function') {
    return () => {}
  }
  const handler = () => {
    try {
      onResize()
    } catch {
      /* ignore */
    }
  }
  try {
    if (typeof uni.onWindowResize === 'function') {
      uni.onWindowResize(handler)
    } else {
      return () => {}
    }
  } catch {
    return () => {}
  }
  return () => {
    try {
      if (typeof uni.offWindowResize === 'function') {
        uni.offWindowResize(handler)
      }
    } catch {
      /* ignore */
    }
  }
}

/**
 * 小程序聊天全屏：绝对定位铺满 runner-main。
 * 普通模式（显示卡片区）用 flex 流式堆叠，不走本函数。
 */
export function measureMpChatSectionFull(opts, callback) {
  if (!isMpWeixinPlatform() || typeof callback !== 'function') return

  const query = uni.createSelectorQuery()
  if (opts?.instance) query.in(opts.instance)
  query.select('.runner-main').boundingClientRect()

  query.exec((res) => {
    try {
      const main = res?.[0] || {}
      const mainH = Number(main.height) || 0
      if (mainH <= 0) {
        callback({ sectionStyle: {} })
        return
      }
      callback({
        sectionStyle: {
          position: 'absolute',
          left: '0',
          right: '0',
          top: '0',
          height: `${Math.floor(mainH)}px`,
          width: '100%',
          boxSizing: 'border-box',
          zIndex: 5,
        },
      })
    } catch {
      callback({ sectionStyle: {} })
    }
  })
}
