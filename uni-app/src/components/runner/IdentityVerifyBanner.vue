<template>
  <view class="identity-banner" @tap="$emit('verify')">
    <view class="identity-icon">!</view>
    <view class="identity-body">
      <text class="identity-title">尚未验证选手身份</text>
      <text class="identity-desc">验证参赛号与身份证后 6 位，解锁 SOS 与我的参赛信息</text>
    </view>
    <text class="identity-action">去验证 ›</text>
  </view>
</template>

<script setup>
defineEmits(['verify'])
</script>

<style scoped>
.identity-body {
  flex: 1;
  min-width: 0;
}
</style>
