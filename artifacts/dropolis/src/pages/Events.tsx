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

function formatGreekTime(timeStr: string): string {
  const hour = parseInt(timeStr.split(":")[0] ?? "0", 10);
  return `${timeStr} ${hour < 12 ? "πμ" : "μμ"}`;
}

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
        description="Ανακαλύψτε πανηγύρια, πολιτιστικές εκδηλώσεις και εορτασμούς από τα χωριά της Δρόπολης Β. Ηπείρου. Καταχωρήστε και τη δική σας εκδήλωση."
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
                        {formatGreekTime(ev.eventTime)}
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
                <p className="text-sm text-muted-foreground leading-relaxed flex-1 whitespace-pre-line">
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

      {/* SEO content section */}
      <section aria-label="Πληροφορίες για τις εκδηλώσεις της Δρόπολης" className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <h2 className="text-xl md:text-2xl font-serif font-bold text-foreground">
          Πανηγύρια και Εκδηλώσεις στη Δρόπολη
        </h2>
        <p>
          Η σελίδα Εκδηλώσεις &amp; Πανηγύρια του Dropolis.net συγκεντρώνει ανακοινώσεις από τα 41 χωριά
          της Δρόπολης και της Βόρειας Ηπείρου. Εδώ προβάλλονται πανηγύρια, πολιτιστικές βραδιές,
          θρησκευτικοί εορτασμοί, χορευτικές εκδηλώσεις, συναυλίες και κάθε κοινοτική δραστηριότητα
          που αφορά τα χωριά της περιοχής — από την άνω ως την κάτω Δρόπολη ως το Πωγώνι.
        </p>

        <div className="space-y-2">
          <h3 className="text-base font-semibold text-foreground">Γιατί να καταχωρήσετε την εκδήλωσή σας</h3>
          <p>
            Καταχωρώντας μια εκδήλωση στο Dropolis.net, ενημερώνετε άμεσα την κοινότητα — τους κατοίκους
            που ζουν στα χωριά αλλά και την ομογένεια που βρίσκεται στην Ελλάδα, στη Γερμανία, στην
            Αυστραλία και σε κάθε γωνιά του κόσμου. Η ανακοίνωση εμφανίζεται στη λίστα εκδηλώσεων, μπορεί
            να συνδεθεί με το αντίστοιχο{" "}
            <Link href="/villages/" className="text-primary hover:underline font-medium">
              χωριό στον κατάλογο
            </Link>{" "}
            και να συνοδεύεται από{" "}
            <Link href="/photos/" className="text-primary hover:underline font-medium">
              φωτογραφίες
            </Link>{" "}
            που αποτυπώνουν τη στιγμή.
          </p>
          <p>
            Κάθε εκδήλωση που δημοσιεύεται γίνεται μέρος του ψηφιακού αρχείου της Δρόπολης. Δεν είναι
            μόνο ανακοίνωση — είναι τεκμηρίωση. Η καταγραφή δίνει στους νέους της ομογένειας τη
            δυνατότητα να μάθουν, να παρακολουθήσουν και να συμμετάσχουν ακόμα κι από μακριά.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-base font-semibold text-foreground">Η ζωντανή παράδοση των χωριών</h3>
          <p>
            Η παράδοση της Δρόπολης ζει μέσα από τις πλατείες, τις εκκλησίες, τα τραγούδια, τους χορούς
            και τις οικογενειακές συναντήσεις. Κάθε εκδήλωση είναι μια μικρή μαρτυρία συνέχειας: ενώνει
            ανθρώπους που ζουν στα χωριά με όσους βρίσκονται σε άλλες πόλεις και χώρες.
          </p>
          <p>
            Τα πανηγύρια στα χωριά της Δρόπολης — από τα Βρυσέρα και τον Άγιο Βασίλη μέχρι τη Λέκλη
            και τη Σελεβίτσα — διατηρούν ζωντανά έθιμα αιώνων. Αγιασμοί, παραδοσιακά τραγούδια,
            χορευτικά συγκροτήματα συλλόγων και εκδηλώσεις μνήμης αποτελούν τον πυρήνα της κοινοτικής
            ζωής. Το Dropolis.net τα καταγράφει και τα κρατά ζωντανά — τόσο σε{" "}
            <Link href="/news/" className="text-primary hover:underline font-medium">
              ειδήσεις
            </Link>{" "}
            όσο και σε{" "}
            <Link href="/photos/" className="text-primary hover:underline font-medium">
              φωτογραφίες
            </Link>
            .
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-base font-semibold text-foreground">Πώς βοηθά η συμμετοχή της κοινότητας</h3>
          <p>
            Μέσα από το Dropolis.net μπορείτε να στείλετε την εκδήλωση του χωριού σας με ημερομηνία, ώρα,
            τοποθεσία, περιγραφή και φωτογραφία. Μετά τον έλεγχο της ομάδας, η ανακοίνωση εμφανίζεται
            αμέσως στη σελίδα εκδηλώσεων και μπορεί να συνδεθεί με το αντίστοιχο χωριό στα{" "}
            <Link href="/villages/" className="text-primary hover:underline font-medium">
              41 χωριά της Δρόπολης
            </Link>
            .
          </p>
          <p>
            Η συμμετοχή κάθε χωριού ενισχύει έναν κοινό ψηφιακό τόπο μνήμης και επικοινωνίας. Όσο
            περισσότερες εκδηλώσεις καταχωρούνται, τόσο πιο πλούσια γίνεται η εικόνα της σύγχρονης
            Δρόπολης — για κατοίκους, για απόδημους, για ιστορικούς και για κάθε άνθρωπο που νιώθει
            δεσμό με αυτή τη γωνιά της Βόρειας Ηπείρου.
          </p>
          <p>
            Αν έχετε μια εκδήλωση να ανακοινώσετε — πανηγύρι, εορτασμό, πολιτιστική βραδιά ή
            οποιαδήποτε κοινοτική δραστηριότητα — μπορείτε να την{" "}
            <Link href="/submit-event/" className="text-primary hover:underline font-medium">
              καταχωρήσετε εδώ
            </Link>
            .
          </p>
        </div>

        {/* Internal links row */}
        <div className="pt-2 border-t border-border flex flex-wrap gap-3">
          <Link href="/submit-event/" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium">
            <CalendarDays className="w-3.5 h-3.5" />
            Καταχώρηση εκδήλωσης
          </Link>
          <Link href="/villages/" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium">
            <ChevronRight className="w-3.5 h-3.5" />
            41 Χωριά Δρόπολης
          </Link>
          <Link href="/photos/" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium">
            <ChevronRight className="w-3.5 h-3.5" />
            Φωτογραφίες
          </Link>
          <Link href="/news/" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium">
            <ChevronRight className="w-3.5 h-3.5" />
            Ειδήσεις Δρόπολης
          </Link>
        </div>
      </section>
    </div>
  );
}
