/** 对麦头像 · 品牌青渐变球体 */
export function AiAvatar({ size = "sm" }: { size?: "sm" | "md" }) {
  const dim = size === "md" ? "w-6 h-6 text-xs" : "w-5 h-5 text-2xs";
  return (
    <span
      className={`${dim} shrink-0 rounded-full flex items-center justify-center font-bold text-white`}
      style={{
        background: "linear-gradient(145deg, #06b6d4 0%, #0e7490 100%)",
        boxShadow: "0 1px 4px rgba(6, 182, 212, 0.35)",
      }}
      aria-hidden
    >
      麦
    </span>
  );
}
