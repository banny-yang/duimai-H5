import { useSyncExternalStore } from "react";

import {
  getRunnerChatSocketState,
  subscribeRunnerChatSocketState,
  type RunnerChatSocketState,
} from "@/lib/runner-chat-ws";

export function useRunnerChatSocketState(): RunnerChatSocketState {
  return useSyncExternalStore(
    subscribeRunnerChatSocketState,
    getRunnerChatSocketState,
    () => "closed" as RunnerChatSocketState,
  );
}
