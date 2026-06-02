import { useEffect, useState } from "react";

import { ChatFooter } from "@/components/ChatFooter";
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
    <div className="runner-shell relative min-h-0 overflow-hidden bg-secondary-bg">
      <header className="safe-top z-30 flex shrink-0 items-center justify-between border-b border-secondary-border bg-white px-3 py-2.5 shadow-sm">
        <div className="flex min-w-0 items-center gap-2.5">
          {headerLogo ? (
            <img
              src={headerLogo}
              alt=""
              className="h-9 w-9 shrink-0 rounded-full border border-secondary-border object-contain bg-white p-0.5"
            />
          ) : (
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: "linear-gradient(145deg, #ef4444, var(--primary))" }}
              aria-hidden
            >
              麦
            </span>
          )}
          <div className="min-w-0">
            <p className="text-2xs font-medium text-secondary">
              {locale === "en" ? "Duimai Runner" : "对麦智能 · 选手助手"}
            </p>
            <p className="truncate text-sm font-bold text-ink">{displayTitle}</p>
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

      <main className="runner-main min-w-0">
        <div className="runner-hub">
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
      </main>

      <SosFloatingButton
        disabled={!identityVerified}
        onTriggered={() => setSosOpen(true)}
        onDisabledTap={openVerify}
      />

      <ChatFooter
        footerSupport={footerSupport}
        hidePoweredBy={Boolean(branding?.hidePoweredBy)}
        locale={locale}
        onOpenLegal={setLegal}
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

      <LegalSheet type={legal ?? "privacy"} open={legal !== null} onClose={() => setLegal(null)} />
    </div>
  );
}
