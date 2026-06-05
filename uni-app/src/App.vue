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

button::after {
  border: none;
}
</style>
