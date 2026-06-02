import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

interface Props {
  footerSupport?: string;
  hidePoweredBy?: boolean;
  locale?: Locale;
  onOpenLegal?: (type: "privacy" | "terms") => void;
}

export function ChatFooter({
  footerSupport,
  hidePoweredBy = false,
  locale = "zh",
  onOpenLegal,
}: Props) {
  const hasSupport = Boolean(footerSupport?.trim());
  const showPowered = !hidePoweredBy;
  const showLegal = Boolean(onOpenLegal);
  if (!hasSupport && !showPowered && !showLegal) {
    return null;
  }

  return (
    <footer className="runner-app-footer border-t border-secondary-border/80 px-3 py-1 text-center text-2xs text-secondary safe-bottom">
      {hasSupport ? (
        <span className="block text-sm font-semibold text-red-600">{footerSupport}</span>
      ) : null}
      {showPowered ? <span className="text-secondary">{t(locale, "poweredBy")}</span> : null}
      {showLegal && (
        <span className="mt-0.5 flex justify-center gap-3 text-secondary">
          <button type="button" className="underline" onClick={() => onOpenLegal!("privacy")}>
            {locale === "en" ? "Privacy" : "隐私政策"}
          </button>
          <button type="button" className="underline" onClick={() => onOpenLegal!("terms")}>
            {locale === "en" ? "Terms" : "用户协议"}
          </button>
        </span>
      )}
    </footer>
  );
}
