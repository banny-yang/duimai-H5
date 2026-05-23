import { useEffect, useState } from "react";

import {
  fetchSelectableEvents,
  type RunnerEventListItem,
  navigateToEvent,
} from "@/api/runner-api";
import { ApiError } from "@/lib/api-client";
import { PhaseBadge } from "@/components/PhaseBadge";
import { resolveH5Phase } from "@/lib/event-phase";

const TYPE_LABEL: Record<string, string> = {
  marathon: "马拉松",
  trail: "越野跑",
  triathlon: "铁人三项",
};

const STATUS_LABEL: Record<string, string> = {
  published: "已上线",
  finished: "已结束",
};

function formatDate(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

export function EventPickerPage() {
  const [items, setItems] = useState<RunnerEventListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await fetchSelectableEvents();
        if (!cancelled) setItems(list);
      } catch (e) {
        if (cancelled) return;
        setError(
          e instanceof ApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : "无法加载赛事列表",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-white">
      <header className="shrink-0 border-b border-secondary-border px-4 py-4 safe-top">
        <p className="text-2xs text-secondary font-medium">对麦智能 · 选手助手</p>
        <h1 className="text-lg font-bold text-ink mt-0.5">选择赛事</h1>
        <p className="text-xs text-secondary mt-1">
          仅展示平台审核通过并已上线的赛事
        </p>
      </header>

      <main className="flex-1 overflow-y-auto px-3 py-3 safe-bottom">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-9 h-9 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="mt-3 text-sm text-secondary">正在加载赛事…</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
            {error}
            <p className="text-2xs mt-2 text-amber-700">
              请确认选手端服务（8091）已启动，或稍后重试
            </p>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="rounded-xl border border-secondary-border bg-secondary-bg px-4 py-8 text-center">
            <p className="text-sm font-medium text-ink">暂无可选赛事</p>
            <p className="text-xs text-secondary mt-2">
              请先在平台完成赛事审核并上线，或联系赛事主办方
            </p>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <ul className="flex flex-col gap-2.5">
            {items.map((ev) => {
              const phase = resolveH5Phase({
                eventDate: ev.eventDate,
                eventStatus: ev.status,
                apiPhase: ev.phase,
              });
              const dateText = formatDate(ev.eventDate);
              return (
                <li key={ev.eventGuid}>
                  <button
                    type="button"
                    onClick={() => navigateToEvent(ev.eventGuid)}
                    className="w-full text-left rounded-xl border border-secondary-border bg-white px-3.5 py-3.5 active:bg-primary-surface transition-colors shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-base font-bold text-ink leading-snug pr-1">
                        {ev.eventName}
                      </p>
                      <PhaseBadge phase={phase} />
                    </div>
                    {dateText && (
                      <p className="text-xs text-secondary mt-1.5">{dateText}</p>
                    )}
                    {ev.location && (
                      <p className="text-xs text-secondary mt-0.5 truncate">
                        {ev.location}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {ev.type && TYPE_LABEL[ev.type] && (
                        <span className="text-2xs px-2 py-0.5 rounded-full bg-primary-muted text-primary-dark font-medium">
                          {TYPE_LABEL[ev.type]}
                        </span>
                      )}
                      {ev.status && (
                        <span className="text-2xs px-2 py-0.5 rounded-full bg-secondary-bg text-secondary font-medium">
                          {STATUS_LABEL[ev.status] ?? ev.status}
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <p className="shrink-0 text-center text-2xs text-slate-300 py-2 pointer-events-none">
        也可通过赛事二维码或链接直接进入
      </p>
    </div>
  );
}
