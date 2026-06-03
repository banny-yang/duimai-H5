import AMapLoader from '@amap/amap-jsapi-loader'

let loadPromise = null
let currentKey = ''
let currentSecurity = ''

/** 将高德原始错误转为可操作的提示 */
export function formatAmapLoadError(err) {
  const msg = String(err?.message || err || '')
  if (/INVALID_USER_DOMAIN/i.test(msg)) {
    const host =
      typeof window !== 'undefined' ? window.location.host : '当前域名'
    return (
      `高德 Key 域名白名单未包含「${host}」。请登录高德开放平台 → 应用 → Key 设置 → ` +
      `「服务平台：Web端(JS API)」→ 域名白名单，添加 localhost、127.0.0.1 或 ${host}；` +
      `本地调试也可暂时清空白名单。详见 uni-app/README.md`
    )
  }
  if (/INVALID_USER_KEY|USERKEY_PLAT_NOMATCH/i.test(msg)) {
    return '高德 Key 无效或类型不是 Web端(JS API)，请在运营台检查高德配置'
  }
  if (/INVALID_USER_SCODE|security/i.test(msg)) {
    return '高德安全密钥(securityJsCode)错误，请在运营台「高德地图配置」核对'
  }
  return msg || '地图加载失败'
}

export async function loadAmapMap(config) {
  const key = config?.apiKey?.trim()
  if (!key) {
    throw new Error('高德地图未配置')
  }
  const security = config?.securityJsCode?.trim() || ''
  if (key !== currentKey || security !== currentSecurity) {
    loadPromise = null
    currentKey = key
    currentSecurity = security
  }
  if (!loadPromise) {
    if (typeof window !== 'undefined') {
      if (security) {
        window._AMapSecurityConfig = { securityJsCode: security }
      } else {
        try {
          delete window._AMapSecurityConfig
        } catch {
          window._AMapSecurityConfig = undefined
        }
      }
    }
    loadPromise = AMapLoader.load({
      key,
      version: '2.0',
      plugins: ['AMap.Scale'],
    }).catch((e) => {
      loadPromise = null
      throw new Error(formatAmapLoadError(e))
    })
  }
  return loadPromise
}
