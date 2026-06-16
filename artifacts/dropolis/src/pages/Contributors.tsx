import { Link } from "wouter";
import { SEO } from "@/components/SEO";
import { motion } from "framer-motion";
import { Camera, Newspaper, BookMarked, AlertTriangle, Mail } from "lucide-react";

const fade = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } };

const accepts = [
  {
    icon: Newspaper,
    title: "Ειδήσεις και ρεπορτάζ",
    desc: "Γεγονότα από τη Δρόπολη που αξίζει να γνωρίζει η κοινότητα: τοπικές εκδηλώσεις, αποφάσεις Δήμου, σημαντικές αφίξεις ή αναχωρήσεις, αγροτικά και κοινωνικά θέματα.",
  },
  {
    icon: Camera,
    title: "Φωτογραφίες",
    desc: "Εικόνες από τα χωριά, τοπία, παραδοσιακά κτίρια, εκδηλώσεις. Αποδεχόμαστε φωτογραφίες για τις οποίες κατέχετε τα πνευματικά δικαιώματα ή έχετε ρητή άδεια χρήσης.",
  },
  {
    icon: BookMarked,
    title: "Ιστορικές μαρτυρίες",
    desc: "Προφορικές ιστορίες, αναμνήσεις, βιογραφικά γνωστών προσώπων από τα χωριά, ιστορικά έγγραφα ή φωτογραφίες από παλιά. Το αρχείο χτίζεται από τη μνήμη της κοινότητας.",
  },
];

const standards = [
  "Το περιεχόμενο αφορά άμεσα τη Δρόπολη ή την ελληνική μειονότητα της Βόρειας Ηπείρου.",
  "Τα γεγονότα που αναφέρετε είναι επαληθεύσιμα — αναφέρετε πηγές ή μάρτυρες.",
  "Δεν υποβάλλεται περιεχόμενο που προάγει μίσος, ψευδείς ισχυρισμούς ή παραπληροφόρηση.",
  "Φωτογραφίες τρίτων προσώπων πρέπει να συνοδεύονται από συγκατάθεση ή να αφορούν δημόσια πρόσωπα σε δημόσια συνάρτηση.",
  "Αναφέρετε ξεκάθαρα αν κάτι είναι γνώμη ή ανάλυση, όχι γεγονός.",
];

export default function Contributors() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl space-y-12">
      <SEO
        title="Συνεισφέρετε στο Dropolis"
        description="Πώς μπορείτε να υποβάλετε ειδήσεις, φωτογραφίες και ιστορικές μαρτυρίες από τη Δρόπολη — οδηγός για τοπικούς ανταποκριτές."
        breadcrumbs={[{ name: "Συνεισφορά", url: "/contributors" }]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Συνεισφέρετε στο Dropolis",
          description: "Πώς κάτοικοι και φίλοι της Δρόπολης μπορούν να συνεισφέρουν περιεχόμενο.",
          url: "https://dropolis.net/contributors",
          inLanguage: "el",
        }}
      />

      <motion.header initial="hidden" animate="show" variants={fade}>
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-secondary/80 bg-secondary/10 px-3 py-1.5 rounded-full mb-4">
          Κοινότητα
        </div>
        <h1 className="text-4xl font-serif font-bold text-foreground mb-3">Συνεισφέρετε στο Dropolis</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Το Dropolis χτίζεται από τη γνώση και τις ιστορίες της κοινότητας. Αν ζείτε στη Δρόπολη, κατάγεστε από εκεί ή απλώς γνωρίζετε κάτι αξιόλογο, μπορείτε να συνεισφέρετε.
        </p>
      </motion.header>

      <motion.section initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade} className="space-y-4">
        <h2 className="text-2xl font-serif font-bold text-foreground">Τι δεχόμαστε</h2>
        <div className="space-y-4">
          {accepts.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass-card rounded-2xl p-5 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade} className="space-y-4">
        <h2 className="text-2xl font-serif font-bold text-foreground">Πρότυπα υποβολής</h2>
        <div className="glass-card rounded-2xl p-6 space-y-3">
          {standards.map((s, i) => (
            <div key={i} className="flex gap-3 text-sm text-muted-foreground leading-relaxed">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
              <span>{s}</span>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade} className="glass-card rounded-2xl p-6 border border-amber-500/20 bg-amber-50/5">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-foreground mb-1">Πνευματική ιδιοκτησία</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Με την υποβολή περιεχομένου, παρέχετε στο Dropolis άδεια δημοσίευσης και μεταφόρτωσής του στον ιστότοπο. Διατηρείτε τα πνευματικά σας δικαιώματα. Αν θέλετε να αποσύρετε κάτι που έχετε υποβάλει, επικοινωνήστε μαζί μας.
            </p>
          </div>
        </div>
      </motion.section>

      <motion.section initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade} className="glass-card rounded-2xl p-6 border border-primary/15">
        <h2 className="font-serif text-xl font-bold text-foreground mb-3">Πώς να υποβάλετε</h2>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          Στείλτε ένα email στη συντακτική ομάδα με το υλικό σας. Απαντάμε συνήθως εντός 1-2 εργάσιμων ημερών.
        </p>
        <div className="flex flex-wrap gap-3">
          <a href="mailto:info@dropolis.net?subject=Συνεισφορά" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors">
            <Mail size={14} /> info@dropolis.net
          </a>
          <Link href="/contact/" className="inline-flex items-center gap-2 border border-border text-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:bg-muted transition-colors">
            Φόρμα επικοινωνίας
          </Link>
        </div>
      </motion.section>
    </div>
  );
}
