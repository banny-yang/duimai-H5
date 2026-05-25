import { useEffect, useMemo, useState } from "react";
import { SheetModal } from "@/components/modals/SheetModal";
import { fetchEventShuttleConfig } from "@/api/runner-api";
import { filterShuttleItemsByPhase, isShuttleVisible } from "@/lib/shuttle-utils";
import { PHASE_LABELS } from "@/types/shuttle";
import type { H5Phase } from "@/types";
import type { EventShuttleConfig } from "@/types/shuttle";

interface Props {
  open: boolean;
  eventGuid: string;
  phase: H5Phase;
  onClose: () => void;
}

export function ShuttleSheet({ open, eventGuid, phase, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<EventShuttleConfig | null>(null);

  useEffect(() => {
    if (!open || !eventGuid) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchEventShuttleConfig(eventGuid)
      .then((data) => {
        if (!cancelled) setConfig(data);
      })
      .catch((e) => {
        if (!cancelled) {
          setConfig(null);
          setError(e instanceof Error ? e.message : "加载失败");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, eventGuid]);

  const items = useMemo(() => {
    if (!config?.items) return [];
    return filterShuttleItemsByPhase(config.items, phase);
  }, [config, phase]);

  const phaseLabel = PHASE_LABELS[phase];

  return (
    <SheetModal open={open} title="交通接驳与物资" onClose={onClose}>
      {loading && (
        <p className="text-xs text-slate-400 text-center py-8">加载接驳信息…</p>
      )}

      {!loading && error && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {!loading && !error && config && !isShuttleVisible(config) && (
        <p className="text-xs text-slate-500 text-center py-8">
          组委会暂未发布交通接驳信息，请咨询现场工作人员。
        </p>
      )}

      {!loading && !error && config && isShuttleVisible(config) && (
        <>
          {config.summary?.trim() && (
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">{config.summary}</p>
          )}
          <p className="text-2xs text-slate-400 mb-2">
            当前赛段：{phaseLabel}
            {items.length !== (config.items?.length ?? 0)
              ? ` · 显示 ${items.length} 条相关指引`
              : ""}
          </p>
          {items.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">
              当前赛段暂无接驳条目，可切换赛段或查看全部指引。
            </p>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
                >
                  <p className="text-sm font-bold text-[#1A1A1A]">{item.title}</p>
                  {item.detail?.trim() && (
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.detail}</p>
                  )}
                  {item.time?.trim() && (
                    <p className="text-2xs text-primary-dark font-semibold mt-1.5">
                      {item.time}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </SheetModal>
  );
}
