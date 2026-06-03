<template>
  <!-- 纯 CSS 图标：微信小程序不支持/不稳定渲染 inline SVG -->
  <view class="chat-maximize-icon" :class="{ 'is-maximized': maximized }" aria-hidden="true">
    <view v-if="maximized" class="icon-restore">
      <view class="restore-arrow" />
      <view class="restore-bar" />
    </view>
    <view v-else class="icon-expand">
      <view class="expand-corner expand-tr" />
      <view class="expand-corner expand-bl" />
    </view>
  </view>
</template>

<script setup>
defineProps({
  maximized: { type: Boolean, default: false },
})
</script>

<style scoped>
.chat-maximize-icon {
  width: 32rpx;
  height: 32rpx;
  position: relative;
  color: inherit;
}

/* 最大化：对角外扩 */
.icon-expand {
  width: 100%;
  height: 100%;
  position: relative;
}

.expand-corner {
  position: absolute;
  width: 14rpx;
  height: 14rpx;
  border: 3rpx solid currentColor;
  box-sizing: border-box;
}

.expand-tr {
  top: 0;
  right: 0;
  border-left: none;
  border-bottom: none;
}

.expand-bl {
  bottom: 0;
  left: 0;
  border-right: none;
  border-top: none;
}

/* 收起：向下箭头 + 底栏 */
.icon-restore {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rpx;
}

.restore-arrow {
  width: 14rpx;
  height: 14rpx;
  border-right: 3rpx solid currentColor;
  border-bottom: 3rpx solid currentColor;
  transform: rotate(45deg) translateY(-2rpx);
  box-sizing: border-box;
}

.restore-bar {
  width: 22rpx;
  height: 3rpx;
  background: currentColor;
  border-radius: 2rpx;
}
</style>
