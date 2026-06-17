import React from "react";

const FALLBACK_UNSPLASH = "https://images.unsplash.com/photo-1504711434969-e33886168f5c";

function optimizeUnsplash(src: string, w: number, q: number): string {
  const base = src.split("?")[0];
  return `${base}?w=${w}&q=${q}&fm=webp&auto=format`;
}

function buildUnsplashSrcSet(src: string, q: number): string {
  const base = src.split("?")[0];
  return [400, 800, 1200, 1600]
    .map((w) => `${base}?w=${w}&q=${q}&fm=webp&auto=format ${w}w`)
    .join(", ");
}

function isUnsplash(src: string): boolean {
  return src.includes("images.unsplash.com");
}

export interface OptimizedImgProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "loading" | "decoding"> {
  src: string;
  alt: string;
  priority?: boolean;
  quality?: number;
  aspectRatio?: string;
}

export function OptimizedImg({
  src,
  alt,
  priority = false,
  quality = 65,
  aspectRatio,
  className = "",
  style,
  onError,
  srcSet: srcSetProp,
  ...rest
}: OptimizedImgProps) {
  const unsplash = isUnsplash(src);

  const resolvedSrc = unsplash ? optimizeUnsplash(src, 800, quality) : src;

  const resolvedSrcSet =
    srcSetProp ?? (unsplash ? buildUnsplashSrcSet(src, quality) : undefined);

  const sizes =
    rest.sizes ?? (unsplash ? "(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px" : undefined);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (unsplash) {
      (e.currentTarget as HTMLImageElement).src = `${FALLBACK_UNSPLASH}?w=800&q=60&fm=webp&auto=format`;
    }
    onError?.(e);
  };

  const imgEl = (
    <img
      {...rest}
      src={resolvedSrc}
      srcSet={resolvedSrcSet}
      sizes={sizes}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      fetchPriority={priority ? "high" : undefined}
      onError={handleError}
      className={aspectRatio ? "w-full h-full object-cover" : className}
      style={aspectRatio ? undefined : style}
    />
  );

  if (aspectRatio) {
    return (
      <div
        style={{ aspectRatio, contain: "layout", overflow: "hidden", ...style }}
        className={`overflow-hidden ${className}`}
      >
        {imgEl}
      </div>
    );
  }

  return imgEl;
}
