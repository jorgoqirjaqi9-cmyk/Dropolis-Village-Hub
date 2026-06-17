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

/** True for images served from our own object-storage route */
function isStorageUrl(src: string): boolean {
  return src.includes("/api/storage/public-objects/");
}

/**
 * Build a WebP srcset for a storage URL by appending `?w=X&format=webp`.
 * The API server's sharp middleware will resize + convert on the fly.
 */
function buildStorageSrcSet(src: string): string {
  const base = src.split("?")[0];
  return [400, 800, 1200]
    .map((w) => `${base}?w=${w}&format=webp ${w}w`)
    .join(", ");
}

function optimizeStorageUrl(src: string, displayWidth: number): string {
  const base = src.split("?")[0];
  // Clamp to sensible bucket widths so the browser can reuse cached variants
  const w = displayWidth <= 400 ? 400 : displayWidth <= 800 ? 800 : 1200;
  return `${base}?w=${w}&format=webp`;
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
  const storage = !unsplash && isStorageUrl(src);
  const displayWidth = typeof rest.width === "number" ? rest.width : 800;

  const resolvedSrc = unsplash
    ? optimizeUnsplash(src, 800, quality)
    : storage
    ? optimizeStorageUrl(src, displayWidth)
    : src;

  const resolvedSrcSet =
    srcSetProp ??
    (unsplash
      ? buildUnsplashSrcSet(src, quality)
      : storage
      ? buildStorageSrcSet(src)
      : undefined);

  const sizes =
    rest.sizes ??
    (unsplash || storage
      ? "(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px"
      : undefined);

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
