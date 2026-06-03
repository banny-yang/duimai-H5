/** 微信小程序：页面高度与布局辅助 */
export function isMpWeixinPlatform() {
  // #ifdef MP-WEIXIN
  return true
  // #endif
  // #ifndef MP-WEIXIN
  try {
    return uni.getSystemInfoSync().uniPlatform === 'mp-weixin'
  } catch {
    return false
  }
  // #endif
}

export function getMpPageHeightPx() {
  // #ifndef MP-WEIXIN
  return null
  // #endif
  // #ifdef MP-WEIXIN
  try {
    let windowH = 0
    let safeH = 0
    try {
      const wi = uni.getWindowInfo()
      windowH = Number(wi.windowHeight)
      safeH = Number(wi.safeArea?.height)
    } catch {
      /* getWindowInfo 不可用时回退 */
    }
    if (!windowH) {
      try {
        const info = uni.getSystemInfoSync()
        windowH = Number(info.windowHeight)
        if (!safeH) safeH = Number(info.safeArea?.height)
      } catch {
        /* ignore */
      }
    }
    if (windowH > 0) return Math.floor(windowH)
    if (safeH > 0) return Math.floor(safeH)
  } catch {
    /* ignore */
  }
  return null
  // #endif
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
