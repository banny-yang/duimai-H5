/** 是否由其他小程序 navigateToMiniProgram 唤起 */
function getLaunchReferrerAppId() {
  // #ifdef MP-WEIXIN
  try {
    if (typeof uni.getEnterOptionsSync === 'function') {
      return String(uni.getEnterOptionsSync()?.referrerInfo?.appId || '').trim()
    }
  } catch {
    /* ignore */
  }
  // #endif
  return ''
}

function callExitMiniProgram() {
  // #ifdef MP-WEIXIN
  if (typeof uni.exitMiniProgram === 'function') {
    uni.exitMiniProgram({ fail: () => {} })
  }
  // #endif
}

function callNavigateBackMiniProgram(extraData) {
  // #ifdef MP-WEIXIN
  if (typeof uni.navigateBackMiniProgram !== 'function') {
    callExitMiniProgram()
    return
  }
  uni.navigateBackMiniProgram({
    extraData,
    fail: () => callExitMiniProgram(),
  })
  // #endif
}

/**
 * 第三方授权完成后关闭小程序
 * - 从其他小程序唤起：navigateBackMiniProgram 回传 extraData 并关闭
 * - 其他入口：exitMiniProgram 直接关闭
 */
export function exitMiniProgramAfterAuth(options = {}) {
  const delay = Math.max(0, Number(options.delay) || 0)
  const extraData =
    options.extraData && typeof options.extraData === 'object' ? options.extraData : {}

  const done = () => {
    const referrerAppId = getLaunchReferrerAppId()
    if (referrerAppId) {
      callNavigateBackMiniProgram(extraData)
      return
    }
    callExitMiniProgram()
  }

  if (delay > 0) setTimeout(done, delay)
  else done()
}
