<script setup>
import { onLaunch } from '@dcloudio/uni-app'
import { applyH5BrandTheme } from '@/utils/h5-brand-theme.js'

// #ifdef MP-WEIXIN
import { MP_ICON_MIC } from '@/config/mp-static-icons.js'
import { getIconGlyph } from '@/utils/iconfont-text.js'
// #endif

const iconfontUrl = (import.meta.env.VITE_ICONFONT_URL || '').trim()

onLaunch(() => {
  applyH5BrandTheme(null)
  // #ifdef H5
  // 通过临时元素测量浏览器实际计算的 env(safe-area-inset-top) 值
  const probe = document.createElement('div')
  probe.style.cssText = 'position:fixed;top:0;left:0;width:1px;padding-top:env(safe-area-inset-top);pointer-events:none;visibility:hidden'
  document.body.appendChild(probe)
  const safeTop = parseFloat(getComputedStyle(probe).paddingTop) || 0
  document.body.removeChild(probe)
  // 如果 env() 返回 0，使用系统 API 作为 fallback
  const statusBarH = safeTop > 0 ? safeTop : (uni.getSystemInfoSync().statusBarHeight || 0)
  document.documentElement.style.setProperty('--status-bar-height', `${statusBarH}px`)
  // #endif
  // #ifdef MP-WEIXIN
  void MP_ICON_MIC
  void getIconGlyph('mic')
  if (iconfontUrl && /^https:\/\//i.test(iconfontUrl)) {
    uni.loadFontFace({
      family: 'iconfont',
      global: true,
      source: `url("${iconfontUrl}")`,
      success() {},
      fail() {},
    })
  }
  // #endif
})
</script>

<style lang="scss">
@import '@/styles/h5-runner.scss';
@import '@/styles/iconfont-runner.scss';
/* #ifdef MP-WEIXIN */
@import '@/styles/mp-icons.scss';
/* #endif */

button::after {
  border: none;
}
</style>
