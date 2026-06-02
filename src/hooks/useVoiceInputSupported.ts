import { useEffect, useState } from "react";
import { isVoiceInputSupported } from "@/lib/voice-capability";

/** 客户端挂载后再检测，避免 SSR/首屏与真实环境不一致 */
export function useVoiceInputSupported(): boolean {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(isVoiceInputSupported());
  }, []);

  return supported;
}
