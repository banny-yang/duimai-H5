import { useEffect, useState } from "react";

import { ChatPanel } from "@/components/ChatPanel";
import { IdentityVerifyBanner } from "@/components/identity/IdentityVerifyBanner";
import { IdentityVerifySheet } from "@/components/identity/IdentityVerifySheet";
import { NotificationBar } from "@/components/NotificationBar";
import { PhaseBadge } from "@/components/PhaseBadge";
import { PickupGuideSheet } from "@/components/modals/PickupGuideSheet";
import { RouteMapSheet } from "@/components/modals/RouteMapSheet";
import { RunnerInfoSheet } from "@/components/modals/RunnerInfoSheet";
import { ShuttleSheet } from "@/components/modals/ShuttleSheet";
import { ShortcutGrid } from "@/components/ShortcutGrid";
import { LegalSheet } from "@/components/LegalSheet";
import { SosFloatingButton } from "@/components/sos/SosFloatingButton";
import { SosFlowModal } from "@/components/sos/SosFlowModal";
import { ConnectionErrorPage } from "@/components/ConnectionErrorPage";
import { useRunnerContext } from "@/hooks/useRunnerContext";
import { t } from "@/lib/i18n";
import { applyH5BrandTheme } from "@/lib/h5-brand-theme";
import type { H5Phase, SosPayload } from "@/types";

type Sheet = "info" | "map" | "shuttle" | null;

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
    branding,
    locale,
    offlineMode,
    identityVerified,
    verifyIdentity,
  } = useRunnerContext(eventGuid);

  const displayTitle = branding?.brandTitle?.trim() || event.name;
  const headerLogo = branding?.logoUrl?.trim();
  const footerSupport = branding?.footerText?.trim();

  const [runner, setRunner] = useState(initialRunner);
  const [verifyOpen, setVerifyOpen] = useState(false);

  useEffect(() => {
    applyH5BrandTheme(branding);
  }, [branding]);

  useEffect(() => {
    setRunner(initialRunner);
  }, [initialRunner]);

  const [sheet, setSheet] = useState<Sheet>(null);
  const [pickupOpen, setPickupOpen] = useState(false);
  const [sosOpen, setSosOpen] = useState(false);
  const [sosToast, setSosToast] = useState<string | null>(null);
  const [legal, setLegal] = useState<"privacy" | "terms" | null>(null);

  const openVerify = () => setVerifyOpen(true);

  if (loading) {
    return (
      <div className="flex flex-col min-h-[100dvh] items-center justify-center bg-white px-6">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm text-secondary font-medium">{t("zh", "loadingEvent")}</p>
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
  const chatDisabledHint = offlineMode
    ? t(locale, "offlineHint")
    : !aiEnabled
      ? t(locale, "aiDisabled")
      : undefined;

  const handleShortcut = (id: string) => {
    if (id === "info" && !identityVerified) {
      openVerify();
      return;
    }
    if (id === "info") setSheet("info");
    if (id === "map") setSheet("map");
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
    else if (noticePhase === "post") setSheet("shuttle");
    else setSheet("map");
  };

  const onSosSubmitted = (_payload: SosPayload, serverMessage?: string) => {
    setSosToast(serverMessage ?? "救援请求已受理");
    window.setTimeout(() => setSosToast(null), 3000);
  };

  return (
    <div className="flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden relative bg-white">
      <header className="shrink-0 z-30 border-b border-secondary-border bg-white px-3 py-2.5 flex items-center justify-between safe-top">
        <div className="min-w-0 flex items-center gap-2">
          {headerLogo ? (
            <img src={headerLogo} alt="" className="h-8 w-8 rounded object-contain shrink-0" />
          ) : null}
          <div className="min-w-0">
            <p className="text-2xs text-secondary font-medium">
              {locale === "en" ? "Duimai Runner" : "对麦智能 · 选手助手"}
            </p>
            <p className="text-sm font-bold text-ink truncate">{displayTitle}</p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {!identityVerified && (
            <button
              type="button"
              onClick={openVerify}
              className="text-2xs font-bold text-primary px-2 py-1 rounded-full border border-primary/30 bg-primary-surface"
            >
              {t(locale, "verifyIdentity")}
            </button>
          )}
          <PhaseBadge phase={phase} />
        </div>
      </header>

      <div className="shrink-0 min-w-0 overflow-x-hidden">
        {!identityVerified && <IdentityVerifyBanner onVerify={openVerify} />}
        <NotificationBar event={event} onClick={handleNoticeClick} />
        <ShortcutGrid onSelect={handleShortcut} />
      </div>

      <ChatPanel
        phase={phase}
        runner={runner}
        greeting={greeting}
        chatEnabled={chatEnabled}
        chatDisabledHint={chatDisabledHint}
        h5QuickQuestions={h5QuickQuestions}
        inboxPollEnabled={apiConnected && identityVerified}
        historyEnabled={apiConnected && identityVerified}
      />

      <SosFloatingButton
        disabled={!identityVerified}
        onTriggered={() => setSosOpen(true)}
        onDisabledTap={openVerify}
      />
      <SosFlowModal
        open={sosOpen}
        eventGuid={eventGuid}
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
        eventGuid={eventGuid}
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
      <RouteMapSheet
        open={sheet === "map"}
        eventGuid={eventGuid}
        runnerCategory={runner.category}
        onClose={() => setSheet(null)}
      />
      <ShuttleSheet
        open={sheet === "shuttle"}
        eventGuid={eventGuid}
        phase={phase}
        onClose={() => setSheet(null)}
      />

      {sosToast && (
        <div
          className="fixed top-16 left-1/2 -translate-x-1/2 z-[70] text-white text-sm font-semibold px-4 py-2 rounded-full shadow-alert-glow"
          style={{ background: "linear-gradient(180deg, #ff3b30, #d32f2f)" }}
        >
          {sosToast}
        </div>
      )}

      <p className="shrink-0 text-center text-2xs text-secondary py-1 safe-bottom flex flex-col items-center gap-1">
        {footerSupport ? (
          <span className="text-primary-dark font-medium">{footerSupport}</span>
        ) : null}
        {!branding?.hidePoweredBy && <span>{t(locale, "poweredBy")}</span>}
        <span className="flex justify-center gap-3 text-primary-dark/80">
          <button type="button" className="underline" onClick={() => setLegal("privacy")}>
            {locale === "en" ? "Privacy" : "隐私政策"}
          </button>
          <button type="button" className="underline" onClick={() => setLegal("terms")}>
            {locale === "en" ? "Terms" : "用户协议"}
          </button>
        </span>
      </p>
      <LegalSheet type={legal ?? "privacy"} open={legal !== null} onClose={() => setLegal(null)} />
    </div>
  );
}
