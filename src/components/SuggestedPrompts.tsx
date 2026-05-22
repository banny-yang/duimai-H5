interface Props {
  prompts: string[];
  onSelect: (text: string) => void;
  disabled?: boolean;
}

export function SuggestedPrompts({ prompts, onSelect, disabled }: Props) {
  return (
    <div className="flex gap-2.5 px-3 pb-2.5 overflow-x-auto no-scrollbar">
      {prompts.map((p) => (
        <button
          key={p}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(p)}
          className="shrink-0 rounded-full bg-primary-surface px-4 py-2.5 text-[13px] text-ink font-semibold active:bg-primary-glow disabled:opacity-50 min-h-[40px] border border-primary/15"
        >
          {p}
        </button>
      ))}
    </div>
  );
}
