/**
 * Canonical static route inventory for Dropolis.
 *
 * This is the single source of truth consumed by:
 *   - prerender.ts       (build-time HTML generation + sitemap.xml)
 *   - plugins/seo-crawler.ts  (Vite dev crawler middleware)
 *
 * The API server's sitemap.ts maintains its own copy of STATIC_ROUTES because
 * it lives in a different package, but it must be kept in sync with this file.
 */

export const BASE_URL = "https://dropolis.net";

export type StaticRoute = {
  loc: string;
  changefreq: string;
  priority: string;
};

export type ArticleMeta = {
  publishedTime?: string | null;
  modifiedTime?: string | null;
  author?: string | null;
  section?: string | null;
};

export type Meta = {
  title: string;
  description: string;
  image?: string | null;
  url: string;
  type?: string;
  article?: ArticleMeta;
  jsonLd?: object | object[];
  breadcrumbs?: Array<{ name: string; item: string }>;
};

export type StaticPrerender = Meta & { path: string };

/**
 * All public static routes included in the sitemap.
 * Keep in sync with STATIC_ROUTES in artifacts/api-server/src/routes/sitemap.ts.
 */
export const STATIC_ROUTES: StaticRoute[] = [
  { loc: "/",             changefreq: "daily",   priority: "1.0" },
  { loc: "/news",         changefreq: "hourly",  priority: "0.9" },
  { loc: "/villages",     changefreq: "weekly",  priority: "0.8" },
  { loc: "/photos",       changefreq: "weekly",  priority: "0.7" },
  { loc: "/videos",       changefreq: "weekly",  priority: "0.7" },
  { loc: "/about",        changefreq: "monthly", priority: "0.8" },
  { loc: "/contact",      changefreq: "monthly", priority: "0.7" },
  { loc: "/press",        changefreq: "monthly", priority: "0.6" },
  { loc: "/help",         changefreq: "monthly", priority: "0.5" },
  { loc: "/privacy",      changefreq: "yearly",  priority: "0.4" },
  { loc: "/terms",        changefreq: "yearly",  priority: "0.4" },
  { loc: "/cookie-policy",changefreq: "yearly",  priority: "0.3" },
  { loc: "/disclaimer",   changefreq: "yearly",  priority: "0.3" },
  { loc: "/sitemap",            changefreq: "monthly", priority: "0.3" },
  { loc: "/editorial-policy",  changefreq: "monthly", priority: "0.5" },
  { loc: "/corrections-policy",changefreq: "monthly", priority: "0.5" },
  { loc: "/contributors",      changefreq: "monthly", priority: "0.5" },
  { loc: "/advertise",         changefreq: "monthly", priority: "0.4" },
  { loc: "/en",                changefreq: "monthly", priority: "0.6" },
  { loc: "/en/about",          changefreq: "monthly", priority: "0.5" },
  { loc: "/en/villages",       changefreq: "monthly", priority: "0.5" },
  { loc: "/en/news",           changefreq: "monthly", priority: "0.5" },
  { loc: "/en/contact",        changefreq: "monthly", priority: "0.5" },
  { loc: "/upload-photo",      changefreq: "monthly", priority: "0.6" },
  { loc: "/submit-news",       changefreq: "monthly", priority: "0.6" },
  { loc: "/submit-video",      changefreq: "monthly", priority: "0.6" },
];

/**
 * Static pages that get their own prerendered HTML with correct OG / JSON-LD.
 * Every entry here must also be reachable via the client-side router (App.tsx).
 */
export const STATIC_PRERENDER: StaticPrerender[] = [
  {
    path: "/news",
    title: "Ειδήσεις",
    description: "Τελευταία νέα, ρεπορτάζ και ειδήσεις από τη Δρόπολη και τα χωριά της Βόρειας Ηπείρου.",
    image: `${BASE_URL}/og-news.png`,
    url: `${BASE_URL}/news`,
    breadcrumbs: [{ name: "Ειδήσεις", item: `${BASE_URL}/news` }],
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Ειδήσεις — Δρόπολη",
        description: "Τελευταία νέα και ρεπορτάζ από τη Δρόπολη και τα χωριά της Βόρειας Ηπείρου.",
        url: `${BASE_URL}/news`,
        inLanguage: "el",
        publisher: {
          "@type": "NewsMediaOrganization",
          "@id": `${BASE_URL}/#organization`,
          name: "Δρόπολη (Dropolis)",
          url: BASE_URL,
          logo: { "@type": "ImageObject", url: `${BASE_URL}/favicon.svg` },
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "NewsMediaOrganization",
        "@id": `${BASE_URL}/#organization`,
        name: "Δρόπολη (Dropolis)",
        url: BASE_URL,
        logo: { "@type": "ImageObject", url: `${BASE_URL}/favicon.svg` },
        foundingLocation: { "@type": "Place", name: "Δρόπολη, Βόρεια Ήπειρος" },
        publishingPrinciples: `${BASE_URL}/editorial-policy`,
        sameAs: [
          "https://www.facebook.com/profile.php?id=61590717183098",
          "https://www.youtube.com/@dropolis",
        ],
      },
    ],
  },
  {
    path: "/villages",
    title: "Τα Χωριά της Δρόπολης",
    description: "Ανακαλύψτε και τα 41 ιστορικά χωριά της Κάτω Δρόπολης, Άνω Δρόπολης και Πωγωνίου. Πληθυσμός, ιστορία και παραδόσεις.",
    url: `${BASE_URL}/villages`,
    breadcrumbs: [{ name: "Χωριά", item: `${BASE_URL}/villages` }],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Τα Χωριά της Δρόπολης",
      description: "41 ιστορικά χωριά σε τρεις Δημοτικές Ενότητες — Κάτω Δρόπολης, Άνω Δρόπολης και Πωγωνίου.",
      url: `${BASE_URL}/villages`,
      inLanguage: "el",
      numberOfItems: 41,
    },
  },
  {
    path: "/photos",
    title: "Φωτογραφίες Δρόπολης | Χωριά, Παράδοση και Ιστορία",
    description: "Φωτογραφικό αρχείο της Δρόπολης με εικόνες από χωριά, τοπία, παραδόσεις, ιστορικά σημεία και την καθημερινότητα της ελληνικής κοινότητας.",
    image: `${BASE_URL}/og-photos.png`,
    url: `${BASE_URL}/photos`,
    breadcrumbs: [{ name: "Φωτογραφίες", item: `${BASE_URL}/photos` }],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "ImageGallery",
      name: "Φωτογραφικό Αρχείο — Δρόπολη",
      description: "Πλούσιο φωτογραφικό αρχείο από τα χωριά, τις εκδηλώσεις και τους ανθρώπους της Δρόπολης, Βόρεια Ήπειρος.",
      url: `${BASE_URL}/photos`,
      inLanguage: "el",
      about: { "@type": "Place", name: "Δρόπολη", containedInPlace: { "@type": "Place", name: "Βόρεια Ήπειρος, Αλβανία" } },
      publisher: { "@type": "Organization", "@id": `${BASE_URL}/#organization`, name: "Δρόπολη (Dropolis)" },
    },
  },
  {
    path: "/videos",
    title: "Βίντεο Δρόπολης | Ρεπορτάζ, Εκδηλώσεις και Ιστορία",
    description: "Βίντεο, ρεπορτάζ, ντοκιμαντέρ και εκδηλώσεις από τη Δρόπολη, τα 41 χωριά της και την ελληνική κοινότητα της Βόρειας Ηπείρου.",
    image: `${BASE_URL}/og-videos.png`,
    url: `${BASE_URL}/videos`,
    breadcrumbs: [{ name: "Βίντεο", item: `${BASE_URL}/videos` }],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Βίντεο & Ρεπορτάζ — Δρόπολη",
      description: "Ντοκιμαντέρ, ρεπορτάζ και βίντεο από τα χωριά της Δρόπολης, Βόρεια Ήπειρος.",
      url: `${BASE_URL}/videos`,
      inLanguage: "el",
      about: { "@type": "Place", name: "Δρόπολη", containedInPlace: { "@type": "Place", name: "Βόρεια Ήπειρος, Αλβανία" } },
      publisher: { "@type": "Organization", "@id": `${BASE_URL}/#organization`, name: "Δρόπολη (Dropolis)" },
    },
  },
  {
    path: "/about",
    title: "Σχετικά με το Dropolis",
    description: "Μάθετε για το Dropolis — το portal ειδήσεων, φωτογραφιών και κοινότητας για τα χωριά της Δρόπολης (Βόρεια Ήπειρος, Αλβανία).",
    url: `${BASE_URL}/about`,
    breadcrumbs: [{ name: "Σχετικά", item: `${BASE_URL}/about` }],
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "AboutPage",
        name: "Σχετικά με το Dropolis",
        description: "Portal ειδήσεων και κοινότητας για τα χωριά της Δρόπολης, Βόρεια Ήπειρος.",
        url: `${BASE_URL}/about`,
        mainEntity: {
          "@type": "Organization",
          name: "Dropolis (Δρόπολη)",
          description: "Ψηφιακός κόμβος ενημέρωσης και κοινότητας για την ελληνική μειονότητα της Δρόπολης.",
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "Τι είναι η Δρόπολη;",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Η Δρόπολη (Dropull) είναι δήμος στον νομό Αργυροκάστρου της Αλβανίας. Αποτελεί ένα από τα σημαντικότερα κέντρα της ελληνικής μειονότητας στη Βόρεια Ήπειρο, με 41 χωριά κατανεμημένα σε τρεις δημοτικές ενότητες: Κάτω Δρόπολη, Άνω Δρόπολη και Πωγώνι.",
            },
          },
          {
            "@type": "Question",
            name: "Ποιος δημιούργησε το Dropolis;",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Το Dropolis δημιουργήθηκε από μέλη της κοινότητας της Δρόπολης με στόχο τη δημιουργία ενός ψηφιακού κόμβου ενημέρωσης, πολιτισμού και επικοινωνίας για την ελληνική μειονότητα.",
            },
          },
          {
            "@type": "Question",
            name: "Ποιο είναι το κοινό σας;",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Απευθυνόμαστε σε κατοίκους της Δρόπολης, στους απόδημους Έλληνες της Β. Ηπείρου, σε ερευνητές, τουρίστες και σε κάθε άνθρωπο που ενδιαφέρεται για την ιστορία και τον πολιτισμό της περιοχής.",
            },
          },
          {
            "@type": "Question",
            name: "Πώς μπορώ να συνεισφέρω;",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Μπορείτε να επικοινωνήσετε μαζί μας μέσω της σελίδας Επικοινωνία για να υποβάλετε άρθρα, φωτογραφίες, ιστορίες ή βίντεο από τη Δρόπολη.",
            },
          },
        ],
      },
    ],
  },
  {
    path: "/contact",
    title: "Επικοινωνία",
    description: "Επικοινωνήστε με το Dropolis. Υποβολή άρθρων, φωτογραφιών, ερωτήσεων και συνεργασιών για το portal της Δρόπολης.",
    url: `${BASE_URL}/contact`,
    breadcrumbs: [{ name: "Επικοινωνία", item: `${BASE_URL}/contact` }],
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "ContactPage",
        name: "Επικοινωνία — Dropolis",
        description: "Επικοινωνήστε με το Dropolis.",
        url: `${BASE_URL}/contact`,
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "Πώς μπορώ να υποβάλω άρθρο;",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Στείλτε μας το άρθρο σας μέσω της φόρμας ή στο email μας. Δεχόμαστε άρθρα σχετικά με τη Δρόπολη, την ιστορία, τον πολιτισμό και τον τουρισμό.",
            },
          },
          {
            "@type": "Question",
            name: "Σε πόσο χρόνο θα λάβω απάντηση;",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Απαντάμε συνήθως εντός 1-2 εργάσιμων ημερών.",
            },
          },
          {
            "@type": "Question",
            name: "Μπορώ να στείλω φωτογραφίες;",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Ναι! Αποδεχόμαστε φωτογραφίες από τα χωριά της Δρόπολης. Αναφέρετε τον τόπο, την ημερομηνία και τυχόν πληροφορίες για τη φωτογραφία.",
            },
          },
          {
            "@type": "Question",
            name: "Συνεργάζεστε με τουριστικούς φορείς;",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Ναι, είμαστε ανοιχτοί σε συνεργασίες με τουριστικές επιχειρήσεις, πολιτιστικούς φορείς και ΜΚΟ που δραστηριοποιούνται στη Β. Ήπειρο.",
            },
          },
        ],
      },
    ],
  },
  {
    path: "/press",
    title: "Τύπος & Νέα",
    description: "Δελτία τύπου, media kit και επικοινωνία τύπου για το Dropolis — portal ειδήσεων της Δρόπολης.",
    url: `${BASE_URL}/press`,
    breadcrumbs: [{ name: "Τύπος", item: `${BASE_URL}/press` }],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Τύπος & Νέα — Dropolis",
      description: "Ανακοινώσεις τύπου, media kit και επικοινωνία για δημοσιογράφους.",
      url: `${BASE_URL}/press`,
      inLanguage: "el",
    },
  },
  {
    path: "/help",
    title: "Κέντρο Βοήθειας",
    description: "Απαντήσεις σε συχνές ερωτήσεις για το Dropolis — portal ειδήσεων και κοινότητας της Δρόπολης.",
    url: `${BASE_URL}/help`,
    breadcrumbs: [{ name: "Βοήθεια", item: `${BASE_URL}/help` }],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      name: "Κέντρο Βοήθειας — Dropolis",
      url: `${BASE_URL}/help`,
      mainEntity: [
        {
          "@type": "Question",
          name: "Τι είναι το Dropolis;",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Το Dropolis (Δρόπολη) είναι ένα ψηφιακό portal ειδήσεων, φωτογραφιών, βίντεο και κοινότητας για τα 41 χωριά του Δήμου Δρόπολης στη Βόρεια Ήπειρο (Αλβανία). Σκοπός του είναι να αποτελέσει τη ψηφιακή πλατφόρμα της ελληνικής μειονότητας.",
          },
        },
        {
          "@type": "Question",
          name: "Η υπηρεσία είναι δωρεάν;",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Ναι, η πρόσβαση στο Dropolis είναι εντελώς δωρεάν. Ο ιστότοπος χρηματοδοτείται μέσω διαφημίσεων Google AdSense που εμφανίζονται στις σελίδες.",
          },
        },
        {
          "@type": "Question",
          name: "Πώς μπορώ να βρω ειδήσεις για συγκεκριμένο χωριό;",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Μεταβείτε στη σελίδα Ειδήσεις (/news) και χρησιμοποιήστε το φίλτρο «Χωριό» ή «Κατηγορία» για να εντοπίσετε σχετικό περιεχόμενο. Μπορείτε επίσης να πλοηγηθείτε στη σελίδα του χωριού σας μέσα από τον κατάλογο Χωριά.",
          },
        },
        {
          "@type": "Question",
          name: "Πώς μπορώ να υποβάλω νέο ή ανακοίνωση;",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Επικοινωνήστε μαζί μας μέσω της σελίδας Επικοινωνία (/contact) ή στο email dropolis9@gmail.com. Η σύνταξη αξιολογεί κάθε υποβολή πριν τη δημοσίευση.",
          },
        },
        {
          "@type": "Question",
          name: "Πόσα χωριά καλύπτει το Dropolis;",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Το Dropolis καλύπτει και τα 41 χωριά του Δήμου Δρόπολης, κατανεμημένα σε τρεις Δημοτικές Ενότητες: Κάτω Δρόπολης (16 χωριά), Άνω Δρόπολης (18 χωριά) και Πωγωνίου (7 χωριά).",
          },
        },
        {
          "@type": "Question",
          name: "Μπορώ να αναρτήσω δικές μου φωτογραφίες;",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Η δυνατότητα υποβολής φωτογραφιών από χρήστες βρίσκεται υπό ανάπτυξη. Προς το παρόν, μπορείτε να στείλετε φωτογραφίες στο dropolis9@gmail.com και η ομάδα θα τις αξιολογήσει για ανάρτηση.",
          },
        },
        {
          "@type": "Question",
          name: "Πώς λειτουργεί το live chat;",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Το chat κοινότητας (/chat) ανανεώνεται αυτόματα κάθε 5 δευτερόλεπτα. Μπορείτε να στείλετε μηνύματα εισάγοντας ένα παρατσούκλι και το κείμενό σας. Δεν απαιτείται εγγραφή.",
          },
        },
        {
          "@type": "Question",
          name: "Μπορώ να εγκαταστήσω το Dropolis ως εφαρμογή στο κινητό μου;",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Ναι! Το Dropolis είναι Progressive Web App (PWA). Στο Android ανοίξτε το site στο Chrome και πατήστε «Εγκατάσταση» ή «Προσθήκη στην αρχική οθόνη». Στο iPhone/iPad χρησιμοποιήστε Safari → κουμπί «Κοινοποίηση» → «Πρόσθεσε στην Αρχική Οθόνη».",
          },
        },
        {
          "@type": "Question",
          name: "Πώς μπορώ να αλλάξω σε σκοτεινό (dark) θέμα;",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Κάντε κλικ στο εικονίδιο 🌙 / ☀️ στην επάνω δεξιά γωνία της σελίδας. Η επιλογή αποθηκεύεται αυτόματα στον browser σας.",
          },
        },
      ],
    },
  },
  {
    path: "/privacy",
    title: "Πολιτική Απορρήτου",
    description: "Πολιτική Απορρήτου του Dropolis. Πληροφορίες για τη συλλογή, χρήση και προστασία των προσωπικών δεδομένων σας.",
    url: `${BASE_URL}/privacy`,
    breadcrumbs: [{ name: "Πολιτική Απορρήτου", item: `${BASE_URL}/privacy` }],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Πολιτική Απορρήτου — Dropolis",
      url: `${BASE_URL}/privacy`,
      inLanguage: "el",
    },
  },
  {
    path: "/terms",
    title: "Όροι Χρήσης",
    description: "Όροι Χρήσης του Dropolis. Πληροφορίες για τη χρήση του portal ειδήσεων και κοινότητας της Δρόπολης.",
    url: `${BASE_URL}/terms`,
    breadcrumbs: [{ name: "Όροι Χρήσης", item: `${BASE_URL}/terms` }],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Όροι Χρήσης — Dropolis",
      url: `${BASE_URL}/terms`,
      inLanguage: "el",
    },
  },
  {
    path: "/cookie-policy",
    title: "Πολιτική Cookies",
    description: "Πολιτική Cookies του Dropolis. Πληροφορίες για τη χρήση cookies και τεχνολογιών παρακολούθησης.",
    url: `${BASE_URL}/cookie-policy`,
    breadcrumbs: [{ name: "Πολιτική Cookies", item: `${BASE_URL}/cookie-policy` }],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Πολιτική Cookies — Dropolis",
      url: `${BASE_URL}/cookie-policy`,
      inLanguage: "el",
    },
  },
  {
    path: "/disclaimer",
    title: "Αποποίηση Ευθύνης",
    description: "Αποποίηση Ευθύνης του Dropolis. Πληροφορίες για τα όρια ευθύνης του ιστότοπου.",
    url: `${BASE_URL}/disclaimer`,
    breadcrumbs: [{ name: "Αποποίηση Ευθύνης", item: `${BASE_URL}/disclaimer` }],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Αποποίηση Ευθύνης — Dropolis",
      url: `${BASE_URL}/disclaimer`,
      inLanguage: "el",
    },
  },
  {
    path: "/sitemap",
    title: "Χάρτης Ιστότοπου",
    description: "Χάρτης ιστότοπου του Dropolis — πλήρης κατάλογος σελίδων και ενότητες του portal.",
    url: `${BASE_URL}/sitemap`,
    breadcrumbs: [{ name: "Χάρτης Ιστότοπου", item: `${BASE_URL}/sitemap` }],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Χάρτης Ιστότοπου — Dropolis",
      url: `${BASE_URL}/sitemap`,
      inLanguage: "el",
    },
  },
  {
    path: "/editorial-policy",
    title: "Συντακτική Πολιτική",
    description: "Οι συντακτικές αρχές του Dropolis — πολιτική πηγών, χρήση AI και αυτοματισμών, ανεξαρτησία και διαφάνεια.",
    url: `${BASE_URL}/editorial-policy`,
    breadcrumbs: [{ name: "Συντακτική Πολιτική", item: `${BASE_URL}/editorial-policy` }],
    jsonLd: { "@context": "https://schema.org", "@type": "WebPage", name: "Συντακτική Πολιτική — Dropolis", url: `${BASE_URL}/editorial-policy`, inLanguage: "el" },
  },
  {
    path: "/corrections-policy",
    title: "Πολιτική Διορθώσεων",
    description: "Πώς μπορείτε να ζητήσετε διόρθωση άρθρου στο Dropolis — διαδικασία αξιολόγησης, χρονοδιάγραμμα και διαφάνεια.",
    url: `${BASE_URL}/corrections-policy`,
    breadcrumbs: [{ name: "Πολιτική Διορθώσεων", item: `${BASE_URL}/corrections-policy` }],
    jsonLd: { "@context": "https://schema.org", "@type": "WebPage", name: "Πολιτική Διορθώσεων — Dropolis", url: `${BASE_URL}/corrections-policy`, inLanguage: "el" },
  },
  {
    path: "/contributors",
    title: "Συνεισφέρετε στο Dropolis",
    description: "Πώς μπορείτε να υποβάλετε ειδήσεις, φωτογραφίες και ιστορικές μαρτυρίες από τη Δρόπολη — οδηγός για τοπικούς ανταποκριτές.",
    url: `${BASE_URL}/contributors`,
    breadcrumbs: [{ name: "Συνεισφορά", item: `${BASE_URL}/contributors` }],
    jsonLd: { "@context": "https://schema.org", "@type": "WebPage", name: "Συνεισφέρετε στο Dropolis", url: `${BASE_URL}/contributors`, inLanguage: "el" },
  },
  {
    path: "/advertise",
    title: "Διαφήμιση",
    description: "Πληροφορίες για διαφήμιση και χορηγία στο Dropolis — portal ειδήσεων της ελληνικής μειονότητας στη Βόρεια Ήπειρο.",
    url: `${BASE_URL}/advertise`,
    breadcrumbs: [{ name: "Διαφήμιση", item: `${BASE_URL}/advertise` }],
    jsonLd: { "@context": "https://schema.org", "@type": "WebPage", name: "Διαφήμιση — Dropolis", url: `${BASE_URL}/advertise`, inLanguage: "el" },
  },
  {
    path: "/en",
    title: "Dropolis — Northern Epirus News Portal (English)",
    description: "English-language guide to Dropolis — the digital community portal for Dropull (Northern Epirus, Albania) and the Greek minority villages.",
    url: `${BASE_URL}/en`,
    breadcrumbs: [{ name: "English", item: `${BASE_URL}/en` }],
    jsonLd: { "@context": "https://schema.org", "@type": "WebPage", name: "Dropolis — Northern Epirus in English", url: `${BASE_URL}/en`, inLanguage: "en" },
  },
  {
    path: "/en/about",
    title: "About Dropolis",
    description: "Learn about Dropolis — the digital community platform for the 41 villages of Dropull, Northern Epirus, covering news, history and culture of the Greek minority in Albania.",
    url: `${BASE_URL}/en/about`,
    breadcrumbs: [{ name: "English", item: `${BASE_URL}/en` }, { name: "About", item: `${BASE_URL}/en/about` }],
    jsonLd: { "@context": "https://schema.org", "@type": "AboutPage", name: "About Dropolis", url: `${BASE_URL}/en/about`, inLanguage: "en" },
  },
  {
    path: "/en/villages",
    title: "The 41 Villages of Dropull, Northern Epirus",
    description: "Explore the 41 villages of the Dropull municipality in southern Albania — geography, history, and the Greek minority heritage of Northern Epirus.",
    url: `${BASE_URL}/en/villages`,
    breadcrumbs: [{ name: "English", item: `${BASE_URL}/en` }, { name: "Villages", item: `${BASE_URL}/en/villages` }],
    jsonLd: { "@context": "https://schema.org", "@type": "CollectionPage", name: "The 41 Villages of Dropull", url: `${BASE_URL}/en/villages`, inLanguage: "en" },
  },
  {
    path: "/en/news",
    title: "News from Dropull, Northern Epirus",
    description: "Guide to Dropolis news coverage — what we report on, news categories, and how to find articles about the Greek minority of Dropull, Northern Epirus.",
    url: `${BASE_URL}/en/news`,
    breadcrumbs: [{ name: "English", item: `${BASE_URL}/en` }, { name: "News", item: `${BASE_URL}/en/news` }],
    jsonLd: { "@context": "https://schema.org", "@type": "WebPage", name: "News from Dropull — Dropolis", url: `${BASE_URL}/en/news`, inLanguage: "en" },
  },
  {
    path: "/en/contact",
    title: "Contact Dropolis",
    description: "Get in touch with the Dropolis team in English — news tips, photo submissions, research enquiries and partnership proposals.",
    url: `${BASE_URL}/en/contact`,
    breadcrumbs: [{ name: "English", item: `${BASE_URL}/en` }, { name: "Contact", item: `${BASE_URL}/en/contact` }],
    jsonLd: { "@context": "https://schema.org", "@type": "ContactPage", name: "Contact Dropolis", url: `${BASE_URL}/en/contact`, inLanguage: "en" },
  },
  {
    path: "/submit-news",
    title: "Στείλτε Είδηση",
    description: "Υποβάλετε είδηση, ανακοίνωση ή ρεπορτάζ από τη Δρόπολη. Η σύνταξη αξιολογεί κάθε υποβολή πριν τη δημοσίευση.",
    url: `${BASE_URL}/submit-news`,
    breadcrumbs: [{ name: "Στείλτε Είδηση", item: `${BASE_URL}/submit-news` }],
    jsonLd: { "@context": "https://schema.org", "@type": "WebPage", name: "Στείλτε Είδηση — Dropolis", url: `${BASE_URL}/submit-news`, inLanguage: "el" },
  },
  {
    path: "/upload-photo",
    title: "Ανέβασε Φωτογραφία",
    description: "Μοιραστείτε φωτογραφίες από τα χωριά της Δρόπολης. Υποβολή εικόνων για το φωτογραφικό αρχείο του Dropolis.",
    url: `${BASE_URL}/upload-photo`,
    breadcrumbs: [{ name: "Υποβολή Φωτογραφίας", item: `${BASE_URL}/upload-photo` }],
    jsonLd: { "@context": "https://schema.org", "@type": "WebPage", name: "Ανέβασε Φωτογραφία — Dropolis", url: `${BASE_URL}/upload-photo`, inLanguage: "el" },
  },
  {
    path: "/submit-video",
    title: "Ανεβάστε Βίντεο",
    description: "Μοιραστείτε βίντεο από τη Δρόπολη. Υποβολή YouTube link για το αρχείο βίντεο του Dropolis.",
    url: `${BASE_URL}/submit-video`,
    breadcrumbs: [{ name: "Ανεβάστε Βίντεο", item: `${BASE_URL}/submit-video` }],
    jsonLd: { "@context": "https://schema.org", "@type": "WebPage", name: "Ανεβάστε Βίντεο — Dropolis", url: `${BASE_URL}/submit-video`, inLanguage: "el" },
  },
];

/**
 * STATIC_META for the dev crawler middleware — same data as STATIC_PRERENDER
 * but keyed by path for O(1) lookup.
 */
export const STATIC_META: Record<string, Meta> = Object.fromEntries(
  STATIC_PRERENDER.map(({ path, ...meta }) => [path, meta])
);

/**
 * Legacy URL aliases that are handled as client-side redirects in App.tsx.
 * Value is the full canonical URL so the crawler middleware can issue a 301
 * and the prerender script can write a canonical-redirect stub.
 */
export const CRAWLER_REDIRECTS: Record<string, string> = {
  "/privacy-policy": `${BASE_URL}/privacy`,
  "/terms-of-service": `${BASE_URL}/terms`,
};
