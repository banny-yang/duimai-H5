import type { ChatHistoryMessageVO } from "@/api/runner-api";
import type { ChatMessage } from "@/types";

export function mapHistoryToChatMessages(items: ChatHistoryMessageVO[]): ChatMessage[] {
  const out: ChatMessage[] = [];
  for (const m of items) {
    const text = m.text?.trim();
    if (!text) continue;

    const createdAt = m.createdAt ?? Date.now();
    const id = m.id ? `hist-${m.id}` : `hist-${createdAt}-${out.length}`;

    if (m.role === "user") {
      const isVoice =
        m.inputSource === "voice" ||
        (m.voiceDurationMs != null && m.voiceDurationMs > 0);
      if (isVoice) {
        out.push({
          id,
          role: "user",
          text,
          inputSource: "voice",
          audioDurationMs: m.voiceDurationMs ?? 0,
          voiceStatus: "done",
          voicePlaybackDisabled: true,
          createdAt,
        });
      } else {
        out.push({ id, role: "user", text, createdAt });
      }
      continue;
    }

    if (m.role === "staff") {
      out.push({ id, role: "staff", text, createdAt });
      continue;
    }

    out.push({ id, role: "assistant", text, createdAt });
  }
  return out;
}
