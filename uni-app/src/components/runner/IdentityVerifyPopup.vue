<template>
  <SheetModal :show="show" title="选手身份验证" :scrollable="false" @close="onClose">
    <view class="verify-intro">
      <text>验证 </text>
      <text class="verify-event">{{ eventName }}</text>
      <text> 参赛身份，解锁 SOS 紧急求助与个人参赛信息。信息仅保存在本设备。</text>
    </view>

    <view class="verify-form">
      <view class="form-field" :class="{ 'form-field--focus': focused === 'bib' }">
        <text class="field-label">参赛号码</text>
        <input
          class="field-input"
          type="text"
          :value="bib"
          placeholder="如 A10234"
          placeholder-class="field-ph"
          maxlength="32"
          :disabled="submitting"
          :adjust-position="true"
          :hold-keyboard="true"
          confirm-type="next"
          @input="onBibInput"
          @focus="focused = 'bib'"
          @blur="onFieldBlur"
        />
      </view>

      <view class="form-field" :class="{ 'form-field--focus': focused === 'suffix' }">
        <text class="field-label">身份证后 6 位</text>
        <input
          class="field-input field-input--suffix"
          type="text"
          :value="suffix"
          placeholder="6 位数字"
          placeholder-class="field-ph"
          maxlength="6"
          :disabled="submitting"
          :adjust-position="true"
          :hold-keyboard="true"
          confirm-type="done"
          @input="onSuffixInput"
          @focus="focused = 'suffix'"
          @blur="onFieldBlur"
          @confirm="submit"
        />
      </view>

      <view v-if="err" class="form-error">{{ err }}</view>

      <button
        class="verify-submit"
        :class="{ loading: submitting }"
        :loading="submitting"
        :disabled="submitting"
        @tap="submit"
      >
        {{ submitting ? '验证中…' : '确认验证' }}
      </button>
    </view>

    <view class="verify-foot">
      与报名时登记的身份证号后 6 位一致方可通过。如有问题请联系赛事组委会。
    </view>
  </SheetModal>
</template>

<script setup>
import { ref, watch } from 'vue'
import SheetModal from './SheetModal.vue'
import { getStoredIdentity } from '@/utils/runner-identity.js'
import { ApiError } from '@/utils/api.js'

const props = defineProps({
  show: Boolean,
  eventGuid: { type: String, default: '' },
  eventName: { type: String, default: '本场赛事' },
  onVerified: { type: Function, required: true },
})
const emit = defineEmits(['close'])

const bib = ref('')
const suffix = ref('')
const err = ref('')
const submitting = ref(false)
const focused = ref('')

watch(
  () => [props.show, props.eventGuid],
  ([open, guid]) => {
    if (!open) return
    const stored = guid ? getStoredIdentity(guid) : null
    bib.value = stored?.bibNumber ?? ''
    suffix.value = ''
    err.value = ''
    submitting.value = false
    focused.value = ''
  },
)

function onBibInput(e) {
  bib.value = e.detail?.value ?? ''
}

function onSuffixInput(e) {
  const raw = e.detail?.value ?? ''
  suffix.value = raw.replace(/\D/g, '').slice(0, 6)
}

function onFieldBlur() {
  focused.value = ''
}

function onClose() {
  emit('close')
}

async function submit() {
  err.value = ''
  const b = bib.value.trim()
  const s = suffix.value.trim()
  if (!b) {
    err.value = '请输入参赛号码'
    return
  }
  if (!/^\d{6}$/.test(s)) {
    err.value = '请输入身份证后 6 位数字'
    return
  }
  submitting.value = true
  try {
    await props.onVerified(b, s)
    onClose()
  } catch (e) {
    err.value =
      e instanceof ApiError
        ? e.message
        : e instanceof Error
          ? e.message
          : '验证失败，请稍后重试'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.verify-intro {
  font-size: 28rpx;
  color: var(--secondary-text);
  line-height: 1.6;
  margin-bottom: 36rpx;
}
.verify-event {
  font-weight: 700;
  color: var(--ink);
}
.verify-form {
  display: flex;
  flex-direction: column;
  gap: 28rpx;
}
.form-field {
  display: flex;
  flex-direction: column;
}
.field-label {
  font-size: 24rpx;
  font-weight: 700;
  color: var(--ink);
  margin-bottom: 16rpx;
}
.form-field--focus .field-input {
  border-color: var(--primary);
  box-shadow: 0 0 0 6rpx rgba(255, 102, 0, 0.12);
}
.field-input {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  padding: 0 28rpx;
  border: 2px solid var(--secondary-border);
  border-radius: 24rpx;
  font-size: 32rpx;
  color: var(--ink);
  background: #fff;
  box-sizing: border-box;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.field-input--suffix {
  letter-spacing: 0.15em;
  font-variant-numeric: tabular-nums;
}
.form-error {
  font-size: 26rpx;
  color: #b45309;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  line-height: 1.45;
}
.verify-submit {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  margin-top: 8rpx;
  border-radius: 24rpx;
  font-size: 32rpx;
  font-weight: 700;
  color: #fff;
  background: var(--primary);
  box-shadow: var(--shadow-primary-sm);
}
.verify-submit.loading,
.verify-submit[disabled] {
  opacity: 0.65;
}
.verify-foot {
  margin-top: 36rpx;
  font-size: 22rpx;
  color: var(--secondary-text);
  line-height: 1.55;
}
</style>

<style>
.field-ph {
  color: #9ca3af;
  font-size: 30rpx;
}
</style>
