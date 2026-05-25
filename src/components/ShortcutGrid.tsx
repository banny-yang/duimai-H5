import { SHORTCUT_ICON_MAP } from "@/components/icons/ShortcutIcons";

const SHORTCUTS = [
  { id: "info" as const, label: "我的参赛信息", desc: "参赛号·分区·领物" },
  { id: "map" as const, label: "赛道补给地图", desc: "公里数·补给点" },
  { id: "shuttle" as const, label: "交通接驳", desc: "物资·返程大巴" },
] as const;

interface Props {
  onSelect: (id: string) => void;
}

export function ShortcutGrid({ onSelect }: Props) {
  return (
    <div className="px-3 py-2.5 bg-secondary-bg/50">
      <div className="grid grid-cols-3 gap-2">
        {SHORTCUTS.map((s) => {
          const Icon = SHORTCUT_ICON_MAP[s.id];
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s.id)}
              className="flex flex-col items-center rounded-xl border border-secondary-border bg-white shadow-sm px-2 py-3 text-center min-h-[96px] transition-all duration-150 active:border-2 active:border-primary active:shadow-primary-sm active:translate-y-0.5 active:bg-primary-surface"
            >
              <span className="shortcut-icon-wrap w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                <Icon className="w-6 h-6" />
              </span>
              <span className="mt-2 text-xs font-bold text-ink leading-snug line-clamp-2 w-full">
                {s.label}
              </span>
              <span className="text-[10px] text-secondary mt-1 font-medium leading-tight line-clamp-2 w-full">
                {s.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
