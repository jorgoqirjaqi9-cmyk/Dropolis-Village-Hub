import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Radio, X, Volume2, VolumeX, ChevronDown } from "lucide-react";

const STATIONS = [
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

export function RadioPlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isLoading, setIsLoading] = useState(false);
  const [stationIndex, setStationIndex] = useState(0);
  const [showStations, setShowStations] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const station = STATIONS[stationIndex];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
  }, [volume]);

  const playStation = (idx: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.src = "";
    setIsPlaying(false);
    setStationIndex(idx);
    setShowStations(false);
    setIsLoading(true);
    const nextUrl = STATIONS[idx].streamUrl;
    audio.src = nextUrl;
    audio.volume = volume;
    audio.play()
      .then(() => { setIsPlaying(true); setIsLoading(false); })
      .catch(() => { setIsLoading(false); });
  };

  useEffect(() => {
    const handler = () => {
      setIsOpen(true);
      const audio = audioRef.current;
      if (!audio || isPlaying) return;
      setIsLoading(true);
      audio.src = station.streamUrl;
      audio.volume = volume;
      audio.play()
        .then(() => { setIsPlaying(true); setIsLoading(false); })
        .catch(() => { setIsLoading(false); });
    };
    window.addEventListener("radio-play", handler);
    return () => window.removeEventListener("radio-play", handler);
  }, [isPlaying, station.streamUrl, volume]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      audio.src = "";
      setIsPlaying(false);
      setIsLoading(false);
    } else {
      setIsLoading(true);
      audio.src = station.streamUrl;
      audio.volume = volume;
      audio.play()
        .then(() => { setIsPlaying(true); setIsLoading(false); })
        .catch(() => { setIsLoading(false); });
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleClose = () => {
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.src = ""; }
    setIsPlaying(false);
    setIsLoading(false);
    setIsOpen(false);
    setShowStations(false);
  };

  return (
    <>
      <audio ref={audioRef} preload="none" />

      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
          title="Radio — Άνοιγμα"
        >
          <Radio className="w-6 h-6 text-secondary" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-72 rounded-2xl shadow-2xl overflow-hidden border border-border/40 bg-card">
          {/* Header with station switcher */}
          <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setShowStations(v => !v)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity min-w-0"
              title="Αλλαγή σταθμού"
            >
              <Radio className="w-4 h-4 text-secondary shrink-0" />
              <div className="text-left min-w-0">
                <p className="font-semibold text-sm leading-tight truncate">{station.name}</p>
                <p className="text-[10px] text-primary-foreground/60">Live streaming</p>
              </div>
              <ChevronDown className={`w-3 h-3 text-primary-foreground/60 shrink-0 transition-transform ${showStations ? "rotate-180" : ""}`} />
            </button>
            <button onClick={handleClose} className="text-primary-foreground/60 hover:text-primary-foreground transition-colors ml-2 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Station list dropdown */}
          {showStations && (
            <div className="border-b border-border/40 bg-muted/40">
              {STATIONS.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => playStation(idx)}
                  className={`w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-muted transition-colors ${idx === stationIndex ? "bg-muted" : ""}`}
                >
                  <Radio className={`w-3.5 h-3.5 shrink-0 ${idx === stationIndex ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-sm ${idx === stationIndex ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                    {s.name}
                  </span>
                  {idx === stationIndex && isPlaying && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Controls */}
          <div className="px-4 py-4 flex items-center gap-3 bg-card">
            <button
              onClick={togglePlay}
              disabled={isLoading}
              className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 disabled:opacity-60 shrink-0"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 ml-0.5" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 mb-2">
                {isPlaying && (
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
                )}
                <span className="text-xs text-muted-foreground truncate">
                  {isLoading ? "Σύνδεση…" : isPlaying ? "Σε αναπαραγωγή" : "Πατήστε για αναπαραγωγή"}
                </span>
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
                  if (v > 0 && isMuted) { setIsMuted(false); if (audioRef.current) audioRef.current.muted = false; }
                }}
                className="w-full h-1 accent-primary cursor-pointer"
              />
            </div>

            <button onClick={toggleMute} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Footer */}
          <div className="px-4 pb-3">
            <a
              href={station.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              {station.websiteLabel} ↗
            </a>
          </div>
        </div>
      )}
    </>
  );
}
