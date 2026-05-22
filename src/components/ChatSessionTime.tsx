import { formatChatSessionTime } from "@/lib/chatTime";

interface Props {
  at: Date;
  label?: string;
}

/** 对话区常驻时间锚点，便于判断回答是否最新 */
export function ChatSessionTime({ at, label = "最近更新" }: Props) {
  return (
    <div className="sticky top-0 z-10 flex justify-center py-1.5 bg-secondary-bg/95 backdrop-blur-sm">
      <span className="text-2xs text-secondary font-medium tabular-nums">
        {label} · {formatChatSessionTime(at)}
      </span>
    </div>
  );
}
