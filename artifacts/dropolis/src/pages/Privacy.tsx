import { SEO } from "@/components/SEO";
import { motion } from "framer-motion";
import { Link } from "wouter";

const fade = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const sections = [
  {
    title: "1. Ποιοι Είμαστε",
    content: `Το Dropolis (dropolis.replit.app) είναι ένα ψηφιακό portal ειδήσεων και κοινότητας αφιερωμένο στα χωριά της Δρόπολης (Βόρεια Ήπειρος, Αλβανία). Η παρούσα Πολιτική Απορρήτου περιγράφει τον τρόπο συλλογής, χρήσης και προστασίας των προσωπικών δεδομένων σας.`,
  },
  {
    title: "2. Δεδομένα που Συλλέγουμε",
    content: `Συλλέγουμε τα ακόλουθα δεδομένα:\n\n• **Δεδομένα που παρέχετε εσείς**: Όνομα, email και μήνυμα όταν χρησιμοποιείτε τη φόρμα επικοινωνίας.\n• **Δεδομένα chat**: Ψευδώνυμο χρήστη και μηνύματα που υποβάλλετε στην κοινότητα chat.\n• **Αυτόματα δεδομένα**: Διεύθυνση IP, τύπος προγράμματος περιήγησης, σελίδες που επισκεφθήκατε, χρόνος παραμονής (μέσω Google Analytics, εφόσον έχετε συναινέσει).`,
  },
  {
    title: "3. Σκοπός Επεξεργασίας",
    content: `Χρησιμοποιούμε τα δεδομένα σας για:\n\n• Απάντηση στα μηνύματά σας\n• Λειτουργία του chat κοινότητας\n• Ανάλυση επισκεψιμότητας και βελτίωση της εμπειρίας χρήστη\n• Εμφάνιση διαφημίσεων μέσω Google AdSense\n• Συμμόρφωση με τις νομικές μας υποχρεώσεις`,
  },
  {
    title: "4. Google AdSense & Cookies",
    content: `Χρησιμοποιούμε Google AdSense για εμφάνιση διαφημίσεων. Η Google χρησιμοποιεί cookies και τεχνολογίες παρακολούθησης για την εξατομίκευση διαφημίσεων βάσει των προτιμήσεών σας. Μπορείτε να απενεργοποιήσετε την εξατομικευμένη διαφήμιση στις ρυθμίσεις διαφημίσεων της Google.\n\nΓια περισσότερες πληροφορίες: https://policies.google.com/technologies/ads`,
  },
  {
    title: "5. Κοινοποίηση Δεδομένων",
    content: `Δεν πωλούμε, νοικιάζουμε ή εκχωρούμε τα προσωπικά σας δεδομένα σε τρίτους, εκτός από:\n\n• Παρόχους υπηρεσιών που μας βοηθούν στη λειτουργία του portal (Google Analytics, Google AdSense)\n• Εφόσον απαιτείται από το νόμο ή αρμόδια αρχή`,
  },
  {
    title: "6. Διατήρηση Δεδομένων",
    content: `Διατηρούμε τα δεδομένα σας για όσο χρόνο είναι απαραίτητο για τους σκοπούς για τους οποίους συλλέχθηκαν. Τα μηνύματα chat διατηρούνται για 90 ημέρες. Τα δεδομένα φόρμας επικοινωνίας για 12 μήνες.`,
  },
  {
    title: "7. Τα Δικαιώματά σας (GDPR)",
    content: `Αν είστε κάτοικος ΕΟΧ, έχετε τα εξής δικαιώματα:\n\n• **Πρόσβαση**: Λήψη αντιγράφου των δεδομένων σας\n• **Διόρθωση**: Διόρθωση ανακριβών δεδομένων\n• **Διαγραφή**: Αίτημα διαγραφής των δεδομένων σας\n• **Περιορισμός**: Περιορισμός επεξεργασίας\n• **Φορητότητα**: Λήψη δεδομένων σε δομημένη μορφή\n• **Εναντίωση**: Αντίρρηση στην επεξεργασία για εμπορικούς σκοπούς\n\nΓια άσκηση δικαιωμάτων: info@dropolis.gr`,
  },
  {
    title: "8. Ασφάλεια",
    content: `Λαμβάνουμε κατάλληλα τεχνικά και οργανωτικά μέτρα για την προστασία των δεδομένων σας. Η μεταφορά δεδομένων γίνεται μέσω κρυπτογράφησης SSL/TLS.`,
  },
  {
    title: "9. Αλλαγές στην Πολιτική",
    content: `Ενδέχεται να ενημερώνουμε την παρούσα πολιτική κατά καιρούς. Θα ειδοποιούμε για σημαντικές αλλαγές αναρτώντας ειδοποίηση στον ιστότοπο.`,
  },
  {
    title: "10. Επικοινωνία",
    content: `Για ερωτήσεις σχετικά με την Πολιτική Απορρήτου μας, επικοινωνήστε:\n\nEmail: info@dropolis.gr\nΔιεύθυνση: Δρόπολη, Νομός Αργυροκάστρου, Αλβανία`,
  },
];

export default function Privacy() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-10 max-w-3xl">
      <SEO
        title="Πολιτική Απορρήτου"
        description="Πολιτική Απορρήτου του Dropolis. Πληροφορίες για τη συλλογή, χρήση και προστασία των προσωπικών δεδομένων σας."
        breadcrumbs={[{ name: "Πολιτική Απορρήτου", url: "/privacy" }]}
        noindex={false}
      />

      <motion.header initial="hidden" animate="show" variants={fade}
        className="space-y-3"
      >
        <nav className="text-xs text-muted-foreground flex items-center gap-2">
          <Link href="/" className="hover:text-primary">Αρχική</Link>
          <span>/</span>
          <span>Πολιτική Απορρήτου</span>
        </nav>
        <h1 className="text-4xl font-serif font-bold text-foreground">Πολιτική Απορρήτου</h1>
        <p className="text-muted-foreground text-sm">Τελευταία ενημέρωση: 10 Ιουνίου 2026</p>
        <p className="text-foreground/80 leading-relaxed">
          Στο Dropolis σεβόμαστε το απόρρητό σας. Η παρούσα πολιτική εξηγεί πώς συλλέγουμε, χρησιμοποιούμε και προστατεύουμε τα προσωπικά σας δεδομένα σύμφωνα με τον Κανονισμό GDPR (ΕΕ) 2016/679.
        </p>
      </motion.header>

      <div className="space-y-8">
        {sections.map((s, i) => (
          <motion.section
            key={s.title}
            initial="hidden" whileInView="show" viewport={{ once: true }}
            variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.03 } } }}
            className="space-y-3"
          >
            <h2 className="text-xl font-serif font-semibold text-foreground">{s.title}</h2>
            <div className="text-foreground/75 text-sm leading-relaxed whitespace-pre-line">
              {s.content.split("\n").map((line, idx) => {
                if (line.startsWith("• **")) {
                  const match = line.match(/• \*\*(.+?)\*\*: (.+)/);
                  if (match) return <p key={idx}>• <strong>{match[1]}</strong>: {match[2]}</p>;
                }
                if (line.startsWith("• ")) return <p key={idx}>{line}</p>;
                return <p key={idx}>{line}</p>;
              })}
            </div>
          </motion.section>
        ))}
      </div>

      <div className="glass-card rounded-xl p-5 text-sm text-muted-foreground">
        Δείτε επίσης: <Link href="/terms" className="text-primary hover:underline">Όροι Χρήσης</Link> · <Link href="/cookie-policy" className="text-primary hover:underline">Πολιτική Cookies</Link> · <Link href="/contact" className="text-primary hover:underline">Επικοινωνία</Link>
      </div>
    </div>
  );
}
