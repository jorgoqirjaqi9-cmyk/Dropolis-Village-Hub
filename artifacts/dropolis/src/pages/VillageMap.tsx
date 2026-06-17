import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { SEO } from "@/components/SEO";
import { useListVillages } from "@workspace/api-client-react";
import { VILLAGE_COORDINATES } from "@/lib/village-coordinates";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Users, Mountain, ChevronRight, ArrowLeft } from "lucide-react";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type Village = {
  id: number;
  name: string;
  nameEl: string;
  description?: string | null;
  municipalUnit?: string | null;
  population?: number | null;
  elevation?: number | null;
  latitude?: number | null;
  longitude?: number | null;
};

const UNITS = [
  { key: "all", label: "Όλα" },
];

function getUnitLabel(_unit: string | null): string {
  return "";
}

function getUnitColor(_unit: string | null | undefined): string {
  return "#1d4ed8";
}

function createPinIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 40" width="28" height="40">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 9.625 14 28 14 28S28 23.625 28 14C28 6.268 21.732 0 14 0z"
        fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="14" cy="14" r="5.5" fill="white" opacity="0.92"/>
    </svg>`,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -42],
  });
}

function getCoords(v: Village): { lat: number; lng: number } | null {
  if (v.latitude != null && v.longitude != null) {
    return { lat: v.latitude, lng: v.longitude };
  }
  return VILLAGE_COORDINATES[v.nameEl] ?? VILLAGE_COORDINATES[v.name] ?? null;
}

function MapController({
  selectedId,
  villages,
  markerRefs,
}: {
  selectedId: number | null;
  villages: Village[];
  markerRefs: React.MutableRefObject<Map<number, L.Marker>>;
}) {
  const map = useMap();
  useEffect(() => {
    if (selectedId == null) return;
    const v = villages.find((x) => x.id === selectedId);
    if (!v) return;
    const coords = getCoords(v);
    if (!coords) return;
    map.flyTo([coords.lat, coords.lng], 14, { animate: true, duration: 0.7 });
    setTimeout(() => {
      markerRefs.current.get(selectedId)?.openPopup();
    }, 750);
  }, [selectedId, map, villages, markerRefs]);
  return null;
}

const popupLinkStyle: React.CSSProperties = {
  display: "block",
  padding: "5px 0",
  color: "#1d4ed8",
  fontSize: "13px",
  textDecoration: "none",
  fontWeight: 500,
};

export default function VillageMap() {
  const { data: villages, isLoading } = useListVillages();
  const [search, setSearch] = useState("");
  const [activeUnit, setActiveUnit] = useState("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const markerRefs = useRef<Map<number, L.Marker>>(new Map());
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filtered = (villages ?? []).filter((v) => {
    const matchSearch =
      v.nameEl.toLowerCase().includes(search.toLowerCase()) ||
      v.name.toLowerCase().includes(search.toLowerCase());
    const matchUnit = activeUnit === "all" || v.municipalUnit === activeUnit;
    return matchSearch && matchUnit;
  });

  const villagesWithCoords = filtered.filter((v) => getCoords(v) != null);

  function handleSelectVillage(id: number) {
    setSelectedId(id);
    const el = listRef.current?.querySelector(`[data-village-id="${id}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  const jsonLd = villages && villages.length > 0
    ? [
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Διαδραστικός Χάρτης Χωριών Δρόπολης",
          description: "Διαδραστικός χάρτης με τα 41 χωριά της Δρόπολης, πληροφορίες, φωτογραφίες, ειδήσεις και σύνδεση με κάθε χωριό.",
          url: "https://dropolis.net/villages/map",
          inLanguage: "el",
          numberOfItems: villages.length,
          about: {
            "@type": "Place",
            name: "Δρόπολη",
            containedInPlace: { "@type": "Place", name: "Βόρεια Ήπειρος, Αλβανία" },
          },
        },
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Χωριά Δρόπολης — Γεωγραφικές Συντεταγμένες",
          itemListElement: villages.map((v, i) => {
            const coords = getCoords(v);
            return {
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "Place",
                name: v.nameEl,
                alternateName: v.name,
                url: `https://dropolis.net/villages/${v.id}`,
                ...(coords
                  ? {
                      geo: {
                        "@type": "GeoCoordinates",
                        latitude: coords.lat,
                        longitude: coords.lng,
                      },
                    }
                  : {}),
                containedInPlace: {
                  "@type": "AdministrativeArea",
                  name: "Δρόπολη",
                  containedInPlace: { "@type": "Country", name: "Αλβανία" },
                },
              },
            };
          }),
        },
      ]
    : undefined;

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-4rem)]">
      <SEO
        title="Διαδραστικός Χάρτης Χωριών Δρόπολης | Dropolis"
        description="Διαδραστικός χάρτης με τα 41 χωριά της Δρόπολης, πληροφορίες, φωτογραφίες, ειδήσεις και σύνδεση με κάθε χωριό."
        breadcrumbs={[
          { name: "Χωριά", url: "/villages/" },
          { name: "Χάρτης", url: "/villages/map/" },
        ]}
        jsonLd={jsonLd}
      />

      {/* Top bar */}
      <div className="bg-primary text-primary-foreground px-4 py-4 md:px-6">
        <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex items-center gap-3 flex-1">
            <Link href="/villages/" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-serif font-bold leading-tight">
                Διαδραστικός Χάρτης Χωριών
              </h1>
              <p className="text-primary-foreground/70 text-sm">
                {isLoading ? "Φόρτωση..." : `${villagesWithCoords.length} από ${villages?.length ?? 0} χωριά στον χάρτη`}
              </p>
            </div>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-foreground/50 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Αναζήτηση χωριού..."
              className="pl-9 bg-white/15 border-white/25 text-white placeholder:text-white/50 focus-visible:ring-secondary"
            />
          </div>
        </div>

        {/* Unit filter tabs */}
        <div className="max-w-screen-xl mx-auto mt-3 flex flex-wrap gap-2">
          {UNITS.map((u) => (
            <button
              key={u.key}
              onClick={() => setActiveUnit(u.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                activeUnit === u.key
                  ? "bg-white text-primary border-white"
                  : "bg-white/10 text-primary-foreground/80 border-white/20 hover:bg-white/20"
              }`}
            >
              {u.label}
              <span className={`ml-1.5 text-xs ${activeUnit === u.key ? "opacity-60" : "opacity-50"}`}>
                {u.key === "all"
                  ? (villages?.length ?? 0)
                  : (villages?.filter((v) => v.municipalUnit === u.key).length ?? 0)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Map + list */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Map */}
        <div className="flex-1 relative" style={{ minHeight: "400px" }}>
          {!mounted || isLoading ? (
            <div className="absolute inset-0 bg-muted flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MapPin className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                <p className="text-sm">Φόρτωση χάρτη…</p>
              </div>
            </div>
          ) : (
            <MapContainer
              center={[39.964, 20.285]}
              zoom={12}
              style={{ width: "100%", height: "100%", minHeight: "400px" }}
              scrollWheelZoom
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapController
                selectedId={selectedId}
                villages={villages ?? []}
                markerRefs={markerRefs}
              />
              {filtered.map((v) => {
                const coords = getCoords(v);
                if (!coords) return null;
                const color = getUnitColor(v.municipalUnit);
                return (
                  <Marker
                    key={v.id}
                    position={[coords.lat, coords.lng]}
                    icon={createPinIcon(color)}
                    ref={(ref) => {
                      if (ref) markerRefs.current.set(v.id, ref);
                      else markerRefs.current.delete(v.id);
                    }}
                    eventHandlers={{
                      click: () => setSelectedId(v.id),
                    }}
                  >
                    <Popup minWidth={210} maxWidth={250}>
                      <div style={{ fontFamily: "inherit" }}>
                        <div style={{ fontWeight: 700, fontSize: "15px", lineHeight: 1.3, marginBottom: "2px" }}>
                          {v.nameEl}
                        </div>
                        <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "8px" }}>
                          {v.name}
                        </div>
                        {v.municipalUnit && (
                          <span style={{
                            display: "inline-block",
                            background: color,
                            color: "white",
                            borderRadius: "99px",
                            padding: "2px 9px",
                            fontSize: "11px",
                            fontWeight: 600,
                            marginBottom: "8px",
                          }}>
                            {getUnitLabel(v.municipalUnit)}
                          </span>
                        )}
                        {(v.population != null || v.elevation != null) && (
                          <div style={{ display: "flex", gap: "14px", fontSize: "12px", color: "#374151", marginBottom: "10px" }}>
                            {v.population != null && <span>👥 {v.population}</span>}
                            {v.elevation != null && <span>⛰ {v.elevation} m</span>}
                          </div>
                        )}
                        <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "8px", display: "flex", flexDirection: "column", gap: "2px" }}>
                          <a href={`/villages/${v.id}/`} style={popupLinkStyle}>
                            🏘 Άνοιγμα χωριού →
                          </a>
                          <a href={`/photos?village=${encodeURIComponent(v.nameEl)}`} style={popupLinkStyle}>
                            📷 Φωτογραφίες
                          </a>
                          <a href="/submit-news/" style={popupLinkStyle}>
                            📰 Στείλτε είδηση
                          </a>
                          <a href="/upload-photo/" style={popupLinkStyle}>
                            📤 Ανέβασε φωτογραφία
                          </a>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          )}
        </div>

        {/* Village list panel */}
        <div className="lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-border flex flex-col bg-card">
          <div className="px-4 py-3 border-b border-border bg-muted/30 shrink-0">
            <p className="text-sm font-semibold text-foreground">
              {filtered.length === 0
                ? "Δεν βρέθηκαν χωριά"
                : `${filtered.length} χωριά`}
            </p>
            {search && (
              <p className="text-xs text-muted-foreground">Αποτέλεσμα για «{search}»</p>
            )}
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto" style={{ maxHeight: "calc(100vh - 280px)", minHeight: "200px" }}>
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array(8).fill(0).map((_, i) => (
                  <div key={i} className="h-14 bg-muted/60 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                Δεν βρέθηκαν χωριά για «{search}».
              </div>
            ) : (
              filtered.map((v) => {
                const hasCoords = getCoords(v) != null;
                const isSelected = selectedId === v.id;
                return (
                  <button
                    key={v.id}
                    data-village-id={v.id}
                    onClick={() => hasCoords && handleSelectVillage(v.id)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 border-b border-border/40 transition-colors
                      ${isSelected ? "bg-primary/8 border-l-2 border-l-primary" : "hover:bg-muted/50"}
                      ${!hasCoords ? "opacity-50 cursor-default" : "cursor-pointer"}`}
                  >
                    <MapPin
                      className="w-4 h-4 mt-0.5 shrink-0"
                      style={{ color: getUnitColor(v.municipalUnit) }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className={`font-semibold text-sm truncate ${isSelected ? "text-primary" : ""}`}>
                        {v.nameEl}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{v.name}</div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                        {v.municipalUnit && (
                          <span style={{ color: getUnitColor(v.municipalUnit) }} className="font-medium">
                            {getUnitLabel(v.municipalUnit)}
                          </span>
                        )}
                        {v.population != null && (
                          <span className="flex items-center gap-0.5">
                            <Users className="w-3 h-3" />{v.population}
                          </span>
                        )}
                        {v.elevation != null && (
                          <span className="flex items-center gap-0.5">
                            <Mountain className="w-3 h-3" />{v.elevation}m
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 shrink-0 mt-1 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                  </button>
                );
              })
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
