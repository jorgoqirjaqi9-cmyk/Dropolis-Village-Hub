import React from "react";

interface StableBoundsProps {
  children: React.ReactNode;
  minHeight?: number | string;
  aspectRatio?: string;
  className?: string;
  skeleton?: React.ReactNode;
  ready?: boolean;
}

export function StableBounds({
  children,
  minHeight,
  aspectRatio,
  className = "",
  skeleton,
  ready = true,
}: StableBoundsProps) {
  const style: React.CSSProperties = {
    contain: "layout",
    ...(aspectRatio ? { aspectRatio } : {}),
    ...(minHeight ? { minHeight } : {}),
  };

  return (
    <div style={style} className={`overflow-hidden ${className}`}>
      {!ready && skeleton ? skeleton : children}
    </div>
  );
}

export function SkeletonBox({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-muted ${className}`}
      style={style}
    />
  );
}
