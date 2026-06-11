import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SEO } from "@/components/SEO";
import { Link } from "wouter";
import { ChevronDown, Search, MessageSquare, Newspaper, Mountain, Image, Video, Mail, Info } from "lucide-react";

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.08 } } };

const categories = [
  { icon: Newspaper, label: "Ειδήσεις", color: "text-primary dark:text-secondary" },
  { icon: Mountain, label: "Χωριά", color: "text-accent" },
  { icon: Image, label: "Φωτογραφίες", color: "text-secondary" },
  { icon: Video, label: "Βίντεο", color: "text-primary dark:text-secondary" },
  { icon: MessageSquare, label: "Κοινότητα", color: "text-accent" },
  { icon: Info, label: "Σχετικά", color: "text-secondary" },
];

const faqs: { q: string; a: string; category: string }[] = [
  {
    category: "Γενικά",
    q: "Τι είναι το Dropolis;",
    a: "Το Dropolis (Δρόπολη) είναι ένα ψηφιακό portal ειδήσεων, φωτογραφιών, βίντεο και κοινότητας για τα 41 χωριά του Δήμου Δρόπολης στη Βόρεια Ήπειρο (Αλβανία). Σκοπός του είναι να αποτελέσει τη ψηφιακή πλατφόρμα της ελληνικής μειονότητας.",
  },
  {
    category: "Γενικά",
    q: "Η υπηρεσία είναι δωρεάν;",
    a: "Ναι, η πρόσβαση στο Dropolis είναι εντελώς δωρεάν. Ο ιστότοπος χρηματοδοτείται μέσω διαφημίσεων Google AdSense που εμφανίζονται στις σελίδες.",
  },
  {
    category: "Ειδήσεις",
    q: "Πώς μπορώ να βρω ειδήσεις για συγκεκριμένο χωριό;",
    a: "Μεταβείτε στη σελίδα Ειδήσεις (/news) και χρησιμοποιήστε το φίλτρο «Χωριό» ή «Κατηγορία» για να εντοπίσετε σχετικό περιεχόμενο. Μπορείτε επίσης να πλοηγηθείτε στη σελίδα του χωριού σας μέσα από τον κατάλογο Χωριά.",
  },
  {
    category: "Ειδήσεις",
    q: "Πώς μπορώ να υποβάλω νέο ή ανακοίνωση;",
    a: "Επικοινωνήστε μαζί μας μέσω της σελίδας Επικοινωνία (/contact) ή στο email dropolis9@gmail.com. Η σύνταξη αξιολογεί κάθε υποβολή πριν τη δημοσίευση.",
  },
  {
    category: "Χωριά",
    q: "Πόσα χωριά καλύπτει το Dropolis;",
    a: "Το Dropolis καλύπτει και τα 41 χωριά του Δήμου Δρόπολης, κατανεμημένα σε τρεις Δημοτικές Ενότητες: Κάτω Δρόπολης (16 χωριά), Άνω Δρόπολης (18 χωριά) και Πωγωνίου (7 χωριά).",
  },
  {
    category: "Φωτογραφίες",
    q: "Μπορώ να αναρτήσω δικές μου φωτογραφίες;",
    a: "Η δυνατότητα υποβολής φωτογραφιών από χρήστες βρίσκεται υπό ανάπτυξη. Προς το παρόν, μπορείτε να στείλετε φωτογραφίες στο dropolis9@gmail.com και η ομάδα θα τις αξιολογήσει για ανάρτηση.",
  },
  {
    category: "Κοινότητα",
    q: "Πώς λειτουργεί το live chat;",
    a: "Το chat κοινότητας (/chat) ανανεώνεται αυτόματα κάθε 5 δευτερόλεπτα. Μπορείτε να στείλετε μηνύματα εισάγοντας ένα παρατσούκλι και το κείμενό σας. Δεν απαιτείται εγγραφή.",
  },
  {
    category: "Κοινότητα",
    q: "Τι είναι αποδεκτό στο chat;",
    a: "Το chat προορίζεται για συζήτηση σχετικά με τη Δρόπολη, τα χωριά, τις ειδήσεις και την κοινότητα. Απαγορεύεται ανάρμοστο, προσβλητικό ή παράνομο περιεχόμενο. Παρακαλώ δείτε τους Όρους Χρήσης.",
  },
  {
    category: "Τεχνικά",
    q: "Μπορώ να εγκαταστήσω το Dropolis ως εφαρμογή στο κινητό μου;",
    a: "Ναι! Το Dropolis είναι Progressive Web App (PWA). Στο Android ανοίξτε το site στο Chrome και πατήστε «Εγκατάσταση» ή «Προσθήκη στην αρχική οθόνη». Στο iPhone/iPad χρησιμοποιήστε Safari → κουμπί «Κοινοποίηση» → «Πρόσθεσε στην Αρχική Οθόνη».",
  },
  {
    category: "Τεχνικά",
    q: "Το site δεν εμφανίζεται σωστά. Τι κάνω;",
    a: "Δοκιμάστε να ανανεώσετε τη σελίδα (Ctrl+Shift+R ή Command+Shift+R). Βεβαιωθείτε ότι χρησιμοποιείτε ενημερωμένο browser (Chrome, Firefox, Safari). Αν το πρόβλημα παραμένει, επικοινωνήστε μαζί μας στο dropolis9@gmail.com.",
  },
  {
    category: "Τεχνικά",
    q: "Πώς μπορώ να αλλάξω σε σκοτεινό (dark) θέμα;",
    a: "Κάντε κλικ στο εικονίδιο 🌙 / ☀️ στην επάνω δεξιά γωνία της σελίδας. Η επιλογή αποθηκεύεται αυτόματα στον browser σας.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      layout
      className="glass-card rounded-xl overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left gap-4"
      >
        <span className="font-semibold text-sm leading-snug">{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0">
          <ChevronDown size={18} className="text-muted-foreground" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-4">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Help() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const grouped = faqs.reduce<Record<string, typeof faqs>>((acc, faq) => {
    if (!acc[faq.category]) acc[faq.category] = [];
    acc[faq.category].push(faq);
    return acc;
  }, {});

  const filtered = Object.entries(grouped).reduce<Record<string, typeof faqs>>((acc, [cat, items]) => {
    if (activeCategory && cat !== activeCategory) return acc;
    const matches = items.filter(
      (f) =>
        !search ||
        f.q.toLowerCase().includes(search.toLowerCase()) ||
        f.a.toLowerCase().includes(search.toLowerCase())
    );
    if (matches.length) acc[cat] = matches;
    return acc;
  }, {});

  return (
    <div>
      <SEO
        title="Κέντρο Βοήθειας"
        description="Απαντήσεις σε συχνές ερωτήσεις για το Dropolis — portal ειδήσεων και κοινότητας της Δρόπολης."
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          name: "Κέντρο Βοήθειας — Dropolis",
          url: "https://dropolis.replit.app/help",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />

      {/* Header */}
      <div className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <motion.div
            initial="hidden" animate="show" variants={stagger}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.div variants={fadeUp}>
              <span className="inline-block text-xs font-semibold tracking-[0.25em] uppercase text-secondary bg-secondary/15 border border-secondary/30 px-3 py-1 rounded-full mb-4">
                Help Center
              </span>
            </motion.div>
            <motion.h1 variants={fadeUp} className="font-serif text-4xl md:text-5xl font-bold mb-4">
              Κέντρο Βοήθειας
            </motion.h1>
            <motion.p variants={fadeUp} className="text-primary-foreground/70 text-lg mb-8">
              Βρείτε απαντήσεις στις πιο συχνές ερωτήσεις για το Dropolis.
            </motion.p>
            <motion.div variants={fadeUp} className="relative max-w-xl mx-auto">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Αναζήτηση ερώτησης..."
                className="w-full bg-white/10 border border-white/20 rounded-full pl-10 pr-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-secondary/50 text-sm"
              />
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">

        {/* Category filter chips */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2 mb-10 justify-center"
        >
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              !activeCategory ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Όλα
          </button>
          {Object.keys(grouped).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* Quick navigation grid */}
        {!search && !activeCategory && (
          <motion.div
            initial="hidden" animate="show" variants={stagger}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-12"
          >
            {categories.map((cat) => (
              <motion.button
                key={cat.label}
                variants={fadeUp}
                onClick={() => setActiveCategory(cat.label)}
                whileHover={{ y: -3 }}
                className="glass-card rounded-xl p-4 flex flex-col items-center gap-2 hover:shadow-md transition-all cursor-pointer"
              >
                <cat.icon size={22} className={cat.color} />
                <span className="text-xs font-medium">{cat.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* FAQ Groups */}
        <div className="max-w-3xl mx-auto space-y-10">
          {Object.entries(filtered).length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Search size={40} className="mx-auto mb-4 opacity-30" />
              <p>Δεν βρέθηκαν αποτελέσματα για «{search}»</p>
            </div>
          ) : (
            Object.entries(filtered).map(([category, items]) => (
              <motion.section
                key={category}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.1 }}
                variants={stagger}
              >
                <motion.h2 variants={fadeUp} className="font-serif text-2xl font-bold mb-5 flex items-center gap-3">
                  <span className="w-2 h-6 bg-secondary rounded-full inline-block" />
                  {category}
                </motion.h2>
                <div className="space-y-3">
                  {items.map((faq, i) => (
                    <motion.div key={i} variants={fadeUp}>
                      <FAQItem q={faq.q} a={faq.a} />
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            ))
          )}
        </div>

        {/* Still need help CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto mt-16 text-center glass-card rounded-3xl p-10"
        >
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <Mail size={24} className="text-primary dark:text-secondary" />
          </div>
          <h3 className="font-serif text-2xl font-bold mb-3">Δεν βρήκατε απάντηση;</h3>
          <p className="text-muted-foreground mb-6">
            Η ομάδα μας είναι εδώ να βοηθήσει. Στείλτε μας μήνυμα και θα απαντήσουμε σύντομα.
          </p>
          <Link href="/contact">
            <motion.span
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-7 py-3 rounded-full shadow-md cursor-pointer text-sm"
            >
              Επικοινωνήστε μαζί μας <Mail size={15} />
            </motion.span>
          </Link>
        </motion.div>

      </div>
    </div>
  );
}
