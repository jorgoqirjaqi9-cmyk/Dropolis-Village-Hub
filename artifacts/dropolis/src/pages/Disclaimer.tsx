import { SEO } from "@/components/SEO";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { AlertTriangle } from "lucide-react";

export default function Disclaimer() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-10 max-w-3xl">
      <SEO
        title="Αποποίηση Ευθύνης"
        description="Αποποίηση Ευθύνης του Dropolis. Πληροφορίες για τα όρια ευθύνης του ιστότοπου."
        breadcrumbs={[{ name: "Αποποίηση Ευθύνης", url: "/disclaimer" }]}
      />

      <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <nav className="text-xs text-muted-foreground flex items-center gap-2">
          <Link href="/" className="hover:text-primary">Αρχική</Link>
          <span>/</span>
          <span>Αποποίηση Ευθύνης</span>
        </nav>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-foreground">Αποποίηση Ευθύνης</h1>
        </div>
        <p className="text-muted-foreground text-sm">Τελευταία ενημέρωση: 10 Ιουνίου 2026</p>
      </motion.header>

      <div className="space-y-8 text-foreground/80 text-sm leading-relaxed">
        {[
          {
            title: "Ακρίβεια Πληροφοριών",
            content: "Το Dropolis καταβάλλει κάθε δυνατή προσπάθεια για την παροχή ακριβών και επίκαιρων πληροφοριών. Ωστόσο, δεν παρέχουμε καμία εγγύηση — ρητή ή σιωπηρή — ως προς την πληρότητα, ακρίβεια, αξιοπιστία ή καταλληλότητα των πληροφοριών για οποιοδήποτε σκοπό.",
          },
          {
            title: "Ειδήσεις & Άρθρα",
            content: "Τα άρθρα και οι ειδήσεις που δημοσιεύονται στο Dropolis εκφράζουν τις απόψεις των αρθρογράφων και δεν αντιπροσωπεύουν απαραίτητα τις θέσεις του Dropolis ως οργανισμού. Ο αναγνώστης ενθαρρύνεται να ελέγχει τις πληροφορίες από πρωτογενείς πηγές.",
          },
          {
            title: "Ιστορικό & Πολιτισμικό Περιεχόμενο",
            content: "Το ιστορικό και πολιτισμικό περιεχόμενο του ιστότοπου βασίζεται σε διαθέσιμες πηγές και τοπικές παραδόσεις. Ενδέχεται να υπάρχουν αποκλίσεις από επίσημες ιστορικές καταγραφές. Το Dropolis δεν αποδέχεται ευθύνη για τυχόν ανακρίβειες ιστορικής φύσης.",
          },
          {
            title: "Τουριστικές Πληροφορίες",
            content: "Οι πληροφορίες τουρισμού (δρομολόγια, ξενοδοχεία, εστιατόρια, αξιοθέατα) παρέχονται για γενική πληροφόρηση μόνο. Συνιστούμε την επαλήθευση πληροφοριών πριν από ταξίδι. Το Dropolis δεν ευθύνεται για αλλαγές σε ωράρια, τιμές ή διαθεσιμότητα.",
          },
          {
            title: "Εξωτερικοί Σύνδεσμοι",
            content: "Ο ιστότοπος περιλαμβάνει συνδέσμους προς εξωτερικούς ιστότοπους. Δεν ελέγχουμε το περιεχόμενο αυτών των ιστότοπων και δεν φέρουμε καμία ευθύνη για αυτό. Η ύπαρξη συνδέσμου δεν συνιστά έγκριση ή υποστήριξη του περιεχομένου.",
          },
          {
            title: "Βίντεο YouTube",
            content: "Τα βίντεο που ενσωματώνονται από το YouTube ανήκουν στους αντίστοιχους δημιουργούς. Το Dropolis δεν φέρει ευθύνη για το περιεχόμενο των βίντεο YouTube. Για παράπονα σχετικά με βίντεο, επικοινωνήστε απευθείας με το YouTube.",
          },
          {
            title: "Περιορισμός Ευθύνης",
            content: "Το Dropolis δεν ευθύνεται για οποιεσδήποτε άμεσες, έμμεσες, τυχαίες, ειδικές ή επακόλουθες ζημίες που προκύπτουν από τη χρήση ή αδυναμία χρήσης του ιστότοπου.",
          },
        ].map(({ title, content }, i) => (
          <motion.section
            key={title}
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.04 }}
            className="space-y-2"
          >
            <h2 className="text-xl font-serif font-semibold text-foreground">{title}</h2>
            <p>{content}</p>
          </motion.section>
        ))}
      </div>

      <div className="glass-card rounded-xl p-5 text-sm text-muted-foreground">
        Δείτε επίσης: <Link href="/privacy/" className="text-primary hover:underline">Πολιτική Απορρήτου</Link> · <Link href="/terms/" className="text-primary hover:underline">Όροι Χρήσης</Link> · <Link href="/contact/" className="text-primary hover:underline">Επικοινωνία</Link>
      </div>
    </div>
  );
}
