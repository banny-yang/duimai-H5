interface Props {
  title?: string;
  message: string;
  eventGuid?: string;
  onRetry?: () => void;
}

function resolveTitle(message: string, title?: string): string {
  if (title) return title;
  if (/审核|尚未发布|暂不可用/.test(message)) return "赛事尚未开放";
  if (/不存在|无效/.test(message)) return "赛事不存在";
  return "无法加载赛事";
}

export function ConnectionErrorPage({
  title,
  message,
  eventGuid,
  onRetry,
}: Props) {
  const retry = onRetry ?? (() => window.location.reload());
  const heading = resolveTitle(message, title);

  return (
    <div className="flex flex-col min-h-[100dvh] items-center justify-center bg-white px-6 safe-top safe-bottom">
      <p className="text-lg font-bold text-ink">{heading}</p>
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
      {/审核|尚未发布|暂不可用/.test(message) ? (
        <p className="mt-6 text-2xs text-slate-400 text-center">
          请在运营平台审核通过并上线赛事后，选手端方可访问
        </p>
      ) : (
        <p className="mt-6 text-2xs text-slate-400 text-center">
          请确认选手端服务（8091）已启动，且 H5 代理指向正确
        </p>
      )}
    </div>
  );
}
