import { useEffect, useState } from "react";

/** 模拟 SSE 流式打字效果 */
export function useTypewriter(text: string, active: boolean, msPerChar = 28) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    if (!active) {
      setDisplay(text);
      return;
    }
    setDisplay("");
    let i = 0;
    const timer = window.setInterval(() => {
      i += 1;
      setDisplay(text.slice(0, i));
      if (i >= text.length) clearInterval(timer);
    }, msPerChar);
    return () => clearInterval(timer);
  }, [text, active, msPerChar]);

  return display;
}
