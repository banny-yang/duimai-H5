import { useEffect, useState } from "react";
import { SheetModal } from "@/components/modals/SheetModal";
import { fetchEventShuttleConfig } from "@/api/runner-api";
import { isPickupVisible } from "@/lib/shuttle-utils";
import type { RunnerProfile } from "@/types";
import type { EventShuttleConfig, PickupGuide } from "@/types/shuttle";

interface Props {
  open: boolean;
  eventGuid: string;
  runner: RunnerProfile;
  onClose: () => void;
  onViewMap?: () => void;
}

const defaultPickup = (): PickupGuide => ({
  enabled: true,
  title: "领物须知",
  location: "",
  hours: "",
  items: [],
  mapHint: "",
});

export function PickupGuideSheet({ open, eventGuid, runner, onClose, onViewMap }: Props) {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<EventShuttleConfig | null>(null);

  useEffect(() => {
    if (!open || !eventGuid) return;
    let cancelled = false;
    setLoading(true);
    fetchEventShuttleConfig(eventGuid)
      .then((data) => {
        if (!cancelled) setConfig(data);
      })
      .catch(() => {
        if (!cancelled) setConfig(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, eventGuid]);

  const g = config?.pickup ?? defaultPickup();
  const visible = isPickupVisible(config);

  return (
    <SheetModal open={open} title={g.title || "领物须知"} onClose={onClose}>
      {loading && (
        <p className="text-xs text-slate-400 text-center py-8">加载领物须知…</p>
      )}

      {!loading && !visible && (
        <p className="text-xs text-slate-500 text-center py-8">
          组委会暂未发布领物指引，请留意赛事官方通知或咨询现场工作人员。
        </p>
      )}

      {!loading && visible && (
        <>
          <div className="rounded-xl border border-primary/20 bg-primary-surface px-3 py-3 mb-4">
            <p className="text-sm font-bold text-ink">{runner.name}</p>
            <p className="text-lg font-black text-primary-deeper mt-0.5">{runner.bib}</p>
            {g.location?.trim() && (
              <p className="text-xs text-secondary mt-1">{g.location}</p>
            )}
            {g.hours?.trim() && (
              <p className="text-2xs text-primary-dark font-semibold mt-1">{g.hours}</p>
            )}
            {runner.pickupWindow?.trim() && (
              <p className="text-2xs text-slate-600 mt-1">
                领物窗口：{runner.pickupWindow}
              </p>
            )}
          </div>
          {g.items.length > 0 && (
            <ul className="space-y-2.5 mb-4">
              {g.items.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-ink/80 leading-snug">
                  <span className="text-primary shrink-0">·</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
          {g.mapHint?.trim() && (
            <p className="text-xs text-slate-500 mb-4">{g.mapHint}</p>
          )}
          {onViewMap && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onViewMap();
              }}
              className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm active:bg-primary-dark shadow-primary-sm"
            >
              查看领物点位置（赛道地图）
            </button>
          )}
        </>
      )}
    </SheetModal>
  );
}
