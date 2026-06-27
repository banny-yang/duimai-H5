import { getWxLoginCode, saveWxProfile } from './mp-login.js'

const MP_BRIDGE_AUTH_KEY = 'duimai_mp_bridge_auth'

/**
 * 本地收集授权结果（不请求对脉服务端）
 * 第三方用 code 在其自有服务端换取 openId / token
 */
export async function collectLocalBridgeAuth(profile, state) {
  const loginCode = await getWxLoginCode()
  const nickName = String(profile?.nickName || '').trim()
  const avatarUrl = String(profile?.avatarUrl || '').trim()
  if (nickName || avatarUrl) saveWxProfile({ nickName, avatarUrl })
  return buildBridgeExtraData({ loginCode, nickName, avatarUrl }, state)
}

/** 回传给第三方小程序的 extraData */
export function buildBridgeExtraData(data, state) {
  const loginCode = String(data?.loginCode || '').trim()
  return {
    ok: true,
    /** wx.login 临时凭证，第三方服务端 jscode2session 换 openId */
    code: loginCode,
    loginCode,
    nickName: String(data?.nickName || '').trim(),
    avatarUrl: String(data?.avatarUrl || '').trim(),
    state: String(state || '').trim(),
  }
}

export function saveMpBridgeAuth(payload, state) {
  const extra = payload?.code
    ? payload
    : buildBridgeExtraData(payload, state)
  uni.setStorageSync(MP_BRIDGE_AUTH_KEY, {
    ...extra,
    savedAt: Date.now(),
  })
  return extra
}

export function getMpBridgeAuth() {
  try {
    const raw = uni.getStorageSync(MP_BRIDGE_AUTH_KEY)
    return raw && typeof raw === 'object' ? raw : null
  } catch {
    return null
  }
}

export function clearMpBridgeAuth() {
  uni.removeStorageSync(MP_BRIDGE_AUTH_KEY)
}

/** 解析第三方传入的 state（透传回 extraData） */
export function resolveBridgeStateFromQuery(query) {
  return String(query?.state || '').trim()
}
