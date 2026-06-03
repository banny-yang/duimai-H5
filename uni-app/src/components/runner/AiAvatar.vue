<template>
  <view class="ai-avatar" :class="size">
    <text>麦</text>
  </view>
</template>

<script setup>
defineProps({
  size: { type: String, default: 'sm' },
})
</script>

<style scoped>
.ai-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  background: linear-gradient(145deg, #ef4444 0%, var(--primary) 100%);
  box-shadow: 0 4rpx 12rpx rgba(239, 68, 68, 0.35);
}
.ai-avatar.sm {
  width: 48rpx;
  height: 48rpx;
  font-size: 20rpx;
}
.ai-avatar.md {
  width: 56rpx;
  height: 56rpx;
  font-size: 24rpx;
}
</style>
