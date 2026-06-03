<template>
  <view class="user-avatar">
    <svg class="user-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" stroke-linecap="round" />
    </svg>
  </view>
</template>

<style scoped>
.user-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  border: 2px solid var(--secondary-border);
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--secondary-text);
  box-shadow: 0 2rpx 8rpx rgba(15, 23, 42, 0.06);
}
.user-svg {
  width: 32rpx;
  height: 32rpx;
}
</style>
