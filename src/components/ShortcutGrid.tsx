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
    <div className="bg-secondary-bg px-3 py-3">
      <div className="grid grid-cols-3 gap-2.5">
        {SHORTCUTS.map((s) => {
          const Icon = SHORTCUT_ICON_MAP[s.id];
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s.id)}
              className="shortcut-card min-h-[100px] px-2 py-3"
            >
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  ICON_STYLES[s.id],
                )}
              >
                <Icon className="h-6 w-6" />
              </span>
              <span className="mt-2 line-clamp-2 w-full text-xs font-bold leading-snug text-ink">
                {s.label}
              </span>
              <span className="mt-1 line-clamp-2 w-full text-[10px] font-medium leading-tight text-secondary">
                {s.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
