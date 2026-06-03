import { API_BASE, getRunnerToken } from './api.js'

const WS_OVERRIDE = (import.meta.env.VITE_RUNNER_WS_BASE || '').replace(/\/$/, '')
const RECONNECT_BASE_MS = 2000
const RECONNECT_MAX_MS = 30000
const IDLE_CLOSE_DELAY_MS = 800

let socketTask = null
let socketUrl = null
let socketState = 'closed'
let reconnectTimer = null
let idleCloseTimer = null
let reconnectAttempt = 0
let connectSerial = 0

const listeners = new Set()
const stateListeners = new Set()
const openListeners = new Set()

function wsBaseFromApiBase() {
  if (WS_OVERRIDE) {
    if (WS_OVERRIDE.startsWith('ws://') || WS_OVERRIDE.startsWith('wss://')) {
      return WS_OVERRIDE
    }
    return WS_OVERRIDE.replace(/^https/i, 'wss').replace(/^http/i, 'ws')
  }
  if (API_BASE.startsWith('http')) {
    const u = API_BASE.replace(/\/api\/?$/, '')
    const isHttps = API_BASE.startsWith('https')
    const host = API_BASE.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    const proto = isHttps ? 'wss' : 'ws'
    const basePath = API_BASE.includes('/api') ? '/api' : ''
    return `${proto}://${host}${basePath}`
  }
  return null
}

export function buildRunnerChatWebSocketUrl() {
  const token = getRunnerToken()
  if (!token) return null
  const base = wsBaseFromApiBase()
  if (!base) return null
  return `${base}/ws/runner-chat?token=${encodeURIComponent(token)}`
}

function setSocketState(state) {
  if (socketState === state) return
  socketState = state
  stateListeners.forEach((fn) => fn())
}

export function getRunnerChatSocketState() {
  return socketState
}

export function subscribeRunnerChatSocketState(onChange) {
  stateListeners.add(onChange)
  return () => stateListeners.delete(onChange)
}

export function subscribeRunnerChatSocketOpen(onOpen) {
  openListeners.add(onOpen)
  if (socketState === 'open') onOpen()
  return () => openListeners.delete(onOpen)
}

function dispatchMessage(raw) {
  try {
    const payload = JSON.parse(raw)
    if (payload.type === 'human_reply' && payload.data?.text?.trim()) {
      listeners.forEach((fn) => fn(payload.data))
    }
  } catch {
    /* ignore */
  }
}

function teardownSocket() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  if (socketTask) {
    try {
      uni.closeSocket()
    } catch {
      /* ignore */
    }
    socketTask = null
  }
  socketUrl = null
  setSocketState('closed')
}

function scheduleReconnect() {
  if (reconnectTimer || listeners.size === 0) return
  const delay = Math.min(RECONNECT_MAX_MS, RECONNECT_BASE_MS * 2 ** reconnectAttempt)
  reconnectAttempt += 1
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    if (listeners.size > 0) ensureRunnerChatSocket()
  }, delay)
}

function scheduleIdleClose() {
  if (idleCloseTimer) clearTimeout(idleCloseTimer)
  if (listeners.size > 0) return
  idleCloseTimer = setTimeout(() => {
    idleCloseTimer = null
    if (listeners.size === 0) teardownSocket()
  }, IDLE_CLOSE_DELAY_MS)
}

function ensureRunnerChatSocket() {
  if (idleCloseTimer) {
    clearTimeout(idleCloseTimer)
    idleCloseTimer = null
  }
  const url = buildRunnerChatWebSocketUrl()
  if (!url || listeners.size === 0) return
  if (socketTask && socketUrl === url && socketState !== 'closed') return

  teardownSocket()
  const serial = ++connectSerial
  socketUrl = url
  setSocketState('connecting')

  socketTask = uni.connectSocket({ url })

  uni.onSocketOpen(() => {
    if (serial !== connectSerial) return
    reconnectAttempt = 0
    setSocketState('open')
    openListeners.forEach((fn) => fn())
  })

  uni.onSocketMessage((res) => {
    if (serial !== connectSerial) return
    dispatchMessage(String(res.data))
  })

  uni.onSocketClose(() => {
    if (serial !== connectSerial) return
    socketTask = null
    socketUrl = null
    setSocketState('closed')
    if (listeners.size > 0) scheduleReconnect()
  })

  uni.onSocketError(() => {
    if (serial !== connectSerial) return
    setSocketState('closed')
  })
}

export function subscribeRunnerChatHumanReply(onHumanReply) {
  listeners.add(onHumanReply)
  reconnectAttempt = 0
  ensureRunnerChatSocket()
  return () => {
    listeners.delete(onHumanReply)
    if (listeners.size === 0) scheduleIdleClose()
  }
}
