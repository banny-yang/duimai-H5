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

    <div className="flex justify-start px-3 pr-14">

      <div className="max-w-[92%]">

        <div className="flex items-center gap-1.5 text-2xs text-secondary px-1 mb-1">

          <AiAvatar />

          对麦智能

        </div>

        <div className="ai-bubble rounded-2xl rounded-bl-md px-3.5 py-3 text-[15px] text-ink font-medium">

          {greeting ? (

            <FormattedChatText text={greeting} />

          ) : (

            <>

              Hi <span className="text-primary-deeper font-bold">{runner.name}</span>，你是{" "}

              <span className="text-primary font-bold">

                {runner.zone} {bibNum} 号

              </span>

              选手，请于 <span className="text-primary font-bold">{runner.checkInBefore}</span>{" "}

              前到达 <span className="text-primary-deeper font-bold">{runner.zone}</span>检录。

            </>

          )}

        </div>

      </div>

    </div>

  );

}


