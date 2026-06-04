import { ref, watch, nextTick } from 'vue'
import {
  getMpPageLayoutStyle,
  getMpPageHeightPx,
  bindMpWindowResize,
  isMpWeixinPlatform,
} from '@/utils/mp-layout.js'

/** 收起态消息区高度（px），不依赖 contentH */
const NORMAL_MESSAGES_PX = 220
const MIN_MESSAGES_PX = 100
const HEADER_FALLBACK_RPX = 96
const INPUT_FOOTER_FALLBACK_RPX = 220

/**
 * 小程序 runner 页布局：
 * - 收起态：信息区 flex:0 0 auto 由内容撑开，聊天区紧跟其后
 * - 全屏态：chat-dock 用 absolute 覆盖顶栏与协议栏之间全部空间
 */
export function useMpRunnerLayout(chatMaximizedRef, pageInstance = null) {
  const rootLayoutStyle = ref({})
  const messagesScrollPx = ref(0)

  let unbindResize = () => {}
  let debounceTimer = null
  let layoutVars = {}

  function query() {
    const q = uni.createSelectorQuery()
    if (pageInstance?.proxy) q.in(pageInstance.proxy)
    return q
  }

  function applyVars(vars) {
    layoutVars = { ...layoutVars, ...vars }
    rootLayoutStyle.value = { ...getMpPageLayoutStyle(), ...layoutVars }
  }

  function rpxToPx(rpx) {
    try {
      const width = Number(uni.getSystemInfoSync().windowWidth) || 375
      return Math.floor((rpx * width) / 750)
    } catch {
      return Math.floor(rpx / 2)
    }
  }

  function measureMessagesScrollPx(maximized) {
    nextTick(() => {
      if (maximized) {
        // 全屏：取 chat-dock 高度，减去 header 和 input
        query()
          .select('.runner-chat-dock')
          .boundingClientRect()
          .select('.chat-section-header')
          .boundingClientRect()
          .select('.chat-input-footer')
          .boundingClientRect()
          .exec((res) => {
            const dockH = Math.floor(Number(res?.[0]?.height) || contentH || 0)
            const headerH = Math.floor(
              Number(res?.[1]?.height) || rpxToPx(HEADER_FALLBACK_RPX),
            )
            const inputH = Math.floor(
              Number(res?.[2]?.height) || rpxToPx(INPUT_FOOTER_FALLBACK_RPX),
            )
            applyVars({
              '--mp-chat-header-h': `${headerH}px`,
              '--mp-chat-input-h': `${inputH}px`,
            })
            if (dockH <= 0) return
            const scrollH = Math.max(MIN_MESSAGES_PX, dockH - headerH - inputH)
            messagesScrollPx.value = scrollH
          })
        return
      }

      // 收起态：消息区高度固定，不受 contentH 影响
      query()
        .select('.chat-section-header')
        .boundingClientRect()
        .select('.chat-input-footer')
        .boundingClientRect()
        .exec((res) => {
          const headerH = Math.floor(
            Number(res?.[0]?.height) || rpxToPx(HEADER_FALLBACK_RPX),
          )
          const inputH = Math.floor(
            Number(res?.[1]?.height) || rpxToPx(INPUT_FOOTER_FALLBACK_RPX),
          )
          applyVars({
            '--mp-chat-header-h': `${headerH}px`,
            '--mp-chat-input-h': `${inputH}px`,
          })
          const scrollH = Math.max(MIN_MESSAGES_PX, NORMAL_MESSAGES_PX - headerH - inputH)
          messagesScrollPx.value = scrollH
        })
    })
  }

  function measureLayout() {
    if (!isMpWeixinPlatform()) return

    nextTick(() => {
      query()
        .select('.runner-header')
        .boundingClientRect()
        .select('.runner-footer-host')
        .boundingClientRect()
        .exec((res) => {
          const headerH = Math.max(0, Math.floor(Number(res?.[0]?.height) || 0))
          const footerH = Math.max(0, Math.floor(Number(res?.[1]?.height) || 0))
          const winH = getMpPageHeightPx() || 667
          const contentH = Math.max(0, winH - headerH - footerH)
          const maximized = Boolean(chatMaximizedRef.value)

          applyVars({
            '--mp-header-h': `${headerH}px`,
            '--mp-footer-h': `${footerH}px`,
            '--mp-content-h': `${contentH}px`,
            '--mp-sos-bottom': `${footerH + 88}px`,
          })

          measureMessagesScrollPx(maximized)
          if (maximized) {
            setTimeout(() => measureMessagesScrollPx(true), 80)
          }
        })
    })
  }

  function scheduleMeasure(delay = 60) {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(measureLayout, delay)
  }

  function mount() {
    if (!isMpWeixinPlatform()) return
    unbindResize = bindMpWindowResize(() => scheduleMeasure(120))
    scheduleMeasure(0)
    setTimeout(measureLayout, 280)
  }

  function unmount() {
    unbindResize()
    if (debounceTimer) clearTimeout(debounceTimer)
  }

  watch(chatMaximizedRef, () => {
    scheduleMeasure(0)
    setTimeout(measureLayout, 320)
  })

  return {
    rootLayoutStyle,
    messagesScrollPx,
    measureLayout,
    scheduleMeasure,
    mount,
    unmount,
  }
}
