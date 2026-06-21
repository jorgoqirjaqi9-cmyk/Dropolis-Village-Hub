import { Link } from "wouter";
import { SEO } from "@/components/SEO";
import { motion } from "framer-motion";
import { AlertCircle, Clock, CheckCircle, Mail } from "lucide-react";

const fade = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } };

const steps = [
  {
    n: "1",
    title: "Υποβολή αιτήματος",
    body: "Στείλτε email στο info@dropolis.net με θέμα «Διόρθωση». Αναφέρετε: τον τίτλο ή τη διεύθυνση URL του άρθρου, την ανακρίβεια που εντοπίσατε, και — αν το γνωρίζετε — την ορθή πληροφορία με πηγή.",
  },
  {
    n: "2",
    title: "Αξιολόγηση εντός 48 ωρών",
    body: "Η συντακτική ομάδα αξιολογεί κάθε αίτημα εντός δύο εργάσιμων ημερών. Αν η ανακρίβεια επιβεβαιωθεί, προχωράμε άμεσα σε διόρθωση. Αν το αίτημα δεν γίνει αποδεκτό, σας ενημερώνουμε με σύντομη αιτιολόγηση.",
  },
  {
    n: "3",
    title: "Διόρθωση με σήμανση",
    body: "Τα διορθωμένα άρθρα φέρουν σημείωση «Διόρθωση» στο κάτω μέρος τους, με σαφή αναφορά στο τι άλλαξε και πότε. Δεν διαγράφουμε λάθη αθόρυβα — η διαφάνεια είναι μέρος της συντακτικής μας δέσμευσης.",
  },
  {
    n: "4",
    title: "Σοβαρά λάθη",
    body: "Αν ένα άρθρο περιέχει ουσιαστικά λανθασμένα γεγονότα που παραπλανούν τους αναγνώστες, δίνουμε προτεραιότητα στη διόρθωση και ενδέχεται να προσθέσουμε προσωρινή σημείωση στη σελίδα μέχρι να ολοκληρωθεί η επαλήθευση.",
  },
];

export default function CorrectionsPolicy() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl space-y-12">
      <SEO
        title="Πολιτική Διορθώσεων"
        description="Η πολιτική διορθώσεων του Dropolis εξηγεί πώς διαχειριζόμαστε λάθη, ενημερώσεις και διορθώσεις σε ειδήσεις, άρθρα και κοινοτικό περιεχόμενο."
        breadcrumbs={[{ name: "Πολιτική Διορθώσεων", url: "/corrections-policy/" }]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Πολιτική Διορθώσεων — Dropolis",
          description: "Διαδικασία αναφοράς και διόρθωσης ανακριβειών στο portal Dropolis.",
          url: "https://dropolis.net/corrections-policy",
          inLanguage: "el",
        }}
      />

      <motion.header initial="hidden" animate="show" variants={fade}>
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary/70 bg-primary/8 px-3 py-1.5 rounded-full mb-4">
          <AlertCircle size={12} /> Δεοντολογία
        </div>
        <h1 className="text-4xl font-serif font-bold text-foreground mb-3">Πολιτική Διορθώσεων</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Κάνουμε λάθη. Όταν συμβεί αυτό, θέλουμε να το ξέρουμε και να το διορθώσουμε — γρήγορα, διαφανώς και χωρίς δικαιολογίες.
        </p>
        <p className="text-xs text-muted-foreground mt-3">Τελευταία ενημέρωση: Ιούνιος 2026</p>
      </motion.header>

      <div className="space-y-5">
        {steps.map(({ n, title, body }, i) => (
          <motion.div
            key={n}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={{ hidden: { opacity: 0, x: -16 }, show: { opacity: 1, x: 0, transition: { delay: i * 0.08 } } }}
            className="flex gap-4 glass-card rounded-2xl p-5"
          >
            <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">
              {n}
            </div>
            <div>
              <h2 className="font-semibold text-foreground mb-1">{title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.section initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade} className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: Clock, label: "Χρόνος απόκρισης", value: "48 ώρες" },
          { icon: CheckCircle, label: "Σήμανση διόρθωσης", value: "Πάντα" },
          { icon: Mail, label: "Επικοινωνία", value: "email" },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="glass-card rounded-2xl p-5 text-center">
            <Icon className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="font-bold text-foreground">{value}</p>
          </div>
        ))}
      </motion.section>

      <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade} className="glass-card rounded-2xl p-6 border border-primary/15">
        <h2 className="font-serif text-xl font-bold text-foreground mb-3">Αναφέρετε ανακρίβεια</h2>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          Αν εντοπίσατε λανθασμένη πληροφορία, ημερομηνία, όνομα ή γεγονός σε κάποιο άρθρο μας, ενημερώστε μας.
        </p>
        <a
          href="mailto:info@dropolis.net?subject=Διόρθωση"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Mail size={15} /> Αποστολή αιτήματος διόρθωσης
        </a>
        <p className="text-xs text-muted-foreground mt-4">
          Για συντακτικές παρατηρήσεις, δείτε επίσης τη{" "}
          <Link href="/editorial-policy/" className="text-primary hover:underline">Συντακτική Πολιτική</Link>.
        </p>
      </motion.div>
    </div>
  );
}
