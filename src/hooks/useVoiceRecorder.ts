import { useCallback, useEffect, useRef, useState } from "react";
import { isVoiceInputSupported } from "@/lib/voice-capability";
import { VOICE_MAX_DURATION_MS, VOICE_MIN_RECORD_MS } from "@/lib/voice-message";

export type VoiceRecorderPhase = "idle" | "recording" | "denied" | "unsupported";

const MAX_MS = VOICE_MAX_DURATION_MS;
const MIN_MS = VOICE_MIN_RECORD_MS;
const STOP_TIMEOUT_MS = 2_000;

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    "audio/mp4",
    "audio/aac",
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
  ];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t));
}

export function useVoiceRecorder() {
  const [phase, setPhase] = useState<VoiceRecorderPhase>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);

  const cleanupStream = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
    setElapsedMs(0);
  }, []);

  const forceIdle = useCallback(() => {
    cleanupStream();
    setPhase("idle");
  }, [cleanupStream]);

  useEffect(() => () => forceIdle(), [forceIdle]);

  const start = useCallback(async () => {
    if (!isVoiceInputSupported()) {
      setPhase("unsupported");
      return false;
    }

    forceIdle();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mime = pickMimeType();
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onerror = () => {
        forceIdle();
      };

      recorder.start(200);
      startedAtRef.current = Date.now();
      setElapsedMs(0);
      setPhase("recording");
      timerRef.current = setInterval(() => {
        const r = recorderRef.current;
        if (!r) return;
        const ms = Math.min(Date.now() - startedAtRef.current, MAX_MS);
        setElapsedMs(ms);
        if (ms >= MAX_MS && r.state === "recording") {
          try {
            if (typeof r.requestData === "function") r.requestData();
            r.stop();
          } catch {
            forceIdle();
          }
        }
      }, 100);
      return true;
    } catch {
      forceIdle();
      setPhase("denied");
      return false;
    }
  }, [forceIdle]);

  const buildBlob = useCallback((recorder: MediaRecorder, duration: number): Blob | null => {
    const mime = recorder.mimeType || chunksRef.current[0]?.type || "audio/webm";
    const blob = new Blob(chunksRef.current, { type: mime });
    if (duration < MIN_MS || blob.size < 100) {
      return null;
    }
    return blob;
  }, []);

  const stopRecorder = useCallback((recorder: MediaRecorder) => {
    try {
      if (recorder.state === "recording" && typeof recorder.requestData === "function") {
        recorder.requestData();
      }
      if (recorder.state !== "inactive") {
        recorder.stop();
      }
    } catch {
      /* force cleanup below */
    }
  }, []);

  const stop = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder) {
        forceIdle();
        resolve(null);
        return;
      }

      const duration = Math.min(Date.now() - startedAtRef.current, MAX_MS);
      let settled = false;

      const finish = (blob: Blob | null) => {
        if (settled) return;
        settled = true;
        forceIdle();
        resolve(blob);
      };

      const timeoutId = window.setTimeout(() => {
        const blob = buildBlob(recorder, duration);
        finish(blob);
      }, STOP_TIMEOUT_MS);

      if (recorder.state === "inactive") {
        window.clearTimeout(timeoutId);
        finish(buildBlob(recorder, duration));
        return;
      }

      recorder.onstop = () => {
        window.clearTimeout(timeoutId);
        finish(buildBlob(recorder, duration));
      };

      stopRecorder(recorder);
    });
  }, [buildBlob, forceIdle, stopRecorder]);

  const cancel = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder) {
      recorder.onstop = null;
      stopRecorder(recorder);
    }
    forceIdle();
  }, [forceIdle, stopRecorder]);

  return {
    phase,
    elapsedMs,
    maxMs: MAX_MS,
    start,
    stop,
    cancel,
    resetDenied: () => setPhase("idle"),
  };
}
