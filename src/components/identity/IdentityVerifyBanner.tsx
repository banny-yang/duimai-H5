interface Props {
  onVerify: () => void;
}

export function IdentityVerifyBanner({ onVerify }: Props) {
  return (
    <button
      type="button"
      onClick={onVerify}
      className="mx-3 mt-2 flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-left active:opacity-90"
    >
      <span className="shrink-0 w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-bold">
        !
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-amber-900">尚未验证选手身份</p>
        <p className="text-2xs text-amber-800/90 mt-0.5">
          验证参赛号与身份证后 6 位，解锁 SOS 与我的参赛信息
        </p>
      </div>
      <span className="shrink-0 text-2xs font-bold text-primary">去验证 ›</span>
    </button>
  );
}
