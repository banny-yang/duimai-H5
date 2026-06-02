import { formatChatSessionTime } from "@/lib/chatTime";

interface Props {
  at: Date;
  label?: string;
}

/** 对话区时间锚点（居中胶囊） */
export function ChatSessionTime({ at, label = "最近更新" }: Props) {
  return (
    <div className="flex justify-center bg-[var(--chat-bg)] py-2">
      <span className="session-time-pill tabular-nums">
        {label} · {formatChatSessionTime(at)}
      </span>
    </div>
  );
}
