import { useEffect, useState } from "react";

import { SheetModal } from "@/components/modals/SheetModal";
import { ApiError } from "@/lib/api-client";
import { getStoredIdentity } from "@/lib/runner-identity";

interface Props {
  open: boolean;
  eventGuid: string;
  eventName: string;
  onClose: () => void;
  onVerified: (bibNumber: string, idCardSuffix: string) => Promise<void>;
}

export function IdentityVerifySheet({
  open,
  eventGuid,
  eventName,
  onClose,
  onVerified,
}: Props) {
  const [bib, setBib] = useState("");
  const [suffix, setSuffix] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const stored = getStoredIdentity(eventGuid);
    setBib(stored?.bibNumber ?? "");
    setSuffix("");
    setError(null);
    setSubmitting(false);
  }, [open, eventGuid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const bibTrim = bib.trim();
    const suffixTrim = suffix.trim();
    if (!bibTrim) {
      setError("请输入参赛号码");
      return;
    }
    if (!/^\d{6}$/.test(suffixTrim)) {
      setError("请输入身份证后 6 位数字");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onVerified(bibTrim, suffixTrim);
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "验证失败，请稍后重试",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SheetModal open={open} title="选手身份验证" onClose={onClose}>
      <p className="text-sm text-secondary leading-relaxed mb-4">
        验证 <span className="font-semibold text-ink">{eventName}</span>{" "}
        参赛身份，解锁 SOS 紧急求助与个人参赛信息。信息仅保存在本设备。
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-xs font-semibold text-ink">参赛号码</span>
          <input
            type="text"
            inputMode="text"
            autoComplete="off"
            placeholder="如 A10234"
            value={bib}
            onChange={(ev) => setBib(ev.target.value)}
            className="mt-1.5 w-full rounded-xl border border-secondary-border px-3 py-3 text-base text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-ink">身份证后 6 位</span>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            autoComplete="off"
            placeholder="6 位数字"
            value={suffix}
            onChange={(ev) => setSuffix(ev.target.value.replace(/\D/g, "").slice(0, 6))}
            className="mt-1.5 w-full rounded-xl border border-secondary-border px-3 py-3 text-base text-ink tracking-widest outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        {error && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 rounded-xl text-white font-bold text-base bg-primary active:opacity-90 disabled:opacity-60"
        >
          {submitting ? "验证中…" : "确认验证"}
        </button>
      </form>
      <p className="text-2xs text-secondary mt-4 leading-relaxed">
        与报名时登记的身份证号后 6 位一致方可通过。如有问题请联系赛事组委会。
      </p>
    </SheetModal>
  );
}
