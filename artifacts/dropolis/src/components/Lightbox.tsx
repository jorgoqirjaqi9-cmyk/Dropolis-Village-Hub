import React, { useEffect, useCallback, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, Camera, MapPin } from "lucide-react";
import { Link } from "wouter";
import { VoteButtons } from "@/components/VoteButtons";

export interface LightboxPhoto {
  id: number;
  url: string;
  thumbnailUrl?: string | null;
  title: string;
  description?: string | null;
  photographer?: string | null;
  villageId?: number | null;
  villageName?: string | null;
  likes: number;
  dislikes: number;
}

interface LightboxProps {
  photos: LightboxPhoto[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function Lightbox({ photos, currentIndex, onClose, onPrev, onNext }: LightboxProps) {
  const photo = photos[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < photos.length - 1;

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [dragX, setDragX] = useState(0);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowLeft" && hasPrev) onPrev();
    if (e.key === "ArrowRight" && hasNext) onNext();
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setDragX(0);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - (touchStartY.current ?? 0);
    if (Math.abs(dx) > Math.abs(dy)) {
      setDragX(dx);
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - (touchStartY.current ?? 0);
    setDragX(0);
    touchStartX.current = null;
    touchStartY.current = null;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0 && hasNext) onNext();
      else if (dx > 0 && hasPrev) onPrev();
    } else if (Math.abs(dy) > 80 && Math.abs(dx) < 40) {
      onClose();
    }
  }

  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 rounded-full bg-white/10 hover:bg-white/20 text-white p-2 transition-colors"
        aria-label="Κλείσιμο"
      >
        <X className="w-6 h-6" />
      </button>

      {hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-3 md:left-6 z-10 rounded-full bg-white/10 hover:bg-white/25 text-white p-3 transition-colors hidden sm:flex"
          aria-label="Προηγούμενη"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>
      )}

      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-3 md:right-6 z-10 rounded-full bg-white/10 hover:bg-white/25 text-white p-3 transition-colors hidden sm:flex"
          aria-label="Επόμενη"
        >
          <ChevronRight className="w-7 h-7" />
        </button>
      )}

      <div
        className="relative flex flex-col items-center w-full h-full px-2 sm:px-16 md:px-24 py-4"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: dragX !== 0 ? `translateX(${dragX * 0.3}px)` : undefined,
          transition: dragX === 0 ? "transform 0.2s ease" : "none",
        }}
      >
        <div className="flex-1 flex items-center justify-center w-full min-h-0">
          <img
            key={photo.id}
            src={photo.url}
            alt={photo.title}
            className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
            style={{ maxHeight: "calc(100vh - 160px)" }}
            draggable={false}
          />
        </div>

        <div className="w-full max-w-3xl mt-3 px-2 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-bold text-base md:text-lg leading-snug truncate">{photo.title}</h2>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-white/60 text-xs">
                {photo.villageId && photo.villageName ? (
                  <Link
                    href={`/villages/${photo.villageId}/`}
                    onClick={onClose}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    <MapPin className="w-3 h-3" /> {photo.villageName}
                  </Link>
                ) : photo.villageName ? (
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {photo.villageName}</span>
                ) : null}
                {photo.photographer && (
                  <span className="flex items-center gap-1"><Camera className="w-3 h-3" /> {photo.photographer}</span>
                )}
                <span className="text-white/40">{currentIndex + 1} / {photos.length}</span>
              </div>
              {photos.length > 1 && (
                <p className="text-white/30 text-xs mt-1 sm:hidden">← Σύρε για επόμενη · ↓ Σύρε για κλείσιμο</p>
              )}
            </div>
            <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
              <VoteButtons
                contentType="photo"
                contentId={photo.id}
                likesCount={photo.likes}
                dislikesCount={photo.dislikes}
                compact
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
