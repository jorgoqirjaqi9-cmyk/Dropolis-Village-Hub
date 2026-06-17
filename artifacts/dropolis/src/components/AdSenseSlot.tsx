import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

interface AdSenseSlotProps {
  adSlot: string;
  adFormat?: "auto" | "rectangle" | "vertical" | "horizontal";
  fullWidthResponsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const FORMAT_MIN_HEIGHT: Record<string, number> = {
  horizontal: 90,
  rectangle: 280,
  vertical: 600,
  auto: 100,
};

declare global {
  interface Window {
    adsbygoogle: unknown[];
    __dropolisAdsAllowed?: (path: string) => boolean;
  }
}

const AD_EXCLUDED_PREFIXES = [
  "/chat", "/upload-photo", "/submit-news", "/submit-video",
  "/admin", "/privacy", "/terms", "/cookie-policy", "/disclaimer", "/diaspora",
];

function adsAllowedOnPath(path: string): boolean {
  for (const prefix of AD_EXCLUDED_PREFIXES) {
    if (path === prefix || path.startsWith(prefix + "/")) return false;
  }
  return true;
}

export function AdSenseSlot({
  adSlot,
  adFormat = "auto",
  fullWidthResponsive = true,
  className = "",
  style,
}: AdSenseSlotProps) {
  const [location] = useLocation();
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const allowed = adsAllowedOnPath(location);

  useEffect(() => {
    if (!allowed) return;
    const el = ref.current;
    if (!el || pushed.current) return;

    // ResizeObserver fires AFTER layout — no forced reflow in the critical
    // render path. Calling el.offsetWidth synchronously inside useEffect was
    // the root cause of the 56 ms forced reflow flagged by Lighthouse: React
    // would commit, run effects, hit the offsetWidth read, and stall the main
    // thread before the hero image could paint.
    const observer = new ResizeObserver(() => {
      if (pushed.current || el.offsetWidth <= 0) return;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushed.current = true;
        observer.disconnect();
      } catch {
        // Silently ignore push errors (ad blockers, unfilled inventory, etc.)
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [adSlot, allowed]);

  if (!allowed) return null;

  const minH = FORMAT_MIN_HEIGHT[adFormat] ?? 100;

  return (
    <div className={`overflow-hidden ${className}`} style={{ height: minH, contain: "strict", ...style }}>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: "block", height: minH }}
        data-ad-client="ca-pub-3960290713410584"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive ? "true" : "false"}
      />
    </div>
  );
}
