<template>
  <view class="shortcut-grid-wrap">
    <view class="shortcut-grid">
      <view
        v-for="s in shortcuts"
        :key="s.id"
        class="shortcut-card"
        @tap="$emit('select', s.id)"
      >
        <view class="shortcut-icon" :class="s.id">
          <ShortcutIcon :type="s.id" />
        </view>
        <text class="shortcut-label">{{ s.label }}</text>
        <text class="shortcut-desc">{{ s.desc }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import ShortcutIcon from '@/components/icons/ShortcutIcon.vue'

defineEmits(['select'])

const shortcuts = [
  { id: 'info', label: '参赛信息', desc: '参赛号·分区·领物' },
  { id: 'map', label: '赛道地图', desc: '公里数·补给点' },
  { id: 'shuttle', label: '交通接驳', desc: '物资·返程大巴' },
]
</script>
