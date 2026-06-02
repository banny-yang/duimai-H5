import { AiAvatar } from "@/components/AiAvatar";
import { FormattedChatText } from "@/lib/format-chat-markdown";
import type { RunnerProfile } from "@/types";

interface Props {
  runner: RunnerProfile;
  /** 后端返回的问候语，优先展示 */
  greeting?: string;
}

export function GreetingMessage({ runner, greeting }: Props) {
  const hasProfile = Boolean(runner?.name?.trim() && runner?.bib?.trim());
  const bibNum = runner?.bib?.replace(/^[A-Z]/i, "") ?? "";

  return (
    <div className="chat-row-assistant">
      <div className="max-w-[88%]">
        <div className="mb-1 flex items-center gap-1.5 px-0.5 text-2xs font-medium text-secondary">
          <AiAvatar />
          对麦智能
        </div>
        <div className="ai-bubble rounded-2xl rounded-bl-md px-3.5 py-3 text-[15px] font-medium text-ink">
          {greeting ? (
            <FormattedChatText text={greeting} />
          ) : hasProfile ? (
            <>
              Hi <span className="font-bold text-primary-dark">{runner!.name}</span>，你是{" "}
              <span className="font-bold text-primary">
                {runner!.zone} {bibNum} 号
              </span>
              选手，请于 <span className="font-bold text-primary">{runner!.checkInBefore}</span> 前到达{" "}
              <span className="font-bold text-primary-dark">{runner!.zone}</span> 检录。
            </>
          ) : (
            <>
              你好，我是 <span className="font-bold text-primary-dark">对麦赛事助手</span>
              。完赛后可问我领物、补给、交通等问题；验证参赛身份后可查看个人参赛信息。
            </>
          )}
        </div>
      </div>
    </div>
  );
}
