function pickRecordMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") {
    return undefined;
  }
  const candidates = [
    "audio/mp4",
    "audio/aac",
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
  ];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t));
}

/** 是否可在当前环境使用麦克风 + MediaRecorder（需 HTTPS 或 localhost） */
export function isVoiceInputSupported(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  if (!window.isSecureContext) {
    return false;
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    return false;
  }
  if (typeof MediaRecorder === "undefined") {
    return false;
  }
  if (!pickRecordMimeType()) {
    return false;
  }
  return true;
}

export function voiceUnsupportedHint(): string {
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return "语音输入需使用 HTTPS 访问（或本机 localhost）";
  }
  return "当前浏览器不支持语音，请使用文字输入";
}
