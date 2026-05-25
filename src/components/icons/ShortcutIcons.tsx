/** 金刚区统一单色线框 · 品牌青 */

const STROKE = "#0891b2";

const strokeProps = {
  fill: "none",
  stroke: STROKE,
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconTicket({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        {...strokeProps}
        d="M4 8h16v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8zm0 0V6a2 2 0 0 1 2-2h1m15 4V6a2 2 0 0 0-2-2h-1M9 12h6"
      />
    </svg>
  );
}

export function IconMap({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path {...strokeProps} d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3z" />
      <path {...strokeProps} d="M9 3v15M15 6v15" />
    </svg>
  );
}

export function IconBus({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path {...strokeProps} d="M6 6h12a2 2 0 0 1 2 2v8H4V8a2 2 0 0 1 2-2zm-2 10h16v2H4v-2z" />
      <circle {...strokeProps} cx="8" cy="18" r="1.5" />
      <circle {...strokeProps} cx="16" cy="18" r="1.5" />
      <path {...strokeProps} d="M8 6V4h8v2" />
    </svg>
  );
}

export const SHORTCUT_ICON_MAP = {
  info: IconTicket,
  map: IconMap,
  shuttle: IconBus,
} as const;
