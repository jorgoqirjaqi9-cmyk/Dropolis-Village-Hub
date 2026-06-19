import React, { useEffect, useState } from "react";
import { Wind, Droplets, Thermometer } from "lucide-react";

const LAT = 40.07;
const LON = 20.17;

const WMO_CODES: Record<number, { label: string; icon: string }> = {
  0:  { label: "Αίθριος", icon: "☀️" },
  1:  { label: "Σχεδόν αίθριος", icon: "🌤️" },
  2:  { label: "Μερικώς συννεφιά", icon: "⛅" },
  3:  { label: "Συννεφιά", icon: "☁️" },
  45: { label: "Ομίχλη", icon: "🌫️" },
  48: { label: "Ομίχλη (πάγος)", icon: "🌫️" },
  51: { label: "Ψιχάλα ελαφριά", icon: "🌦️" },
  53: { label: "Ψιχάλα", icon: "🌦️" },
  55: { label: "Ψιχάλα έντονη", icon: "🌧️" },
  61: { label: "Βροχή ελαφριά", icon: "🌧️" },
  63: { label: "Βροχή", icon: "🌧️" },
  65: { label: "Βροχή έντονη", icon: "🌧️" },
  71: { label: "Χιονόπτωση ελαφριά", icon: "🌨️" },
  73: { label: "Χιονόπτωση", icon: "❄️" },
  75: { label: "Χιονόπτωση έντονη", icon: "❄️" },
  80: { label: "Μπόρα ελαφριά", icon: "🌦️" },
  81: { label: "Μπόρα", icon: "🌧️" },
  82: { label: "Μπόρα έντονη", icon: "⛈️" },
  95: { label: "Καταιγίδα", icon: "⛈️" },
  96: { label: "Καταιγίδα με χαλάζι", icon: "⛈️" },
  99: { label: "Καταιγίδα με χαλάζι", icon: "⛈️" },
};

function getWeatherInfo(code: number) {
  return WMO_CODES[code] ?? { label: "Άγνωστο", icon: "🌡️" };
}

interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
}

export function WeatherWidget() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
      `&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m` +
      `&timezone=Europe%2FAthens`,
      { signal: controller.signal }
    )
      .then(r => r.json())
      .then(json => {
        const c = json.current;
        setData({
          temp: Math.round(c.temperature_2m),
          feelsLike: Math.round(c.apparent_temperature),
          humidity: c.relative_humidity_2m,
          windSpeed: Math.round(c.wind_speed_10m),
          weatherCode: c.weather_code,
        });
      })
      .catch(() => setError(true));
    return () => controller.abort();
  }, []);

  if (error) return null;

  const info = data ? getWeatherInfo(data.weatherCode) : null;

  return (
    <div
      className="inline-flex items-center gap-3 bg-black/30 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2.5 text-white shadow-lg w-full sm:w-auto max-w-xs sm:max-w-none"
      // minHeight reserves vertical space so the widget never shifts content below it.
      // Width is fluid on mobile (w-full max-w-xs) and auto on sm+ to prevent overflow
      // on narrow screens (360px) while keeping the desktop absolute-positioned look.
      style={{ minHeight: 52, contain: "layout" }}
    >
      {!data ? (
        <span className="text-white/80 text-sm animate-pulse" style={{ display: "inline-block", width: 220 }}>Φόρτωση καιρού…</span>
      ) : (
        <>
          <span className="text-3xl leading-none">{info!.icon}</span>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold leading-none">{data.temp}°</span>
              <span className="text-xs text-white/80 font-medium">{info!.label}</span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-xs text-white/80">
                <Droplets size={11} />
                {data.humidity}%
              </span>
              <span className="flex items-center gap-1 text-xs text-white/80">
                <Wind size={11} />
                {data.windSpeed} km/h
              </span>
              <span className="flex items-center gap-1 text-xs text-white/80">
                <Thermometer size={11} />
                Αίσθηση {data.feelsLike}°
              </span>
            </div>
          </div>
          <div className="border-l border-white/20 pl-3 hidden sm:block">
            <p className="text-xs text-white/80 leading-tight">Δρόπολη</p>
            <p className="text-xs text-white/70 leading-tight">Αλβανία</p>
          </div>
        </>
      )}
    </div>
  );
}
