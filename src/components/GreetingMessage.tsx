import { AiAvatar } from "@/components/AiAvatar";
import { FormattedChatText } from "@/lib/format-chat-markdown";
import type { RunnerProfile } from "@/types";

interface Props {
  runner: RunnerProfile;
  /** 后端返回的问候语，优先展示 */
  greeting?: string;
}

export function GreetingMessage({ runner, greeting }: Props) {
  const bibNum = runner.bib.replace(/^[A-Z]/i, "");

  return (
    <div className="flex justify-start px-3 pr-12">
      <div className="max-w-[88%]">
        <div className="mb-1 flex items-center gap-1.5 px-0.5 text-2xs font-medium text-secondary">
          <AiAvatar />
          对麦智能
        </div>
        <div className="ai-bubble rounded-2xl rounded-bl-md px-3.5 py-3 text-[15px] font-medium text-ink">
          {greeting ? (
            <FormattedChatText text={greeting} />
          ) : (
            <>
              Hi <span className="font-bold text-primary-dark">{runner.name}</span>，你是{" "}
              <span className="font-bold text-primary">
                {runner.zone} {bibNum} 号
              </span>
              选手，请于 <span className="font-bold text-primary">{runner.checkInBefore}</span> 前到达{" "}
              <span className="font-bold text-primary-dark">{runner.zone}</span> 检录。
            </>
          )}
        </div>
      </div>
    </div>
  );
}
