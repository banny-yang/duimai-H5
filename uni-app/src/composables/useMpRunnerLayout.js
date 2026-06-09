/**
 * 小程序 runner 页面布局 composable
 * 
 * 功能说明：
 * - 测量小程序页面各区域的高度（标题栏、信息区、协议栏）
 * - 将高度设置为 CSS 变量，供样式使用
 * - 根据聊天面板是否全屏，动态调整布局
 * 
 * CSS 变量：
 * - --mp-header-h: 标题栏高度 (px)
 * - --mp-footer-h: 协议栏高度 (px)
 * - --mp-sos-bottom: SOS按钮底部位置 (px)
 * 
 * 使用方式：
 * ```javascript
 * const { rootLayoutStyle, messagesScrollPx, mount, unmount } = useMpRunnerLayout(chatMaximizedRef, pageInstance)
 * ```
 * 
 * 注意：
 * - 仅在微信小程序环境 (MP-WEIXIN) 下生效
 * - 需要在组件 mounted 后调用 mount()
 * - 需要在组件 unmounted 后调用 unmount()
 */

import { ref, watch, nextTick } from 'vue'
import {
  getMpPageLayoutStyle,
  getMpCapsuleRightGapPx,
  getMpCapsuleNavBarHeightPx,
  bindMpWindowResize,
  isMpWeixinPlatform,
} from '@/utils/mp-layout.js'

/** 消息区最小高度（px），防止消息区过小 */
const MIN_MESSAGES_PX = 100
/** 标题栏高度回退值（rpx），用于获取不到元素高度时的计算 */
const HEADER_FALLBACK_RPX = 96

/**
 * 创建小程序 runner 页面布局控制器
 * 
 * @param {Ref<boolean>} chatMaximizedRef - 聊天面板是否全屏的响应式引用
 * @param {ComponentPublicInstance|null} pageInstance - 页面实例，用于选择器查询
 * @returns {Object} 布局控制器对象
 */
export function useMpRunnerLayout(chatMaximizedRef, pageInstance = null) {
  /** 根元素样式，用于设置 CSS 变量 */
  const rootLayoutStyle = ref({})
  /** 消息滚动区域高度（px），为0表示由内容撑开 */
  const messagesScrollPx = ref(0)

  let unbindResize = () => {}  // 窗口 resize 解绑函数
  let debounceTimer = null    // 防抖定时器
  let layoutVars = {}          // 当前布局 CSS 变量

  /**
   * 创建选择器查询对象
   * 在小程序中，需要指定组件实例才能在组件内查询元素
   */
  function query() {
    const q = uni.createSelectorQuery()
    if (pageInstance?.proxy) q.in(pageInstance.proxy)
    return q
  }

  /**
   * 应用布局 CSS 变量到根元素
   * 
   * @param {Object} vars - CSS 变量键值对，如 { '--mp-header-h': '50px' }
   */
  function applyVars(vars) {
    layoutVars = { ...layoutVars, ...vars }
    // 合并默认样式和布局变量
    rootLayoutStyle.value = { ...getMpPageLayoutStyle(), ...layoutVars }
  }

  /**
   * 将 rpx 单位转换为 px 单位
   * 
   * @param {number} rpx - rpx 值
   * @returns {number} px 值
   */
  function rpxToPx(rpx) {
    try {
      // 获取屏幕宽度（单位：px）
      const width = Number(uni.getSystemInfoSync().windowWidth) || 375
      // rpx 转 px 的公式：rpx * (屏幕宽度 / 750)
      return Math.floor((rpx * width) / 750)
    } catch {
      // 降级处理：假设 1rpx ≈ 0.5px
      return Math.floor(rpx / 2)
    }
  }

  /**
   * 测量消息滚动区域高度
   * 
   * 统一由 chat-dock 容器高度减去 header 高度来计算消息区高度
   * 
   * @param {boolean} maximized - 是否全屏
   */
  function measureMessagesScrollPx(maximized) {
    nextTick(() => {
      // 获取 chat-dock 和 chat-section-header 的高度
      query()
        .select('.runner-chat-dock')
        .boundingClientRect()
        .select('.chat-section-header')
        .boundingClientRect()
        .exec((res) => {
          // 解析各元素高度，如果获取失败则使用回退值
          const dockH = Math.floor(Number(res?.[0]?.height) || 0)
          const headerH = Math.floor(
            Number(res?.[1]?.height) || rpxToPx(HEADER_FALLBACK_RPX),
          )
          // 应用 header 的高度变量
          applyVars({
            '--mp-chat-header-h': `${headerH}px`,
          })
          // 计算消息滚动区域高度
          if (dockH <= 0) return
          const scrollH = Math.max(MIN_MESSAGES_PX, dockH - headerH)
          messagesScrollPx.value = scrollH
        })
    })
  }

  /**
   * 测量并更新整体布局
   * 
   * 获取标题栏、信息区、协议栏的高度，
   * 并将高度值设置为 CSS 变量供样式使用
   */
  function measureLayout() {
    // 仅在小程序环境执行
    if (!isMpWeixinPlatform()) return

    nextTick(() => {
      // 查询标题栏、信息区、输入区、协议栏的高度
      query()
        .select('.runner-header')
        .boundingClientRect()
        .select('.runner-body')
        .boundingClientRect()
        .select('.runner-chat-input-fixed')
        .boundingClientRect()
        .select('.runner-footer-host')
        .boundingClientRect()
        .exec((res) => {
          // 解析各区域高度，如果获取失败则默认为0
          const headerH = Math.max(0, Math.floor(Number(res?.[0]?.height) || 0))
          const bodyH = Math.max(0, Math.floor(Number(res?.[1]?.height) || 0))
          const inputH = Math.max(0, Math.floor(Number(res?.[2]?.height) || 0))
          const footerH = Math.max(0, Math.floor(Number(res?.[3]?.height) || 0))
          const maximized = Boolean(chatMaximizedRef.value)  // 是否全屏

          // SOS 按钮底部位置 = 协议栏高度 + 输入区高度 + 偏移
          const sosBottom = footerH + inputH + 88

          // 获取胶囊按钮相关间距与状态栏高度
          const capsuleRightGap = getMpCapsuleRightGapPx()
          const capsuleNavBarH = getMpCapsuleNavBarHeightPx()
          let statusBarH = 0
          let capsuleBottomY = 0
          try {
            statusBarH = uni.getSystemInfoSync().statusBarHeight || 0
            const capsule = uni.getMenuButtonBoundingClientRect()
            if (capsule && capsule.height) {
              capsuleBottomY = (capsule.bottom || (capsule.top + capsule.height))
            }
          } catch { /* ignore */ }

          // 应用布局变量到 CSS
          applyVars({
            '--mp-header-h': `${headerH}px`,   // 标题栏高度
            '--mp-body-h': `${bodyH}px`,       // 信息区高度
            '--mp-footer-h': `${footerH}px`,   // 协议栏高度
            '--mp-sos-bottom': `${sosBottom}px`,  // SOS按钮底部位置
            '--mp-status-bar-h': `${statusBarH}px`,  // 状态栏高度
            '--mp-capsule-right-gap': `${capsuleRightGap}px`,  // 胶囊按钮右侧安全间距
            '--mp-capsule-nav-h': `${capsuleNavBarH}px`,  // 胶囊按钮对齐的导航内容区高度
            '--mp-capsule-bottom-y': `${capsuleBottomY}px`,  // 胶囊按钮底部Y坐标（作为第二排内容的 top）
          })

          // 测量消息滚动区域高度
          measureMessagesScrollPx(maximized)
          
          // 全屏态需要延迟再测量一次，确保布局已稳定
          if (maximized) {
            setTimeout(() => measureMessagesScrollPx(true), 80)
          }
        })
    })
  }

  /**
   * 防抖调度测量
   * 避免频繁触发测量操作
   * 
   * @param {number} delay - 延迟时间（毫秒），默认60ms
   */
  function scheduleMeasure(delay = 60) {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(measureLayout, delay)
  }

  /**
   * 挂载布局控制器
   * 在组件 mounted 时调用
   */
  function mount() {
    if (!isMpWeixinPlatform()) return
    
    // 绑定窗口 resize 事件
    unbindResize = bindMpWindowResize(() => scheduleMeasure(120))
    
    // 立即测量一次
    scheduleMeasure(0)
    
    // 延迟280ms后再测量一次，确保所有元素已渲染完成
    setTimeout(measureLayout, 280)
  }

  /**
   * 卸载布局控制器
   * 在组件 unmounted 时调用
   */
  function unmount() {
    unbindResize()  // 解绑窗口 resize 事件
    if (debounceTimer) clearTimeout(debounceTimer)  // 清除防抖定时器
  }

  // 监听聊天面板全屏状态变化
  watch(chatMaximizedRef, () => {
    // 立即重新测量
    scheduleMeasure(0)
    
    // 延迟320ms后再次测量，确保布局已稳定
    setTimeout(measureLayout, 320)
  })

  // 返回布局控制器
  return {
    rootLayoutStyle,    // 根元素样式（包含 CSS 变量）
    messagesScrollPx,    // 消息滚动区域高度
    measureLayout,      // 手动触发布局测量
    scheduleMeasure,    // 防抖调度测量
    mount,              // 挂载
    unmount,            // 卸载
  }
}
