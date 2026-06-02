/** 对麦 AI 头像 · 赛事红橙渐变 */
export function AiAvatar({ size = "sm" }: { size?: "sm" | "md" }) {
  const dim = size === "md" ? "h-7 w-7 text-xs" : "h-6 w-6 text-[10px]";
  return (
    <span
      className={`${dim} flex shrink-0 items-center justify-center rounded-full font-bold text-white`}
      style={{
        background: "linear-gradient(145deg, #ef4444 0%, var(--primary) 100%)",
        boxShadow: "0 2px 6px rgba(239, 68, 68, 0.35)",
      }}
      aria-hidden
    >
      麦
    </span>
  );
}
