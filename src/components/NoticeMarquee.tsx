import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

interface Props {
  text: string;
  className?: string;
  /** 应急等场景：始终跑马灯 */
  alwaysScroll?: boolean;
}

const PX_PER_SEC = 48;
const PX_PER_SEC_REDUCED = 28;
const GAP_PX = 32;

/**
 * 跑马灯（requestAnimationFrame），避免 CSS 动画在部分 WebView / 减少动效下不生效。
 */
export function NoticeMarquee({ text, className, alwaysScroll = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const lastTsRef = useRef<number | null>(null);
  const [staticText, setStaticText] = useState(!alwaysScroll);

  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track || !text) return;

    let raf = 0;
    let loopWidth = 0;

    const layout = () => {
      const first = track.firstElementChild as HTMLElement | null;
      if (!first) return 0;
      return first.offsetWidth + GAP_PX;
    };

    const start = () => {
      loopWidth = layout();
      const fits = loopWidth > 0 && loopWidth <= container.clientWidth + 2;

      if (!alwaysScroll && fits) {
        setStaticText(true);
        track.style.transform = "";
        return;
      }

      setStaticText(false);
      offsetRef.current = 0;
      lastTsRef.current = null;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const speed = reduced ? PX_PER_SEC_REDUCED : PX_PER_SEC;

      const tick = (ts: number) => {
        if (lastTsRef.current == null) lastTsRef.current = ts;
        const dt = Math.min(0.05, (ts - lastTsRef.current) / 1000);
        lastTsRef.current = ts;

        if (loopWidth > 0) {
          offsetRef.current += speed * dt;
          if (offsetRef.current >= loopWidth) {
            offsetRef.current -= loopWidth;
          }
          track.style.transform = `translate3d(${-offsetRef.current}px,0,0)`;
        }

        raf = requestAnimationFrame(tick);
      };

      raf = requestAnimationFrame(tick);
    };

    start();

    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      track.style.transform = "";
      start();
    });
    ro.observe(container);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      track.style.transform = "";
      offsetRef.current = 0;
      lastTsRef.current = null;
    };
  }, [text, alwaysScroll]);

  return (
    <div
      ref={containerRef}
      className="notice-marquee-viewport relative h-5 w-full min-w-0 max-w-full overflow-hidden"
    >
      {!staticText && (
        <>
          <span
            className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-3 bg-gradient-to-r from-white to-transparent"
            aria-hidden
          />
          <span
            className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-3 bg-gradient-to-l from-white to-transparent"
            aria-hidden
          />
        </>
      )}
      <div
        ref={trackRef}
        className={cn(
          "flex w-max items-center whitespace-nowrap will-change-transform",
          staticText && "w-full",
        )}
        style={{ gap: staticText ? 0 : GAP_PX }}
      >
        <span className={cn(className, staticText && "block truncate w-full")}>{text}</span>
        {!staticText && (
          <span className={className} aria-hidden>
            {text}
          </span>
        )}
      </div>
    </div>
  );
}
