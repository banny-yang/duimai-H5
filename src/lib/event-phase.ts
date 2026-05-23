import type { H5QuickQuestions } from "@/api/runner-api";
import { POST_PROMPTS, PRE_PROMPTS, RACE_PROMPTS } from "@/constants/chat-prompts";

/** 赛前 / 赛中 / 赛后（由当前日期与赛事日期推导） */
export type H5Phase = "pre" | "race" | "post";

export interface ResolveH5PhaseInput {
  /** 赛事日期 yyyy-MM-dd */
  eventDate?: string | null;
  eventStatus?: string | null;
  /** 后端 phase 字段（无赛事日期时的兜底） */
  apiPhase?: string | null;
  /** 开发调试 ?phase=pre|race|post，优先于日期计算 */
  phaseOverride?: H5Phase | null;
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function parseEventDate(iso?: string | null): Date | null {
  if (!iso?.trim()) return null;
  const d = new Date(`${iso.trim()}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * 根据当前日期与赛事日期判断赛段：
 * - 今天早于赛事日 → 赛前
 * - 今天等于赛事日 → 赛中
 * - 今天晚于赛事日，或 status=finished → 赛后
 */
export function resolveH5Phase(input: ResolveH5PhaseInput): H5Phase {
  if (input.phaseOverride) {
    return input.phaseOverride;
  }
  if (input.eventStatus === "finished") {
    return "post";
  }
  const raceDay = parseEventDate(input.eventDate);
  if (raceDay) {
    const today = startOfLocalDay(new Date());
    const race = startOfLocalDay(raceDay);
    if (today.getTime() < race.getTime()) return "pre";
    if (today.getTime() === race.getTime()) return "race";
    return "post";
  }
  if (input.apiPhase === "race") return "race";
  if (input.apiPhase === "post") return "post";
  return "pre";
}

export function readPhaseOverride(): H5Phase | undefined {
  const p = new URLSearchParams(window.location.search).get("phase")?.trim();
  if (p === "race" || p === "pre" || p === "post") return p;
  return undefined;
}

/** 按赛段选取主办配置的常用问题 */
export function resolveQuickPrompts(
  phase: H5Phase,
  fromApi?: H5QuickQuestions | null,
): string[] {
  const pick = (custom?: string[], fallback?: string[]) => {
    const list = custom?.filter(Boolean) ?? [];
    return list.length > 0 ? list : (fallback ?? []);
  };
  if (phase === "post") return pick(fromApi?.post, POST_PROMPTS);
  if (phase === "race") return pick(fromApi?.race, RACE_PROMPTS);
  return pick(fromApi?.pre, PRE_PROMPTS);
}

export function phaseLabel(phase: H5Phase): string {
  if (phase === "race") return "赛中";
  if (phase === "post") return "赛后";
  return "赛前";
}
