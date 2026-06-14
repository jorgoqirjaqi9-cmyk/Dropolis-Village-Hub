import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Radio, X, Volume2, VolumeX } from "lucide-react";

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

type StationId = (typeof STATIONS)[number]["id"];

function StationRow({
  station,
  onFirstPlay,
}: {
  station: (typeof STATIONS)[number];
  onFirstPlay: () => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      audio.src = "";
      setIsPlaying(false);
      setIsLoading(false);
    } else {
      onFirstPlay();
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

  // expose play for the global radio-play event (triggers first station)
  useEffect(() => {
    if (station.id !== "menta88") return;
    const handler = () => {
      const audio = audioRef.current;
      if (!audio || isPlaying) return;
      onFirstPlay();
      setIsLoading(true);
      audio.src = station.streamUrl;
      audio.volume = volume;
      audio.play()
        .then(() => { setIsPlaying(true); setIsLoading(false); })
        .catch(() => { setIsLoading(false); });
    };
    window.addEventListener("radio-play", handler);
    return () => window.removeEventListener("radio-play", handler);
  }, [isPlaying, station, volume, onFirstPlay]);

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
            {isPlaying && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />}
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
              if (v > 0 && isMuted) { setIsMuted(false); if (audioRef.current) audioRef.current.muted = false; }
            }}
            className="w-full h-1 accent-primary cursor-pointer"
          />
        </div>

        {/* Mute */}
        <button onClick={toggleMute} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
          {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </>
  );
}

export function RadioPlayer() {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => setIsOpen(true);

  const handleClose = () => {
    // Pause all audio by reloading the component key — simplest approach
    setIsOpen(false);
    setTimeout(() => setIsOpen(false), 0);
  };

  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener("radio-play", handler);
    return () => window.removeEventListener("radio-play", handler);
  }, []);

  return (
    <>
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 h-9 px-4 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center gap-2 hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
          title="Radio"
        >
          <Radio className="w-4 h-4 text-secondary" />
          <span className="text-xs font-semibold">Live Radio</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-72 rounded-2xl shadow-2xl overflow-hidden border border-border/40 bg-card">
          {/* Header */}
          <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-secondary shrink-0" />
              <p className="font-semibold text-sm">Live Radio</p>
            </div>
            <button onClick={handleClose} className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Station rows */}
          <div className="divide-y divide-border/40">
            {STATIONS.map((s, idx) => (
              <StationRow key={s.id} station={s} onFirstPlay={() => {}} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
