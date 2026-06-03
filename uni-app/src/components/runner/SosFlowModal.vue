<template>
  <view v-if="show" class="mask">
    <view class="sheet">
      <view v-if="step === 'gps'" class="center">
        <view class="spinner" />
        <text class="bold">正在获取 GPS 定位…</text>
        <text class="muted">读取电量与网络信号</text>
      </view>

      <template v-else-if="step === 'symptom'">
        <view class="row">
          <text class="title-alert">确认伤情</text>
          <text class="muted">{{ countdown }}s 后默认最高级别</text>
        </view>
        <text class="gps-line">
          GPS {{ gpsText }} · 电量 {{ env.battery }}% · {{ env.signal }}
        </text>
        <view class="phones">
          <button class="phone-main" @tap="callPhone(rescuePhone)">拨打 {{ rescuePhone }}</button>
          <button
            v-if="organizerPhone"
            class="phone-sub"
            @tap="callPhone(organizerPhone)"
          >
            组委会
          </button>
        </view>
        <button
          v-for="s in symptoms"
          :key="s.id"
          class="symptom"
          :loading="submitting"
          @tap="doSubmit(s.id)"
        >
          {{ s.label }}
        </button>
        <button class="cancel" @tap="$emit('close')">取消（未发送）</button>
      </template>

      <view v-else class="center">
        <text class="done-icon">✓</text>
        <text class="bold">救援请求已发送</text>
        <text class="muted">组委会与最近医疗志愿者将收到您的定位</text>
        <view class="phones">
          <button class="phone-main" @tap="callPhone(rescuePhone)">拨打 {{ rescuePhone }}</button>
          <button
            v-if="organizerPhone"
            class="phone-sub"
            @tap="callPhone(organizerPhone)"
          >
            组委会
          </button>
        </view>
        <button class="ok" @tap="$emit('close')">知道了</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import {
  fetchSosRescueConfig,
  submitSos,
  submitSosBeacon,
} from '@/utils/runner-api.js'
import { enqueueOfflineSos } from '@/utils/sos-offline-queue.js'
import { ApiError } from '@/utils/api.js'

const AUTO_SEC = 5

const props = defineProps({
  show: Boolean,
  eventGuid: String,
  runner: Object,
  apiConnected: Boolean,
})
const emit = defineEmits(['close', 'submitted'])

const symptoms = [
  { id: 'heart', label: '心脏不适 / 胸闷' },
  { id: 'muscle', label: '肌肉拉伤 / 抽筋' },
  { id: 'injury', label: '外伤出血 / 跌倒' },
]

const step = ref('gps')
const countdown = ref(AUTO_SEC)
const gps = ref(null)
const env = ref({ battery: 68, signal: '4G 良好' })
const submitting = ref(false)
const rescuePhone = ref('120')
const organizerPhone = ref(null)
let submitted = false
let countTimer = null

const gpsText = computed(() =>
  gps.value ? `${gps.value.lat.toFixed(4)}, ${gps.value.lng.toFixed(4)}` : '—',
)

watch(
  () => props.show,
  (v) => {
    if (!v) {
      step.value = 'gps'
      countdown.value = AUTO_SEC
      gps.value = null
      submitted = false
      if (countTimer) clearInterval(countTimer)
      return
    }
    step.value = 'gps'
    submitted = false
    if (props.eventGuid) {
      fetchSosRescueConfig(props.eventGuid)
        .then((cfg) => {
          if (cfg.rescuePhone) rescuePhone.value = cfg.rescuePhone
          if (cfg.organizerPhone) organizerPhone.value = cfg.organizerPhone
        })
        .catch(() => {})
    }
    uni.getLocation({
      type: 'gcj02',
      success(res) {
        gps.value = { lat: res.latitude, lng: res.longitude }
        env.value = { battery: 68, signal: 'GPS 已定位' }
        step.value = 'symptom'
      },
      fail() {
        gps.value = { lat: 30.5728, lng: 104.0668 }
        env.value = { battery: 55, signal: 'GPS 不可用·使用近似坐标' }
        step.value = 'symptom'
      },
    })
  },
)

watch(
  () => [props.show, step.value],
  () => {
    if (countTimer) clearInterval(countTimer)
    if (!props.show || step.value !== 'symptom') return
    submitted = false
    countdown.value = AUTO_SEC
    countTimer = setInterval(() => {
      countdown.value -= 1
      if (countdown.value <= 0) {
        clearInterval(countTimer)
        doSubmit('heart')
      }
    }, 1000)
  },
)

function callPhone(num) {
  uni.makePhoneCall({ phoneNumber: String(num).replace(/\s/g, '') })
}

async function doSubmit(symptomKey) {
  if (submitted || submitting.value) return
  submitted = true
  submitting.value = true

  const payload = {
    runnerId: props.runner?.id,
    bib: props.runner?.bib,
    name: props.runner?.name,
    gps: gps.value ?? { lat: 0, lng: 0 },
    battery: env.value.battery,
    signal: env.value.signal,
    symptomKey,
    submittedAt: new Date().toISOString(),
  }

  if (!props.apiConnected) {
    enqueueOfflineSos(payload)
    step.value = 'done'
    emit('submitted', '网络不可用，已本地记录；请立即拨打救援电话')
    submitting.value = false
    return
  }

  try {
    const res = await submitSos({
      lat: payload.gps.lat,
      lng: payload.gps.lng,
      battery: payload.battery,
      signal: payload.signal,
      symptomKey,
    })
    step.value = 'done'
    emit('submitted', res.comfortMessage ?? res.message)
  } catch (e) {
    enqueueOfflineSos(payload)
    try {
      await submitSosBeacon({
        lat: payload.gps.lat,
        lng: payload.gps.lng,
        battery: payload.battery,
      })
    } catch {
      /* ignore */
    }
    submitted = false
    const msg =
      e instanceof ApiError
        ? `${e.message}（已离线缓存，请拨打救援电话）`
        : 'SOS 上报失败，已离线缓存，请拨打救援电话'
    emit('submitted', msg)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 300;
  display: flex;
  align-items: flex-end;
}
.sheet {
  width: 100%;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  padding: 40rpx 32rpx calc(40rpx + env(safe-area-inset-bottom));
  max-height: 90vh;
  overflow-y: auto;
}
.center {
  text-align: center;
  padding: 60rpx 0;
}
.spinner {
  width: 80rpx;
  height: 80rpx;
  border: 6rpx solid #fecaca;
  border-top-color: #dc2626;
  border-radius: 50%;
  margin: 0 auto 24rpx;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.bold {
  font-size: 32rpx;
  font-weight: 700;
  display: block;
}
.muted {
  font-size: 24rpx;
  color: #64748b;
  margin-top: 8rpx;
  display: block;
}
.row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16rpx;
}
.title-alert {
  font-size: 34rpx;
  font-weight: 800;
  color: #dc2626;
}
.gps-line {
  font-size: 24rpx;
  color: #475569;
  margin-bottom: 20rpx;
  display: block;
}
.phones {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
}
.phone-main {
  flex: 1;
  background: #dc2626;
  color: #fff;
  font-size: 24rpx;
  border-radius: 12rpx;
}
.phone-sub {
  flex: 1;
  border: 1px solid #fecaca;
  color: #b91c1c;
  font-size: 24rpx;
  border-radius: 12rpx;
  background: #fff;
}
.symptom {
  width: 100%;
  margin-bottom: 20rpx;
  background: linear-gradient(180deg, #ff3b30, #d32f2f);
  color: #fff;
  font-size: 32rpx;
  font-weight: 700;
  border-radius: 16rpx;
}
.cancel {
  width: 100%;
  margin-top: 16rpx;
  color: #64748b;
  background: transparent;
  font-size: 28rpx;
}
.done-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 16rpx;
}
.ok {
  margin-top: 32rpx;
  width: 100%;
  background: var(--primary);
  color: #fff;
  border-radius: 16rpx;
}
</style>
