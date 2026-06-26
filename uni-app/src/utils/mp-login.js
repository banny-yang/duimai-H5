import { ApiError } from './api.js'

const WX_PROFILE_KEY = 'duimai_wx_profile'

/** uni.login / wx.login 获取临时 code */
export function getWxLoginCode() {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    uni.login({
      provider: 'weixin',
      success(res) {
        if (res.code) resolve(res.code)
        else reject(new ApiError('微信登录未返回 code', 0))
      },
      fail(err) {
        reject(new ApiError(err.errMsg || '微信登录失败', 0))
      },
    })
    // #endif
    // #ifndef MP-WEIXIN
    reject(new ApiError('仅微信小程序支持 wx.login', 0))
    // #endif
  })
}

/**
 * 用户点击按钮后调用，获取微信昵称与头像（须用户主动授权）
 * @see https://developers.weixin.qq.com/miniprogram/dev/api/open-api/user-info/wx.getUserProfile.html
 */
export function getWxUserProfile(desc = '用于展示您的微信昵称与头像') {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    uni.getUserProfile({
      desc,
      success(res) {
        const info = res.userInfo || {}
        const nickName = String(info.nickName || '').trim()
        const avatarUrl = String(info.avatarUrl || '').trim()
        if (!nickName && !avatarUrl) {
          reject(new ApiError('未获取到微信个人信息', 0))
          return
        }
        resolve({ nickName, avatarUrl })
      },
      fail(err) {
        const msg = err?.errMsg || '微信授权失败'
        if (/deny|cancel|拒绝/i.test(msg)) {
          reject(new ApiError('已取消微信授权', 0))
          return
        }
        if (/privacy agreement|api scope is not declared/i.test(msg)) {
          reject(
            new ApiError(
              '请先在微信公众平台「用户隐私保护指引」中声明「收集你的昵称、头像」，审核通过并生效后再试',
              0,
            ),
          )
          return
        }
        reject(new ApiError(msg, 0))
      },
    })
    // #endif
    // #ifndef MP-WEIXIN
    reject(new ApiError('仅微信小程序支持 getUserProfile', 0))
    // #endif
  })
}

export function getStoredWxProfile() {
  try {
    const raw = uni.getStorageSync(WX_PROFILE_KEY)
    if (!raw || typeof raw !== 'object') return null
    const nickName = String(raw.nickName || '').trim()
    const avatarUrl = String(raw.avatarUrl || '').trim()
    if (!nickName && !avatarUrl) return null
    return { nickName, avatarUrl }
  } catch {
    return null
  }
}

export function saveWxProfile(profile) {
  if (!profile) return
  const nickName = String(profile.nickName || profile.wxNickName || '').trim()
  const avatarUrl = String(profile.avatarUrl || profile.wxAvatarUrl || '').trim()
  if (!nickName && !avatarUrl) return
  uni.setStorageSync(WX_PROFILE_KEY, { nickName, avatarUrl })
}

export function clearWxProfile() {
  uni.removeStorageSync(WX_PROFILE_KEY)
}

export function hasWxProfile(profile) {
  const p = profile || getStoredWxProfile()
  return Boolean(p?.nickName || p?.avatarUrl)
}

/** 查询是否需先弹出微信隐私协议（基础库 2.32.3+） */
export function getMpPrivacySetting() {
  return new Promise((resolve) => {
    // #ifdef MP-WEIXIN
    if (typeof uni.getPrivacySetting !== 'function') {
      resolve({ needAuthorization: false, privacyContractName: '' })
      return
    }
    uni.getPrivacySetting({
      success(res) {
        resolve({
          needAuthorization: Boolean(res?.needAuthorization),
          privacyContractName: String(res?.privacyContractName || '《用户隐私保护指引》'),
        })
      },
      fail() {
        resolve({ needAuthorization: false, privacyContractName: '' })
      },
    })
    // #endif
    // #ifndef MP-WEIXIN
    resolve({ needAuthorization: false, privacyContractName: '' })
    // #endif
  })
}

/** 打开微信后台配置的隐私保护指引页面 */
export function openMpPrivacyContract() {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    if (typeof uni.openPrivacyContract !== 'function') {
      reject(new ApiError('当前基础库不支持打开隐私协议', 0))
      return
    }
    uni.openPrivacyContract({
      success: () => resolve(),
      fail(err) {
        reject(new ApiError(err?.errMsg || '打开隐私协议失败', 0))
      },
    })
    // #endif
    // #ifndef MP-WEIXIN
    reject(new ApiError('仅微信小程序支持', 0))
    // #endif
  })
}
