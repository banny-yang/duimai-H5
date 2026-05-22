import { BibPickupCard } from "@/components/cards/BibPickupCard";
import { SupplyStationCard } from "@/components/cards/SupplyStationCard";
import { AiAvatar } from "@/components/AiAvatar";
import { GreetingMessage } from "@/components/GreetingMessage";
import { useTypewriter } from "@/hooks/useTypewriter";
import { FormattedChatText } from "@/lib/format-chat-markdown";
import type { ChatMessage, RunnerProfile } from "@/types";

interface Props {
  message: ChatMessage;
  runner?: RunnerProfile;
  greeting?: string;
}

export function ChatMessageItem({ message, runner, greeting }: Props) {
  const isUser = message.role === "user";
  const streamText = useTypewriter(message.text ?? "", !!message.streaming);

  if (message.id === "greet" && runner) {
    return <GreetingMessage runner={runner} greeting={greeting} />;
  }

  if (isUser) {
    return (
      <div className="flex justify-end px-3 pr-14">
        <div className="user-bubble max-w-[85%] rounded-2xl rounded-br-md px-3.5 py-2.5 text-[15px] text-white font-medium">
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start px-3 pr-14">
      <div className="max-w-[92%] space-y-2">
        <div className="flex items-center gap-1.5 text-2xs text-secondary px-1">
          <AiAvatar />
          对麦智能
        </div>
        {message.cardType === "supply" && message.supply && (
          <SupplyStationCard data={message.supply} />
        )}
        {message.cardType === "bib" && message.bib && <BibPickupCard data={message.bib} />}
        {message.text && (
          <div className="ai-bubble rounded-2xl rounded-bl-md px-3.5 py-2.5 text-[15px] text-ink font-medium">
            <FormattedChatText text={message.streaming ? streamText : message.text} />
            {message.streaming && streamText.length < (message.text?.length ?? 0) && (
              <span className="inline-block w-1.5 h-4 ml-0.5 bg-primary animate-pulse align-middle" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
