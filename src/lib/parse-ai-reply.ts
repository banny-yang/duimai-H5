import type { ChatMessage } from "@/types";

/** 将 AI 文本解析为结构化卡片（本地增强，后端返回纯文本时仍有好体验） */
export function parseAiReply(
  input: string,
  runner: { name: string; bib: string; pickupWindow: string },
): Omit<ChatMessage, "id" | "role" | "createdAt"> {
  const q = input.trim();
  if (/补给|水|香蕉|电解质/.test(q)) {
    return {
      cardType: "supply",
      supply: {
        stationName: "15公里核心补给站",
        distance: "约 450 米",
        supplies: "饮用水、电解质、香蕉",
        medical: "配备医疗人员与AED",
        navUrl: "https://uri.amap.com/navigation",
      },
    };
  }
  if (/领物|号码布|参赛包|柜台/.test(q)) {
    return {
      cardType: "bib",
      bib: {
        name: runner.name,
        bib: runner.bib,
        counter: runner.pickupWindow,
        barcode: runner.bib.replace(/[^A-Z0-9]/gi, "") + "CD2026",
      },
    };
  }
  return { text: q };
}
