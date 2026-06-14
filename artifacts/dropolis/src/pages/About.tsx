import { Link } from "wouter";
import { SEO } from "@/components/SEO";
import { motion } from "framer-motion";
import { MapPin, Users, Globe, Heart, BookOpen, Camera } from "lucide-react";

const fade = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const values = [
  { icon: Heart, title: "Αγάπη για την Πατρίδα", desc: "Αφοσιωμένοι στη διατήρηση της ιστορίας και της πολιτιστικής ταυτότητας των χωριών της Δρόπολης." },
  { icon: Globe, title: "Ανοιχτή Κοινότητα", desc: "Συνδέουμε Έλληνες της διασποράς με τη ρίζα τους στη Βόρεια Ήπειρο." },
  { icon: BookOpen, title: "Αξιόπιστη Ενημέρωση", desc: "Παρέχουμε αξιόπιστες ειδήσεις και πληροφορίες σχετικά με την ελληνική μειονότητα." },
  { icon: Camera, title: "Οπτική Τεκμηρίωση", desc: "Αρχειοθετούμε φωτογραφίες, βίντεο και ιστορίες για τα μελλοντικά γενιά." },
];

const faqItems = [
  { q: "Τι είναι η Δρόπολη;", a: "Η Δρόπολη (Dropull) είναι δήμος στον νομό Αργυροκάστρου της Αλβανίας. Αποτελεί ένα από τα σημαντικότερα κέντρα της ελληνικής μειονότητας στη Βόρεια Ήπειρο, με 41 ιστορικά χωριά." },
  { q: "Ποιος δημιούργησε το Dropolis;", a: "Το Dropolis δημιουργήθηκε από μέλη της κοινότητας της Δρόπολης με στόχο τη δημιουργία ενός ψηφιακού κόμβου ενημέρωσης, πολιτισμού και επικοινωνίας για την ελληνική μειονότητα." },
  { q: "Ποιο είναι το κοινό σας;", a: "Απευθυνόμαστε σε κατοίκους της Δρόπολης, στους απόδημους Έλληνες της Β. Ηπείρου, σε ερευνητές, τουρίστες και σε κάθε άνθρωπο που ενδιαφέρεται για την ιστορία και τον πολιτισμό της περιοχής." },
  { q: "Πώς μπορώ να συνεισφέρω;", a: "Μπορείτε να επικοινωνήσετε μαζί μας μέσω της σελίδας Επικοινωνία για να υποβάλετε άρθρα, φωτογραφίες, ιστορίες ή βίντεο από τη Δρόπολη." },
];

export default function About() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "Σχετικά με το Dropolis",
    description: "Portal ειδήσεων και κοινότητας για τα χωριά της Δρόπολης, Βόρεια Ήπειρος.",
    url: "https://dropolis.net/about",
    mainEntity: {
      "@type": "Organization",
      name: "Dropolis (Δρόπολη)",
      description: "Ψηφιακός κόμβος ενημέρωσης και κοινότητας για την ελληνική μειονότητα της Δρόπολης.",
    },
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map(f => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-16 max-w-4xl">
      <SEO
        title="Σχετικά με το Dropolis"
        description="Μάθετε για το Dropolis — το portal ειδήσεων, φωτογραφιών και κοινότητας για τα χωριά της Δρόπολης (Βόρεια Ήπειρος, Αλβανία)."
        breadcrumbs={[{ name: "Σχετικά", url: "/about" }]}
        jsonLd={[jsonLd, faqLd]}
      />

      {/* Hero */}
      <motion.header
        initial="hidden" animate="show" variants={fade}
        className="relative rounded-3xl overflow-hidden bg-primary text-primary-foreground p-10 md:p-16 shadow-2xl text-center"
      >
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 50% 50%, white 0%, transparent 65%)" }} />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-secondary/20 text-secondary px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-4">
            <MapPin size={12} /> Δρόπολη — Β. Ήπειρος
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4">Σχετικά με το Dropolis</h1>
          <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto leading-relaxed">
            Το Dropolis είναι το ψηφιακό σπίτι της Δρόπολης — ένας ζωντανός κόμβος ειδήσεων, ιστοριών και κοινότητας για τα χωριά της Βόρειας Ηπείρου.
          </p>
        </div>
      </motion.header>

      {/* Mission */}
      <motion.section initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade} className="space-y-6">
        <h2 className="text-3xl font-serif font-bold text-foreground">Η Αποστολή μας</h2>
        <div className="prose prose-lg dark:prose-invert max-w-none text-foreground/80 leading-relaxed space-y-4">
          <p>
            Η Δρόπολη αποτελεί ένα από τα σημαντικότερα κέντρα της ελληνικής μειονότητας στη Βόρεια Ήπειρο. Τα 41 ιστορικά χωριά της φέρουν μαζί τους αιώνες ελληνικής ιστορίας, γλώσσας και παράδοσης.
          </p>
          <p>
            Το Dropolis δημιουργήθηκε με έναν ξεκάθαρο στόχο: να λειτουργεί ως η ψηφιακή πλατφόρμα αυτής της κοινότητας. Ένα μέρος όπου οι ντόπιοι μπορούν να ενημερώνονται για τα τελευταία νέα, όπου η διασπορά διατηρεί τη σύνδεση με τη ρίζα της, και όπου επισκέπτες από όλο τον κόσμο μπορούν να ανακαλύψουν την ομορφιά και τον πλούτο αυτής της μοναδικής περιοχής.
          </p>
          <p>
            Ταυτόχρονα, λειτουργούμε ως αρχείο ψηφιακής μνήμης: φωτογραφίες, βίντεο, ιστορίες και μαρτυρίες διατηρούνται για τις επόμενες γενιές που μπορεί να βρίσκονται μακριά από τη γη των προγόνων τους.
          </p>
        </div>
      </motion.section>

      {/* Values */}
      <motion.section initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade} className="space-y-6">
        <h2 className="text-3xl font-serif font-bold text-foreground">Οι Αξίες μας</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {values.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass-card rounded-2xl p-6 flex gap-4 items-start hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Region Info */}
      <motion.section initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade} className="space-y-6">
        <h2 className="text-3xl font-serif font-bold text-foreground">Η Περιοχή της Δρόπολης</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { label: "Δήμος", value: "1", sub: "Δήμος Δρόπολης — Αλβανία" },
            { label: "Ιστορικά Χωριά", value: "41", sub: "Κάθε χωριό με μοναδική ταυτότητα" },
            { label: "Αιώνες Ιστορίας", value: "3.000+", sub: "Αδιάλειπτη ελληνική παρουσία" },
          ].map(({ label, value, sub }) => (
            <div key={label} className="glass-card rounded-2xl p-6 text-center">
              <p className="text-4xl font-serif font-bold text-primary mb-1">{value}</p>
              <p className="font-semibold text-foreground text-sm">{label}</p>
              <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Team */}
      <motion.section initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade} className="space-y-6">
        <h2 className="text-3xl font-serif font-bold text-foreground">Η Ομάδα μας</h2>
        <p className="text-foreground/80 leading-relaxed">
          Το Dropolis υποστηρίζεται από μία ομάδα εθελοντών — κατοίκους, απόδημους και φίλους της Δρόπολης — που μοιράζονται κοινό όραμα: να κρατήσουν ζωντανό τον πολιτισμό και τη μνήμη αυτής της μοναδικής περιοχής. Αν θέλετε να συμμετάσχετε,{" "}
          <Link href="/contact" className="text-primary hover:underline font-medium">επικοινωνήστε μαζί μας</Link>.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "Χρήστος Π.", role: "Αρχισυντάκτης" },
            { name: "Ελένη Μ.", role: "Φωτογράφος" },
            { name: "Νίκος Κ.", role: "Βιντεογράφος" },
            { name: "Αγγελική Β.", role: "Ιστορικός-Αρθρογράφος" },
          ].map(({ name, role }) => (
            <div key={name} className="glass-card rounded-xl p-4 text-center">
              <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <p className="font-semibold text-foreground text-sm">{name}</p>
              <p className="text-xs text-muted-foreground">{role}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* FAQ */}
      <motion.section initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade} className="space-y-6">
        <h2 className="text-3xl font-serif font-bold text-foreground">Συχνές Ερωτήσεις</h2>
        <div className="space-y-4">
          {faqItems.map(({ q, a }) => (
            <details key={q} className="glass-card rounded-xl p-5 group cursor-pointer">
              <summary className="font-semibold text-foreground list-none flex justify-between items-center gap-4">
                {q}
                <span className="text-primary shrink-0 text-xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </motion.section>

      {/* Community / Social */}
      <motion.section initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade} className="space-y-6">
        <h2 className="text-3xl font-serif font-bold text-foreground">Κοινότητα</h2>
        <p className="text-foreground/80 leading-relaxed">
          Ακολουθήστε την κοινότητα της Δρόπολης στα social media για νέα, φωτογραφίες, χάρτες, ιστορίες χωριών και συζητήσεις:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a
            href="https://www.facebook.com/profile.php?id=61590717183098"
            target="_blank"
            rel="noopener noreferrer"
            className="glass-card rounded-2xl p-5 flex items-center gap-4 hover:shadow-lg transition-shadow group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center shrink-0 text-blue-600 font-bold text-lg group-hover:bg-blue-600/20 transition-colors">
              f
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Facebook</p>
              <p className="text-xs text-muted-foreground">Επίσημη σελίδα</p>
            </div>
          </a>
          <a
            href="https://www.youtube.com/@dropolis"
            target="_blank"
            rel="noopener noreferrer"
            className="glass-card rounded-2xl p-5 flex items-center gap-4 hover:shadow-lg transition-shadow group"
          >
            <div className="w-10 h-10 rounded-xl bg-red-600/10 flex items-center justify-center shrink-0 text-red-600 font-bold text-lg group-hover:bg-red-600/20 transition-colors">
              ▶
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">YouTube</p>
              <p className="text-xs text-muted-foreground">Βίντεο & ρεπορτάζ</p>
            </div>
          </a>
          <a
            href="https://www.reddit.com/r/DropolisNet/"
            target="_blank"
            rel="noopener noreferrer"
            className="glass-card rounded-2xl p-5 flex items-center gap-4 hover:shadow-lg transition-shadow group"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0 text-orange-500 font-bold text-sm group-hover:bg-orange-500/20 transition-colors">
              r/
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Reddit</p>
              <p className="text-xs text-muted-foreground">r/DropolisNet</p>
            </div>
          </a>
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
        className="text-center glass-card rounded-3xl p-10 space-y-4"
      >
        <h2 className="text-2xl font-serif font-bold text-foreground">Ανακαλύψτε τη Δρόπολη</h2>
        <p className="text-muted-foreground">Εξερευνήστε τα χωριά, διαβάστε τις ειδήσεις, δείτε φωτογραφίες και βίντεο.</p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link href="/news" className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-medium hover:bg-primary/90 transition-colors">Ειδήσεις</Link>
          <Link href="/villages" className="bg-secondary text-secondary-foreground px-6 py-2.5 rounded-full font-medium hover:bg-secondary/90 transition-colors">Χωριά</Link>
          <Link href="/contact" className="border border-border text-foreground px-6 py-2.5 rounded-full font-medium hover:bg-muted transition-colors">Επικοινωνία</Link>
        </div>
      </motion.section>
    </div>
  );
}
