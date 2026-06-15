import { SEO } from "@/components/SEO";
import { motion } from "framer-motion";
import { Monitor, Users, Mail, AlertCircle } from "lucide-react";

const fade = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } };

export default function Advertise() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl space-y-12">
      <SEO
        title="Διαφήμιση"
        description="Πληροφορίες για διαφήμιση και χορηγία στο Dropolis — portal ειδήσεων της ελληνικής μειονότητας στη Βόρεια Ήπειρο."
        breadcrumbs={[{ name: "Διαφήμιση", url: "/advertise" }]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Διαφήμιση στο Dropolis",
          description: "Επικοινωνήστε μαζί μας για διαφήμιση ή χορηγία στο portal ειδήσεων Dropolis.",
          url: "https://dropolis.net/advertise",
          inLanguage: "el",
        }}
      />

      <motion.header initial="hidden" animate="show" variants={fade}>
        <h1 className="text-4xl font-serif font-bold text-foreground mb-3">Διαφήμιση στο Dropolis</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Το Dropolis απευθύνεται σε μια εξειδικευμένη κοινότητα: ελληνόφωνους αναγνώστες ενδιαφερόμενους για τη Δρόπολη, τη Βόρεια Ήπειρο και την ελληνική μειονότητα της Αλβανίας.
        </p>
      </motion.header>

      <div className="space-y-5">
        <motion.section initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade} className="glass-card rounded-2xl p-6 flex gap-5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Monitor className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-foreground mb-2">Προγραμματική διαφήμιση (AdSense)</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Ο ιστότοπος εμφανίζει διαφημίσεις μέσω Google AdSense, οι οποίες προβάλλονται αυτόματα σε καθορισμένες θέσεις. Δεν υπάρχει ανθρώπινη επιλογή ή αναθεώρηση των επιμέρους διαφημίσεων. Αν εμφανιστεί διαφήμιση ακατάλληλου περιεχομένου, ενημερώστε μας μέσω email.
            </p>
          </div>
        </motion.section>

        <motion.section initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade} className="glass-card rounded-2xl p-6 flex gap-5">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-foreground mb-2">Κοινό</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Οι αναγνώστες του Dropolis ενδιαφέρονται για ειδήσεις, ιστορία και πολιτισμό της Δρόπολης και της Βόρειας Ηπείρου. Πρόκειται κυρίως για ελληνόφωνους χρήστες στην Ελλάδα, στην Αλβανία και στη διασπορά. Δεν δημοσιεύουμε δεδομένα επισκεψιμότητας που δεν μπορούμε να τεκμηριώσουμε ανεξάρτητα.
            </p>
          </div>
        </motion.section>

        <motion.section initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade} className="glass-card rounded-2xl p-6 flex gap-5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-foreground mb-2">Χορηγίες και Branded Content</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Για επιχειρήσεις, ΜΚΟ ή φορείς που θέλουν να συνεργαστούν απευθείας (sponsored content, banners, υποστήριξη εκδηλώσεων), επικοινωνήστε μαζί μας μέσω email. Κάθε διαφημιστικό ή χορηγούμενο περιεχόμενο επισημαίνεται ρητά ως τέτοιο — δεν παρουσιάζεται ποτέ ως συντακτικό άρθρο.
            </p>
            <a
              href="mailto:info@dropolis.net?subject=Διαφήμιση"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Mail size={14} /> info@dropolis.net
            </a>
          </div>
        </motion.section>
      </div>

      <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade} className="glass-card rounded-2xl p-5 border border-amber-500/20 bg-amber-50/5">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            Δεν αποδεχόμαστε διαφημίσεις για τυχερά παιχνίδια, αμφίβολα χρηματοοικονομικά προϊόντα ή περιεχόμενο που αντιβαίνει στις αξίες της κοινότητάς μας.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
