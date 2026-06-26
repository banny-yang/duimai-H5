<template>
  <SheetModal :show="show" title="微信登录" :scrollable="false" @close="onClose">
    <view class="wx-login-body">
      <image
        v-if="previewAvatar"
        class="wx-avatar"
        :src="previewAvatar"
        mode="aspectFill"
      />
      <view v-else class="wx-avatar wx-avatar--placeholder">
        <text class="wx-avatar-icon">微</text>
      </view>

      <text class="wx-login-title">授权微信个人信息</text>
      <text class="wx-login-desc">
        用于展示您的微信昵称与头像，便于赛事助手识别您。不会获取手机号。
      </text>

      <view v-if="needPrivacyAuth" class="wx-privacy-block">
        <text class="wx-login-desc">
          使用微信登录前，请先阅读并同意{{ privacyContractName }}。
        </text>
        <text class="wx-privacy-link" @tap="onOpenPrivacy">查看隐私保护指引</text>
        <button
          class="wx-login-btn"
          open-type="agreePrivacyAuthorization"
          @agreeprivacyauthorization="onPrivacyAgreed"
        >
          同意隐私协议并继续
        </button>
      </view>

      <template v-else>
        <view v-if="err" class="wx-login-error">{{ err }}</view>

        <button
          class="wx-login-btn"
          :loading="loading"
          :disabled="loading"
          @tap="onAuthorize"
        >
          {{ loading ? '登录中…' : '微信授权登录' }}
        </button>

        <text class="wx-login-skip" @tap="onClose">暂不登录，先逛逛</text>
      </template>
    </view>
  </SheetModal>
</template>

<script setup>
import { ref, watch } from 'vue'
import SheetModal from './SheetModal.vue'
import { getStoredWxProfile, getMpPrivacySetting, openMpPrivacyContract } from '@/utils/mp-login.js'

const props = defineProps({
  show: Boolean,
  loading: Boolean,
})
const emit = defineEmits(['close', 'authorize'])

const err = ref('')
const previewAvatar = ref('')
const needPrivacyAuth = ref(false)
const privacyContractName = ref('《用户隐私保护指引》')

watch(
  () => props.show,
  async (open) => {
    if (!open) return
    err.value = ''
    previewAvatar.value = getStoredWxProfile()?.avatarUrl || ''
    try {
      const setting = await getMpPrivacySetting()
      needPrivacyAuth.value = setting.needAuthorization
      privacyContractName.value = setting.privacyContractName
    } catch {
      needPrivacyAuth.value = false
    }
  },
)

function onClose() {
  emit('close')
}

function onAuthorize() {
  if (props.loading) return
  err.value = ''
  emit('authorize')
}

async function onOpenPrivacy() {
  try {
    await openMpPrivacyContract()
  } catch (e) {
    err.value = e instanceof Error ? e.message : '无法打开隐私协议'
  }
}

function onPrivacyAgreed() {
  needPrivacyAuth.value = false
  err.value = ''
}

function setError(message) {
  err.value = message || '登录失败，请重试'
}

defineExpose({ setError })
</script>

<style scoped>
.wx-login-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12rpx 8rpx 24rpx;
}
.wx-avatar {
  width: 144rpx;
  height: 144rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(7, 193, 96, 0.25);
  margin-bottom: 28rpx;
}
.wx-avatar--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #ecfdf5 0%, #d1fae5 100%);
}
.wx-avatar-icon {
  font-size: 56rpx;
  font-weight: 800;
  color: #059669;
}
.wx-login-title {
  font-size: 34rpx;
  font-weight: 700;
  color: var(--ink);
  margin-bottom: 16rpx;
}
.wx-login-desc {
  font-size: 26rpx;
  line-height: 1.6;
  color: var(--secondary-text);
  text-align: center;
  margin-bottom: 32rpx;
}
.wx-login-error {
  width: 100%;
  margin-bottom: 20rpx;
  padding: 16rpx 20rpx;
  border-radius: 16rpx;
  font-size: 24rpx;
  color: #b45309;
  background: #fffbeb;
  border: 1px solid #fde68a;
  box-sizing: border-box;
}
.wx-login-btn {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  border-radius: 24rpx;
  font-size: 32rpx;
  font-weight: 700;
  color: #fff;
  background: #07c160;
  box-shadow: 0 4rpx 16rpx rgba(7, 193, 96, 0.25);
}
.wx-login-btn[disabled] {
  opacity: 0.65;
}
.wx-login-skip {
  margin-top: 24rpx;
  font-size: 26rpx;
  color: var(--secondary-text);
}
.wx-privacy-block {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.wx-privacy-link {
  margin-bottom: 28rpx;
  font-size: 26rpx;
  color: #2563eb;
  text-decoration: underline;
}
</style>
