import { SEO } from "@/components/SEO";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Cookie } from "lucide-react";

const cookieTypes = [
  {
    type: "Απαραίτητα Cookies",
    required: true,
    desc: "Αυτά τα cookies είναι απαραίτητα για τη λειτουργία του ιστότοπου και δεν μπορούν να απενεργοποιηθούν.",
    examples: ["Προτιμήσεις θέματος (dark/light mode)", "Ρυθμίσεις συναίνεσης cookies"],
    provider: "Dropolis",
    duration: "Περίοδος σύνδεσης / 1 χρόνος",
  },
  {
    type: "Cookies Ανάλυσης",
    required: false,
    desc: "Μας βοηθούν να κατανοήσουμε πώς χρησιμοποιείται ο ιστότοπος, ώστε να τον βελτιώσουμε.",
    examples: ["Google Analytics (_ga, _gid)", "Μετρήσεις επισκεψιμότητας"],
    provider: "Google Analytics",
    duration: "Έως 2 χρόνια",
  },
  {
    type: "Cookies Διαφήμισης",
    required: false,
    desc: "Χρησιμοποιούνται για εξατομικευμένες διαφημίσεις μέσω Google AdSense.",
    examples: ["Google AdSense (IDE, __gads)", "Παρακολούθηση μετατροπών"],
    provider: "Google AdSense",
    duration: "Έως 2 χρόνια",
  },
];

export default function CookiePolicy() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-10 max-w-3xl">
      <SEO
        title="Πολιτική Cookies"
        description="Πολιτική Cookies του Dropolis. Πληροφορίες για τα cookies που χρησιμοποιούμε και τις επιλογές σας."
        breadcrumbs={[{ name: "Πολιτική Cookies", url: "/cookie-policy" }]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Πολιτική Cookies — Dropolis",
          description: "Πληροφορίες για τα cookies που χρησιμοποιούμε στο Dropolis και τις επιλογές διαχείρισής τους.",
          url: "https://dropolis.net/cookie-policy",
          inLanguage: "el",
          about: { "@type": "Thing", name: "Cookies, GDPR" },
        }}
      />

      <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <nav className="text-xs text-muted-foreground flex items-center gap-2">
          <Link href="/" className="hover:text-primary">Αρχική</Link>
          <span>/</span>
          <span>Πολιτική Cookies</span>
        </nav>
        <h1 className="text-4xl font-serif font-bold text-foreground">Πολιτική Cookies</h1>
        <p className="text-muted-foreground text-sm">Τελευταία ενημέρωση: 10 Ιουνίου 2026</p>
      </motion.header>

      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
        <h2 className="text-2xl font-serif font-semibold text-foreground">Τι είναι τα Cookies;</h2>
        <p className="text-foreground/75 text-sm leading-relaxed">
          Τα cookies είναι μικρά αρχεία κειμένου που αποθηκεύονται στη συσκευή σας όταν επισκέπτεστε έναν ιστότοπο. Χρησιμοποιούνται για να θυμούνται τις προτιμήσεις σας, να αναλύουν την επισκεψιμότητα και να παρέχουν στοχευμένες διαφημίσεις.
        </p>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
        <h2 className="text-2xl font-serif font-semibold text-foreground">Τύποι Cookies που Χρησιμοποιούμε</h2>
        <div className="space-y-4">
          {cookieTypes.map(c => (
            <div key={c.type} className="glass-card rounded-xl p-6 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Cookie className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-foreground">{c.type}</h3>
                </div>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${c.required ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {c.required ? "Απαραίτητο" : "Προαιρετικό"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{c.desc}</p>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="font-medium text-foreground mb-1">Παραδείγματα</p>
                  <ul className="text-muted-foreground space-y-0.5">
                    {c.examples.map(e => <li key={e}>• {e}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">Πάροχος</p>
                  <p className="text-muted-foreground">{c.provider}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">Διάρκεια</p>
                  <p className="text-muted-foreground">{c.duration}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-4">
        <h2 className="text-2xl font-serif font-semibold text-foreground">Πώς να Διαχειριστείτε τα Cookies</h2>
        <p className="text-foreground/75 text-sm leading-relaxed">
          Μπορείτε να ελέγξετε και να διαγράψετε τα cookies μέσω των ρυθμίσεων του προγράμματος περιήγησής σας. Σημειώστε ότι η απενεργοποίηση ορισμένων cookies ενδέχεται να επηρεάσει τη λειτουργικότητα του ιστότοπου.
        </p>
        <ul className="space-y-2 text-sm text-foreground/75">
          {[
            { name: "Google Chrome", url: "https://support.google.com/chrome/answer/95647" },
            { name: "Mozilla Firefox", url: "https://support.mozilla.org/kb/enhanced-tracking-protection-firefox-desktop" },
            { name: "Safari", url: "https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" },
          ].map(({ name, url }) => (
            <li key={name}>• <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{name}</a></li>
          ))}
        </ul>
        <p className="text-foreground/75 text-sm">
          Για διαχείριση cookies Google AdSense: <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">adssettings.google.com</a>
        </p>
      </motion.section>

      <div className="glass-card rounded-xl p-5 text-sm text-muted-foreground">
        Δείτε επίσης: <Link href="/privacy" className="text-primary hover:underline">Πολιτική Απορρήτου</Link> · <Link href="/terms" className="text-primary hover:underline">Όροι Χρήσης</Link> · <Link href="/contact" className="text-primary hover:underline">Επικοινωνία</Link>
      </div>
    </div>
  );
}
