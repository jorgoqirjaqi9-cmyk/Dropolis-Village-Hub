import React, { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Radio, X, Volume2, VolumeX, ChevronDown } from "lucide-react";

const STATIONS = [
  {
    id: "menta88",
    name: "Menta 88 FM",
    streamUrl: "https://netradio.live24.gr/menta88ath",
    website: "https://menta88.gr/player/",
    websiteLabel: "menta88.gr",
  },
  {
    id: "sfera",
    name: "Sfera Radio",
    streamUrl: "https://sfera.live24.gr/sfera4132",
    website: "https://www.sfera.gr",
    websiteLabel: "sfera.gr",
  },
  {
    id: "epirus",
    name: "Ράδιο Ήπειρος",
    streamUrl: "https://rdst.win:59450/stream",
    website: "http://www.radioepirus.gr/",
    websiteLabel: "radioepirus.gr",
  },
] as const;

// ---------------------------------------------------------------------------
// Presence API helpers
// ---------------------------------------------------------------------------

async function apiRegisterPresence(
  listenerId?: string
): Promise<{ listenerId: string; count: number }> {
  const res = await fetch("/api/radio/presence", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ listenerId }),
  });
  return res.json();
}

function apiDeletePresence(listenerId: string): void {
  fetch(`/api/radio/presence/${listenerId}`, { method: "DELETE" }).catch(() => {});
}

// ---------------------------------------------------------------------------
// StationRow
// ---------------------------------------------------------------------------

function StationRow({
  station,
  onPlay,
  onPause,
}: {
  station: (typeof STATIONS)[number];
  onPlay: (stationName: string, pauseFn: () => void) => void;
  onPause: () => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.src = "";
    setIsPlaying(false);
    setIsLoading(false);
    onPause();
  }, [onPause]);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setIsLoading(true);
    audio.src = station.streamUrl;
    audio.volume = isMuted ? 0 : volume;
    audio.play()
      .then(() => {
        setIsPlaying(true);
        setIsLoading(false);
        onPlay(station.name, pause);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [station, volume, isMuted, onPlay, pause]);

  const togglePlay = () => {
    if (isPlaying) pause();
    else play();
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = !isMuted;
    audio.muted = next;
    setIsMuted(next);
  };

  // radio-play global event — triggers first station (menta88)
  useEffect(() => {
    if (station.id !== "menta88") return;
    const handler = () => {
      if (!isPlaying) play();
    };
    window.addEventListener("radio-play", handler);
    return () => window.removeEventListener("radio-play", handler);
  }, [isPlaying, play, station.id]);

  return (
    <>
      <audio ref={audioRef} preload="none" />
      <div className="px-4 py-3 flex items-center gap-3">
        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          disabled={isLoading}
          className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 disabled:opacity-60 shrink-0"
          title={isPlaying ? "Παύση" : "Αναπαραγωγή"}
        >
          {isLoading ? (
            <span className="w-3.5 h-3.5 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-3.5 h-3.5" />
          ) : (
            <Play className="w-3.5 h-3.5 ml-0.5" />
          )}
        </button>

        {/* Station info + volume */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            {isPlaying && (
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
            )}
            <a
              href={station.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold truncate hover:text-primary transition-colors"
            >
              {station.name}
            </a>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setVolume(v);
              if (audioRef.current) audioRef.current.volume = v;
              if (v > 0 && isMuted) {
                setIsMuted(false);
                if (audioRef.current) audioRef.current.muted = false;
              }
            }}
            className="w-full h-1 accent-primary cursor-pointer"
          />
        </div>

        {/* Mute */}
        <button
          onClick={toggleMute}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="w-3.5 h-3.5" />
          ) : (
            <Volume2 className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// RadioPlayer
// ---------------------------------------------------------------------------

export function RadioPlayer() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [listenerCount, setListenerCount] = useState(0);
  const [playingStationName, setPlayingStationName] = useState<string | null>(null);

  const listenerIdRef = useRef<string | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const minimizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activePauseRef = useRef<(() => void) | null>(null);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    if (listenerIdRef.current) {
      apiDeletePresence(listenerIdRef.current);
      listenerIdRef.current = null;
    }
  }, []);

  const startHeartbeat = useCallback(async () => {
    try {
      const data = await apiRegisterPresence(listenerIdRef.current ?? undefined);
      listenerIdRef.current = data.listenerId;
      setListenerCount(data.count);
    } catch {}

    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    heartbeatRef.current = setInterval(async () => {
      try {
        const d = await apiRegisterPresence(listenerIdRef.current ?? undefined);
        listenerIdRef.current = d.listenerId;
        setListenerCount(d.count);
      } catch {}
    }, 15_000);
  }, []);

  const handlePlay = useCallback(
    (stationName: string, pauseFn: () => void) => {
      setPlayingStationName(stationName);
      activePauseRef.current = pauseFn;
      startHeartbeat();
      if (minimizeTimerRef.current) clearTimeout(minimizeTimerRef.current);
      minimizeTimerRef.current = setTimeout(() => setIsMinimized(true), 3000);
    },
    [startHeartbeat]
  );

  const handlePause = useCallback(() => {
    setPlayingStationName(null);
    activePauseRef.current = null;
    stopHeartbeat();
    setListenerCount(0);
    if (minimizeTimerRef.current) {
      clearTimeout(minimizeTimerRef.current);
      minimizeTimerRef.current = null;
    }
    setIsMinimized(false);
  }, [stopHeartbeat]);

  const handleMiniPause = useCallback(() => {
    activePauseRef.current?.();
  }, []);

  const handleClose = useCallback(() => {
    activePauseRef.current?.();
    stopHeartbeat();
    setIsVisible(false);
    setIsMinimized(false);
    setPlayingStationName(null);
  }, [stopHeartbeat]);

  // radio-play global event → open player
  useEffect(() => {
    const handler = () => setIsVisible(true);
    window.addEventListener("radio-play", handler);
    return () => window.removeEventListener("radio-play", handler);
  }, []);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      stopHeartbeat();
      if (minimizeTimerRef.current) clearTimeout(minimizeTimerRef.current);
    };
  }, [stopHeartbeat]);

  return (
    <>
      {/* ── Trigger button (when player is closed) ── */}
      {!isVisible && (
        <button
          onClick={() => setIsVisible(true)}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 h-9 px-4 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center gap-2 hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
          title="Radio"
        >
          <Radio className="w-4 h-4 text-secondary" />
          <span className="text-xs font-semibold">Live Radio</span>
        </button>
      )}

      {/* ── Minimized pill ── */}
      {isVisible && isMinimized && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-0 rounded-full shadow-2xl border border-border/40 bg-card overflow-hidden">
          {/* clickable area → expand */}
          <button
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-2 pl-3 pr-2 py-2 hover:bg-muted/40 transition-colors"
            title="Άνοιγμα player"
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <Radio className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-xs font-semibold whitespace-nowrap max-w-[110px] truncate">
              {playingStationName ?? "Live Radio"}
            </span>
            {listenerCount > 1 && (
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {listenerCount} ακροατές
              </span>
            )}
            <ChevronDown className="w-3 h-3 text-muted-foreground -rotate-90" />
          </button>

          {/* pause button */}
          <button
            onClick={handleMiniPause}
            className="px-2 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors border-l border-border/40"
            title="Παύση"
          >
            <Pause className="w-3.5 h-3.5" />
          </button>

          {/* close button */}
          <button
            onClick={handleClose}
            className="px-2 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors border-l border-border/40"
            title="Κλείσιμο"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Full card — always mounted when visible, hidden via CSS when minimized ── */}
      {/* Using `hidden` (display:none) keeps audio running — browsers don't stop audio on display:none */}
      <div
        className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 w-72 rounded-2xl shadow-2xl overflow-hidden border border-border/40 bg-card ${
          isVisible && !isMinimized ? "block" : "hidden"
        }`}
      >
        {/* Header */}
        <div className="bg-primary text-primary-foreground px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-secondary shrink-0" />
            <p className="font-semibold text-sm">Live Radio</p>
            {listenerCount > 1 && (
              <span className="text-[10px] text-primary-foreground/70 font-normal ml-1">
                {listenerCount} ακροατές τώρα
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-primary-foreground/60 hover:text-primary-foreground transition-colors"
            title="Κλείσιμο"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Station rows */}
        <div className="divide-y divide-border/40">
          {STATIONS.map((s) => (
            <StationRow
              key={s.id}
              station={s}
              onPlay={handlePlay}
              onPause={handlePause}
            />
          ))}
        </div>
      </div>
    </>
  );
}
