import { ref, watch, nextTick } from 'vue'
import {
  getMpPageLayoutStyle,
  getMpPageHeightPx,
  bindMpWindowResize,
  isMpWeixinPlatform,
} from '@/utils/mp-layout.js'

/** 收起态消息区约占「顶栏与协议栏之间」高度的比例 */
const NORMAL_CHAT_RATIO = 0.44
const MIN_MESSAGES_PX = 100

/**
 * 小程序 runner 页布局：顶栏 | 信息(flex:1) | 聊天(贴协议栏) | 协议栏
 * 普通态聊天区 height:auto，scroll-view 高度由 JS 注入 px
 */
export function useMpRunnerLayout(chatMaximizedRef, pageInstance = null) {
  const rootLayoutStyle = ref({})
  const messagesScrollPx = ref(0)

  let unbindResize = () => {}
  let debounceTimer = null

  function query() {
    const q = uni.createSelectorQuery()
    if (pageInstance?.proxy) q.in(pageInstance.proxy)
    return q
  }

  function applyVars(vars) {
    rootLayoutStyle.value = { ...getMpPageLayoutStyle(), ...vars }
  }

  function measureMessagesScrollPx(contentH, maximized) {
    nextTick(() => {
      if (maximized) {
        query()
          .select('.runner-chat-dock')
          .boundingClientRect()
          .select('.chat-section-header')
          .boundingClientRect()
          .select('.chat-input-footer')
          .boundingClientRect()
          .exec((res) => {
            const dockH = Math.floor(Number(res?.[0]?.height) || 0)
            const headerH = Math.floor(Number(res?.[1]?.height) || 0)
            const inputH = Math.floor(Number(res?.[2]?.height) || 0)
            if (dockH <= 0) return
            const scrollH = Math.max(MIN_MESSAGES_PX, dockH - headerH - inputH)
            messagesScrollPx.value = scrollH
          })
        return
      }

      const targetChatH = Math.max(
        MIN_MESSAGES_PX + 120,
        Math.floor(contentH * NORMAL_CHAT_RATIO),
      )

      query()
        .select('.chat-section-header')
        .boundingClientRect()
        .select('.chat-input-footer')
        .boundingClientRect()
        .exec((res) => {
          const headerH = Math.floor(Number(res?.[0]?.height) || 0)
          const inputH = Math.floor(Number(res?.[1]?.height) || 0)
          const scrollH = Math.max(
            MIN_MESSAGES_PX,
            targetChatH - headerH - inputH,
            Math.floor(contentH * 0.22),
          )
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
        .select('.runner-footer')
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

          measureMessagesScrollPx(contentH, maximized)
          if (maximized) {
            setTimeout(() => measureMessagesScrollPx(contentH, true), 80)
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
