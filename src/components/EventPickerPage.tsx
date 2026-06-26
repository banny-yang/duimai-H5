import { useEffect, useMemo, useState } from "react";

import {
  fetchSelectableEvents,
  navigateToEvent,
  parseEventGuidFromText,
  type RunnerEventListItem,
} from "@/api/runner-api";
import { ApiError } from "@/lib/api-client";

const FEATURES = [
  {
    icon: "🎙️",
    iconBg: "bg-blue-50",
    title: "毫秒级高风噪语音网关",
    desc: "针对山地风噪与高喘息环境深度优化，多 Key 轮询保障万人并发下语音转写稳定可达。",
  },
  {
    icon: "📊",
    iconBg: "bg-emerald-50",
    title: "实时热点舆情雷达大屏",
    desc: "基于 Redis 高并发聚类算法，5 分钟滑动窗口内自动提炼断水、物资紧缺等赛道群体性痛点。",
  },
  {
    icon: "🚨",
    iconBg: "bg-orange-50",
    title: "高危安全护栏与秒级响应",
    desc: "内置医疗救援（MEDICAL）与极端情绪（ANGRY）拦截机制，秒级拉响 WebSocket 弹窗警报。",
  },
] as const;

function formatDate(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function EventPickerPage() {
  const [items, setItems] = useState<RunnerEventListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

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

  const trimmedQuery = query.trim();
  const showSuggest = searchFocused && trimmedQuery.length > 0;

  const suggestions = useMemo(() => {
    if (!trimmedQuery) return [];
    const q = trimmedQuery.toLowerCase();
    return items.filter((ev) => ev.eventName.toLowerCase().includes(q)).slice(0, 8);
  }, [items, trimmedQuery]);

  const goEvent = (guid: string) => {
    setSearchFocused(false);
    setQuery("");
    navigateToEvent(guid);
  };

  const handleConnect = () => {
    if (suggestions.length === 1) {
      goEvent(suggestions[0].eventGuid);
      return;
    }
    if (suggestions.length > 1) {
      setSearchFocused(true);
      return;
    }
    const guid = parseEventGuidFromText(trimmedQuery);
    if (guid) {
      goEvent(guid);
      return;
    }
    window.alert("未找到匹配赛事，请从联想列表选择或扫描现场二维码");
  };

  const handleScan = () => {
    const raw = window.prompt(
      "粘贴赛事二维码链接，或扫描后填入结果文本",
      "",
    );
    if (!raw) return;
    const guid = parseEventGuidFromText(raw);
    if (!guid) {
      window.alert("未能识别赛事链接，请确认二维码内容");
      return;
    }
    goEvent(guid);
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-slate-50">
      {/* 1. Hero */}
      <section className="shrink-0 bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))] text-white">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/30 bg-white/10 text-xs font-extrabold tracking-tight backdrop-blur-md"
            aria-hidden
          >
            DM
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold leading-tight">对麦智能</p>
            <p className="mt-0.5 text-[10px] font-medium tracking-wide text-blue-200/90">
              DUIMAI AI · 赛事数据审计网关
            </p>
          </div>
        </div>

        <div className="mx-auto mt-6 max-w-lg">
          <h1 className="text-[1.35rem] font-extrabold leading-snug tracking-tight sm:text-2xl">
            面向万人大型赛事的{" "}
            <span className="bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent">
              全链路 AI 语音交互系统
            </span>
          </h1>
          <p className="mt-3 text-xs leading-relaxed text-blue-100/85 sm:text-sm">
            高性能多 Key 轮询与大模型网关，串联选手端语音问答、舆情雷达与 SOS
            安全熔断，保障赛道安全生命线。
          </p>
        </div>
      </section>

      {/* 2. Feature matrix */}
      <main className="flex-1 overflow-y-auto px-4 pb-52 pt-5">
        <div className="mx-auto flex max-w-lg flex-col gap-3">
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_4px_24px_rgba(15,23,42,0.06)]"
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${f.iconBg}`}
                aria-hidden
              >
                {f.icon}
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-ink">{f.title}</h2>
                <p className="mt-1 text-xs leading-relaxed text-secondary">
                  {f.desc}
                </p>
              </div>
            </article>
          ))}

          {loading && (
            <div className="flex flex-col items-center py-8 text-secondary">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <p className="mt-2 text-xs">正在同步已上线赛事…</p>
            </div>
          )}

          {!loading && error && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {error}
            </p>
          )}
        </div>
      </main>

      {/* 3. Bottom gateway */}
      <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-100 bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_32px_rgba(15,23,42,0.08)]">
        <div className="relative mx-auto max-w-lg">
          {showSuggest && (
            <div
              className="absolute bottom-14 left-0 right-0 z-50 max-h-52 overflow-y-auto rounded-2xl border border-slate-200 bg-white py-1 shadow-xl"
              role="listbox"
            >
              {suggestions.length > 0 ? (
                suggestions.map((ev) => (
                  <button
                    key={ev.eventGuid}
                    type="button"
                    role="option"
                    className="flex w-full items-center justify-between gap-2 px-3.5 py-3 text-left active:bg-slate-50"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => goEvent(ev.eventGuid)}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">
                        {ev.eventName}
                      </p>
                      {formatDate(ev.eventDate) && (
                        <p className="mt-0.5 truncate text-xs text-secondary">
                          {formatDate(ev.eventDate)}
                          {ev.location ? ` · ${ev.location}` : ""}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                      点击直达
                    </span>
                  </button>
                ))
              ) : (
                <p className="px-3.5 py-4 text-center text-xs leading-relaxed text-secondary">
                  未找到「{trimmedQuery}」相关赛事
                  <br />
                  请检查名称，或扫描现场二维码进入
                </p>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
            <span className="text-base text-secondary" aria-hidden>
              🔍
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => {
                window.setTimeout(() => setSearchFocused(false), 150);
              }}
              placeholder="输入赛事名称（如：无锡）"
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-slate-400"
              enterKeyHint="search"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConnect();
              }}
            />
            <button
              type="button"
              onClick={handleConnect}
              className="shrink-0 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm active:bg-blue-700"
            >
              连线
            </button>
          </div>

          <button
            type="button"
            onClick={handleScan}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white py-3 text-sm font-medium text-slate-600 active:bg-slate-50"
          >
            <span aria-hidden>📷</span>
            扫描赛道现场专属二维码直达
          </button>
        </div>
      </footer>
    </div>
  );
}
