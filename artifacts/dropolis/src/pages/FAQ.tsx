import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SEO } from "@/components/SEO";
import { Link } from "wouter";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqs: { category: string; q: string; a: string }[] = [
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
    a: "Επικοινωνήστε μαζί μας μέσω της σελίδας Επικοινωνία (/contact) ή στο email news@dropolis.net. Η σύνταξη αξιολογεί κάθε υποβολή πριν τη δημοσίευση.",
  },
  {
    category: "Χωριά",
    q: "Πόσα χωριά καλύπτει το Dropolis;",
    a: "Το Dropolis καλύπτει και τα 41 χωριά του Δήμου Δρόπολης, κατανεμημένα σε τρεις Δημοτικές Ενότητες: Κάτω Δρόπολης (16 χωριά), Άνω Δρόπολης (18 χωριά) και Πωγωνίου (7 χωριά).",
  },
  {
    category: "Φωτογραφίες",
    q: "Μπορώ να αναρτήσω δικές μου φωτογραφίες;",
    a: "Η δυνατότητα υποβολής φωτογραφιών από χρήστες βρίσκεται υπό ανάπτυξη. Προς το παρόν, μπορείτε να στείλετε φωτογραφίες στο news@dropolis.net και η ομάδα θα τις αξιολογήσει για ανάρτηση.",
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
    a: "Δοκιμάστε να ανανεώσετε τη σελίδα (Ctrl+Shift+R ή Command+Shift+R). Βεβαιωθείτε ότι χρησιμοποιείτε ενημερωμένο browser (Chrome, Firefox, Safari). Αν το πρόβλημα παραμένει, επικοινωνήστε μαζί μας στο news@dropolis.net.",
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
    <div className="border border-border/60 rounded-xl overflow-hidden bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left gap-4 hover:bg-muted/40 transition-colors"
        aria-expanded={open}
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
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-4 text-sm text-muted-foreground leading-relaxed border-t border-border/50">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const grouped = faqs.reduce<Record<string, typeof faqs>>((acc, faq) => {
  if (!acc[faq.category]) acc[faq.category] = [];
  acc[faq.category].push(faq);
  return acc;
}, {});

export default function FAQ() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <SEO
        title="Συχνές Ερωτήσεις (FAQ)"
        description="Απαντήσεις σε συχνές ερωτήσεις για το Dropolis — portal ειδήσεων και κοινότητας για τα χωριά της Δρόπολης στη Βόρεια Ήπειρο."
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          name: "Συχνές Ερωτήσεις — Dropolis",
          url: "https://dropolis.net/faq",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
          <HelpCircle size={22} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Συχνές Ερωτήσεις</h1>
      </div>
      <p className="text-muted-foreground mb-10 ml-1">
        Βρείτε απαντήσεις στις πιο συνηθισμένες ερωτήσεις για το Dropolis.
        Χρειάζεστε περισσότερη βοήθεια;{" "}
        <Link href="/help" className="text-primary underline underline-offset-4 hover:text-primary/80">
          Κέντρο Βοήθειας
        </Link>{" "}
        ή{" "}
        <Link href="/contact" className="text-primary underline underline-offset-4 hover:text-primary/80">
          Επικοινωνία
        </Link>.
      </p>

      <div className="space-y-10">
        {Object.entries(grouped).map(([category, items]) => (
          <section key={category}>
            <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wider mb-4 pb-2 border-b border-border/50">
              {category}
            </h2>
            <div className="space-y-3">
              {items.map((item) => (
                <FAQItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 p-6 rounded-2xl bg-muted/50 border border-border/50 text-center">
        <p className="text-sm text-muted-foreground">
          Δεν βρήκατε την απάντησή σας;{" "}
          <Link href="/contact" className="text-primary font-medium hover:underline">
            Στείλτε μας μήνυμα
          </Link>{" "}
          και θα σας απαντήσουμε άμεσα.
        </p>
      </div>
    </div>
  );
}
