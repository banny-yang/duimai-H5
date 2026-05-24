import { API_BASE, getRunnerToken } from "@/lib/api-client";
import type { ChatInboxMessageVO } from "@/api/runner-api";

export type HumanReplyHandler = (message: ChatInboxMessageVO) => void;
export type RunnerChatSocketState = "closed" | "connecting" | "open";

/** 开发环境可设 ws://localhost:8091/api，绕过 Vite 代理 WebSocket 问题 */
const WS_ORIGIN_OVERRIDE = (import.meta.env.VITE_RUNNER_WS_BASE as string | undefined)?.replace(
  /\/$/,
  "",
);

const RECONNECT_BASE_MS = 2000;
const RECONNECT_MAX_MS = 30000;
/** 短暂无订阅者时不立刻关连，吸收 React StrictMode 双挂载 */
const IDLE_CLOSE_DELAY_MS = 800;

function wsBaseFromApiBase(): string {
  if (WS_ORIGIN_OVERRIDE) {
    if (WS_ORIGIN_OVERRIDE.startsWith("ws://") || WS_ORIGIN_OVERRIDE.startsWith("wss://")) {
      return WS_ORIGIN_OVERRIDE;
    }
    return WS_ORIGIN_OVERRIDE.replace(/^https/i, "wss").replace(/^http/i, "ws");
  }
  if (API_BASE.startsWith("http")) {
    const url = new URL(API_BASE);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    return url.origin + url.pathname.replace(/\/$/, "");
  }
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}${API_BASE.replace(/\/$/, "")}`;
}

export function buildRunnerChatWebSocketUrl(): string | null {
  const token = getRunnerToken();
  if (!token) return null;
  const base = wsBaseFromApiBase();
  return `${base}/ws/runner-chat?token=${encodeURIComponent(token)}`;
}

let sharedSocket: WebSocket | null = null;
let sharedUrl: string | null = null;
let socketState: RunnerChatSocketState = "closed";
let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
let idleCloseTimer: ReturnType<typeof setTimeout> | undefined;
let reconnectAttempt = 0;
let connectSerial = 0;

const listeners = new Set<HumanReplyHandler>();
const stateListeners = new Set<() => void>();
const openListeners = new Set<() => void>();

function setSocketState(state: RunnerChatSocketState) {
  if (socketState === state) return;
  socketState = state;
  stateListeners.forEach((fn) => fn());
}

export function getRunnerChatSocketState(): RunnerChatSocketState {
  if (sharedSocket?.readyState === WebSocket.OPEN) return "open";
  if (sharedSocket?.readyState === WebSocket.CONNECTING) return "connecting";
  return socketState;
}

export function subscribeRunnerChatSocketState(onChange: () => void): () => void {
  stateListeners.add(onChange);
  return () => stateListeners.delete(onChange);
}

export function subscribeRunnerChatSocketOpen(onOpen: () => void): () => void {
  openListeners.add(onOpen);
  if (getRunnerChatSocketState() === "open") {
    onOpen();
  }
  return () => openListeners.delete(onOpen);
}

function dispatchMessage(raw: string) {
  try {
    const payload = JSON.parse(raw) as {
      type?: string;
      data?: ChatInboxMessageVO;
    };
    if (payload.type === "human_reply" && payload.data?.text?.trim()) {
      listeners.forEach((fn) => fn(payload.data!));
    }
  } catch {
    /* ignore */
  }
}

function cancelIdleClose() {
  if (idleCloseTimer) {
    clearTimeout(idleCloseTimer);
    idleCloseTimer = undefined;
  }
}

function scheduleIdleClose() {
  cancelIdleClose();
  if (listeners.size > 0) return;
  idleCloseTimer = setTimeout(() => {
    idleCloseTimer = undefined;
    if (listeners.size === 0) {
      teardownSocket();
    }
  }, IDLE_CLOSE_DELAY_MS);
}

function teardownSocket() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = undefined;
  }
  const ws = sharedSocket;
  sharedSocket = null;
  sharedUrl = null;
  if (ws) {
    ws.onopen = null;
    ws.onclose = null;
    ws.onmessage = null;
    ws.onerror = null;
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      try {
        ws.close();
      } catch {
        /* ignore */
      }
    }
  }
  setSocketState("closed");
}

function scheduleReconnect() {
  if (reconnectTimer || listeners.size === 0) return;
  const delay = Math.min(RECONNECT_MAX_MS, RECONNECT_BASE_MS * 2 ** reconnectAttempt);
  reconnectAttempt += 1;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = undefined;
    if (listeners.size > 0) ensureRunnerChatSocket();
  }, delay);
}

function ensureRunnerChatSocket() {
  cancelIdleClose();
  const url = buildRunnerChatWebSocketUrl();
  if (!url || listeners.size === 0) return;

  if (sharedSocket && sharedUrl === url) {
    const rs = sharedSocket.readyState;
    if (rs === WebSocket.OPEN || rs === WebSocket.CONNECTING) {
      return;
    }
  }

  teardownSocket();

  const serial = ++connectSerial;
  sharedUrl = url;
  setSocketState("connecting");

  let ws: WebSocket;
  try {
    ws = new WebSocket(url);
  } catch {
    setSocketState("closed");
    scheduleReconnect();
    return;
  }
  sharedSocket = ws;

  ws.onopen = () => {
    if (serial !== connectSerial || sharedSocket !== ws) return;
    reconnectAttempt = 0;
    setSocketState("open");
    openListeners.forEach((fn) => fn());
  };
  ws.onmessage = (ev) => {
    if (sharedSocket === ws) dispatchMessage(String(ev.data));
  };
  ws.onclose = () => {
    if (sharedSocket === ws) {
      sharedSocket = null;
      sharedUrl = null;
    }
    if (serial !== connectSerial) return;
    setSocketState("closed");
    if (listeners.size > 0) {
      scheduleReconnect();
    }
  };
  ws.onerror = () => {
    if (serial !== connectSerial) return;
    setSocketState("closed");
  };
}

/**
 * 订阅人工回复 WebSocket（进程内单例；勿在依赖 ws 状态的 effect 里反复 subscribe/unsubscribe）。
 */
export function subscribeRunnerChatHumanReply(onHumanReply: HumanReplyHandler): () => void {
  listeners.add(onHumanReply);
  reconnectAttempt = 0;
  ensureRunnerChatSocket();
  return () => {
    listeners.delete(onHumanReply);
    if (listeners.size === 0) {
      scheduleIdleClose();
    }
  };
}
