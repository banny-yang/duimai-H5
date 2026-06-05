const TOKEN_KEY = 'duimai_runner_token'

import { MP_DEFAULT_API_BASE } from '@/config/runner-api-base.js'

function trimBase(url) {
  return String(url || '').trim().replace(/\/$/, '')
}

function isAbsoluteHttpUrl(url) {
  return /^https?:\/\//i.test(url)
}

function resolveApiBase() {
  const fromEnv = trimBase(import.meta.env.VITE_API_BASE_URL)

  // #ifdef H5
  return fromEnv || '/api'
  // #endif

  // #ifndef H5
  if (isAbsoluteHttpUrl(fromEnv)) return fromEnv
  return trimBase(MP_DEFAULT_API_BASE)
  // #endif
}

export const API_BASE = resolveApiBase()

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

/** 小程序构建后 instanceof 可能失效，需同时判断 name */
export function isApiError(e) {
  return (
    e instanceof ApiError ||
    (Boolean(e) && typeof e === 'object' && e.name === 'ApiError')
  )
}

/** 将后端/网络错误转为用户可读文案（聊天等场景） */
export function formatApiErrorMessage(e, fallback = '请求失败') {
  const raw =
    (isApiError(e) && e.message) ||
    (e instanceof Error && e.message) ||
    (e && typeof e.message === 'string' ? e.message : '')
  if (!raw) return fallback
  if (/Missing request attribute 'userId'/i.test(raw)) {
    return '会话已失效，请返回首页重新进入赛事'
  }
  if (/conversation not exists/i.test(raw)) {
    return '会话已过期，请重新发送'
  }
  if (/Dify 对话失败|invalid_param/i.test(raw)) {
    return 'AI 服务繁忙，请稍后重试'
  }
  if (/timeout|超时/i.test(raw)) {
    return '请求超时，请稍后重试'
  }
  if (/url not in domain|不在以下 request 合法域名/i.test(raw)) {
    return '请求域名未配置，请在微信后台添加合法域名后重试'
  }
  return raw.length > 160 ? `${raw.slice(0, 160)}…` : raw
}

function assertRequestUrl(url) {
  if (!url || !/^https?:\/\//i.test(url)) {
    const hint =
      '小程序 API 须为完整 https 地址。请配置 .env.production（build）或 .env.development（dev:mp-weixin），或修改 src/config/runner-api-base.js 后重新编译'
    throw new ApiError(
      `${hint}（当前: ${url || '(空)'}，基址: ${API_BASE || '(空)'}）`,
      0,
      'INVALID_API_BASE',
    )
  }
}

function buildUrl(path, params) {
  let url = `${API_BASE}${path}`
  if (params) {
    const qs = Object.entries(params)
      .filter(([, v]) => v != null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&')
    if (qs) url += (url.includes('?') ? '&' : '?') + qs
  }
  // #ifdef MP-WEIXIN
  assertRequestUrl(url)
  // #endif
  return url
}

export function getRunnerToken() {
  return uni.getStorageSync(TOKEN_KEY) || null
}

export function setRunnerToken(token) {
  if (token) uni.setStorageSync(TOKEN_KEY, token)
  else uni.removeStorageSync(TOKEN_KEY)
}

const DEFAULT_TIMEOUT_MS = 20000
const CHAT_TIMEOUT_MS = 90000

/** 微信小程序无 FormData，不可直接引用全局 FormData */
function isFormDataPayload(data) {
  return typeof FormData !== 'undefined' && data instanceof FormData
}

function request({ method, path, data, params, auth = true, timeout = DEFAULT_TIMEOUT_MS }) {
  return new Promise((resolve, reject) => {
    let url
    try {
      url = buildUrl(path, params)
    } catch (e) {
      reject(e)
      return
    }

    const header = { Accept: 'application/json' }
    if (auth) {
      const token = getRunnerToken()
      if (token) header.Authorization = `Bearer ${token}`
    }
    if (data != null && !isFormDataPayload(data)) {
      header['Content-Type'] = 'application/json'
    }

    uni.request({
      url,
      method,
      data,
      header,
      timeout,
      success(res) {
        const body = res.data
        if (!body || typeof body !== 'object') {
          reject(new ApiError('Invalid response', res.statusCode))
          return
        }
        const code = Number(body.code)
        if (res.statusCode >= 400 || (Number.isFinite(code) && code !== 200)) {
          reject(new ApiError(body.message || '请求失败', res.statusCode, body.code))
          return
        }
        resolve(body.data)
      },
      fail(err) {
        reject(new ApiError(err.errMsg || '网络错误', 0))
      },
    })
  })
}

export function apiGet(path, params, auth = true, options = {}) {
  return request({ method: 'GET', path, params, auth, timeout: options.timeout })
}

export function apiPost(path, payload, auth = true, options = {}) {
  return request({ method: 'POST', path, data: payload, auth, timeout: options.timeout })
}

export { CHAT_TIMEOUT_MS }

/** H5：Blob 上传（MediaRecorder 录音） */
export function apiUploadBlob(path, blob, name = 'audio', filename = 'recording.webm', auth = true) {
  return new Promise((resolve, reject) => {
    if (typeof FormData === 'undefined') {
      reject(new ApiError('当前环境不支持 FormData 上传，请使用文字输入', 0))
      return
    }
    const token = auth ? getRunnerToken() : null
    if (auth && !token) {
      reject(new ApiError('请先绑定参赛号登录后再使用语音输入', 401))
      return
    }
    const form = new FormData()
    form.append(name, blob, filename)
    const headers = { Accept: 'application/json' }
    if (token) headers.Authorization = `Bearer ${token}`
    fetch(buildUrl(path), { method: 'POST', headers, body: form })
      .then(async (res) => {
        let body
        try {
          body = await res.json()
        } catch {
          reject(new ApiError('Invalid JSON', res.status))
          return
        }
        if (!res.ok || body.code !== 200) {
          reject(new ApiError(body.message || '上传失败', res.status, body.code))
          return
        }
        resolve(body.data)
      })
      .catch((e) => reject(new ApiError(e?.message || '上传失败', 0)))
  })
}

/** 上传录音（uni.uploadFile，小程序/App 临时路径） */
export function apiUpload(path, filePath, name = 'audio', auth = true) {
  return new Promise((resolve, reject) => {
    const header = { Accept: 'application/json' }
    if (auth) {
      const token = getRunnerToken()
      if (!token) {
        reject(new ApiError('请先绑定参赛号登录后再使用语音输入', 401))
        return
      }
      header.Authorization = `Bearer ${token}`
    }
    uni.uploadFile({
      url: buildUrl(path),
      filePath,
      name,
      header,
      success(res) {
        try {
          const body = JSON.parse(res.data)
          if (body.code !== 200) {
            reject(new ApiError(body.message || '上传失败', res.statusCode, body.code))
            return
          }
          resolve(body.data)
        } catch {
          reject(new ApiError('Invalid JSON', res.statusCode))
        }
      },
      fail(err) {
        reject(new ApiError(err.errMsg || '上传失败', 0))
      },
    })
  })
}
