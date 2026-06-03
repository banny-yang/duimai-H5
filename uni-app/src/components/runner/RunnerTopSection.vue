<template>
  <view class="runner-top-section">
    <NotificationBar :event="event" />
    <view class="runner-hub">
      <IdentityVerifyBanner v-if="!identityVerified" @verify="$emit('verify')" />
      <ShortcutGrid @select="$emit('shortcut', $event)" />
    </view>
  </view>
</template>

<script setup>
import NotificationBar from './NotificationBar.vue'
import IdentityVerifyBanner from './IdentityVerifyBanner.vue'
import ShortcutGrid from './ShortcutGrid.vue'

defineProps({
  event: { type: Object, required: true },
  identityVerified: Boolean,
})
defineEmits(['verify', 'shortcut'])
</script>
