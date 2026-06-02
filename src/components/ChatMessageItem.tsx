import { BibPickupCard } from "@/components/cards/BibPickupCard";
import { SupplyStationCard } from "@/components/cards/SupplyStationCard";
import { AiAvatar } from "@/components/AiAvatar";
import { UserAvatar } from "@/components/UserAvatar";
import { GreetingMessage } from "@/components/GreetingMessage";
import { VoiceMessageBubble } from "@/components/VoiceMessageBubble";
import { isVoiceTranscribedMessage, VoiceTranscribeTag } from "@/components/VoiceTranscribeTag";
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
  const isStaff = message.role === "staff";
  const streamText = useTypewriter(message.text ?? "", !!message.streaming);

  if (message.id === "greet") {
    return <GreetingMessage runner={runner} greeting={greeting} />;
  }

  if (isUser) {
    const voiceTranscribed = isVoiceTranscribedMessage(message);
    const showVoiceBubble =
      !!message.audioUrl ||
      (voiceTranscribed && (message.audioDurationMs ?? 0) > 0) ||
      message.voiceStatus === "transcribing" ||
      message.voiceStatus === "failed";
    const showTranscribedText =
      !!message.text?.trim() && voiceTranscribed && message.voiceStatus !== "transcribing";

    if (showVoiceBubble || showTranscribedText) {
      return (
        <div className="chat-row-user">
          <div className="chat-row-user-bubbles">
            {showVoiceBubble && (
              <VoiceMessageBubble
                audioUrl={message.audioUrl}
                durationMs={message.audioDurationMs ?? 0}
                transcribing={message.voiceStatus === "transcribing"}
                failed={message.voiceStatus === "failed"}
                playbackDisabled={message.voicePlaybackDisabled}
              />
            )}
            {showTranscribedText && (
              <div className="user-bubble rounded-2xl rounded-br-md px-3.5 py-2.5 text-[15px] font-medium text-white">
                <VoiceTranscribeTag
                  inverted
                  durationMs={message.audioDurationMs}
                  className="mb-1.5 block"
                />
                <p className="break-words text-right leading-relaxed">{message.text}</p>
              </div>
            )}
          </div>
          <UserAvatar />
        </div>
      );
    }
    if (message.text) {
      return (
        <div className="chat-row-user">
          <div className="user-bubble chat-row-user-bubble rounded-2xl rounded-br-md px-3.5 py-2.5 text-[15px] font-medium text-white">
            <p className="break-words text-right leading-relaxed">{message.text}</p>
          </div>
          <UserAvatar />
        </div>
      );
    }
    return null;
  }

  return (
    <div className="chat-row-assistant">
      <div className="max-w-[88%] space-y-1.5">
        <div className="flex items-center gap-1.5 px-0.5 text-2xs font-medium text-secondary">
          {isStaff ? (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-800">
              人
            </span>
          ) : (
            <AiAvatar />
          )}
          {isStaff ? "赛事工作人员" : "对麦智能"}
        </div>
        {message.cardType === "supply" && message.supply && (
          <SupplyStationCard data={message.supply} />
        )}
        {message.cardType === "bib" && message.bib && <BibPickupCard data={message.bib} />}
        {message.text && (
          <div
            className={
              isStaff
                ? "rounded-2xl rounded-bl-sm border border-amber-200 bg-amber-50/90 px-3.5 py-2.5 text-[15px] font-medium text-ink shadow-sm"
                : "ai-bubble rounded-2xl rounded-bl-md px-3.5 py-2.5 text-[15px] font-medium text-ink"
            }
          >
            <FormattedChatText text={message.streaming ? streamText : message.text} />
            {message.streaming && streamText.length < (message.text?.length ?? 0) && (
              <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-primary align-middle" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
