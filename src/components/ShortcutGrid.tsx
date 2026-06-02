import { SHORTCUT_ICON_MAP } from "@/components/icons/ShortcutIcons";
import { cn } from "@/lib/cn";

const SHORTCUTS = [
  { id: "info" as const, label: "我的参赛信息", desc: "参赛号·分区·领物" },
  { id: "map" as const, label: "赛道补给地图", desc: "公里数·补给点" },
  { id: "shuttle" as const, label: "交通接驳", desc: "物资·返程大巴" },
] as const;

const ICON_STYLES: Record<(typeof SHORTCUTS)[number]["id"], string> = {
  info: "bg-orange-100 text-orange-600",
  map: "bg-blue-100 text-blue-600",
  shuttle: "bg-emerald-100 text-emerald-600",
};

interface Props {
  onSelect: (id: string) => void;
}

export function ShortcutGrid({ onSelect }: Props) {
  return (
    <div className="bg-secondary-bg px-3 py-2 pb-2.5">
      <div className="grid grid-cols-3 gap-2">
        {SHORTCUTS.map((s) => {
          const Icon = SHORTCUT_ICON_MAP[s.id];
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s.id)}
              className="shortcut-card min-h-[92px] px-1.5 py-2.5"
            >
              <span
                className={cn(
                  "shortcut-card-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                  ICON_STYLES[s.id],
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="mt-1.5 line-clamp-2 w-full text-[11px] font-bold leading-snug text-ink">
                {s.label}
              </span>
              <span className="mt-0.5 line-clamp-1 w-full text-[10px] font-medium leading-tight text-secondary">
                {s.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
