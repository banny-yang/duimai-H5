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

  // 不再使用固定 px 高度锁定，使用 100% 让页面自适应安全区域
  // 标题栏和协议栏分别通过 env(safe-area-inset-*) 适配刘海屏
  return {
    height: '100%',
    minHeight: '100%',
    maxHeight: '100%',
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


