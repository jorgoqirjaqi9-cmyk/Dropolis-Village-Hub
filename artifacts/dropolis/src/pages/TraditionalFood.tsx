import { Link } from "wouter";
import { SEO } from "@/components/SEO";
import { AdSenseSlot } from "@/components/AdSenseSlot";
import { ChevronRight, UtensilsCrossed, Flame, Leaf, Wheat, Star } from "lucide-react";

const PAGE_URL  = "https://dropolis.net/paradosiaka-faghta/";
const PAGE_TITLE = "Παραδοσιακά Φαγητά της Δρόπολης: Η Αυθεντική Γαστρονομία της Βορείου Ηπείρου";
const PAGE_DESC  = "Ανακαλύψτε τα κορυφαία παραδοσιακά φαγητά της Δρόπολης και της Βορείου Ηπείρου. Από την αυθεντική Κασιόπιτα μέχρι τα μελωμένα κρέατα στη γάστρα!";
const PAGE_KW    = "Δρόπολη, Παραδοσιακά Φαγητά, Βόρειος Ήπειρος, Κουζίνα, Συνταγές, Φοινίκη, Χειμάρρα, Κασιόπιτα";

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
        { "@type": "ListItem", position: 1, name: "Αρχική",                item: "https://dropolis.net/" },
        { "@type": "ListItem", position: 2, name: "Παραδοσιακά Φαγητά",    item: PAGE_URL },
      ],
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Παραδοσιακά Φαγητά της Δρόπολης",
    url: PAGE_URL,
    numberOfItems: 7,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Κασιόπιτα", url: PAGE_URL + "#kasiopita" },
      { "@type": "ListItem", position: 2, name: "Μπατσαριά", url: PAGE_URL + "#mpatsaria" },
      { "@type": "ListItem", position: 3, name: "Πασούλ (Φασολάδα)", url: PAGE_URL + "#pasoul" },
      { "@type": "ListItem", position: 4, name: "Κρέατα στη Γάστρα", url: PAGE_URL + "#gastra" },
      { "@type": "ListItem", position: 5, name: "Πετούλες", url: PAGE_URL + "#petoules" },
      { "@type": "ListItem", position: 6, name: "Σαρμαδάκια", url: PAGE_URL + "#sarmadakia" },
      { "@type": "ListItem", position: 7, name: "Τυρί Δρόπολης", url: PAGE_URL + "#tyri" },
    ],
  },
];

function ImagePlaceholder({ emoji, alt, gradient }: { emoji: string; alt: string; gradient: string }) {
  return (
    <div
      role="img"
      aria-label={alt}
      className={`w-full h-52 rounded-xl flex items-center justify-center text-7xl select-none ${gradient}`}
    >
      {emoji}
    </div>
  );
}

function SectionBadge({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold uppercase tracking-wide">
      <Icon className="w-3.5 h-3.5" /> {label}
    </span>
  );
}

export default function TraditionalFood() {
  return (
    <>
      <SEO
        title={PAGE_TITLE}
        description={PAGE_DESC}
        keywords={PAGE_KW}
        type="website"
        jsonLd={jsonLd}
        breadcrumbs={[
          { name: "Αρχική",             url: "https://dropolis.net/" },
          { name: "Παραδοσιακά Φαγητά", url: PAGE_URL },
        ]}
      />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-amber-900 via-amber-800 to-orange-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.4%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" aria-hidden="true" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-amber-200/70 text-sm mb-6">
            <Link href="/" className="hover:text-amber-100 transition-colors">Αρχική</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-amber-100">Παραδοσιακά Φαγητά</span>
          </nav>

          <div className="flex items-start gap-4">
            <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white/10 items-center justify-center text-3xl shrink-0">
              🫕
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight tracking-tight mb-4">
                Παραδοσιακά Φαγητά της <strong className="text-amber-300">Δρόπολης</strong>:<br className="hidden sm:block" />
                Η Αυθεντική Γαστρονομία της <strong className="text-amber-300">Βορείου Ηπείρου</strong>
              </h1>
              <p className="text-amber-100/90 text-base sm:text-lg leading-relaxed max-w-2xl">
                Η κουζίνα της <strong className="text-white">Δρόπολης</strong> είναι αναπόσπαστο κομμάτι της ταυτότητας
                της <strong className="text-white">ελληνικής μειονότητας</strong> της <strong className="text-white">Βορείου Ηπείρου</strong>.
                Μαγειρεμένη με αγάπη, τοπικά υλικά και αιώνια παράδοση.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-16">

        {/* ── Intro ──────────────────────────────────────────────────────── */}
        <section aria-labelledby="intro-heading">
          <h2 id="intro-heading" className="text-xl sm:text-2xl font-bold text-foreground mb-4">
            Η Γαστρονομική Κληρονομιά της Δρόπολης
          </h2>
          <div className="prose prose-stone dark:prose-invert max-w-none text-base leading-relaxed space-y-4 text-foreground/90">
            <p>
              Τα παραδοσιακά φαγητά της <strong>Δρόπολης</strong> αντικατοπτρίζουν τη μακραίωνη ιστορία της περιοχής,
              συνδυάζοντας επιρροές ελληνικής, βυζαντινής και ηπειρωτικής κουζίνας. Τα 41 χωριά του <strong>Δήμου Δρόπολης</strong>,
              ανάμεσα στα οποία η <strong>Φοινίκη</strong>, η Δερβιτσιάνη και ο Παραπόταμος, έχουν χτίσει γύρω
              από τη γαστρονομία έναν ζωντανό πολιτισμό που επιζεί μέχρι σήμερα.
            </p>
            <p>
              Από τις κρεμώδεις πίτες στο ταψί μέχρι τα αργομαγειρεμένα κρέατα στη <strong>γάστρα</strong>,
              η κουζίνα της <strong>Βορείου Ηπείρου</strong> αγκαλιάζει τις εποχές, γιορτάζει τη φύση και τιμά
              τους αγαπημένους. Μια κουζίνα που μυρίζει καπνό, ορεινό αέρα και θυμάρι.
            </p>
          </div>
        </section>

        <AdSenseSlot adSlot="7994234180" adFormat="horizontal" className="rounded-xl" />

        {/* ── Πίτες ────────────────────────────────────────────────────── */}
        <section aria-labelledby="pites-heading">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 rounded-full bg-amber-500" aria-hidden="true" />
            <h2 id="pites-heading" className="text-xl sm:text-2xl font-bold text-foreground">
              Οι Παραδοσιακές Πίτες της Δρόπολης
            </h2>
          </div>
          <p className="text-foreground/80 mb-8 leading-relaxed">
            Η πίτα είναι ο ακρογωνιαίος λίθος της κουζίνας της <strong>Δρόπολης</strong> και ολόκληρης της <strong>Βορείου Ηπείρου</strong>.
            Κάθε χωριό έχει τη δική του παραλλαγή, τη δική του μυστική επαφή με το φύλλο και τη γέμιση.
          </p>

          <div className="grid gap-8 sm:grid-cols-2">
            {/* Κασιόπιτα */}
            <article id="kasiopita" className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <ImagePlaceholder
                emoji="🥧"
                alt="Παραδοσιακή Κασιόπιτα Δρόπολης — πίτα με κεφαλοτύρι"
                gradient="bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/20 dark:to-amber-900/20"
              />
              <div className="p-5 space-y-3">
                <SectionBadge icon={Star} label="Σήμα κατατεθέν" />
                <h3 className="text-lg font-bold text-foreground">Κασιόπιτα</h3>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  Η <strong>Κασιόπιτα</strong> είναι αναμφίβολα το πιο εμβληματικό φαγητό της <strong>Δρόπολης</strong>.
                  Πρόκειται για μια τραγανή πίτα παρασκευασμένη με λεπτό σπιτικό φύλλο και γέμιση από
                  το τοπικό αλμυρό τυρί — το <strong>κεφαλοτύρι Δρόπολης</strong> — αυγά και βούτυρο.
                  Σερβίρεται ζεστή, με κρούστα χρυσοκίτρινη και εσωτερικό λιωμένο, κρεμώδες.
                </p>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  Στη <strong>Φοινίκη</strong> και στα χωριά της <strong>Χειμάρρας</strong>, η Κασιόπιτα
                  είναι παρούσα σε κάθε γιορτή, γάμο και πανηγύρι. Κάθε νοικοκυρά έχει το δικό της
                  μυστικό — η πάχνωση του φύλλου, η αναλογία τυριού, το σωστό ψήσιμο στο ξυλόφουρνο.
                </p>
              </div>
            </article>

            {/* Μπατσαριά */}
            <article id="mpatsaria" className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <ImagePlaceholder
                emoji="🌿"
                alt="Μπατσαριά — παραδοσιακή χορτόπιτα Βορείου Ηπείρου"
                gradient="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20"
              />
              <div className="p-5 space-y-3">
                <SectionBadge icon={Leaf} label="Ορεινή Παράδοση" />
                <h3 className="text-lg font-bold text-foreground">Μπατσαριά</h3>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  Η <strong>Μπατσαριά</strong> είναι η παραδοσιακή χορτόπιτα της <strong>Βορείου Ηπείρου</strong>,
                  φτιαγμένη με αγριόχορτα που μαζεύονται στα ορεινά λιβάδια γύρω από τα χωριά της <strong>Δρόπολης</strong>.
                  Η γέμιση συνδυάζει τσουκνίδα, σπανάκι, ξινόχορτο και άλλα αρωματικά βότανα με αυγά και τυρί.
                </p>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  Αγαπημένο φαγητό της <strong>Σαρακοστής</strong>, η Μπατσαριά συμβολίζει τη σχέση των
                  κατοίκων με τη φύση. Στα χωριά του <strong>Δήμου Δρόπολης</strong>, το μάζεμα χόρτων
                  την άνοιξη παραμένει κοινωνική τελετουργία.
                </p>
              </div>
            </article>

            {/* Σπανακόπιτα Ηπείρου */}
            <article className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <ImagePlaceholder
                emoji="🫓"
                alt="Σπανακόπιτα Ηπείρου — παραδοσιακή πίτα της Δρόπολης"
                gradient="bg-gradient-to-br from-lime-50 to-green-100 dark:from-lime-900/20 dark:to-green-900/20"
              />
              <div className="p-5 space-y-3">
                <SectionBadge icon={Wheat} label="Πίτες" />
                <h3 className="text-lg font-bold text-foreground">Σπανακόπιτα Ηπείρου</h3>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  Σε διαφορετική από τη γνωστή νότια εκδοχή, η σπανακόπιτα της <strong>Βορείου Ηπείρου</strong>
                  ψήνεται σε μεγάλα ορθογώνια ταψιά με χοντρό φύλλο και πλούσια γέμιση από φέτα,
                  σπανάκι, πράσο και άνηθο. Σερβίρεται κομμένη σε μεγάλα κομμάτια και τρώγεται
                  ζεστή σαν κυρίως γεύμα.
                </p>
              </div>
            </article>

            {/* Τυρόπιτα */}
            <article className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <ImagePlaceholder
                emoji="🧀"
                alt="Τυρόπιτα Δρόπολης — πίτα με φέτα και κεφαλοτύρι"
                gradient="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-900/20"
              />
              <div className="p-5 space-y-3">
                <SectionBadge icon={Wheat} label="Πίτες" />
                <h3 className="text-lg font-bold text-foreground">Τυρόπιτα Δρόπολης</h3>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  Η τυρόπιτα της <strong>Δρόπολης</strong> διαφέρει από τις υπόλοιπες ελληνικές παραδόσεις
                  λόγω του τοπικού τυριού που χρησιμοποιείται. Ο συνδυασμός <strong>κεφαλοτυριού
                  Δρόπολης</strong> με φέτα και αυγά δημιουργεί μια βαθιά, πικάντικη γεύση που δεν
                  μοιάζει με τίποτα άλλο.
                </p>
              </div>
            </article>
          </div>
        </section>

        {/* ── Κρέατα ────────────────────────────────────────────────────── */}
        <section aria-labelledby="kreata-heading">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 rounded-full bg-red-500" aria-hidden="true" />
            <h2 id="kreata-heading" className="text-xl sm:text-2xl font-bold text-foreground">
              Κρέατα στη Γάστρα
            </h2>
          </div>
          <p className="text-foreground/80 mb-8 leading-relaxed">
            Η <strong>γάστρα</strong> είναι το παραδοσιακό πήλινο σκεύος που χρησιμοποιούσαν οι νοικοκυρές
            της <strong>Δρόπολης</strong> για αργό μαγείρεμα στη χόβολη. Τα κρέατα που μαγειρεύονται
            σε γάστρα αποκτούν μοναδική γεύση — τρυφερά, μελωμένα, με έντονο άρωμα τοπικών βοτάνων.
          </p>

          <div className="grid gap-8 sm:grid-cols-2">
            {/* Αρνί/Κατσίκι */}
            <article id="gastra" className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <ImagePlaceholder
                emoji="🍖"
                alt="Αρνί στη γάστρα — παραδοσιακό κρέας Δρόπολης"
                gradient="bg-gradient-to-br from-red-50 to-orange-100 dark:from-red-900/20 dark:to-orange-900/20"
              />
              <div className="p-5 space-y-3">
                <SectionBadge icon={Flame} label="Πασχαλινή Παράδοση" />
                <h3 className="text-lg font-bold text-foreground">Αρνί/Κατσίκι στη Γάστρα</h3>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  Το κυριότερο φαγητό του <strong>Πάσχα</strong> στα χωριά της <strong>Δρόπολης</strong>
                  είναι το αρνί ή κατσίκι μαγειρεμένο αργά στη γάστρα. Καρυκεύεται με σκόρδο, δεντρολίβανο,
                  θυμάρι και ντόπιο ελαιόλαδο, σκεπασμένο με την πήλινη καπακωτή γάστρα που εγκλωβίζει
                  τους ατμούς και κάνει το κρέας να λιώνει.
                </p>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  Στη <strong>Φοινίκη</strong> και στη <strong>Χειμάρρα</strong>, το έθιμο της γάστρας
                  συνεχίζεται από γενιά σε γενιά. Η γάστρα τοποθετείται σε χόβολη (κάρβουνα) ή
                  στον ξυλόφουρνο για 3-4 ώρες — το αποτέλεσμα είναι μαγευτικό.
                </p>
              </div>
            </article>

            {/* Σαρμαδάκια */}
            <article id="sarmadakia" className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <ImagePlaceholder
                emoji="🍃"
                alt="Σαρμαδάκια — ντολμάδες της Δρόπολης με αμπελόφυλλα"
                gradient="bg-gradient-to-br from-green-50 to-teal-100 dark:from-green-900/20 dark:to-teal-900/20"
              />
              <div className="p-5 space-y-3">
                <SectionBadge icon={Leaf} label="Καλοκαιρινό" />
                <h3 className="text-lg font-bold text-foreground">Σαρμαδάκια (Ντολμάδες)</h3>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  Τα <strong>σαρμαδάκια</strong> — τα ντολμαδάκια της <strong>Βορείου Ηπείρου</strong> — είναι
                  φτιαγμένα με φρέσκα αμπελόφυλλα που μαζεύονται από τους αμπελώνες της <strong>Δρόπολης</strong>.
                  Η γέμιση αποτελείται από ρύζι, αρνί ή χοιρινό, μυρωδικά και χυμό λεμονιού.
                </p>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  Η τοπική ονομασία «σαρμαδάκι» (από το τουρκικό sarma) μαρτυρεί τη μακραίωνη
                  πολιτισμική ανταλλαγή στην περιοχή. Σερβίρονται ζεστά με αυγολέμονο.
                </p>
              </div>
            </article>
          </div>
        </section>

        <AdSenseSlot adSlot="7994234180" adFormat="horizontal" className="rounded-xl" />

        {/* ── Όσπρια ────────────────────────────────────────────────────── */}
        <section aria-labelledby="ospria-heading">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 rounded-full bg-orange-500" aria-hidden="true" />
            <h2 id="ospria-heading" className="text-xl sm:text-2xl font-bold text-foreground">
              Τα Όσπρια και οι Σούπες της Δρόπολης
            </h2>
          </div>
          <p className="text-foreground/80 mb-8 leading-relaxed">
            Στο ορεινό κλίμα της <strong>Δρόπολης</strong>, τα όσπρια αποτέλεσαν για αιώνες την κύρια
            πηγή ενέργειας τους χειμερινούς μήνες. Μαγειρεμένα με απλότητα και αγάπη, γίνονται
            αριστουργήματα της απλής κουζίνας.
          </p>

          <article id="pasoul" className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="sm:flex">
              <div className="sm:w-64 shrink-0">
                <ImagePlaceholder
                  emoji="🫘"
                  alt="Πασούλ — παραδοσιακή φασολάδα Δρόπολης Βορείου Ηπείρου"
                  gradient="bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/20"
                />
              </div>
              <div className="p-6 space-y-3">
                <SectionBadge icon={Leaf} label="Χειμωνιάτικο" />
                <h3 className="text-lg font-bold text-foreground">Πασούλ — Η Φασολάδα της Δρόπολης</h3>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  Ο <strong>«Πασούλ»</strong> (από το τουρκο-αλβανικό fasule) είναι η παραδοσιακή
                  φασολάδα της <strong>Δρόπολης</strong> και ολόκληρης της <strong>Βορείου Ηπείρου</strong>.
                  Φτιαγμένος με μεγάλα άσπρα φασόλια, κρεμμύδι, σκόρδο, ντομάτα και άφθονο
                  εξαιρετικό παρθένο ελαιόλαδο, αποτελεί το επιτομή της «φτωχής» αλλά πλούσιας
                  παραδοσιακής κουζίνας.
                </p>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  Στα χωριά της <strong>Δρόπολης</strong>, ο πασούλ σερβίρεται με χοντρό ψωμί φούρνου
                  και ελιές. Σε εποχές νηστείας, είναι το φαγητό που συγκεντρώνει όλη την οικογένεια
                  γύρω από το τραπέζι. Πολλοί παλαιότεροι κάτοικοι τον φτιάχνουν ακόμα σε ξυλόφουρνο.
                </p>
              </div>
            </div>
          </article>
        </section>

        {/* ── Γλυκά ─────────────────────────────────────────────────────── */}
        <section aria-labelledby="glyka-heading">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 rounded-full bg-pink-500" aria-hidden="true" />
            <h2 id="glyka-heading" className="text-xl sm:text-2xl font-bold text-foreground">
              Γλυκά και Ζύμες της Δρόπολης
            </h2>
          </div>
          <p className="text-foreground/80 mb-8 leading-relaxed">
            Τα γλυκά της <strong>Δρόπολης</strong> είναι απλά, θρεπτικά και γεμάτα αρώματα. Μέλι από
            τα ορεινά μελίσσια της <strong>Βορείου Ηπείρου</strong>, καρύδια, αμύγδαλα και σπιτική ζύμη
            αποτελούν τα βασικά τους υλικά.
          </p>

          <div className="grid gap-8 sm:grid-cols-2">
            {/* Πετούλες */}
            <article id="petoules" className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <ImagePlaceholder
                emoji="🥞"
                alt="Πετούλες — παραδοσιακές τηγανίτες της Δρόπολης με μέλι"
                gradient="bg-gradient-to-br from-yellow-50 to-honey-100 dark:from-yellow-900/20 dark:to-orange-900/20"
              />
              <div className="p-5 space-y-3">
                <SectionBadge icon={Star} label="Γιορτινό" />
                <h3 className="text-lg font-bold text-foreground">Πετούλες</h3>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  Οι <strong>Πετούλες</strong> (το όνομα σημαίνει «φτερούγες» στα ελληνικά) είναι
                  ελαφριές τηγανίτες από σπιτική ζύμη, τηγανισμένες σε καυτό λάδι μέχρι να φουσκώσουν
                  και να πάρουν χρυσαφί χρώμα. Σερβίρονται με τοπικό μέλι από τη <strong>Δρόπολη</strong>
                  και θρυμματισμένα καρύδια.
                </p>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  Παραδοσιακά φτιάχνονται για τις Αποκριές, τις γιορτές και τα πανηγύρια των χωριών
                  της <strong>Φοινίκης</strong> και της <strong>Χειμάρρας</strong>. Η μυρωδιά τους
                  γεμίζει τα σπίτια και καλεί όλη τη γειτονιά.
                </p>
              </div>
            </article>

            {/* Μπακλαβάς Ηπείρου */}
            <article className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <ImagePlaceholder
                emoji="🍯"
                alt="Μπακλαβάς Ηπείρου — παραδοσιακό γλυκό Βορείου Ηπείρου"
                gradient="bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-900/20"
              />
              <div className="p-5 space-y-3">
                <SectionBadge icon={Star} label="Γιορτινό" />
                <h3 className="text-lg font-bold text-foreground">Μπακλαβάς Ηπείρου</h3>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  Ο μπακλαβάς της <strong>Βορείου Ηπείρου</strong> παρασκευάζεται με σπιτικό φύλλο,
                  αφθονία από καρύδια και αμύγδαλα της περιοχής, και σιρόπι από μέλι αντί για ζάχαρη —
                  μια τεχνική που τον κάνει πιο αρωματικό και λιγότερο γλυκό από τις άλλες εκδοχές.
                  Κόβεται σε ρόμβους και σερβίρεται σε κάθε σημαντική οικογενειακή γιορτή.
                </p>
              </div>
            </article>
          </div>
        </section>

        {/* ── Τυρί ──────────────────────────────────────────────────────── */}
        <section id="tyri" aria-labelledby="tyri-heading" className="bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-200 dark:border-amber-800/30 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl" aria-hidden="true">🧀</span>
            <h2 id="tyri-heading" className="text-xl sm:text-2xl font-bold text-foreground">
              Το Τυρί της Δρόπολης
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-3 text-foreground/80 text-sm leading-relaxed">
              <p>
                Κανένα φαγητό της <strong>Δρόπολης</strong> δεν είναι πλήρες χωρίς το τοπικό τυρί.
                Το <strong>κεφαλοτύρι</strong> και το <strong>κασκαβάλι Δρόπολης</strong> παράγονται
                από αιώνες με παραδοσιακές μεθόδους, χρησιμοποιώντας γάλα από τα ορεινά λιβάδια
                της <strong>Βορείου Ηπείρου</strong>.
              </p>
              <p>
                Το κεφαλοτύρι ωριμάζει για τουλάχιστον 3 μήνες, αποκτώντας σκληρή κρούστα και
                έντονη, αλμυρή γεύση. Είναι η ψυχή της <strong>Κασιόπιτας</strong> και
                χρησιμοποιείται τριμμένο πάνω από μακαρόνια, σαλάτες και ψητά.
              </p>
            </div>
            <div className="space-y-3 text-foreground/80 text-sm leading-relaxed">
              <p>
                Το <strong>τυρόπιτο</strong> τυρί (λευκό φρέσκο) παράγεται κυρίως στα χωριά της
                <strong> Φοινίκης</strong> και ακόμα παρασκευάζεται χειροποίητα σε πολλά νοικοκυριά.
                Μαλακό, κρεμώδες, με ελαφριά ξινίλα — τέλειο για τις πίτες, αλλά και ως σνακ
                με μέλι και καρύδια.
              </p>
              <p>
                Η τυροκομική παράδοση της <strong>Δρόπολης</strong> είναι άρρηκτα συνδεδεμένη με
                την κτηνοτροφία — τα κοπάδια πρόβατα και κατσίκια που βόσκουν στα βουνά
                της <strong>Χειμάρρας</strong> παράγουν το εξαιρετικό γάλα που δίνει στα τυριά
                τη μοναδική τους γεύση.
              </p>
            </div>
          </div>
        </section>

        {/* ── Εποχιακό Ημερολόγιο ──────────────────────────────────────── */}
        <section aria-labelledby="calendar-heading">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 rounded-full bg-blue-500" aria-hidden="true" />
            <h2 id="calendar-heading" className="text-xl sm:text-2xl font-bold text-foreground">
              Εποχιακό Γαστρονομικό Ημερολόγιο
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { season: "Άνοιξη 🌸", foods: ["Μπατσαριά (αγριόχορτα)", "Σαρμαδάκια", "Αρνί στη γάστρα (Πάσχα)"] },
              { season: "Καλοκαίρι ☀️", foods: ["Ντολμάδες", "Κασιόπιτα", "Φρέσκα τυριά"] },
              { season: "Φθινόπωρο 🍂", foods: ["Μπακλαβάς", "Πίτες με κολοκύθα", "Κρέας στη γάστρα"] },
              { season: "Χειμώνας ❄️", foods: ["Πασούλ (φασολάδα)", "Τυρόπιτα", "Πετούλες (Αποκριές)"] },
            ].map(({ season, foods }) => (
              <div key={season} className="bg-card border border-border rounded-xl p-4">
                <p className="font-semibold text-sm text-foreground mb-2">{season}</p>
                <ul className="space-y-1">
                  {foods.map(f => (
                    <li key={f} className="text-xs text-foreground/70 flex gap-1.5 items-start">
                      <span className="text-amber-500 mt-0.5 shrink-0">•</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <AdSenseSlot adSlot="7994234180" adFormat="horizontal" className="rounded-xl" />

        {/* ── Σχετικοί σύνδεσμοι ───────────────────────────────────────── */}
        <section aria-labelledby="related-heading" className="border-t border-border pt-10">
          <h2 id="related-heading" className="text-lg font-bold text-foreground mb-5 flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-amber-500" />
            Εξερευνήστε τη Δρόπολη
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/villages/"
              className="group flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all"
            >
              <span className="text-2xl" aria-hidden="true">🏘️</span>
              <div>
                <p className="font-semibold text-sm text-foreground group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">Χωριά της Δρόπολης</p>
                <p className="text-xs text-muted-foreground">Γνωρίστε τα 41 χωριά</p>
              </div>
            </Link>
            <Link
              href="/news/"
              className="group flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all"
            >
              <span className="text-2xl" aria-hidden="true">📰</span>
              <div>
                <p className="font-semibold text-sm text-foreground group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">Ειδήσεις Δρόπολης</p>
                <p className="text-xs text-muted-foreground">Τελευταία νέα</p>
              </div>
            </Link>
            <Link
              href="/photos/"
              className="group flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all"
            >
              <span className="text-2xl" aria-hidden="true">📸</span>
              <div>
                <p className="font-semibold text-sm text-foreground group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">Φωτογραφίες</p>
                <p className="text-xs text-muted-foreground">Παράδοση και ζωή</p>
              </div>
            </Link>
          </div>
        </section>

      </main>
    </>
  );
}
