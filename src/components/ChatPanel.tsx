import { useCallback, useEffect, useRef, useState } from "react";

import { ChatInput } from "@/components/ChatInput";

import { ChatMessageItem } from "@/components/ChatMessageItem";

import { ChatSessionTime } from "@/components/ChatSessionTime";

import { SuggestedPrompts } from "@/components/SuggestedPrompts";

import { sendChat } from "@/api/runner-api";

import { ApiError } from "@/lib/api-client";

import { parseAiReply } from "@/lib/parse-ai-reply";

import { mockAiReply, MOCK_STREAM_TEXT, PRE_PROMPTS, RACE_PROMPTS } from "@/mock/data";

import type { ChatMessage, RacePhase, RunnerProfile } from "@/types";



interface Props {

  phase: RacePhase;

  runner: RunnerProfile;

  greeting: string;

  apiConnected: boolean;

}



function uid() {

  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

}



function now() {

  return Date.now();

}



function initialSessionTime() {

  const d = new Date();

  d.setHours(6, 15, 0, 0);

  return d;

}



async function streamText(

  streamId: string,

  fullText: string,

  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,

) {

  for (let i = 1; i <= fullText.length; i++) {

    await new Promise((r) => setTimeout(r, 20));

    const slice = fullText.slice(0, i);

    setMessages((prev) =>

      prev.map((m) =>

        m.id === streamId ? { ...m, text: slice, streaming: i < fullText.length } : m,

      ),

    );

  }

}



export function ChatPanel({ phase, runner, greeting, apiConnected }: Props) {

  const [messages, setMessages] = useState<ChatMessage[]>([

    { id: "greet", role: "assistant", text: "", createdAt: initialSessionTime().getTime() },

  ]);

  const [sessionAt, setSessionAt] = useState(initialSessionTime);

  const [thinking, setThinking] = useState(false);

  const [chatError, setChatError] = useState<string | null>(null);

  const conversationIdRef = useRef<string | undefined>();

  const bottomRef = useRef<HTMLDivElement>(null);

  const prompts = phase === "pre" ? PRE_PROMPTS : RACE_PROMPTS;



  const touchSession = useCallback(() => {

    setSessionAt(new Date());

  }, []);



  const scrollBottom = useCallback(() => {

    bottomRef.current?.scrollIntoView({ behavior: "smooth" });

  }, []);



  useEffect(() => {

    scrollBottom();

  }, [messages, thinking, scrollBottom]);



  const appendReply = useCallback(

    async (reply: Omit<ChatMessage, "id" | "role" | "createdAt">) => {

      if (reply.cardType) {

        setMessages((prev) => [

          ...prev,

          { id: uid(), role: "assistant", ...reply, createdAt: now() },

        ]);

        touchSession();

        return;

      }



      const fullText = reply.text ?? MOCK_STREAM_TEXT;

      const streamId = uid();

      setMessages((prev) => [

        ...prev,

        { id: streamId, role: "assistant", text: "", streaming: true, createdAt: now() },

      ]);

      await streamText(streamId, fullText, setMessages);

      touchSession();

    },

    [touchSession],

  );



  const sendMessage = useCallback(

    async (text: string) => {

      if (thinking) return;

      const ts = now();

      setMessages((prev) => [...prev, { id: uid(), role: "user", text, createdAt: ts }]);

      touchSession();

      setThinking(true);

      setChatError(null);



      try {

        if (apiConnected) {

          const res = await sendChat({

            query: text,

            conversationId: conversationIdRef.current,

          });

          if (res.conversationId) conversationIdRef.current = res.conversationId;

          const answer = res.answer?.trim() || MOCK_STREAM_TEXT;

          const parsed = parseAiReply(answer, runner);

          if (!parsed.cardType && parsed.text === answer) {

            await appendReply({ text: answer });

          } else {

            await appendReply(parsed);

          }

        } else {

          await new Promise((r) => setTimeout(r, 400));

          await appendReply(mockAiReply(text));

        }

      } catch (e) {

        const msg = e instanceof ApiError ? e.message : "对话请求失败";

        setChatError(msg);

        await appendReply(mockAiReply(text));

      } finally {

        setThinking(false);

      }

    },

    [thinking, touchSession, apiConnected, runner, appendReply],

  );



  return (

    <section className="flex flex-col flex-1 min-h-0 border-t border-secondary-border bg-secondary-bg">

      <div className="px-3 py-2 flex items-center justify-between bg-white border-b border-secondary-border">

        <h2 className="text-sm font-bold text-ink">AI 赛事助手</h2>

        <span className="text-2xs text-secondary">

          {apiConnected ? "已连接后端" : "离线演示"}

        </span>

      </div>



      <div className="flex-1 overflow-y-auto min-h-[200px]">

        <ChatSessionTime at={sessionAt} />

        <div className="space-y-3 py-2">

          {messages.map((m) => (

            <ChatMessageItem

              key={m.id}

              message={m}

              runner={runner}

              greeting={m.id === "greet" ? greeting : undefined}

            />

          ))}

          {thinking && (

            <div className="px-3 pr-14 text-sm text-secondary font-medium flex items-center gap-2">

              <span className="inline-flex gap-1">

                <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />

                <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.15s]" />

                <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.3s]" />

              </span>

              对麦正在思考

            </div>

          )}

          {chatError && (

            <p className="px-3 text-2xs text-amber-600">API: {chatError}（已使用本地回复）</p>

          )}

          <div ref={bottomRef} className="h-2" />

        </div>

      </div>



      <div className="shrink-0 bg-white border-t border-secondary-border">

        <SuggestedPrompts prompts={prompts} onSelect={sendMessage} disabled={thinking} />

        <ChatInput onSend={sendMessage} disabled={thinking} />

      </div>

    </section>

  );

}


