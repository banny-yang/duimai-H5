import type { EventShuttleConfig } from "@/types/shuttle";

/** 与主办方控制台示例数据一致，供本地演示或联调参考 */
export function shuttleExampleConfig(): EventShuttleConfig {
  return {
    enabled: true,
    summary:
      "组委会提供赛前领物、起点分区摆渡与赛后返程大巴；请凭参赛号或完赛奖牌乘车，具体以现场指引为准。",
    items: [
      {
        id: "shuttle-pickup",
        title: "参赛包物资发放",
        detail:
          "天府广场东侧「赛事服务中心」，凭参赛号与身份证件领取参赛服、号码布、计时芯片及参赛包。",
        time: "赛前一日 09:00–20:00 · 比赛日 05:30–07:00",
        phase: "pre",
        sortOrder: 0,
      },
      {
        id: "shuttle-start-bus",
        title: "起点分区摆渡车",
        detail:
          "地铁世纪城站 D 口 → 全程马拉松 A 区集结区；半程选手请乘坐半程专线至 B 区。人满即走。",
        time: "比赛日 05:00–06:30",
        phase: "pre",
        sortOrder: 1,
      },
      {
        id: "shuttle-family",
        title: "家属观赛接驳",
        detail: "家属专线：春熙路地铁站 C 口 → 起点观赛区，需提前在官方小程序预约座位。",
        time: "比赛日 05:30–06:30",
        phase: "pre",
        sortOrder: 2,
      },
      {
        id: "shuttle-finish",
        title: "赛后返程大巴",
        detail:
          "完赛选手请前往终点区 P3 停车场「返程大巴候车区」，凭完赛奖牌或参赛号免费乘车至地铁世纪城站。",
        time: "赛后 11:30 起每 15 分钟一班，末班 16:00",
        phase: "post",
        sortOrder: 3,
      },
      {
        id: "shuttle-bag",
        title: "完赛包领取",
        detail: "完赛包领取点位于终点广场西侧，请按号码布分区排队，支持代领需出示委托书。",
        time: "赛后 10:00–18:00",
        phase: "post",
        sortOrder: 4,
      },
    ],
    pickup: {
      enabled: true,
      title: "官方领物单",
      location: "天府广场东侧 · 赛事服务中心（近 1 号门）",
      hours: "赛前一日 09:00–20:00 · 比赛日 05:30–07:00",
      items: [
        "请携带身份证件原件与报名确认短信（或参赛号查询页面截图）",
        "领取：参赛服、号码布、计时芯片、参赛包、参赛手册",
        "建议按短信/小程序提示的分区窗口排队，避开 18:00 高峰",
        "贵重物品请自行保管，现场提供简易寄存（数量有限）",
      ],
      mapHint: "地铁天府广场站 B 口出站，沿「2026 成都马拉松」引导标识步行约 3 分钟",
    },
  };
}
