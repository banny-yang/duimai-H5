<template>
  <view v-if="visible" class="runner-footer">
    <text v-if="footerSupport" class="footer-support">{{ footerSupport }}</text>
    <text v-if="!hidePoweredBy">{{ poweredLabel }}</text>
    <view v-if="showLegal" class="legal-row">
      <text class="legal-link" @tap="$emit('open-legal', 'privacy')">{{ privacyLabel }}</text>
      <text class="legal-link" @tap="$emit('open-legal', 'terms')">{{ termsLabel }}</text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { t } from '@/utils/i18n.js'

const props = defineProps({
  footerSupport: String,
  hidePoweredBy: Boolean,
  locale: { type: String, default: 'zh' },
  showLegal: { type: Boolean, default: true },
})
defineEmits(['open-legal'])

const visible = computed(
  () =>
    !!props.footerSupport?.trim() ||
    !props.hidePoweredBy ||
    props.showLegal,
)
const poweredLabel = computed(() => t(props.locale, 'poweredBy'))
const privacyLabel = computed(() => (props.locale === 'en' ? 'Privacy' : '隐私政策'))
const termsLabel = computed(() => (props.locale === 'en' ? 'Terms' : '用户协议'))
</script>

<style scoped>
.legal-row {
  display: flex;
  justify-content: center;
  gap: 32rpx;
  margin-top: 8rpx;
}
.legal-link {
  text-decoration: underline;
}
</style>
