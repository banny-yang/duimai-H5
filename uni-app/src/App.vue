<script setup>
import { onLaunch } from '@dcloudio/uni-app'
import { applyH5BrandTheme } from '@/utils/h5-brand-theme.js'

onLaunch(() => {
  applyH5BrandTheme(null)
})
</script>

<style lang="scss">
@import '@/styles/h5-runner.scss';

button::after {
  border: none;
}
</style>
