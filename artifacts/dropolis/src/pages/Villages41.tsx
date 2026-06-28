import { useState, useMemo } from "react";
import { Link } from "wouter";
import { SEO } from "@/components/SEO";
import { AdSenseSlot } from "@/components/AdSenseSlot";
import { useListVillages } from "@workspace/api-client-react";
import {
  ChevronRight, MapPin, Church, Mountain, Camera,
  Users, HelpCircle, Map, BookOpen, Star, Home,
  Search, ArrowUpDown, ArrowUp, ArrowDown,
} from "lucide-react";

// ─── SEO constants ────────────────────────────────────────────────────────────

const PAGE_URL   = "https://dropolis.net/ta-41-xoria-tis-dropolis/";
const PAGE_TITLE = "Τα 41 Χωριά της Δρόπολης — Ιστορία & Παράδοση";
const PAGE_DESC  =
  "Ανακαλύψτε τα 41 ελληνικά χωριά της Δρόπολης στη Βόρεια Ήπειρο. Ιστορία, αξιοθέατα, " +
  "φωτογραφίες και πολιτιστική κληρονομιά της ομογένειας.";
const PAGE_KW    =
  "41 χωριά Δρόπολης, Βόρεια Ήπειρος, ελληνική μειονότητα, Αργυρόκαστρο, Dropull, " +
  "ιστορία χωριών Δρόπολης, παραδοσιακά χωριά Βορείου Ηπείρου, χάρτης Δρόπολης, " +
  "πολιτισμός Δρόπολη, αξιοθέατα Βόρεια Ήπειρος";

// ─── JSON-LD ──────────────────────────────────────────────────────────────────

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": PAGE_URL,
    url: PAGE_URL,
    name: PAGE_TITLE,
    description: PAGE_DESC,
    inLanguage: "el",
    publisher: {
      "@type": "Organization",
      name: "Δρόπολη — Dropolis",
      url: "https://dropolis.net/",
      logo: { "@type": "ImageObject", url: "https://dropolis.net/og-home.jpg" },
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Αρχική",   item: "https://dropolis.net/" },
        { "@type": "ListItem", position: 2, name: "Χωριά",    item: "https://dropolis.net/villages/" },
        { "@type": "ListItem", position: 3, name: "Τα 41 Χωριά", item: PAGE_URL },
      ],
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Πού βρίσκεται η Δρόπολη;",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Η Δρόπολη βρίσκεται στη νότια Αλβανία, στην περιοχή του Αργυροκάστρου (Gjirokastra), και αποτελεί τμήμα της ιστορικής Βορείου Ηπείρου. Διασχίζεται από τον ποταμό Δρίνο (Drino).",
        },
      },
      {
        "@type": "Question",
        name: "Πόσα χωριά έχει η Δρόπολη;",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Η Δρόπολη αριθμεί 41 χωριά που ανήκουν στον Δήμο Δρόπολης (Bashkia Dropull). Χωρίζονται γεωγραφικά σε Κάτω Δρόπολη, Άνω Δρόπολη και σε χωριά της ευρύτερης περιοχής.",
        },
      },
      {
        "@type": "Question",
        name: "Ποια είναι η σχέση της Δρόπολης με τη Βόρεια Ήπειρο;",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Η Δρόπολη αποτελεί ιστορικό πυρήνα του Ελληνισμού της Βορείου Ηπείρου. Η ελληνική μειονότητα διατηρεί ζωντανή παρουσία με ελληνόφωνα σχολεία, ορθόδοξες εκκλησίες και πολιτιστικές οργανώσεις.",
        },
      },
      {
        "@type": "Question",
        name: "Πώς μπορώ να ανεβάσω φωτογραφίες ή νέα από το χωριό μου;",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Μπορείτε να υποβάλετε φωτογραφίες μέσω της σελίδας «Υποβολή Φωτογραφίας» και νέα μέσω της φόρμας «Αποστολή Είδησης» στο Dropolis.net. Κάθε υποβολή αξιολογείται από την ομάδα μας πριν δημοσιευτεί.",
        },
      },
    ],
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionIcon({ icon: Icon, color }: { icon: React.ElementType; color: string }) {
  return (
    <span className={`inline-flex w-9 h-9 rounded-xl items-center justify-center shrink-0 ${color}`}>
      <Icon className="w-4.5 h-4.5" />
    </span>
  );
}

function H2Section({
  id,
  icon,
  iconColor,
  title,
  children,
}: {
  id: string;
  icon: React.ElementType;
  iconColor: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-20">
      <div className="flex items-center gap-3 mb-5">
        <SectionIcon icon={icon} color={iconColor} />
        <h2 id={`${id}-heading`} className="text-xl sm:text-2xl font-bold text-foreground">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-lg font-semibold text-foreground mb-2 mt-6">
      {children}
    </h3>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="prose prose-stone dark:prose-invert max-w-none text-base leading-relaxed space-y-3 text-foreground/90">
      {children}
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-5">
      <p className="font-semibold text-foreground mb-2 flex items-start gap-2">
        <HelpCircle className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
        {q}
      </p>
      <p className="text-sm text-foreground/80 leading-relaxed pl-6">{a}</p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type SortField = "nameEl" | "name" | "population";
type SortDir = "asc" | "desc";

export default function Villages41() {
  const { data: villages, isLoading: villagesLoading } = useListVillages();
  const [query, setQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("nameEl");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const filteredVillages = useMemo(() => {
    if (!villages) return [];
    const q = query.trim().toLowerCase();
    const list = q
      ? villages.filter(
          v =>
            (v.nameEl ?? "").toLowerCase().includes(q) ||
            (v.name ?? "").toLowerCase().includes(q) ||
            (v.municipalUnit ?? "").toLowerCase().includes(q),
        )
      : [...villages];
    list.sort((a, b) => {
      let va: string | number = "";
      let vb: string | number = "";
      if (sortField === "nameEl") { va = a.nameEl ?? a.name ?? ""; vb = b.nameEl ?? b.name ?? ""; }
      else if (sortField === "name") { va = a.name ?? ""; vb = b.name ?? ""; }
      else if (sortField === "population") { va = a.population ?? -1; vb = b.population ?? -1; }
      if (typeof va === "number") return sortDir === "asc" ? va - (vb as number) : (vb as number) - va;
      return sortDir === "asc" ? va.localeCompare(vb as string, "el") : (vb as string).localeCompare(va, "el");
    });
    return list;
  }, [villages, query, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />;
    return sortDir === "asc"
      ? <ArrowUp className="w-3.5 h-3.5 text-primary" />
      : <ArrowDown className="w-3.5 h-3.5 text-primary" />;
  }

  return (
    <>
      <SEO
        title={PAGE_TITLE}
        standalone
        description={PAGE_DESC}
        keywords={PAGE_KW}
        type="website"
        jsonLd={jsonLd}
        breadcrumbs={[
          { name: "Αρχική", url: "https://dropolis.net/" },
          { name: "Χωριά",  url: "https://dropolis.net/villages/" },
          { name: "Τα 41 Χωριά", url: PAGE_URL },
        ]}
      />

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-primary via-primary/90 to-emerald-900 text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.3' fill-rule='evenodd'%3E%3Ccircle cx='40' cy='40' r='2'/%3E%3Ccircle cx='0' cy='0' r='2'/%3E%3Ccircle cx='80' cy='0' r='2'/%3E%3Ccircle cx='0' cy='80' r='2'/%3E%3Ccircle cx='80' cy='80' r='2'/%3E%3C/g%3E%3C/svg%3E\")",
          }}
          aria-hidden="true"
        />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-white/60 text-sm mb-6">
            <Link href="/" className="hover:text-white/90 transition-colors">Αρχική</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/villages/" className="hover:text-white/90 transition-colors">Χωριά</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white/90">Τα 41 Χωριά</span>
          </nav>
          <div className="flex items-start gap-4">
            <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white/10 items-center justify-center text-3xl shrink-0">
              🏘️
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight tracking-tight mb-4">
                Τα 41 Χωριά της <strong className="text-secondary">Δρόπολης</strong>:<br className="hidden sm:block" />
                Ιστορία, Πολιτισμός &amp; Αξιοθέατα
              </h1>
              <p className="text-white/85 text-base sm:text-lg leading-relaxed max-w-2xl">
                Πλήρης οδηγός για τα <strong className="text-white">41 χωριά της Δρόπολης στη Βόρεια Ήπειρο</strong> —
                από την αρχαία ιστορία και τους βυζαντινούς ναούς έως τη ζωντανή κοινότητα της{" "}
                <strong className="text-white">ελληνικής μειονότητας</strong> στο{" "}
                <strong className="text-white">Αργυρόκαστρο</strong> και την ομογένεια ανά τον κόσμο.
              </p>
              <div className="flex flex-wrap gap-2 mt-5">
                {["41 χωριά", "Βόρεια Ήπειρος", "ελλην. μειονότητα", "Αργυρόκαστρο", "Dropull"].map((tag) => (
                  <span
                    key={tag}
                    className="inline-block px-3 py-1 rounded-full bg-white/15 text-white/90 text-xs font-medium border border-white/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main content ──────────────────────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-16">

        {/* ── 1. Τι είναι η Δρόπολη ───────────────────────────────────────── */}
        <H2Section id="ti-einai" icon={BookOpen} iconColor="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" title="Τι είναι η Δρόπολη και γιατί έχει ιστορική σημασία">
          <Prose>
            <p>
              Η <strong>Δρόπολη</strong> είναι μια από τις πιο σημαντικές ιστορικές περιοχές της{" "}
              <strong>Βορείου Ηπείρου</strong>. Εκτείνεται κατά μήκος της κοιλάδας του ποταμού Δρίνου (Drino),
              στη νότια Αλβανία, βορειοδυτικά του Αργυροκάστρου — της ιστορικής πρωτεύουσας του νοτιοαλβανικού
              ελληνισμού. Τα <strong>41 χωριά της Δρόπολης</strong> αποτελούν έναν αδιάσπαστο πολιτισμικό ιστό
              αιώνων, με διατηρημένη ελληνική γλώσσα, ορθόδοξη παράδοση και ζωντανές τοπικές κοινότητες.
            </p>
          </Prose>

          <H3>Η Δρόπολη στη Βόρεια Ήπειρο</H3>
          <Prose>
            <p>
              Η περιοχή ορίζεται γεωγραφικά από τα βουνά του Δρίνου στα δυτικά, τις κορυφές του Κελτσυρέ στα
              ανατολικά, και το νότιο τμήμα της αλβανικής επικράτειας προς τα ελληνοαλβανικά σύνορα. Τα{" "}
              <strong>παραδοσιακά χωριά της Βορείου Ηπείρου</strong> που συνθέτουν τη Δρόπολη φέρουν ονόματα
              με βαθιές ελληνικές ρίζες: Φοινίκη, Δερβιτσιάνη, Βουνοπόλης, Γοραντζή, Αντιγόνεια — κάθε τοπωνύμιο
              αποτελεί ζωντανό μάρτυρα της ιστορίας της Ηπείρου.
            </p>
            <p>
              Η Δρόπολη εντάσσεται διοικητικά στον{" "}
              <strong>Δήμο Δρόπολης (Bashkia Dropull)</strong>, που υπάγεται στην Περιφέρεια Αργυροκάστρου
              (Qarku i Gjirokastrës) της Αλβανίας. Οι{" "}
              <strong>νέα από τη Δρόπολη και το Αργυρόκαστρο</strong> που φτάνουν στο Dropolis.net
              αντικατοπτρίζουν την καθημερινή ζωή, τους αγώνες και τις χαρές μιας κοινότητας που διατηρεί
              την ταυτότητά της με αξιοθαύμαστη επιμονή.
            </p>
          </Prose>

          <H3>Η ελληνική μειονότητα στην περιοχή Αργυροκάστρου</H3>
          <Prose>
            <p>
              Η <strong>ελληνική μειονότητα στη Δρόπολη Αλβανίας</strong> αποτελεί μια από τις μεγαλύτερες
              και πιο συνεκτικές ελληνικές κοινότητες εκτός ελληνικής επικράτειας. Διατηρεί ελληνόγλωσσα
              σχολεία σε πολλά χωριά, δεκάδες ενεργές ορθόδοξες ενορίες, τοπικούς πολιτιστικούς συλλόγους,
              και ισχυρούς δεσμούς με την Ελλάδα μέσω της διασποράς.
            </p>
            <p>
              Οι <strong>Δρόπολη Αργυρόκαστρο νέα και πληροφορίες</strong> που συγκεντρώνει το Dropolis.net
              καλύπτουν ζητήματα μειονοτικών δικαιωμάτων, εκπαίδευσης, εκκλησιαστικής ζωής, τοπικής
              ανάπτυξης και πολιτιστικών εκδηλώσεων — διαμορφώνοντας ένα ολοκληρωμένο πορτρέτο της κοινότητας.
            </p>
          </Prose>

          <H3>Dropull, Dropolis και η ιστορική ταυτότητα της περιοχής</H3>
          <Prose>
            <p>
              Η λέξη <strong>Dropull</strong> (αλβανική απόδοση του ελληνικού «Δρόπολη») απαντά σε βυζαντινά
              χρονικά και οθωμανικά κατάστιχα ως δήλωση της συγκεκριμένης κοιλάδας με τον ελληνόφωνο πληθυσμό
              της. Το Dropolis.net αντλεί το όνομά του από αυτή την παράδοση, λειτουργώντας ως ψηφιακός
              κόμβος για τη διασύνδεση όλων των{" "}
              <strong>ιστορικών χωριών ελληνικής μειονότητας στην Αλβανία</strong>{" "}
              με την ομογένεια και την ελληνική κοινωνία.
            </p>
          </Prose>
        </H2Section>

        {/* ── 2. Τα 41 χωριά ──────────────────────────────────────────────── */}
        <H2Section id="ta-41-xoria" icon={MapPin} iconColor="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" title="Τα 41 χωριά της Δρόπολης">
          <Prose>
            <p>
              Τα <strong>41 χωριά της Δρόπολης στη Βόρεια Ήπειρο</strong> διαφέρουν σε μέγεθος, υψόμετρο και
              χαρακτήρα — από μικρά ορεινά χωριά με λίγες εκατοντάδες κατοίκους έως μεγαλύτερες κωμοπόλεις
              με κεντρική θέση στην πολιτιστική ζωή της περιοχής. Κάθε χωριό έχει τη δική του ιστορία,
              εκκλησία, πανηγύρι και τοπικό χαρακτήρα — και όλα μαζί συνθέτουν την ενιαία ταυτότητα της
              Δρόπολης.
            </p>
          </Prose>

          <H3>Χωριά της κοιλάδας (νότια ζώνη)</H3>
          <Prose>
            <p>
              Η νότια ζώνη της Δρόπολης περιλαμβάνει τα χωριά της κοιλάδας και των πρόποδων, πολλά εκ των οποίων
              έχουν άμεση πρόσβαση στην εθνική οδό. Η <strong>Φοινίκη</strong> (Finiqi), διοικητικό κέντρο
              του Δήμου, η <strong>Δερβιτσιάνη</strong>, το <strong>Λεκλί</strong>, η <strong>Βουνοπόλης</strong>,
              η <strong>Γοραντζή</strong> και το <strong>Σόφρατο</strong> είναι μερικά από τα πιο γνωστά χωριά
              της Δρόπολης με ισχυρή ελληνόφωνη παρουσία.
            </p>
          </Prose>

          <H3>Χωριά της ορεινής ζώνης (βόρεια ζώνη)</H3>
          <Prose>
            <p>
              Τα χωριά της βόρειας ζώνης της Δρόπολης βρίσκονται σε υψηλότερα υψόμετρα και διατηρούν συχνά αρχαιότερη
              αρχιτεκτονική κληρονομιά. Η <strong>Αντιγόνεια</strong> — γνωστή για τα αρχαία ερείπιά της —,
              ο <strong>Παραπόταμος</strong>, το <strong>Τσεπέλοβο</strong>, τα <strong>Λιούμπονιε</strong>
              και άλλα χωριά αποτελούν την «καρδιά» της ιστορίας των χωριών της Δρόπολης στη Βόρεια Ήπειρο.
            </p>
          </Prose>

          <H3>Χωριά της περιοχής Πωγωνίου</H3>
          <Prose>
            <p>
              Στα όρια μεταξύ της Δρόπολης και του γειτονικού Πωγωνίου βρίσκονται χωριά με διπλή
              πολιτισμική ταυτότητα — ανήκουν διοικητικά στη μία περιοχή αλλά μοιράζονται έθιμα,
              εκκλησίες και οικογενειακές δεσμεύσεις και με τις δύο. Η διασύνδεση αυτή αποτελεί
              χαρακτηριστικό παράδειγμα του πώς ο ελληνισμός της Βορείου Ηπείρου υπερβαίνει
              διοικητικά όρια.
            </p>
          </Prose>

          <H3>Πώς συνδέονται τα χωριά μεταξύ τους ιστορικά και πολιτιστικά</H3>
          <Prose>
            <p>
              Η <strong>ιστορία των χωριών της Δρόπολης</strong> είναι ιστορία αλληλοβοήθειας και κοινής
              τύχης. Η κοινή γλώσσα, η ορθόδοξη πίστη, τα πανηγύρια που τελούνται σε εκατοντάδες
              ναούς και τα γαμήλια έθιμα που ενώνουν οικογένειες από διαφορετικά χωριά συναποτελούν
              τον κοινωνικό ιστό αυτής της κοινότητας. Το <Link href="/villages/map/" className="text-primary underline underline-offset-2 hover:no-underline">διαδραστικό χάρτη των 41 χωριών</Link> μπορείτε να τον εξερευνήσετε στο Dropolis.net.
            </p>
          </Prose>

          {/* ── Searchable / sortable village table ── */}
          <div className="mt-6 space-y-3">
            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Αναζήτηση χωριού (ελληνικά ή αλβανικά)…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
              />
            </div>

            {/* Table */}
            {villagesLoading ? (
              <div className="grid grid-cols-1 gap-1.5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-11 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-[2fr_2fr_1fr] bg-muted/60 text-xs font-semibold text-muted-foreground uppercase tracking-wide divide-x divide-border border-b border-border">
                  <button
                    type="button"
                    onClick={() => toggleSort("nameEl")}
                    className="flex items-center gap-1.5 px-4 py-3 hover:text-foreground transition-colors text-left"
                  >
                    Ελληνικό Όνομα <SortIcon field="nameEl" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSort("name")}
                    className="flex items-center gap-1.5 px-4 py-3 hover:text-foreground transition-colors text-left"
                  >
                    Αλβανικό Όνομα <SortIcon field="name" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSort("population")}
                    className="flex items-center gap-1.5 px-4 py-3 hover:text-foreground transition-colors text-left"
                  >
                    Πληθ. <SortIcon field="population" />
                  </button>
                </div>

                {/* Rows */}
                {filteredVillages.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    Δεν βρέθηκαν χωριά για «{query}».
                  </div>
                ) : (
                  filteredVillages.map((v, idx) => (
                    <Link
                      key={v.id}
                      href={`/villages/${v.id}/`}
                      className={`grid grid-cols-[2fr_2fr_1fr] divide-x divide-border text-sm hover:bg-primary/5 transition-colors group ${idx % 2 === 0 ? "bg-background" : "bg-muted/20"}`}
                    >
                      <span className="flex items-center gap-2 px-4 py-3 font-medium text-foreground group-hover:text-primary transition-colors">
                        <MapPin className="w-3 h-3 shrink-0 text-muted-foreground group-hover:text-primary" />
                        {v.nameEl ?? v.name}
                      </span>
                      <span className="flex items-center px-4 py-3 text-muted-foreground">
                        {v.name ?? "—"}
                      </span>
                      <span className="flex items-center px-4 py-3 text-muted-foreground tabular-nums">
                        {v.population != null ? v.population.toLocaleString("el-GR") : "—"}
                      </span>
                    </Link>
                  ))
                )}

                {/* Footer count */}
                <div className="px-4 py-2 border-t border-border bg-muted/30 text-xs text-muted-foreground">
                  {filteredVillages.length} από {villages?.length ?? 0} χωριά
                </div>
              </div>
            )}
          </div>
        </H2Section>

        <AdSenseSlot adSlot="7994234180" adFormat="horizontal" className="rounded-xl" />

        {/* ── 3. Ιστορία ──────────────────────────────────────────────────── */}
        <H2Section id="istoria" icon={BookOpen} iconColor="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" title="Ιστορία της Δρόπολης">

          <H3>Αρχαία και βυζαντινή κληρονομιά</H3>
          <Prose>
            <p>
              Η <strong>Δρόπολη</strong> φέρει αρχαιολογικά ίχνη από τη Νεολιθική Εποχή, ενώ η πιο
              εντυπωσιακή αρχαία μαρτυρία είναι τα ερείπια της <strong>Αντιγόνειας</strong> — μιας
              ελληνιστικής πόλης κτισμένης τον 3ο αιώνα π.Χ. από τον βασιλιά της Ηπείρου Πύρρο.
              Τα τείχη, τα σπίτια και η αγορά της Αντιγόνειας αποτελούν σήμερα αρχαιολογικό πάρκο
              και σημαντικό <strong>αξιοθέατο στη Δρόπολη, Βόρεια Ήπειρος</strong>.
            </p>
            <p>
              Κατά τη βυζαντινή περίοδο, η Δρόπολη αποτελούσε τμήμα του Δεσποτάτου της Ηπείρου.
              Μοναστήρια, εκκλησίες και αμυντικά κτίσματα εκείνης της εποχής σώζονται ακόμα στα χωριά
              — αποτελώντας ζωντανή αναγνώριση της ελληνοβυζαντινής ταυτότητας της περιοχής.
            </p>
          </Prose>

          <H3>Ορθόδοξη παράδοση και εκκλησίες</H3>
          <Prose>
            <p>
              Οι <strong>ορθόδοξες εκκλησίες στα χωριά της Δρόπολης</strong> αποτελούν το κεντρικό σύμβολο
              της πολιτισμικής ταυτότητας της περιοχής. Σε κάθε χωριό — ανεξαρτήτως μεγέθους — υπάρχει
              τουλάχιστον ένας ορθόδοξος ναός, πολλοί εκ των οποίων φέρουν σπάνιες βυζαντινές τοιχογραφίες
              και αγιογραφίες. Ο ναός του Αγίου Νικολάου στη Φοινίκη, η Παναγία Δερβιτσιάνης, τα μοναστήρια
              του Παραποτάμου — κάθε ένας κρύβει αιώνες ελληνορθόδοξης παράδοσης.
            </p>
          </Prose>

          <H3>Νεότερη ιστορία και ελληνισμός της Βορείου Ηπείρου</H3>
          <Prose>
            <p>
              Η σύγχρονη ιστορία της Δρόπολης χαρακτηρίζεται από τους αγώνες της{" "}
              <strong>ελληνικής μειονότητας</strong> για αναγνώριση, διατήρηση της γλώσσας και
              πολιτισμικής ταυτότητας κάτω από αλλεπάλληλα καθεστώτα. Ιδιαίτερα κατά την περίοδο
              του αλβανικού κομμουνισμού (1945–1991), οι κοινότητες της Δρόπολης υπέστησαν σκληρές
              διώξεις — ωστόσο η ελληνική παιδεία, η γλώσσα και η ορθόδοξη πίστη επέζησαν.
              Μετά το 1991, χιλιάδες Δροπολίτες μετανάστευσαν στην Ελλάδα, στη Γερμανία και αλλού,
              διατηρώντας ζωντανή την <strong>ομογένεια από τη Δρόπολη και τη Βόρεια Ήπειρο</strong>.
            </p>
          </Prose>
        </H2Section>

        {/* ── 4. Πολιτισμός ───────────────────────────────────────────────── */}
        <H2Section id="politismos" icon={Star} iconColor="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400" title="Πολιτισμός και παράδοση στα χωριά της Δρόπολης">

          <H3>Πανηγύρια, γιορτές και τοπικά έθιμα</H3>
          <Prose>
            <p>
              Ο <strong>πολιτισμός και η παράδοση στη Δρόπολη</strong> εκφράζονται με μεγαλύτερη ένταση
              κατά τα τοπικά πανηγύρια, που τελούνται συνήθως την εορτή του πολιούχου αγίου κάθε χωριού.
              Το πανηγύρι της Αγίας Τριάδας στη Δερβιτσιάνη, της Παναγίας στη Βουνοπόλη, του Αγίου Γεωργίου
              στη Φοινίκη — συγκεντρώνουν Δροπολίτες από την Ελλάδα, τη Γερμανία, τις ΗΠΑ και τον υπόλοιπο
              κόσμο. Το πανηγύρι δεν είναι απλώς θρησκευτική εκδήλωση: είναι η ετήσια επανένωση της
              κοινότητας.
            </p>
          </Prose>

          <H3>Παραδοσιακή αρχιτεκτονική και πέτρινα σπίτια</H3>
          <Prose>
            <p>
              Τα <strong>παλιά πέτρινα σπίτια στα χωριά της Δρόπολης</strong> αποτελούν ιδιαίτερο
              αρχιτεκτονικό χαρακτηριστικό της περιοχής. Κτισμένα από ντόπια γκρίζα πέτρα, με χαμηλές
              ξύλινες βεράντες, πλακόστρωτα αυλές και χαρακτηριστικές στρωτές στέγες, τα κτίσματα αυτά
              ανάγονται σε παράδοση αιώνων. Πολλά εξ αυτών σώζονται σε καλή κατάσταση και αποτελούν
              σήμερα οικογενειακά σπίτια, μνημεία ή μικρά τοπικά μουσεία.
            </p>
          </Prose>

          <H3>Μουσική, χοροί και προφορική ιστορία</H3>
          <Prose>
            <p>
              Η μουσική παράδοση της Δρόπολης ανήκει στη γενικότερη ηπειρωτική μουσική κουλτούρα,
              με πολυφωνικά τραγούδια (iso-polyphony) που ανακηρύχθηκαν από την UNESCO ως άυλη
              πολιτιστική κληρονομιά. Οι χοροί — κυρίως ο γρήγορος «τσάμικος» και ο βραδύς
              «ηπειρώτικος» — επιζούν στα πανηγύρια και τους γάμους, ενώ η προφορική ιστορία
              μεταδίδεται μέσα από τα τραγούδια των γυναικών και τις αφηγήσεις των ηλικιωμένων.
            </p>
          </Prose>
        </H2Section>

        <AdSenseSlot adSlot="7994234180" adFormat="horizontal" className="rounded-xl" />

        {/* ── 5. Αξιοθέατα ────────────────────────────────────────────────── */}
        <H2Section id="aksiotheata" icon={Camera} iconColor="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400" title="Αξιοθέατα και σημεία ενδιαφέροντος στη Δρόπολη">

          <H3>Φυσικά τοπία και διαδρομές</H3>
          <Prose>
            <p>
              Τα <strong>αξιοθέατα στη Δρόπολη, Βόρεια Ήπειρος</strong> δεν περιορίζονται στα ιστορικά
              μνημεία. Η φυσική ομορφιά της περιοχής — με τη βαθιά κοιλάδα του Δρίνου, τους κατάφυτους
              λόφους, τα ρέματα και τις καλλιεργημένες πεδιάδες — αποτελεί αφεαυτής αξιόλογο φυσικό
              τοπίο. Ορειβατικές διαδρομές ανάμεσα στα χωριά, μονοπάτια στα βουνά και βόλτες στην
              κοιλάδα προσφέρουν εναλλακτικές εμπειρίες για επισκέπτες κάθε είδους.
            </p>
          </Prose>

          <H3>Εκκλησίες, μνημεία και ιστορικά σημεία</H3>
          <Prose>
            <p>
              Πέρα από τις εκκλησίες που απαντώνται σε κάθε χωριό, σημαντικά ιστορικά σημεία είναι
              τα ερείπια της <strong>Αντιγόνειας</strong> (κοντά στη Βουνοπόλη), οι βυζαντινοί πύργοι
              της κοιλάδας, το κάστρο του Δελβινακίου στα σύνορα, καθώς και οι ανεσκαμμένες
              ελληνιστικές νεκροπόλεις που αποκάλυψαν αρχαιολογικά τεκμήρια για την κατοίκηση
              από τον 4ο αιώνα π.Χ.
            </p>
          </Prose>

          <H3>Φωτογραφικά σημεία στα 41 χωριά</H3>
          <Prose>
            <p>
              Για φωτογράφους και ταξιδιώτες, τα <strong>φωτογραφίες από τα χωριά της Δρόπολης</strong>
              που ανεβάζουν οι επισκέπτες στο Dropolis.net αποτυπώνουν μερικά από τα πιο εντυπωσιακά
              τοπία: χαράματα πάνω από την κοιλάδα, καλοκαιρινά πανηγύρια με παραδοσιακές φορεσιές,
              ασπρόμαυρα πορτρέτα γερόντων που διηγούνται ιστορίες από τον 20ό αιώνα, και στιγμιότυπα
              από τη σύγχρονη αγροτική ζωή. Μπορείτε να{" "}
              <Link href="/photos/" className="text-primary underline underline-offset-2 hover:no-underline">
                εξερευνήσετε το φωτογραφικό αρχείο
              </Link>{" "}
              ή να{" "}
              <Link href="/upload-photo/" className="text-primary underline underline-offset-2 hover:no-underline">
                ανεβάσετε τις δικές σας φωτογραφίες
              </Link>.
            </p>
          </Prose>
        </H2Section>

        {/* ── 6. Σήμερα ───────────────────────────────────────────────────── */}
        <H2Section id="simera" icon={Home} iconColor="bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400" title="Η Δρόπολη σήμερα">

          <H3>Η ζωή στα χωριά</H3>
          <Prose>
            <p>
              Παρά τη μαζική μετανάστευση των δεκαετιών 1990–2010, η Δρόπολη δεν άδειασε — αντίθετα,
              παρουσιάζει σήμερα σημάδια αναζωογόνησης. Νέα ζεύγη επιστρέφουν ή δεν φεύγουν,
              τουριστικές δραστηριότητες αναπτύσσονται, και η κυβέρνηση επενδύει σε βελτίωση
              υποδομών. Η γεωργία — κυρίως ελαιοκαλλιέργεια, κτηνοτροφία και οπωροκηπευτικά —
              παραμένει κεντρική στην οικονομία των χωριών.
            </p>
          </Prose>

          <H3>Η ομογένεια και οι Δροπολίτες του εξωτερικού</H3>
          <Prose>
            <p>
              Η <strong>ομογένεια από τη Δρόπολη και τη Βόρεια Ήπειρο</strong> έχει διασπαρεί σε
              Αθήνα, Θεσσαλονίκη, Γερμανία, Αυστρία, ΗΠΑ, Αυστραλία και αλλού. Σύλλογοι Δροπολιτών
              στη διασπορά διοργανώνουν εκδηλώσεις, συλλέγουν βοήθεια για τα χωριά και διατηρούν
              ζωντανές τις παραδόσεις. Το Dropolis.net επιδιώκει να αποτελέσει τον κοινό ψηφιακό
              τόπο συνάντησης — ένα «χωριό χωρίς σύνορα».
            </p>
          </Prose>

          <H3>Πώς το Dropolis.net ενώνει την κοινότητα</H3>
          <Prose>
            <p>
              Από ειδήσεις και φωτογραφίες έως βίντεο, χάρτες και live chat, το Dropolis.net
              λειτουργεί ως πλατφόρμα για τη συνεχή ενημέρωση και διασύνδεση όλων όσοι αγαπούν
              τη Δρόπολη. Κάθε χρήστης μπορεί να{" "}
              <Link href="/upload-photo/" className="text-primary underline underline-offset-2 hover:no-underline">υποβάλει φωτογραφίες</Link>,
              να{" "}
              <Link href="/submit-news/" className="text-primary underline underline-offset-2 hover:no-underline">αποστείλει είδηση</Link>{" "}
              και να συμμετέχει στο{" "}
              <Link href="/chat/" className="text-primary underline underline-offset-2 hover:no-underline">κοινοτικό chat</Link>.
            </p>
          </Prose>
        </H2Section>

        {/* ── 7. Χάρτης ───────────────────────────────────────────────────── */}
        <H2Section id="xartis" icon={Map} iconColor="bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400" title="Διαδραστικός χάρτης των 41 χωριών">
          <Prose>
            <p>
              Ο <strong>χάρτης με τα χωριά της Δρόπολης</strong> στο Dropolis.net σας επιτρέπει να
              εντοπίσετε κάθε χωριό γεωγραφικά, να δείτε τη σχετική θέση του ως προς το Αργυρόκαστρο
              και τα ελληνοαλβανικά σύνορα, και να πλοηγηθείτε στις πληροφορίες κάθε κοινότητας.
            </p>
          </Prose>

          <H3>Πώς να βρείτε κάθε χωριό</H3>
          <Prose>
            <p>
              Πλοηγηθείτε στον{" "}
              <Link href="/villages/map/" className="text-primary font-semibold underline underline-offset-2 hover:no-underline">
                διαδραστικό χάρτη χωριών
              </Link>{" "}
              για να δείτε την ακριβή γεωγραφική θέση κάθε οικισμού. Κάνοντας κλικ σε κάθε σημείο
              ανοίγει η σελίδα του αντίστοιχου χωριού με νέα, φωτογραφίες και ιστορικές πληροφορίες.
            </p>
          </Prose>

          <H3>Φωτογραφίες, νέα και πληροφορίες ανά χωριό</H3>
          <Prose>
            <p>
              Κάθε χωριό έχει τη δική του σελίδα στο Dropolis.net με ειδήσεις, φωτογραφίες,
              ιστορικό σημείωμα και δεδομένα πληθυσμού. Επισκεφτείτε τη{" "}
              <Link href="/villages/" className="text-primary underline underline-offset-2 hover:no-underline">
                πλήρη λίστα χωριών
              </Link>{" "}
              για να βρείτε το χωριό σας.
            </p>
          </Prose>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/villages/map/"
              className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Map className="w-4 h-4" /> Άνοιγμα Χάρτη
            </Link>
            <Link
              href="/villages/"
              className="inline-flex items-center gap-2 rounded-xl border border-primary text-primary px-5 py-2.5 text-sm font-semibold hover:bg-primary/5 transition-colors"
            >
              <MapPin className="w-4 h-4" /> Λίστα Χωριών
            </Link>
            <Link
              href="/photos/"
              className="inline-flex items-center gap-2 rounded-xl border border-border text-foreground/70 px-5 py-2.5 text-sm font-semibold hover:bg-muted transition-colors"
            >
              <Camera className="w-4 h-4" /> Φωτογραφικό Αρχείο
            </Link>
          </div>
        </H2Section>

        {/* ── 8. FAQ ──────────────────────────────────────────────────────── */}
        <H2Section id="faq" icon={HelpCircle} iconColor="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400" title="Συχνές ερωτήσεις για τη Δρόπολη">
          <div className="space-y-4">
            <FaqItem
              q="Πού βρίσκεται η Δρόπολη;"
              a="Η Δρόπολη βρίσκεται στη νότια Αλβανία, στην κοιλάδα του ποταμού Δρίνου, βορειοδυτικά της πόλης του Αργυροκάστρου (Gjirokastra). Αποτελεί τμήμα της ιστορικής Βορείου Ηπείρου και βρίσκεται σε απόσταση περίπου 40–60 χλμ. από τα ελληνοαλβανικά σύνορα (Κακαβιά)."
            />
            <FaqItem
              q="Πόσα χωριά έχει η Δρόπολη;"
              a="Η Δρόπολη αριθμεί 41 χωριά που ανήκουν στον Δήμο Δρόπολης (Bashkia Dropull). Τα χωριά αυτά χωρίζονται γεωγραφικά σε Κάτω Δρόπολη, Άνω Δρόπολη και σε χωριά της ευρύτερης περιοχής Αργυροκάστρου."
            />
            <FaqItem
              q="Ποια είναι η σχέση της Δρόπολης με τη Βόρεια Ήπειρο;"
              a="Η Δρόπολη αποτελεί ένα από τα ιστορικά κέντρα του Ελληνισμού της Βορείου Ηπείρου. Η ελληνική μειονότητα διατηρεί ζωντανή παρουσία στην περιοχή, με ελληνόφωνα σχολεία, ορθόδοξες εκκλησίες και ενεργές πολιτιστικές οργανώσεις που λειτουργούν μέχρι σήμερα."
            />
            <FaqItem
              q="Πώς μπορώ να ανεβάσω φωτογραφίες ή νέα από το χωριό μου;"
              a="Μπορείτε να υποβάλετε φωτογραφίες μέσω της σελίδας «Υποβολή Φωτογραφίας» και νέα μέσω της φόρμας «Αποστολή Είδησης» στο Dropolis.net. Κάθε υποβολή αξιολογείται από την ομάδα μας πριν δημοσιευτεί — στόχος μας είναι η ακρίβεια και η αντιπροσωπευτικότητα."
            />
          </div>
        </H2Section>

      </main>
    </>
  );
}
