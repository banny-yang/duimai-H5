<template>
  <view class="cosmic-page" @tap="onPageTap">
    <!-- 静默鉴权：极简闪现 -->
    <view v-if="phase === 'checking'" class="cosmic-checking">
      <view class="brand-logo brand-logo--pulse">
        <view class="logo-ring logo-ring--outer" />
        <view class="logo-ring logo-ring--inner" />
        <text class="logo-glyph">脉</text>
      </view>
    </view>

    <template v-else>
      <!-- 顶部 40%：品牌 -->
      <view class="cosmic-hero">
        <view class="brand-logo">
          <view class="logo-ring logo-ring--outer" />
          <view class="logo-ring logo-ring--inner" />
          <view class="logo-particles">
            <view v-for="i in 8" :key="i" class="logo-dot" :class="'logo-dot--' + i" />
          </view>
          <text class="logo-glyph">脉</text>
        </view>
        <text class="brand-title">对脉</text>
        <text class="brand-en">DUIMAI</text>
        <text class="brand-slogan">对齐时空频率 · 洞察内在引力</text>
      </view>

      <!-- 中部：双正弦能量波形 -->
      <view class="cosmic-wave">
        <view class="wave-sine wave-sine--gold" />
        <view class="wave-sine wave-sine--blue" />
      </view>

      <!-- 底部：状态提示（无按钮，进入即授权） -->
      <view class="cosmic-status">
        <view v-if="loading" class="cosmic-loading">
          <view class="loading-dot" />
          <text class="loading-text">矩阵对齐中…</text>
        </view>
        <view v-if="err" class="cosmic-error">{{ err }}</view>
        <text v-if="err && needTapRetry" class="cosmic-retry-hint">轻触屏幕重试</text>
      </view>
    </template>
  </view>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { resolveBridgeStateFromQuery } from '@/utils/mp-bridge-api.js'
import {
  getWxUserProfile,
  ensureMpPrivacyAuthorized,
} from '@/utils/mp-login.js'
import {
  trySilentMpAuthBridge,
  finishMpAuthBridge,
} from '@/utils/mp-auth-bridge.js'
import { exitMiniProgramAfterAuth } from '@/utils/mp-exit.js'

const phase = ref('checking')
const bridgeState = ref('')
const loading = ref(false)
const err = ref('')
const needTapRetry = ref(false)

onLoad(async (query) => {
  bridgeState.value = resolveBridgeStateFromQuery(query)

  phase.value = 'checking'
  if (await trySilentMpAuthBridge(bridgeState.value)) {
    return
  }

  phase.value = 'ready'
  await nextTick()
  setTimeout(() => startAutoAuth(), 320)
})

function onPageTap() {
  if (needTapRetry.value && !loading.value) {
    startAutoAuth()
  }
}

async function startAutoAuth() {
  if (loading.value) return

  loading.value = true
  err.value = ''
  needTapRetry.value = false

  try {
    await ensureMpPrivacyAuthorized()
    const profile = await getWxUserProfile()
    await finishMpAuthBridge(profile, { state: bridgeState.value })
  } catch (e) {
    const message = e instanceof Error ? e.message : '授权失败，请重试'
    if (/取消|拒绝|deny|cancel/i.test(message)) {
      exitMiniProgramAfterAuth({
        delay: 400,
        extraData: {
          ok: false,
          state: bridgeState.value,
          errMsg: 'user_denied',
        },
      })
      return
    }
    needTapRetry.value = true
    err.value = /tap|click|gesture|TAP/i.test(message)
      ? '请轻触屏幕完成授权'
      : message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.cosmic-page {
  width: 100vw;
  min-height: 100vh;
  box-sizing: border-box;
  background: linear-gradient(135deg, #090a10 0%, #0d0e17 50%, #141625 100%);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: calc(env(safe-area-inset-top) + 48rpx) 40rpx calc(env(safe-area-inset-bottom) + 48rpx);
  overflow: hidden;
}

.cosmic-checking {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cosmic-hero {
  flex: 4;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 0;
}

.brand-logo {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 36rpx;
  animation: logoPulse 4s infinite ease-in-out;
}

.brand-logo--pulse {
  animation: logoPulse 1.2s infinite ease-in-out;
}

.logo-ring {
  position: absolute;
  border-radius: 50%;
  box-sizing: border-box;
}

.logo-ring--outer {
  inset: 0;
  border: 1px solid rgba(229, 184, 66, 0.25);
  box-shadow: 0 0 40rpx rgba(229, 184, 66, 0.15);
}

.logo-ring--inner {
  inset: 24rpx;
  border: 1px solid rgba(74, 144, 226, 0.35);
  box-shadow: 0 0 24rpx rgba(74, 144, 226, 0.2);
}

.logo-particles {
  position: absolute;
  inset: 0;
}

.logo-dot {
  position: absolute;
  width: 6rpx;
  height: 6rpx;
  border-radius: 50%;
  background: #e5b842;
  opacity: 0.7;
  animation: dotOrbit 6s linear infinite;
}

.logo-dot--1 { top: 8%; left: 50%; animation-delay: 0s; }
.logo-dot--2 { top: 22%; right: 12%; animation-delay: 0.4s; background: #4a90e2; }
.logo-dot--3 { bottom: 22%; right: 12%; animation-delay: 0.8s; }
.logo-dot--4 { bottom: 8%; left: 50%; animation-delay: 1.2s; background: #4a90e2; }
.logo-dot--5 { bottom: 22%; left: 12%; animation-delay: 1.6s; }
.logo-dot--6 { top: 22%; left: 12%; animation-delay: 2s; }
.logo-dot--7 { top: 50%; right: 4%; animation-delay: 2.4s; background: #4a90e2; }
.logo-dot--8 { top: 50%; left: 4%; animation-delay: 2.8s; }

.logo-glyph {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 72rpx;
  font-weight: 700;
  color: transparent;
  background: linear-gradient(180deg, #f8fafc 0%, #cbd5e1 100%);
  -webkit-background-clip: text;
  background-clip: text;
  letter-spacing: 8rpx;
}

.brand-title {
  font-size: 44rpx;
  font-weight: 700;
  letter-spacing: 6rpx;
  color: transparent;
  background: linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #cbd5e1 100%);
  -webkit-background-clip: text;
  background-clip: text;
  margin-bottom: 8rpx;
}

.brand-en {
  font-size: 22rpx;
  letter-spacing: 12rpx;
  color: rgba(229, 184, 66, 0.75);
  margin-bottom: 20rpx;
}

.brand-slogan {
  font-size: 24rpx;
  line-height: 1.6;
  color: #6b7280;
  text-align: center;
  letter-spacing: 1rpx;
}

.cosmic-wave {
  flex: 3;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 280rpx;
  overflow: hidden;
}

.wave-sine {
  width: 200%;
  height: 100rpx;
  background-repeat: repeat-x;
  background-size: 400rpx 100%;
  will-change: transform;
}

.wave-sine--gold {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='80' viewBox='0 0 400 80'%3E%3Cdefs%3E%3Cfilter id='g' x='-20%25' y='-20%25' width='140%25' height='140%25'%3E%3CfeGaussianBlur stdDeviation='2.5' result='b'/%3E%3CfeMerge%3E%3CfeMergeNode in='b'/%3E%3CfeMergeNode in='SourceGraphic'/%3E%3C/feMerge%3E%3C/filter%3E%3C/defs%3E%3Cpath d='M0 40 C50 12 50 68 100 40 S150 12 200 40 S250 68 300 40 S350 12 400 40' fill='none' stroke='%23E5B842' stroke-width='2.5' filter='url(%23g)'/%3E%3C/svg%3E");
  animation: sineFlowGold 4s linear infinite, sineBobGold 3s ease-in-out infinite;
  filter: drop-shadow(0 0 8rpx rgba(229, 184, 66, 0.55));
}

.wave-sine--blue {
  margin-top: -36rpx;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='80' viewBox='0 0 400 80'%3E%3Cdefs%3E%3Cfilter id='b' x='-20%25' y='-20%25' width='140%25' height='140%25'%3E%3CfeGaussianBlur stdDeviation='2.5' result='bl'/%3E%3CfeMerge%3E%3CfeMergeNode in='bl'/%3E%3CfeMergeNode in='SourceGraphic'/%3E%3C/feMerge%3E%3C/filter%3E%3C/defs%3E%3Cpath d='M0 40 C50 68 50 12 100 40 S150 68 200 40 S250 12 300 40 S350 68 400 40' fill='none' stroke='%234A90E2' stroke-width='2.5' filter='url(%23b)'/%3E%3C/svg%3E");
  animation: sineFlowBlue 5.5s linear infinite, sineBobBlue 4s ease-in-out infinite;
  filter: drop-shadow(0 0 8rpx rgba(74, 144, 226, 0.45));
  opacity: 0.92;
}

.cosmic-status {
  flex: 2;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  min-height: 120rpx;
  padding-bottom: 16rpx;
}

.cosmic-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.loading-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #e5b842;
  box-shadow: 0 0 16rpx rgba(229, 184, 66, 0.6);
  animation: loadingPulse 1.2s ease-in-out infinite;
}

.loading-text {
  font-size: 24rpx;
  color: #6b7280;
  letter-spacing: 4rpx;
}

.cosmic-retry-hint {
  margin-top: 16rpx;
  font-size: 22rpx;
  color: rgba(74, 144, 226, 0.85);
  letter-spacing: 2rpx;
}

.cosmic-error {
  width: 100%;
  padding: 16rpx 20rpx;
  border-radius: 16rpx;
  font-size: 24rpx;
  color: #fca5a5;
  background: rgba(127, 29, 29, 0.35);
  border: 1px solid rgba(248, 113, 113, 0.25);
  box-sizing: border-box;
  text-align: center;
}

@keyframes logoPulse {
  0% {
    transform: scale(1);
    opacity: 0.85;
    filter: drop-shadow(0 0 10rpx rgba(229, 184, 66, 0.2));
  }
  50% {
    transform: scale(1.03);
    opacity: 1;
    filter: drop-shadow(0 0 30rpx rgba(229, 184, 66, 0.55));
  }
  100% {
    transform: scale(1);
    opacity: 0.85;
    filter: drop-shadow(0 0 10rpx rgba(229, 184, 66, 0.2));
  }
}

@keyframes dotOrbit {
  0%,
  100% {
    opacity: 0.35;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

@keyframes sineFlowGold {
  0% { transform: translateX(0); }
  100% { transform: translateX(-400rpx); }
}

@keyframes sineFlowBlue {
  0% { transform: translateX(-200rpx); }
  100% { transform: translateX(-600rpx); }
}

@keyframes sineBobGold {
  0%, 100% { margin-top: 0; }
  50% { margin-top: 6rpx; }
}

@keyframes sineBobBlue {
  0%, 100% { margin-top: -36rpx; }
  50% { margin-top: -42rpx; }
}

@keyframes loadingPulse {
  0%, 100% { opacity: 0.4; transform: scale(0.85); }
  50% { opacity: 1; transform: scale(1.15); }
}
</style>
