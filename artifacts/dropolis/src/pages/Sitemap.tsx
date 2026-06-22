import { Link } from "wouter";
import { SEO } from "@/components/SEO";
import { motion } from "framer-motion";
import {
  Home, Newspaper, MapPin, Image, Video,
  Info, Mail, Shield, FileText, Cookie, AlertTriangle,
  Megaphone, HelpCircle, Map, BookOpen, UserPlus, BarChart2, Globe,
} from "lucide-react";

const fade = { hidden: { opacity: 0, y: 20 }, show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.07 } }) };

const sections = [
  {
    title: "Κύριες Σελίδες",
    color: "text-primary",
    border: "border-primary/20",
    bg: "bg-primary/5",
    icon: Home,
    links: [
      { href: "/", label: "Αρχική", desc: "Ειδήσεις, στατιστικά, κοινότητα", icon: Home },
      { href: "/news", label: "Ειδήσεις", desc: "Όλα τα νέα από τη Δρόπολη", icon: Newspaper },
      { href: "/villages", label: "Χωριά", desc: "Κατάλογος 41 χωριών του Δήμου", icon: MapPin },
      { href: "/photos", label: "Φωτογραφίες", desc: "Γκαλερί εικόνων από την περιοχή", icon: Image },
      { href: "/videos", label: "Βίντεο", desc: "Βιντεοσκοπημένες στιγμές", icon: Video },
    ],
  },
  {
    title: "Σχετικά με εμάς",
    color: "text-secondary",
    border: "border-secondary/20",
    bg: "bg-secondary/5",
    icon: Info,
    links: [
      { href: "/about", label: "Σχετικά", desc: "Η ιστορία και η αποστολή του Dropolis", icon: Info },
      { href: "/contact", label: "Επικοινωνία", desc: "Στείλτε μας μήνυμα", icon: Mail },
      { href: "/press", label: "Τύπος", desc: "Δελτία τύπου και δημοσιεύσεις", icon: Megaphone },
      { href: "/help", label: "Βοήθεια", desc: "Συχνές ερωτήσεις και οδηγίες", icon: HelpCircle },
    ],
  },
  {
    title: "Νομικό Πλαίσιο",
    color: "text-muted-foreground",
    border: "border-muted/30",
    bg: "bg-muted/20",
    icon: Shield,
    links: [
      { href: "/privacy", label: "Πολιτική Απορρήτου", desc: "Πώς χειριζόμαστε τα δεδομένα σας", icon: Shield },
      { href: "/terms", label: "Όροι Χρήσης", desc: "Κανόνες χρήσης της πλατφόρμας", icon: FileText },
      { href: "/cookie-policy", label: "Πολιτική Cookies", desc: "Χρήση cookies στον ιστότοπο", icon: Cookie },
      { href: "/disclaimer", label: "Αποποίηση Ευθύνης", desc: "Περιορισμοί ευθύνης", icon: AlertTriangle },
    ],
  },
  {
    title: "Δεοντολογία & Εμπιστοσύνη",
    color: "text-primary",
    border: "border-primary/20",
    bg: "bg-primary/5",
    icon: BookOpen,
    links: [
      { href: "/editorial-policy", label: "Συντακτική Πολιτική", desc: "Πηγές, AI, ανεξαρτησία, διαφάνεια", icon: BookOpen },
      { href: "/corrections-policy", label: "Πολιτική Διορθώσεων", desc: "Πώς να αναφέρετε ανακρίβεια", icon: FileText },
      { href: "/contributors", label: "Συνεισφορά", desc: "Υποβολή ειδήσεων, φωτογραφιών, ιστοριών", icon: UserPlus },
      { href: "/advertise", label: "Διαφήμιση", desc: "Πληροφορίες για διαφήμιση & χορηγία", icon: BarChart2 },
    ],
  },
  {
    title: "English / International",
    color: "text-secondary",
    border: "border-secondary/20",
    bg: "bg-secondary/5",
    icon: Globe,
    links: [
      { href: "/en", label: "Dropolis in English", desc: "English-language portal for Dropull", icon: Globe },
      { href: "/en/about/", label: "About Dropolis", desc: "What we are and what we cover", icon: Info },
      { href: "/en/villages/", label: "The 41 Villages", desc: "Dropull municipality — geography & history", icon: MapPin },
      { href: "/en/news/", label: "News guide (EN)", desc: "How to navigate our Greek news section", icon: Newspaper },
    ],
  },
];

export default function Sitemap() {
  return (
    <>
      <SEO
        title="Χάρτης Ιστοτόπου"
        description="Πλήρης χάρτης του ιστοτόπου Dropolis — Δρόπολη. Βρείτε εύκολα όλες τις σελίδες: ειδήσεις, χωριά, φωτογραφίες, βίντεο, chat και πολλά άλλα."
        breadcrumbs={[{ name: "Χάρτης Ιστοτόπου", url: "/sitemap/" }]}
      />

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Map className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold font-serif text-foreground">Χάρτης Ιστοτόπου</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Όλες οι σελίδες του <span className="text-primary font-semibold">Dropolis</span> σε μία ματιά.
          </p>
        </motion.div>

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((section, si) => (
            <motion.div
              key={section.title}
              custom={si}
              initial="hidden"
              animate="show"
              variants={fade}
              className={`rounded-2xl border ${section.border} ${section.bg} p-6`}
            >
              <h2 className={`text-lg font-bold font-serif mb-5 flex items-center gap-2 ${section.color}`}>
                <section.icon className="w-5 h-5" />
                {section.title}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {section.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-start gap-3 p-3 rounded-xl bg-background/70 hover:bg-background border border-transparent hover:border-border hover:shadow-sm transition-all group"
                  >
                    <div className={`mt-0.5 p-1.5 rounded-lg bg-muted/60 group-hover:bg-primary/10 transition-colors`}>
                      <link.icon className={`w-4 h-4 text-muted-foreground group-hover:${section.color} transition-colors`} />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
                        {link.label}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 leading-snug">
                        {link.desc}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* XML Sitemaps */}
        <motion.div
          custom={sections.length}
          initial="hidden"
          animate="show"
          variants={fade}
          className="mt-8 rounded-2xl border border-dashed border-border bg-muted/10 p-6"
        >
          <h2 className="text-base font-bold font-serif mb-4 text-muted-foreground flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Sitemaps για Μηχανές Αναζήτησης
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl bg-background border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-sm font-medium text-muted-foreground hover:text-primary"
            >
              <FileText className="w-4 h-4 flex-shrink-0" />
              <span>/sitemap.xml</span>
              <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Δυναμικό</span>
            </a>
          </div>
        </motion.div>
      </div>
    </>
  );
}
