import { useEffect, useState } from "react";

import { ChatPanel } from "@/components/ChatPanel";
import { IdentityVerifyBanner } from "@/components/identity/IdentityVerifyBanner";
import { IdentityVerifySheet } from "@/components/identity/IdentityVerifySheet";
import { NotificationBar } from "@/components/NotificationBar";
import { PhaseBadge } from "@/components/PhaseBadge";
import { PickupGuideSheet } from "@/components/modals/PickupGuideSheet";
import { ResultSheet } from "@/components/modals/ResultSheet";
import { RouteMapSheet } from "@/components/modals/RouteMapSheet";
import { RunnerInfoSheet } from "@/components/modals/RunnerInfoSheet";
import { ShuttleSheet } from "@/components/modals/ShuttleSheet";
import { ShortcutGrid } from "@/components/ShortcutGrid";
import { SosFloatingButton } from "@/components/sos/SosFloatingButton";
import { SosFlowModal } from "@/components/sos/SosFlowModal";
import { ConnectionErrorPage } from "@/components/ConnectionErrorPage";
import { useRunnerContext } from "@/hooks/useRunnerContext";
import type { H5Phase, RunnerProfile, SosPayload } from "@/types";

type Sheet = "info" | "map" | "result" | "shuttle" | null;

interface Props {
  eventGuid: string;
}

export default function RunnerApp({ eventGuid }: Props) {
  const {
    runner: initialRunner,
    event,
    phase,
    greeting,
    aiEnabled,
    loading,
    error,
    apiConnected,
    h5QuickQuestions,
    identityVerified,
    verifyIdentity,
  } = useRunnerContext(eventGuid);

  const [runner, setRunner] = useState(initialRunner);
  const [verifyOpen, setVerifyOpen] = useState(false);

  useEffect(() => {
    setRunner(initialRunner);
  }, [initialRunner]);

  const [sheet, setSheet] = useState<Sheet>(null);
  const [pickupOpen, setPickupOpen] = useState(false);
  const [sosOpen, setSosOpen] = useState(false);
  const [sosToast, setSosToast] = useState<string | null>(null);

  const openVerify = () => setVerifyOpen(true);

  if (loading) {
    return (
      <div className="flex flex-col min-h-[100dvh] items-center justify-center bg-white px-6">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm text-secondary font-medium">正在加载赛事…</p>
      </div>
    );
  }

  if (!apiConnected || error) {
    return (
      <ConnectionErrorPage
        message={error ?? "无法连接选手端服务，请稍后重试"}
        eventGuid={eventGuid}
      />
    );
  }

  const chatEnabled = apiConnected && aiEnabled;
  const chatDisabledHint = !aiEnabled
    ? "赛事 AI 未配置（请检查 Dify）"
    : undefined;

  const handleShortcut = (id: string) => {
    if (id === "info" && !identityVerified) {
      openVerify();
      return;
    }
    if (id === "info") setSheet("info");
    if (id === "map") setSheet("map");
    if (id === "result") setSheet("result");
    if (id === "shuttle") setSheet("shuttle");
  };

  const handleNoticeClick = (noticePhase: H5Phase) => {
    if (event.emergencyActive) {
      return;
    }
    if (noticePhase === "pre" && !identityVerified) {
      openVerify();
      return;
    }
    if (noticePhase === "pre") setPickupOpen(true);
    else if (noticePhase === "post") setSheet("result");
    else setSheet("map");
  };

  const onSosSubmitted = (_payload: SosPayload, serverMessage?: string) => {
    setSosToast(serverMessage ?? "救援请求已受理");
    window.setTimeout(() => setSosToast(null), 3000);
  };

  return (
    <div className="flex flex-col min-h-[100dvh] relative bg-white">
      <header className="shrink-0 border-b border-secondary-border bg-white px-3 py-2.5 flex items-center justify-between safe-top">
        <div className="min-w-0">
          <p className="text-2xs text-secondary font-medium">对麦智能 · 选手助手</p>
          <p className="text-sm font-bold text-ink truncate">{event.name}</p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {!identityVerified && (
            <button
              type="button"
              onClick={openVerify}
              className="text-2xs font-bold text-primary px-2 py-1 rounded-full border border-primary/30 bg-primary-surface"
            >
              身份验证
            </button>
          )}
          <PhaseBadge phase={phase} />
        </div>
      </header>

      {!identityVerified && <IdentityVerifyBanner onVerify={openVerify} />}

      <NotificationBar event={event} onClick={handleNoticeClick} />
      <ShortcutGrid onSelect={handleShortcut} />

      <ChatPanel
        phase={phase}
        runner={runner}
        greeting={greeting}
        chatEnabled={chatEnabled}
        chatDisabledHint={chatDisabledHint}
        h5QuickQuestions={h5QuickQuestions}
      />

      <SosFloatingButton
        disabled={!identityVerified}
        onTriggered={() => setSosOpen(true)}
        onDisabledTap={openVerify}
      />
      <SosFlowModal
        open={sosOpen}
        runner={runner}
        apiConnected={apiConnected}
        onClose={() => setSosOpen(false)}
        onSubmitted={onSosSubmitted}
      />

      <IdentityVerifySheet
        open={verifyOpen}
        eventGuid={eventGuid}
        eventName={event.name}
        onClose={() => setVerifyOpen(false)}
        onVerified={verifyIdentity}
      />

      <PickupGuideSheet
        open={pickupOpen}
        runner={runner}
        onClose={() => setPickupOpen(false)}
        onViewMap={() => setSheet("map")}
      />
      <RunnerInfoSheet
        open={sheet === "info"}
        runner={runner}
        apiConnected={apiConnected}
        onClose={() => setSheet(null)}
        onRunnerUpdate={setRunner}
      />
      <RouteMapSheet open={sheet === "map"} onClose={() => setSheet(null)} />
      <ResultSheet open={sheet === "result"} onClose={() => setSheet(null)} />
      <ShuttleSheet open={sheet === "shuttle"} onClose={() => setSheet(null)} />

      {sosToast && (
        <div
          className="fixed top-16 left-1/2 -translate-x-1/2 z-[70] text-white text-sm font-semibold px-4 py-2 rounded-full shadow-alert-glow"
          style={{ background: "linear-gradient(180deg, #ff3b30, #d32f2f)" }}
        >
          {sosToast}
        </div>
      )}

      <p className="shrink-0 text-center text-2xs text-slate-300 py-1 pointer-events-none">
        已对接 · 8091 · {eventGuid.slice(0, 8)}… · ?phase=pre|race|post
      </p>
    </div>
  );
}
