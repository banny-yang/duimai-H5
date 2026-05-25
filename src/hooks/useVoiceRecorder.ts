import { useCallback, useEffect, useRef, useState } from "react";

export type VoiceRecorderPhase = "idle" | "recording" | "denied" | "unsupported";

const MAX_MS = 60_000;
const MIN_MS = 500;

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    "audio/mp4",
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

  useEffect(() => () => cleanupStream(), [cleanupStream]);

  const start = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setPhase("unsupported");
      return false;
    }
    if (typeof MediaRecorder === "undefined") {
      setPhase("unsupported");
      return false;
    }

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

      recorder.start(200);
      startedAtRef.current = Date.now();
      setElapsedMs(0);
      setPhase("recording");
      timerRef.current = setInterval(() => {
        const ms = Date.now() - startedAtRef.current;
        setElapsedMs(ms);
        if (ms >= MAX_MS && recorder.state === "recording") {
          try {
            recorder.stop();
          } catch {
            /* ignore */
          }
        }
      }, 100);
      return true;
    } catch {
      cleanupStream();
      setPhase("denied");
      return false;
    }
  }, [cleanupStream]);

  const finalizeBlob = useCallback(
    (recorder: MediaRecorder, duration: number): Blob | null => {
      const mime = recorder.mimeType || chunksRef.current[0]?.type || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: mime });
      cleanupStream();
      setPhase("idle");
      if (duration < MIN_MS || blob.size < 100) {
        return null;
      }
      return blob;
    },
    [cleanupStream],
  );

  const stop = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder) {
        cleanupStream();
        setPhase("idle");
        resolve(null);
        return;
      }

      const duration = Date.now() - startedAtRef.current;

      if (recorder.state === "inactive") {
        resolve(finalizeBlob(recorder, duration));
        return;
      }

      recorder.onstop = () => {
        resolve(finalizeBlob(recorder, duration));
      };

      try {
        recorder.stop();
      } catch {
        cleanupStream();
        setPhase("idle");
        resolve(null);
      }
    });
  }, [cleanupStream, finalizeBlob]);

  const cancel = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = null;
      try {
        recorder.stop();
      } catch {
        /* ignore */
      }
    }
    cleanupStream();
    setPhase("idle");
  }, [cleanupStream]);

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
