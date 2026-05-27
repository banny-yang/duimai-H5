import { useEffect, useState } from "react";

type Doc = { title: string; version: string; content: string };

interface Props {
  type: "privacy" | "terms";
  open: boolean;
  onClose: () => void;
}

export function LegalSheet({ type, open, onClose }: Props) {
  const [doc, setDoc] = useState<Doc | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const path = type === "privacy" ? "/public/legal/privacy" : "/public/legal/terms";
      const res = await fetch(`/api${path}`);
      const json = (await res.json()) as { data?: Doc };
      if (!cancelled && json.data) setDoc(json.data);
    })().catch(() => {
      if (!cancelled) {
        setDoc({
          title: type === "privacy" ? "隐私政策" : "用户协议",
          version: "",
          content: "加载失败，请稍后重试。",
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open, type]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white safe-top safe-bottom">
      <header className="shrink-0 flex items-center justify-between px-4 py-3 border-b gap-2">
        <div className="min-w-0">
          <h1 className="text-base font-bold truncate">{doc?.title ?? "加载中…"}</h1>
          {doc?.version ? (
            <p className="text-xs text-muted-foreground mt-0.5">版本 {doc.version}</p>
          ) : null}
        </div>
        <button type="button" className="text-sm text-primary font-medium shrink-0" onClick={onClose}>
          关闭
        </button>
      </header>
      <main className="flex-1 overflow-y-auto px-4 py-4 text-sm text-secondary leading-relaxed whitespace-pre-wrap">
        {doc?.content}
      </main>
    </div>
  );
}
