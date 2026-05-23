interface Props {
  title?: string;
  message: string;
  eventGuid?: string;
  onRetry?: () => void;
}

export function ConnectionErrorPage({
  title = "无法加载赛事",
  message,
  eventGuid,
  onRetry,
}: Props) {
  const retry = onRetry ?? (() => window.location.reload());

  return (
    <div className="flex flex-col min-h-[100dvh] items-center justify-center bg-white px-6 safe-top safe-bottom">
      <p className="text-lg font-bold text-ink">{title}</p>
      <p className="mt-3 text-sm text-secondary text-center leading-relaxed">{message}</p>
      {eventGuid && (
        <p className="mt-2 text-2xs text-slate-400 font-mono break-all">{eventGuid}</p>
      )}
      <button
        type="button"
        onClick={retry}
        className="mt-8 px-6 py-3 rounded-2xl bg-primary text-white text-sm font-bold active:bg-primary-dark"
      >
        重试
      </button>
      <p className="mt-6 text-2xs text-slate-400 text-center">
        请确认选手端服务（8091）已启动，且 H5 代理指向正确
      </p>
    </div>
  );
}
