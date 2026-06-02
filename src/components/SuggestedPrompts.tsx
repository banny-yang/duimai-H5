interface Props {
  prompts: string[];
  onSelect: (text: string) => void;
  disabled?: boolean;
}

export function SuggestedPrompts({ prompts, onSelect, disabled }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto px-3 pb-2 pt-1 no-scrollbar">
      {prompts.map((p) => (
        <button
          key={p}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(p)}
          className="prompt-pill min-h-[38px] disabled:opacity-50"
        >
          {p}
        </button>
      ))}
    </div>
  );
}
