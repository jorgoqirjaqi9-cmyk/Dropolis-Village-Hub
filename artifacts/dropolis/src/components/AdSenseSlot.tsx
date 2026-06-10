import React from 'react';

export function AdSenseSlot({ width, height, className = "" }: { width: number | string; height: number | string; className?: string }) {
  return (
    <div 
      className={`bg-muted border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground ${className}`}
      style={{ width, height, maxWidth: '100%' }}
    >
      <span className="text-xs font-semibold uppercase tracking-wider mb-1">Διαφήμιση</span>
      <span className="text-sm opacity-50">{width} × {height}</span>
    </div>
  );
}
