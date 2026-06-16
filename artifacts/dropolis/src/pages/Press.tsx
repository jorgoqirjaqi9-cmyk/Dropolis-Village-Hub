import { motion } from "framer-motion";
import { SEO } from "@/components/SEO";
import { Link } from "wouter";
import { ArrowRight, Download, Mail, Newspaper, ExternalLink } from "lucide-react";

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.1 } } };

const pressReleases = [
  {
    date: "Ιούνιος 2026",
    title: "Εγκαινιάζεται το Dropolis — το πρώτο ψηφιακό portal για τη Δρόπολη",
    excerpt: "Το Dropolis αποτελεί πλέον την κύρια ψηφιακή πλατφόρμα ειδήσεων, φωτογραφιών και κοινότητας για τα 41 χωριά της ελληνικής μειονότητας στη Βόρεια Ήπειρο.",
    tag: "Εγκαίνια",
  },
  {
    date: "Μάιος 2026",
    title: "41 χωριά, μία ψηφιακή φωνή — η ιστορία της Δρόπολης online",
    excerpt: "Η Δρόπολη αποκτά παρουσία στο internet με πλήρη χαρτογράφηση των χωριών, αρχείο ειδήσεων και ζωντανό chat κοινότητας.",
    tag: "Ανακοίνωση",
  },
  {
    date: "Απρίλιος 2026",
    title: "Νέο πρόγραμμα φωτογραφικής αρχειοθέτησης των χωριών",
    excerpt: "Ξεκινά η συλλογή φωτογραφικού υλικού από κάθε χωριό της Δρόπολης. Η κοινότητα καλείται να συνεισφέρει υλικό.",
    tag: "Πρόγραμμα",
  },
];

const mediaCoverage = [
  {
    outlet: "Greek Reporter",
    url: "https://greekreporter.com",
    headline: "Greek Minority Villages of Northern Epirus Go Digital",
    date: "2026",
  },
  {
    outlet: "Keep Talking Greece",
    url: "https://keeptalkinggreece.com",
    headline: "Dropull Greek Community Launches News Portal",
    date: "2026",
  },
  {
    outlet: "Αργυρόκαστρο Νέα",
    url: "#",
    headline: "Η Δρόπολη αποκτά το δικό της portal ειδήσεων",
    date: "2026",
  },
];

const pressContacts = [
  { name: "Τμήμα Τύπου", email: "press@dropolis.gr", role: "Γενικές ανακοινώσεις & συνεντεύξεις" },
  { name: "Συνεργασίες", email: "partnerships@dropolis.gr", role: "Μέσα ενημέρωσης & ΜΚΟ" },
];

export default function Press() {
  return (
    <div>
      <SEO
        title="Τύπος & Νέα"
        description="Δελτία τύπου, media kit και επικοινωνία τύπου για το Dropolis — portal ειδήσεων της Δρόπολης."
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Press & Media Kit — Dropolis",
            description: "Press releases, media kit, and press contact for journalists covering the Greek minority of Northern Epirus.",
            url: "https://dropolis.net/press",
            inLanguage: "el",
            about: { "@type": "Thing", name: "Greek minority, Northern Epirus, Dropull, Δρόπολη" },
          },
          {
            "@context": "https://schema.org",
            "@type": "NewsMediaOrganization",
            "@id": "https://dropolis.net/#organization",
            name: "Δρόπολη - Dropolis",
            alternateName: ["Dropolis", "Δρόπολη", "Dropull News"],
            url: "https://dropolis.net",
            logo: { "@type": "ImageObject", url: "https://dropolis.net/favicon.svg" },
            sameAs: [
              "https://www.facebook.com/profile.php?id=61590959938071",
              "https://www.instagram.com/dropolis_net/",
              "https://www.reddit.com/r/DropolisNet/",
              "https://www.youtube.com/@dropolis",
            ],
            contactPoint: {
              "@type": "ContactPoint",
              email: "info@dropolis.net",
              contactType: "press",
              availableLanguage: ["Greek", "English"],
            },
            publishingPrinciples: "https://dropolis.net/editorial-policy",
            ethicsPolicy: "https://dropolis.net/editorial-policy",
            correctionsPolicy: "https://dropolis.net/corrections-policy",
          },
        ]}
      />

      {/* Header */}
      <div className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <motion.div
            initial="hidden" animate="show" variants={stagger}
            className="max-w-3xl"
          >
            <motion.div variants={fadeUp}>
              <span className="inline-block text-xs font-semibold tracking-[0.25em] uppercase text-secondary bg-secondary/15 border border-secondary/30 px-3 py-1 rounded-full mb-4">
                Media & Press
              </span>
            </motion.div>
            <motion.h1 variants={fadeUp} className="font-serif text-4xl md:text-5xl font-bold mb-4">
              Τύπος & Νέα
            </motion.h1>
            <motion.p variants={fadeUp} className="text-primary-foreground/70 text-lg leading-relaxed">
              Δελτία τύπου, media kit και επικοινωνία για δημοσιογράφους που καλύπτουν την ελληνική μειονότητα της Βόρειας Ηπείρου.
            </motion.p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 space-y-16">

        {/* Press Releases */}
        <motion.section
          initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}
        >
          <motion.h2 variants={fadeUp} className="font-serif text-3xl font-bold mb-8 relative">
            Δελτία Τύπου
            <span className="absolute -bottom-2 left-0 w-10 h-0.5 bg-secondary rounded-full" />
          </motion.h2>
          <div className="space-y-5">
            {pressReleases.map((pr, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="glass-card rounded-2xl p-6 flex flex-col sm:flex-row gap-5 hover:shadow-md transition-shadow"
              >
                <div className="shrink-0 text-center sm:w-28">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{pr.date}</span>
                  <div className="mt-2">
                    <span className="inline-block bg-secondary/10 text-secondary text-xs font-bold px-2.5 py-1 rounded-full">{pr.tag}</span>
                  </div>
                </div>
                <div className="flex-grow">
                  <h3 className="font-serif text-lg font-bold mb-2">{pr.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{pr.excerpt}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Media Coverage */}
        <motion.section
          initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}
        >
          <motion.h2 variants={fadeUp} className="font-serif text-3xl font-bold mb-8 relative">
            Αναφορές στα Μέσα
            <span className="absolute -bottom-2 left-0 w-10 h-0.5 bg-secondary rounded-full" />
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {mediaCoverage.map((item, i) => (
              <motion.a
                key={i}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                variants={fadeUp}
                whileHover={{ y: -4 }}
                className="glass-card rounded-2xl p-6 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-primary dark:text-secondary text-sm">{item.outlet}</span>
                  <ExternalLink size={14} className="text-muted-foreground group-hover:text-primary dark:group-hover:text-secondary transition-colors" />
                </div>
                <p className="font-serif text-base font-semibold leading-snug mb-2">{item.headline}</p>
                <span className="text-xs text-muted-foreground">{item.date}</span>
              </motion.a>
            ))}
          </div>
        </motion.section>

        {/* Media Kit */}
        <motion.section
          initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}
          className="bg-primary/5 dark:bg-primary/10 rounded-3xl p-8 md:p-12 border border-primary/10"
        >
          <motion.div variants={fadeUp} className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-grow">
              <h2 className="font-serif text-3xl font-bold mb-3">Media Kit</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Κατεβάστε το επίσημο media kit του Dropolis. Περιέχει logos σε SVG/PNG, color palette, font guidelines, στατιστικά χρηστών και στοιχεία επικοινωνίας τύπου.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="/favicon.svg"
                  download="dropolis-logo.svg"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors shadow-md"
                >
                  <Download size={15} /> Logo (SVG)
                </a>
                <a
                  href="mailto:press@dropolis.gr"
                  className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-secondary/90 transition-colors shadow-md"
                >
                  <Mail size={15} /> Αίτηση Media Kit
                </a>
              </div>
            </div>
            <div className="glass-card rounded-2xl p-6 min-w-[220px] space-y-3 shrink-0">
              <h4 className="font-semibold text-sm uppercase tracking-widest text-muted-foreground mb-4">Σε αριθμούς</h4>
              {[
                { label: "Χωριά", value: "41" },
                { label: "Δημοσιεύσεις", value: "19+" },
                { label: "Ετη ιστορίας", value: "2.000+" },
                { label: "Κατηγορίες", value: "5" },
              ].map((s) => (
                <div key={s.label} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="font-bold text-secondary">{s.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.section>

        {/* Press Contacts */}
        <motion.section
          initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}
        >
          <motion.h2 variants={fadeUp} className="font-serif text-3xl font-bold mb-8 relative">
            Επικοινωνία Τύπου
            <span className="absolute -bottom-2 left-0 w-10 h-0.5 bg-secondary rounded-full" />
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {pressContacts.map((c, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="glass-card rounded-2xl p-6"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Newspaper size={18} className="text-primary dark:text-secondary" />
                </div>
                <h3 className="font-semibold mb-1">{c.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{c.role}</p>
                <a
                  href={`mailto:${c.email}`}
                  className="inline-flex items-center gap-1.5 text-primary dark:text-secondary text-sm font-medium hover:opacity-80 transition-opacity"
                >
                  <Mail size={13} /> {c.email}
                </a>
              </motion.div>
            ))}
          </div>
          <motion.div variants={fadeUp} className="mt-6 text-center">
            <Link href="/contact">
              <span className="inline-flex items-center gap-2 text-primary dark:text-secondary font-medium hover:opacity-80 transition-opacity cursor-pointer">
                Γενική επικοινωνία <ArrowRight size={15} />
              </span>
            </Link>
          </motion.div>
        </motion.section>

      </div>
    </div>
  );
}
