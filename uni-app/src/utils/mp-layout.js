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



/**
 * 获取微信小程序胶囊按钮右侧安全间距（px）
 * 用于标题栏右侧内容的 padding-right，避免被胶囊按钮遮挡
 *
 * @returns {number} 需要的最小右侧间距（px），获取失败返回 0
 */
export function getMpCapsuleRightGapPx() {
  // #ifndef MP-WEIXIN
  return 0
  // #endif
  // #ifdef MP-WEIXIN
  try {
    const capsule = uni.getMenuButtonBoundingClientRect()
    if (!capsule || !capsule.width) return 0
    const info = uni.getSystemInfoSync()
    const screenWidth = info.windowWidth || 375
    // 从屏幕右边缘到胶囊左边缘的距离 + 8px 额外间距
    return Math.ceil(screenWidth - capsule.left) + 8
  } catch {
    return 0
  }
  // #endif
}

/**
 * 获取微信小程序自定义导航栏高度（px）
 * 根据胶囊按钮位置计算，确保标题栏内容与胶囊按钮垂直居中
 * 公式： (胶囊.top - 状态栏高度) * 2 + 胶囊.height
 *
 * @returns {number} 导航栏高度（px），获取失败返回 0
 */
export function getMpCapsuleNavBarHeightPx() {
  // #ifndef MP-WEIXIN
  return 0
  // #endif
  // #ifdef MP-WEIXIN
  try {
    const capsule = uni.getMenuButtonBoundingClientRect()
    if (!capsule || !capsule.height) return 0
    const info = uni.getSystemInfoSync()
    const statusBarH = info.statusBarHeight || 0
    // 标准自定义导航栏公式：上间距 + 胶囊高度 + 下间距（与上间距相等）
    return Math.floor((capsule.top - statusBarH) * 2 + capsule.height)
  } catch {
    return 0
  }
  // #endif
}

/**
 * 自定义导航栏相关 CSS 变量（状态栏、胶囊区、胶囊高度、右侧避让）
 * @returns {Record<string, string>}
 */
export function getMpCustomNavStyleVars() {
  // #ifndef MP-WEIXIN
  return {}
  // #endif
  // #ifdef MP-WEIXIN
  try {
    const capsule = uni.getMenuButtonBoundingClientRect()
    if (!capsule?.height) return {}
    const info = uni.getSystemInfoSync()
    const statusBarH = info.statusBarHeight || 0
    const navBarH = Math.floor((capsule.top - statusBarH) * 2 + capsule.height)
    const screenWidth = info.windowWidth || 375
    const rightGap = Math.ceil(screenWidth - capsule.left) + 8
    return {
      '--mp-status-bar-h': `${statusBarH}px`,
      '--mp-capsule-nav-h': `${navBarH}px`,
      '--mp-capsule-h': `${capsule.height}px`,
      '--mp-capsule-right-gap': `${rightGap}px`,
    }
  } catch {
    return {}
  }
  // #endif
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


