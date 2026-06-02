import { useEffect, useRef, useState } from "react";

import { fetchProfile, mergeProfile } from "@/api/runner-api";
import { SheetModal } from "@/components/modals/SheetModal";
import type { RunnerProfile } from "@/types";

interface Props {
  open: boolean;
  runner: RunnerProfile;
  apiConnected: boolean;
  onClose: () => void;
  onRunnerUpdate?: (runner: RunnerProfile) => void;
}

export function RunnerInfoSheet({
  open,
  runner,
  apiConnected,
  onClose,
  onRunnerUpdate,
}: Props) {
  const [data, setData] = useState(runner);
  const [loading, setLoading] = useState(false);
  const wasOpenRef = useRef(false);
  const onRunnerUpdateRef = useRef(onRunnerUpdate);
  onRunnerUpdateRef.current = onRunnerUpdate;

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      setLoading(false);
      return;
    }

    setData(runner);

    const justOpened = !wasOpenRef.current;
    wasOpenRef.current = true;

    if (!apiConnected || !justOpened) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    const base = runner;

    fetchProfile()
      .then((p) => {
        if (cancelled) return;
        const merged = mergeProfile(base, p);
        setData(merged);
        onRunnerUpdateRef.current?.(merged);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, apiConnected, runner]);

  const rows = [
    ["参赛号", data.bib],
    ["分区", data.zone],
    ["领物窗口", data.pickupWindow],
    ["检录截止", `${data.zone} ${data.checkInBefore} 前`],
    ["血型", data.bloodType],
    ["紧急联系人", data.emergencyContact],
    ["联系电话", data.emergencyPhone],
  ];

  return (
    <SheetModal open={open} title="我的参赛信息" onClose={onClose}>
      <p
        className={`text-2xs text-secondary mb-2 min-h-[1.125rem] ${loading ? "visible" : "invisible"}`}
        aria-live="polite"
      >
        正在从服务器同步…
      </p>
      <div className="rounded-xl bg-primary-surface border border-primary/20 p-4 mb-4">
        <p className="text-2xs text-secondary">选手</p>
        <p className="text-2xl font-black text-primary-deeper">{data.name}</p>
        <p className="text-3xl font-black mt-1 tracking-wider">{data.bib}</p>
      </div>
      <dl className="space-y-3">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between text-sm border-b border-slate-50 pb-2">
            <dt className="text-slate-500">{k}</dt>
            <dd className="font-semibold text-slate-900 text-right max-w-[60%]">{v}</dd>
          </div>
        ))}
      </dl>
    </SheetModal>
  );
}
