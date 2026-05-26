import { cn } from "@/lib/cn";

interface Props {
  visible: boolean;
  onClick: () => void;
  className?: string;
}

export function ScrollToBottomButton({ visible, onClick, className }: Props) {
  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="回到底部"
      className={cn(
        "absolute z-10 left-4 bottom-4 w-10 h-10 rounded-full",
        "bg-white border border-secondary-border shadow-md",
        "flex items-center justify-center text-primary",
        "active:scale-95 transition-transform",
        className,
      )}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M12 5v14M6 13l6 6 6-6" />
      </svg>
    </button>
  );
}
