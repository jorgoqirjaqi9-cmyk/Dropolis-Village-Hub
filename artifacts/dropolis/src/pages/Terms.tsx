import { SEO } from "@/components/SEO";
import { motion } from "framer-motion";
import { Link } from "wouter";

const sections = [
  {
    title: "1. Αποδοχή Όρων",
    content: "Με τη χρήση του ιστότοπου Dropolis (dropolis.net) αποδέχεστε πλήρως τους παρόντες Όρους Χρήσης. Αν δεν συμφωνείτε με τους όρους αυτούς, παρακαλούμε να μην χρησιμοποιείτε τον ιστότοπο.",
  },
  {
    title: "2. Περιγραφή Υπηρεσίας",
    content: "Το Dropolis παρέχει ειδήσεις, πληροφορίες, φωτογραφίες, βίντεο και δυνατότητα κοινότητας (chat) σχετικά με τα χωριά της Δρόπολης (Βόρεια Ήπειρος). Ο ιστότοπος λειτουργεί ως πληροφοριακό μέσο και δεν παρέχει νομικές, ιατρικές ή χρηματοοικονομικές συμβουλές.",
  },
  {
    title: "3. Πνευματική Ιδιοκτησία",
    content: "Όλο το περιεχόμενο του Dropolis — κείμενα, φωτογραφίες, βίντεο, γραφικά και λογότυπα — προστατεύεται από πνευματικά δικαιώματα. Απαγορεύεται η αναπαραγωγή, διανομή ή εμπορική χρήση χωρίς έγγραφη άδεια. Μπορείτε να μοιραστείτε περιεχόμενο με αναφορά πηγής.",
  },
  {
    title: "4. Συμπεριφορά Χρηστών (Chat)",
    content: "Κατά τη χρήση της λειτουργίας chat, απαγορεύεται αυστηρά:\n• Ρατσιστικό ή μισαλλόδοξο περιεχόμενο\n• Παρενόχληση, εκφοβισμός ή απειλές\n• Ανεπιθύμητη διαφήμιση (spam)\n• Ψευδείς ειδήσεις ή παραπληροφόρηση\n• Δημοσίευση προσωπικών δεδομένων τρίτων\n\nΔιατηρούμε το δικαίωμα αφαίρεσης μηνυμάτων και αποκλεισμού χρηστών που παραβαίνουν τους κανόνες.",
  },
  {
    title: "5. Περιεχόμενο Τρίτων",
    content: "Ο ιστότοπος ενδέχεται να περιλαμβάνει συνδέσμους προς εξωτερικούς ιστότοπους. Δεν φέρουμε ευθύνη για το περιεχόμενο, τις πρακτικές ασφάλειας ή τις πολιτικές απορρήτου αυτών των ιστότοπων. Τα βίντεο YouTube ενσωματώνονται σύμφωνα με τους όρους χρήσης της Google/YouTube.",
  },
  {
    title: "6. Διαφημίσεις (Google AdSense)",
    content: "Ο ιστότοπος χρησιμοποιεί Google AdSense για εμφάνιση διαφημίσεων. Οι διαφημίσεις δεν αποτελούν υποστήριξη των διαφημιζόμενων προϊόντων ή υπηρεσιών από το Dropolis. Για τη διαχείριση προτιμήσεων διαφημίσεων: g.co/adsettings",
  },
  {
    title: "7. Αποποίηση Ευθύνης",
    content: "Το Dropolis παρέχεται «ως έχει» χωρίς εγγυήσεις κάθε είδους. Δεν εγγυόμαστε την ακρίβεια, πληρότητα ή επικαιρότητα του περιεχομένου. Δεν ευθυνόμαστε για ζημίες που προκύπτουν από τη χρήση ή αδυναμία χρήσης του ιστότοπου.",
  },
  {
    title: "8. Τροποποιήσεις",
    content: "Διατηρούμε το δικαίωμα τροποποίησης των παρόντων όρων ανά πάσα στιγμή. Οι αλλαγές τίθενται σε ισχύ κατά τη δημοσίευσή τους. Η συνέχιση χρήσης του ιστότοπου μετά τις αλλαγές συνιστά αποδοχή των νέων όρων.",
  },
  {
    title: "9. Εφαρμοστέο Δίκαιο",
    content: "Οι παρόντες όροι διέπονται από το δίκαιο της Ελλάδας και της Ευρωπαϊκής Ένωσης. Για κάθε διαφορά αρμόδια είναι τα Ελληνικά Δικαστήρια.",
  },
  {
    title: "10. Επικοινωνία",
    content: "Για ερωτήσεις σχετικά με τους Όρους Χρήσης: dropolis9@gmail.com",
  },
];

export default function Terms() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-10 max-w-3xl">
      <SEO
        title="Όροι Χρήσης"
        description="Όροι Χρήσης του Dropolis — portal ειδήσεων και κοινότητας για τη Δρόπολη, Βόρεια Ήπειρος."
        breadcrumbs={[{ name: "Όροι Χρήσης", url: "/terms" }]}
      />

      <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <nav className="text-xs text-muted-foreground flex items-center gap-2">
          <Link href="/" className="hover:text-primary">Αρχική</Link>
          <span>/</span>
          <span>Όροι Χρήσης</span>
        </nav>
        <h1 className="text-4xl font-serif font-bold text-foreground">Όροι Χρήσης</h1>
        <p className="text-muted-foreground text-sm">Τελευταία ενημέρωση: 10 Ιουνίου 2026</p>
        <p className="text-foreground/80 leading-relaxed">
          Οι παρόντες Όροι Χρήσης διέπουν τη χρήση του ιστότοπου Dropolis. Παρακαλούμε διαβάστε τους προσεκτικά.
        </p>
      </motion.header>

      <div className="space-y-8">
        {sections.map((s, i) => (
          <motion.section
            key={s.title}
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.03 }}
            className="space-y-3"
          >
            <h2 className="text-xl font-serif font-semibold text-foreground">{s.title}</h2>
            <div className="text-foreground/75 text-sm leading-relaxed">
              {s.content.split("\n").map((line, idx) => (
                <p key={idx} className={line.startsWith("•") ? "ml-4" : ""}>{line}</p>
              ))}
            </div>
          </motion.section>
        ))}
      </div>

      <div className="glass-card rounded-xl p-5 text-sm text-muted-foreground">
        Δείτε επίσης: <Link href="/privacy" className="text-primary hover:underline">Πολιτική Απορρήτου</Link> · <Link href="/disclaimer" className="text-primary hover:underline">Αποποίηση Ευθύνης</Link> · <Link href="/contact" className="text-primary hover:underline">Επικοινωνία</Link>
      </div>
    </div>
  );
}
