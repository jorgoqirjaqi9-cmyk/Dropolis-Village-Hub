import { Link } from "wouter";
import { SEO } from "@/components/SEO";
import { motion } from "framer-motion";
import { BookOpen, Search, Bot, RefreshCw, ArrowRight } from "lucide-react";

const fade = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } };

const principles = [
  {
    icon: BookOpen,
    title: "Συντακτικές Αρχές",
    body: "Δημοσιεύουμε ειδήσεις και άρθρα που αφορούν άμεσα τη Δρόπολη, την ελληνική μειονότητα της Βόρειας Ηπείρου και την ευρύτερη περιοχή. Προτεραιότητα δίνεται σε επαληθεύσιμα γεγονότα, τοπικό ενδιαφέρον και πολιτισμική αξία. Αποφεύγουμε σκανδαλολογία, αναπαραγωγή ανεπαλήθευτων ισχυρισμών και περιεχόμενο που δεν εξυπηρετεί την κοινότητα.",
  },
  {
    icon: Search,
    title: "Πολιτική Πηγών",
    body: "Το Dropolis αντλεί ειδήσεις από δύο πηγές: α) Επιλεγμένα ελληνόφωνα μέσα ενημέρωσης μέσω RSS, όπου κάθε άρθρο συνοδεύεται από σαφή αναφορά της πηγής και σύνδεσμο. β) Αλλόγλωσσα μέσα (αλβανικά, αγγλικά) για θέματα αλβανικής πολιτικής που αφορούν την ελληνική μειονότητα — αυτά μεταφράζονται και δημοσιεύονται με ρητή αναφορά της αρχικής πηγής. Δεν αναπαράγουμε περιεχόμενο χωρίς απόδοση πηγής.",
  },
  {
    icon: Bot,
    title: "Χρήση AI και Αυτοματισμών",
    body: "Ο ιστότοπος χρησιμοποιεί αυτοματοποιημένα εργαλεία για: μετάφραση αλλόγλωσσων άρθρων (με επεξεργασία από AI), κατηγοριοποίηση και βαθμολόγηση ποιότητας άρθρων πριν τη δημοσίευση, και εντοπισμό χωριών και θεματικών. Άρθρα με χαμηλό βαθμό ποιότητας αποθηκεύονται ως πρόχειρα και δεν δημοσιεύονται αυτόματα. Κανένα AI-generated περιεχόμενο δεν παρουσιάζεται ως αυθεντική ανθρώπινη δημοσιογραφία χωρίς σαφή σήμανση.",
  },
  {
    icon: RefreshCw,
    title: "Ανεξαρτησία και Διαφάνεια",
    body: "Το Dropolis λειτουργεί ανεξάρτητα, χωρίς χρηματοδότηση από κόμματα, κυβερνήσεις ή εταιρικούς χορηγούς που θα μπορούσαν να επηρεάσουν τη συντακτική γραμμή. Τα έσοδα προέρχονται αποκλειστικά από το Google AdSense (προγραμματική διαφήμιση). Διαφημιστικό περιεχόμενο δεν εμφανίζεται ποτέ ως συντακτικό.",
  },
];

export default function EditorialPolicy() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl space-y-12">
      <SEO
        title="Συντακτική Πολιτική"
        description="Οι συντακτικές αρχές του Dropolis — πολιτική πηγών, χρήση AI και αυτοματισμών, ανεξαρτησία και διαφάνεια."
        breadcrumbs={[{ name: "Συντακτική Πολιτική", url: "/editorial-policy/" }]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Συντακτική Πολιτική — Dropolis",
          description: "Οι συντακτικές αρχές, η πολιτική πηγών και η αποκάλυψη χρήσης AI στο Dropolis.",
          url: "https://dropolis.net/editorial-policy",
          inLanguage: "el",
        }}
      />

      <motion.header initial="hidden" animate="show" variants={fade}>
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary/70 bg-primary/8 px-3 py-1.5 rounded-full mb-4">
          <BookOpen size={12} /> Δεοντολογία
        </div>
        <h1 className="text-4xl font-serif font-bold text-foreground mb-3">Συντακτική Πολιτική</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Πώς λαμβάνουμε συντακτικές αποφάσεις, ποιες πηγές χρησιμοποιούμε και πώς αξιοποιούμε την αυτοματοποίηση — χωρίς κρυφές ατζέντες.
        </p>
        <p className="text-xs text-muted-foreground mt-3">Τελευταία ενημέρωση: Ιούνιος 2026</p>
      </motion.header>

      <div className="space-y-6">
        {principles.map(({ icon: Icon, title, body }, i) => (
          <motion.section
            key={title}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { delay: i * 0.08 } } }}
            className="glass-card rounded-2xl p-6 flex gap-5"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-foreground mb-2">{title}</h2>
              <p className="text-muted-foreground leading-relaxed text-sm">{body}</p>
            </div>
          </motion.section>
        ))}
      </div>

      <motion.section initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade} className="glass-card rounded-2xl p-6 border border-primary/15">
        <h2 className="font-serif text-xl font-bold text-foreground mb-3">Επικοινωνία Συντακτικής Ομάδας</h2>
        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
          Για παρατηρήσεις σχετικά με συντακτικές επιλογές ή για να αναφέρετε ανακρίβεια, επικοινωνήστε μαζί μας. Αξιολογούμε κάθε αίτημα εντός 48 ωρών.
        </p>
        <div className="flex flex-wrap gap-3">
          <a href="mailto:info@dropolis.net" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors">
            info@dropolis.net
          </a>
          <Link href="/corrections-policy/" className="inline-flex items-center gap-2 border border-border text-foreground px-5 py-2 rounded-full text-sm font-medium hover:bg-muted transition-colors">
            Πολιτική Διορθώσεων <ArrowRight size={14} />
          </Link>
        </div>
      </motion.section>
    </div>
  );
}
