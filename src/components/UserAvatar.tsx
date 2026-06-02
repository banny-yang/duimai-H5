/** 用户消息旁头像占位 */
export function UserAvatar() {
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-secondary-border bg-white text-secondary shadow-sm"
      aria-hidden
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" strokeLinecap="round" />
      </svg>
    </span>
  );
}
