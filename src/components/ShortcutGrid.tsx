import { SHORTCUT_ICON_MAP } from "@/components/icons/ShortcutIcons";

const SHORTCUTS = [
  { id: "info" as const, label: "我的参赛信息", desc: "参赛号·分区·领物" },
  { id: "map" as const, label: "赛道补给地图", desc: "公里数·补给点" },
  { id: "result" as const, label: "成绩与计时", desc: "冲线后查询" },
  { id: "shuttle" as const, label: "交通接驳", desc: "物资·返程大巴" },
];

interface Props {
  onSelect: (id: string) => void;
}

export function ShortcutGrid({ onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2.5 px-3 py-2.5 bg-secondary-bg/50">
      {SHORTCUTS.map((s) => {
        const Icon = SHORTCUT_ICON_MAP[s.id];
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.id)}
            className="flex flex-col items-start rounded-xl border border-secondary-border bg-white shadow-sm px-3 py-3.5 text-left min-h-[92px] transition-all duration-150 active:border-2 active:border-primary active:shadow-primary-sm active:translate-y-0.5 active:bg-primary-surface"
          >
            <span className="shortcut-icon-wrap w-11 h-11 rounded-lg flex items-center justify-center">
              <Icon />
            </span>
            <span className="mt-2 text-sm font-bold text-ink">{s.label}</span>
            <span className="text-2xs text-secondary mt-0.5 font-medium">{s.desc}</span>
          </button>
        );
      })}
    </div>
  );
}
