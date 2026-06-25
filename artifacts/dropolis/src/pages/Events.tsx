import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SEO } from "@/components/SEO";
import { useListVillages } from "@workspace/api-client-react";
import { CalendarDays, MapPin, Clock, ChevronRight, AlertCircle, Filter } from "lucide-react";
import { AdSenseSlot } from "@/components/AdSenseSlot";

type EventPublic = {
  id: number;
  title: string;
  eventDate: string;
  eventTime: string | null;
  villageId: number | null;
  location: string | null;
  description: string;
  imageUrl: string | null;
  contactInfo: string | null;
  status: string;
  submittedAt: string;
};

function formatGreekDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const d = new Date(year!, month! - 1, day!);
    return d.toLocaleDateString("el-GR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export default function Events() {
  const [villageFilter, setVillageFilter] = useState<string>("");
  const [showPast, setShowPast] = useState(false);

  const { data: villages } = useListVillages();

  const params = new URLSearchParams();
  if (villageFilter) params.set("villageId", villageFilter);
  if (showPast) params.set("past", "true");
  params.set("limit", "60");
  const qs = params.toString();

  const { data: events, isLoading, isError } = useQuery<EventPublic[]>({
    queryKey: ["events", qs],
    queryFn: async () => {
      const res = await fetch(`/api/events${qs ? "?" + qs : ""}`);
      if (!res.ok) throw new Error("Αποτυχία φόρτωσης εκδηλώσεων.");
      return res.json();
    },
  });

  const villageMap = new Map(villages?.map((v) => [v.id, v.nameEl]) ?? []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
      <SEO
        title="Εκδηλώσεις & Πανηγύρια — Δρόπολη"
        description="Εκδηλώσεις, πανηγύρια και πολιτιστικές εκδηλώσεις από τα χωριά της Δρόπολης Β. Ηπείρου."
        breadcrumbs={[{ name: "Εκδηλώσεις", url: "/events/" }]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Εκδηλώσεις & Πανηγύρια — Dropolis",
          description: "Εκδηλώσεις, πανηγύρια και πολιτιστικές εκδηλώσεις από τα χωριά της Δρόπολης.",
          url: "https://dropolis.net/events",
          inLanguage: "el",
        }}
      />

      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden bg-primary text-primary-foreground p-8 shadow-lg">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 70% 50%, white 0%, transparent 60%)" }} />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">Εκδηλώσεις & Πανηγύρια</h1>
            <p className="text-primary-foreground/80">
              Πολιτιστικές εκδηλώσεις, πανηγύρια και εορτασμοί από τα χωριά της Δρόπολης
            </p>
          </div>
          <Link
            href="/submit-event/"
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold transition-colors text-sm"
          >
            <CalendarDays className="w-4 h-4" />
            Καταχώρηση Εκδήλωσης
          </Link>
        </div>
      </div>

      <AdSenseSlot adSlot="events-top" className="my-2" />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span className="font-medium">Φίλτρα:</span>
        </div>
        <select
          value={villageFilter}
          onChange={(e) => setVillageFilter(e.target.value)}
          className="rounded-xl border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">Όλα τα χωριά</option>
          {villages
            ?.slice()
            .sort((a, b) => a.nameEl.localeCompare(b.nameEl, "el"))
            .map((v) => (
              <option key={v.id} value={String(v.id)}>
                {v.nameEl}
              </option>
            ))}
        </select>
        <div className="flex rounded-xl border bg-background overflow-hidden text-sm">
          <button
            onClick={() => setShowPast(false)}
            className={`px-3 py-1.5 transition-colors ${!showPast ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
          >
            Επερχόμενες
          </button>
          <button
            onClick={() => setShowPast(true)}
            className={`px-3 py-1.5 transition-colors ${showPast ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
          >
            Παρελθόν
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Αδυναμία φόρτωσης εκδηλώσεων. Δοκιμάστε ξανά.
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && events?.length === 0 && (
        <div className="text-center py-16 space-y-4">
          <CalendarDays className="w-16 h-16 text-muted-foreground/40 mx-auto" />
          <p className="text-muted-foreground text-lg">
            {showPast ? "Δεν βρέθηκαν παρελθοντικές εκδηλώσεις." : "Δεν υπάρχουν επερχόμενες εκδηλώσεις."}
          </p>
          <Link href="/submit-event/" className="inline-flex items-center gap-2 text-primary hover:underline text-sm font-medium">
            <CalendarDays className="w-4 h-4" />
            Καταχωρήστε εκδήλωση
          </Link>
        </div>
      )}

      {/* Events grid */}
      {!isLoading && events && events.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {events.map((ev) => (
            <article
              key={ev.id}
              className="group flex flex-col bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              {ev.imageUrl && (
                <div className="aspect-video overflow-hidden bg-muted">
                  <img
                    src={ev.imageUrl}
                    alt={ev.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="flex flex-col flex-1 p-5">
                <h2 className="font-semibold text-foreground text-base leading-snug mb-3 line-clamp-2">
                  {ev.title}
                </h2>
                <div className="flex flex-col gap-1.5 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1.5 font-medium text-primary">
                    <CalendarDays className="w-3.5 h-3.5" />
                    {formatGreekDate(ev.eventDate)}
                    {ev.eventTime && (
                      <span className="flex items-center gap-1 ml-1 text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {ev.eventTime}
                      </span>
                    )}
                  </span>
                  {(ev.location || ev.villageId) && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {ev.location ?? (ev.villageId ? villageMap.get(ev.villageId) : null) ?? "Δρόπολη"}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">
                  {ev.description}
                </p>
                {ev.contactInfo && (
                  <p className="mt-2 text-xs text-muted-foreground border-t border-border pt-2">
                    📞 {ev.contactInfo}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <AdSenseSlot adSlot="events-bottom" className="my-4" />

      {/* Submit CTA */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center space-y-3">
        <CalendarDays className="w-10 h-10 text-primary mx-auto" />
        <h2 className="font-semibold text-foreground">Έχετε μια εκδήλωση να ανακοινώσετε;</h2>
        <p className="text-sm text-muted-foreground">
          Στείλτε μας τα στοιχεία της εκδήλωσής σας και θα τη δημοσιεύσουμε μετά από έλεγχο.
        </p>
        <Link
          href="/submit-event/"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors text-sm"
        >
          <CalendarDays className="w-4 h-4" />
          Καταχώρηση Εκδήλωσης
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
