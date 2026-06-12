import { useEffect, useRef } from "react";

interface AdSenseSlotProps {
  adSlot: string;
  adFormat?: "auto" | "rectangle" | "vertical" | "horizontal";
  fullWidthResponsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export function AdSenseSlot({
  adSlot,
  adFormat = "auto",
  fullWidthResponsive = true,
  className = "",
  style,
}: AdSenseSlotProps) {
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || pushed.current) return;

    const pushAd = () => {
      if (pushed.current || el.offsetWidth <= 0) return;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushed.current = true;
      } catch {
        // Silently ignore push errors, e.g. ad blockers or unfilled inventory.
      }
    };

    pushAd();

    if (pushed.current) return;
    const observer = new ResizeObserver(pushAd);
    observer.observe(el);
    return () => observer.disconnect();
  }, [adSlot]);

  return (
    <div className={`overflow-hidden min-h-[120px] ${className}`} style={style}>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: "block", minHeight: 120 }}
        data-ad-client="ca-pub-3960290713410584"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive ? "true" : "false"}
      />
    </div>
  );
}
