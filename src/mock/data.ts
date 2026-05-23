import type { ChatMessage, EventInfo, RunnerProfile } from "@/types";

export const MOCK_RUNNER: RunnerProfile = {
  id: "r10234",
  name: "张三",
  bib: "A10234",
  zone: "A区",
  bloodType: "O型",
  pickupWindow: "12号窗口",
  pickupCounter: "12",
  emergencyContact: "李四（配偶）",
  emergencyPhone: "138****5678",
  checkInBefore: "7:15",
};

export const MOCK_EVENT: EventInfo = {
  name: "2026成都马拉松",
  phase: "pre",
  preNotice: "距离2026成都马拉松开跑还有 14 小时，请尽快领取参赛包。",
  raceNotice:
    "突发：由于前方赛道突降暴雨，请注意脚下防滑，最近补给点在 1.5 公里后。",
  postNotice: "赛事已结束，可查询成绩、接驳与赛后服务。",
};

export const PRE_PROMPTS = [
  "我的号码布在哪个柜台领？",
  "明天几点关门？",
  "起点厕所在哪？",
];

export const RACE_PROMPTS = [
  "下个厕所在几公里？",
  "医疗点能处理擦伤吗？",
  "最近的补给点在哪？",
];

export const MOCK_GREETING =
  "Hi 张三，你是 A 区 10234 号选手，请于 7:15 前到达 A 区检录。";

/** 赛前通知条点击 · 领物须知 */
export const MOCK_PICKUP_GUIDE = {
  title: "领物须知",
  location: "天府广场东侧 · 赛事服务中心",
  hours: "赛前一日 09:00–20:00 · 比赛日 05:30–07:00",
  items: [
    "请携带身份证件原件与报名确认短信",
    "领取：参赛服、号码布、计时芯片、参赛包",
    `您的专属窗口：${MOCK_RUNNER.pickupWindow}（志愿者扫码发放）`,
    "建议提前 1 小时到达，避开高峰排队",
  ],
  mapHint: "从地铁天府广场站 B 口出站，沿引导标识步行约 3 分钟",
};

/** 模拟 AI 回复：根据关键词返回结构化卡片或文本 */
export function mockAiReply(input: string): Omit<ChatMessage, "id" | "role"> {
  const q = input.trim();
  if (/补给|水|香蕉|电解质/.test(q)) {
    return {
      cardType: "supply",
      supply: {
        stationName: "15公里核心补给站",
        distance: "450 米",
        supplies: "魔力电解质水、香蕉、盐丸",
        medical: "配备AED、除颤仪及救护车",
        navUrl: "https://uri.amap.com/navigation",
      },
    };
  }
  if (/领物|号码布|参赛包|柜台/.test(q)) {
    return {
      cardType: "bib",
      bib: {
        name: MOCK_RUNNER.name,
        bib: MOCK_RUNNER.bib,
        counter: MOCK_RUNNER.pickupWindow,
        barcode: "A10234CD2026",
      },
    };
  }
  if (/厕所|卫生间|公厕/.test(q)) {
    return {
      text: "前方约 1.2 公里（临河路补给站旁）设有移动公厕 3 处，预计步行 8 分钟可达。",
    };
  }
  if (/关门|几点结束|最晚/.test(q)) {
    return {
      text: "全马关门时间为明日 13:30，请合理安排配速。半程关门 11:00（20公里点）。",
    };
  }
  if (/医疗|擦伤|受伤/.test(q)) {
    return {
      text: "前方 2.3 公里医疗点可处理擦伤、抽筋；配备急救护士与AED，如需救援请长按右下角 SOS。",
    };
  }
  return {
    text: "已收到您的问题。赛事组委会信息正在为您查询，请稍候或点击上方快捷卡片获取常用信息。",
  };
}

export const MOCK_STREAM_TEXT =
  "根据当前赛道情况，建议您保持节奏，注意补水。如有不适请立即使用 SOS 求助。";

export const ROUTE_POINTS = [
  { km: 0, label: "起点" },
  { km: 5, label: "5K" },
  { km: 10, label: "10K" },
  { km: 15, label: "15K 核心补给" },
  { km: 21, label: "半程" },
  { km: 30, label: "30K" },
  { km: 42.195, label: "终点" },
];

export const MOCK_SHUTTLE = {
  summary: "赛事组委会提供的接驳与物资领取指引（模拟数据）",
  items: [
    {
      title: "参赛包物资发放",
      detail: "天府广场东侧「赛事服务中心」，凭参赛号领取服装、号码布与计时芯片。",
      time: "今日 09:00–20:00",
    },
    {
      title: "赛后返程大巴",
      detail: "完赛选手请前往终点区 P3 停车场，凭完赛奖牌免费乘车至地铁世纪城站。",
      time: "赛后 12:00 起每 15 分钟一班",
    },
    {
      title: "家属观赛接驳",
      detail: "家属专线：春熙路地铁站 C 口 → 起点区，需提前预约。",
      time: "赛前 05:30–06:30",
    },
  ],
};

export const MOCK_RESULT = {
  finishTime: "03:42:18",
  netTime: "03:41:55",
  rankOverall: 1284,
  rankGender: 312,
  status: "已完赛",
};
