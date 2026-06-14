import React, { useRef, useState, useEffect } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { useGetStats, useGetFeaturedArticles, useListArticles } from "@workspace/api-client-react";
import { SEO, seoPages } from "@/components/SEO";
import { AdSenseSlot } from "@/components/AdSenseSlot";
import { Skeleton } from "@/components/ui/skeleton";
import { Newspaper, Users, Image as ImageIcon, Video as VideoIcon, MessageSquare, ChevronDown, ArrowRight, Shield, Globe, Smartphone, Download, X, Camera, CheckCircle2, UsersRound, Map } from "lucide-react";
import { usePWAInstall } from "@/hooks/use-pwa-install";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { WeatherWidget } from "@/components/WeatherWidget";

const COMMUNITY_CATEGORY = "Ειδήσεις Κοινότητας";

const HERO_IMAGE = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0 },
};

const stagger = {
  show: { transition: { staggerChildren: 0.12 } },
};

const mediaMentions = [
  { name: "Greek Reporter", url: "https://greekreporter.com", abbr: "GR" },
  { name: "Keep Talking Greece", url: "https://keeptalkinggreece.com", abbr: "KTG" },
  { name: "Ethnos.gr", url: "https://ethnos.gr", abbr: "ETH" },
  { name: "Αλβανία Νέα", url: "#", abbr: "ΑΝ" },
  { name: "Ομογένεια", url: "#", abbr: "ΟΜ" },
];

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { canNativeInstall, isIOS, isInstalled, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showGenericModal, setShowGenericModal] = useState(false);

  const handleInstallClick = async () => {
    if (isInstalled) return;
    if (canNativeInstall) {
      await install();
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      setShowGenericModal(true);
    }
  };
  const { data: stats, isLoading: statsLoading } = useGetStats();
  const { data: featuredArticles, isLoading: featuredLoading } = useGetFeaturedArticles();
  const { data: recentArticles, isLoading: recentLoading } = useListArticles({ limit: 6 });

  const scrollToContent = () => {
    const el = document.getElementById("content-start");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div>
      <SEO
        title={seoPages.home.title}
        standalone={true}
        description={seoPages.home.description}
        ogDescription={seoPages.home.ogDescription}
        image={seoPages.home.image}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "@id": "https://dropolis.net/#webpage",
          name: "Δρόπολη - Dropolis | Τα 41 χωριά της Δρόπολης στη Βόρεια Ήπειρο",
          description: "Το Dropolis.net είναι η ψηφιακή πλατφόρμα για τη Δρόπολη, τα 41 χωριά της Δρόπολης, την ελληνική μειονότητα στη Βόρεια Ήπειρο, με ειδήσεις, φωτογραφίες, ιστορία, βίντεο και διαδραστικό χάρτη.",
          url: "https://dropolis.net/",
          inLanguage: "el",
          isPartOf: { "@id": "https://dropolis.net/#website" },
          image: "https://dropolis.net/og-home.jpg",
          keywords: "Δρόπολη, Dropolis, Dropull, Βόρεια Ήπειρος, χωριά Δρόπολης, 41 χωριά, ειδήσεις Δρόπολη, φωτογραφίες Δρόπολη, πολιτισμός, κοινότητα, Ήπειρος, Αργυρόκαστρο",
          about: {
            "@type": "AdministrativeArea",
            name: "Δήμος Δρόπολης",
            alternateName: "Municipality of Dropull",
            containedInPlace: { "@type": "Country", name: "Αλβανία" },
          },
        }}
      />

      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        aria-labelledby="hero-heading"
        className="relative w-full min-h-[92vh] flex items-center justify-center overflow-hidden -mt-0"
        style={{ marginTop: 0 }}
      >
        <img
          src={HERO_IMAGE}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          loading="eager"
          decoding="sync"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="hero-gradient absolute inset-0" />

        <motion.div
          className="relative z-10 text-center px-4 max-w-4xl mx-auto"
          initial="hidden"
          animate="show"
          variants={stagger}
        >
          {/* PLAY LIVE radio button */}
          <motion.div variants={fadeUp} className="mb-5">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("radio-play"))}
              className="group inline-flex items-center gap-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/25 text-white px-5 py-2 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              <span className="text-xs font-bold tracking-[0.2em] uppercase">Play Live</span>
              <svg className="w-3.5 h-3.5 fill-white opacity-80" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </button>
          </motion.div>

          <motion.div variants={fadeUp} className="mb-4">
            <span className="inline-block text-xs font-semibold tracking-[0.3em] uppercase text-secondary/90 bg-secondary/10 border border-secondary/30 px-4 py-1.5 rounded-full backdrop-blur-sm">
              Βόρεια Ήπειρος · Αλβανία
            </span>
          </motion.div>

          <motion.h1
            id="hero-heading"
            variants={fadeUp}
            className="font-serif text-5xl sm:text-6xl md:text-7xl font-black text-white text-shadow-hero leading-none tracking-tight mb-4"
          >
            Δρόπολη - Dropolis
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-xl sm:text-2xl text-white/80 font-light text-shadow-hero mb-3 font-serif italic"
          >
            Η ψηφιακή πλατφόρμα της ελληνικής μειονότητας
          </motion.p>

          <motion.p
            variants={fadeUp}
            className="text-white/60 text-sm sm:text-base max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Ειδήσεις, ιστορία, φωτογραφίες και κοινότητα για τα{" "}
            <span className="text-secondary font-semibold">41 χωριά</span> του Δήμου Δρόπολης.
          </motion.p>

          <motion.div variants={fadeUp} className="mx-auto mt-8 flex max-w-4xl flex-col items-center gap-4">
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/news" className="min-h-12 rounded-full bg-yellow-400 px-6 py-3 font-bold text-slate-950 shadow-lg transition hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-200">
                Τελευταίες Ειδήσεις
              </Link>
              <Link href="/villages" className="min-h-12 rounded-full border border-white/40 bg-white/15 px-6 py-3 font-bold text-white backdrop-blur transition hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/70">
                Τα Χωριά μας
              </Link>
              <Link href="/villages/map" className="min-h-12 rounded-full border border-yellow-300/70 bg-blue-950/70 px-6 py-3 font-bold text-yellow-300 backdrop-blur transition hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-yellow-300">
                Διαδραστικός Χάρτης
              </Link>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Link href="/submit-news" className="min-h-10 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20">
                Στείλτε Είδηση
              </Link>
              <Link href="/upload-photo" className="min-h-10 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20">
                Ανέβασε Φωτογραφία
              </Link>
              <Link href="/submit-video" className="min-h-10 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20">
                Ανεβάστε Βίντεο
              </Link>
            </div>
          </motion.div>
        </motion.div>

        {/* Weather overlay — bottom left */}
        <div className="absolute bottom-8 left-6 z-10">
          <WeatherWidget />
        </div>

        <button
          onClick={scrollToContent}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-white/50 hover:text-secondary transition-colors animate-scroll-bounce"
          aria-label="Κύλιση κάτω"
        >
          <ChevronDown size={32} />
        </button>
      </section>

      {/* ── CONTENT ───────────────────────────────────────────────── */}
      <div id="content-start" className="container mx-auto px-4 py-10 space-y-12">

        {/* Breaking News Ticker */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-primary text-primary-foreground py-2.5 px-4 rounded-xl flex items-center gap-4 overflow-hidden shadow-md max-w-full"
        >
          <span className="font-bold whitespace-nowrap bg-secondary text-secondary-foreground px-3 py-1 rounded-lg text-xs uppercase tracking-wider shrink-0">
            Τελευταίες
          </span>
          <div className="flex-grow overflow-hidden relative min-w-0">
            <div className="animate-marquee whitespace-nowrap">
              {recentArticles?.slice(0, 5).map((article) => (
                <span key={article.id} className="mx-6 text-sm inline-flex items-center gap-2">
                  <span className="opacity-40">◆</span>
                  {article.category === COMMUNITY_CATEGORY && (
                    <span className="inline-flex items-center gap-0.5 bg-secondary/30 text-secondary-foreground text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0">
                      <UsersRound className="w-2.5 h-2.5" />
                      Κοινότητα
                    </span>
                  )}
                  <Link href={`/news/${article.id}`} className="hover:text-secondary transition-colors">
                    {article.title}
                  </Link>
                </span>
              )) || <span className="opacity-50 text-sm">Φόρτωση ειδήσεων...</span>}
            </div>
          </div>
        </motion.div>

        {/* Brand intro — visible to crawlers and users */}
        <p className="text-sm text-muted-foreground text-center leading-relaxed max-w-3xl mx-auto -mt-4">
          Το <strong>Dropolis.net</strong> είναι η ψηφιακή πλατφόρμα για τη{" "}
          <strong>Δρόπολη</strong>, τα{" "}
          <Link href="/villages" className="underline underline-offset-2 hover:text-foreground transition-colors">
            41 χωριά της Δρόπολης
          </Link>{" "}
          και την ελληνική μειονότητα στη <strong>Βόρεια Ήπειρο</strong>.
        </p>

        {/* Stats Bar */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-5 gap-4"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
        >
          {[
            { icon: Newspaper, label: "Άρθρα", value: stats?.totalArticles, color: "text-primary" },
            { icon: Users, label: "Χωριά", value: stats?.totalVillages, color: "text-accent" },
            { icon: ImageIcon, label: "Φωτογραφίες", value: stats?.totalPhotos, color: "text-secondary" },
            { icon: VideoIcon, label: "Βίντεο", value: stats?.totalVideos, color: "text-primary" },
            { icon: MessageSquare, label: "Μηνύματα", value: stats?.totalMessages, color: "text-accent" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              whileHover={{ y: -4, scale: 1.02 }}
              className="glass-card rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-default transition-shadow hover:shadow-md"
            >
              <stat.icon className={`h-6 w-6 ${stat.color} mb-2.5 opacity-80`} />
              {statsLoading ? (
                <Skeleton className="h-8 w-12 mb-1" />
              ) : (
                <span className="text-3xl font-bold font-serif text-secondary">{stat.value ?? 0}</span>
              )}
              <span className="text-xs text-muted-foreground uppercase tracking-widest mt-1">{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* ── 41 VILLAGES SECTION ─────────────────────────────────── */}
        <section aria-labelledby="villages-heading">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
              <div>
                <h2 id="villages-heading" className="font-serif text-3xl font-bold text-foreground relative inline-block">
                  Τα 41 χωριά της Δρόπολης
                  <span className="absolute -bottom-2 left-0 w-12 h-0.5 bg-secondary rounded-full" />
                </h2>
                <p className="text-muted-foreground text-sm mt-4 max-w-xl leading-relaxed">
                  Ανακαλύψτε τα χωριά της Δρόπολης μέσα από ειδήσεις, φωτογραφίες, ιστορία και τον διαδραστικό χάρτη.
                </p>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {[
                { id: 51, nameEl: "Δερβιτσάνη", name: "Derviçan" },
                { id: 69, nameEl: "Βουλιαράτες", name: "Bularat" },
                { id: 81, nameEl: "Κακαβιά", name: "Kakavijë" },
                { id: 55, nameEl: "Δούβιανη", name: "Duvjan" },
                { id: 64, nameEl: "Γλύνα", name: "Glina" },
                { id: 65, nameEl: "Βραχογοραντζή", name: "Vraho-Goranxi" },
                { id: 84, nameEl: "Άγιος Νικόλαος", name: "Dritë" },
                { id: 86, nameEl: "Πολίτσανη", name: "Politsan" },
              ].map((v) => (
                <motion.div key={v.id} variants={fadeUp}>
                  <Link href={`/villages/${v.id}`}>
                    <div className="group glass-card rounded-xl p-4 flex items-start gap-3 hover:shadow-md transition-all duration-200 cursor-pointer">
                      <div className="flex-grow min-w-0">
                        <p className="font-semibold text-sm text-foreground group-hover:text-primary dark:group-hover:text-secondary transition-colors leading-tight truncate">
                          {v.nameEl}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{v.name}</p>
                      </div>
                      <ArrowRight size={14} className="shrink-0 mt-1 text-muted-foreground group-hover:text-primary dark:group-hover:text-secondary transition-colors" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
              <Link href="/villages">
                <span className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-full text-sm hover:bg-primary/90 transition-colors min-h-[44px]">
                  <Users size={15} />
                  Όλα τα χωριά
                </span>
              </Link>
              <Link href="/villages/map">
                <span className="inline-flex items-center gap-2 border border-primary text-primary dark:border-secondary dark:text-secondary font-semibold px-5 py-2.5 rounded-full text-sm hover:bg-primary/5 transition-colors min-h-[44px]">
                  <Map size={15} />
                  Διαδραστικός Χάρτης
                </span>
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* PWA Install Button — always visible */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`rounded-2xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-md border ${
            isInstalled
              ? "bg-muted/60 border-border text-muted-foreground"
              : "bg-primary text-primary-foreground border-primary/20"
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isInstalled ? "bg-green-500/20" : "bg-secondary/20"}`}>
            {isInstalled
              ? <CheckCircle2 size={20} className="text-green-500" />
              : <Smartphone size={20} className="text-secondary" />
            }
          </div>
          <div className="flex-grow">
            <p className="font-semibold text-sm">
              {isInstalled ? "Η εφαρμογή είναι εγκατεστημένη" : "Εγκαταστήστε το Dropolis στη συσκευή σας"}
            </p>
            <p className={`text-xs mt-0.5 ${isInstalled ? "text-muted-foreground" : "text-primary-foreground/60"}`}>
              {isInstalled
                ? "Μπορείτε να ανοίξετε το Dropolis απευθείας από την οθόνη σας."
                : "Γρήγορη πρόσβαση στις ειδήσεις — χωρίς browser, δουλεύει offline."}
            </p>
          </div>
          {!isInstalled && (
            <button
              onClick={handleInstallClick}
              className="shrink-0 flex items-center gap-1.5 bg-secondary text-secondary-foreground text-sm font-semibold px-4 py-2 rounded-full hover:bg-secondary/90 transition-colors shadow-md"
            >
              <Download size={14} /> Εγκατάσταση εφαρμογής
            </button>
          )}
        </motion.div>

        {/* iOS install modal */}
        <Dialog open={showIOSModal} onOpenChange={setShowIOSModal}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-serif">
                <Smartphone size={20} className="text-primary" /> Εγκατάσταση στο iPhone / iPad
              </DialogTitle>
              <DialogDescription>
                Το Safari δεν υποστηρίζει αυτόματη εγκατάσταση. Ακολούθησε τα παρακάτω βήματα:
              </DialogDescription>
            </DialogHeader>
            <ol className="space-y-4 mt-2">
              <li className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                <div>
                  <p className="text-sm font-medium">Πάτησε το κουμπί Κοινοποίηση</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Βρίσκεται στο κάτω μέρος του Safari <span className="inline-block">⬆️</span></p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                <div>
                  <p className="text-sm font-medium">Επίλεξε «Προσθήκη στην οθόνη αφετηρίας»</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Κύλισε προς τα κάτω στο μενού επιλογών</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                <div>
                  <p className="text-sm font-medium">Πάτησε «Προσθήκη»</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Το Dropolis θα εμφανιστεί στην αρχική οθόνη σου</p>
                </div>
              </li>
            </ol>
          </DialogContent>
        </Dialog>

        {/* Generic browser install modal */}
        <Dialog open={showGenericModal} onOpenChange={setShowGenericModal}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-serif">
                <Download size={20} className="text-primary" /> Εγκατάσταση εφαρμογής
              </DialogTitle>
              <DialogDescription>
                Ο browser σου μπορεί να υποστηρίζει εγκατάσταση ως εφαρμογή.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-2 space-y-3 text-sm text-foreground">
              <p>Άνοιξε το μενού του browser σου <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">⋮</span> ή <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">≡</span> και επίλεξε:</p>
              <ul className="space-y-2 pl-2">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span><strong>«Install app»</strong> ή <strong>«Εγκατάσταση εφαρμογής»</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span><strong>«Add to Home screen»</strong> ή <strong>«Προσθήκη στην αρχική»</strong></span>
                </li>
              </ul>
              <p className="text-muted-foreground text-xs">Αν δεν εμφανίζεται αυτή η επιλογή, ο browser σου ενδέχεται να μην υποστηρίζει PWA εγκατάσταση.</p>
            </div>
          </DialogContent>
        </Dialog>

        {/* Media Mentions Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-card rounded-2xl px-6 py-5"
        >
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap shrink-0">
              Αναφέρθηκε σε
            </span>
            <div className="w-px h-6 bg-border hidden sm:block shrink-0" />
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-x-6 gap-y-2">
              {mediaMentions.map((m) => (
                <a
                  key={m.name}
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={m.name}
                  className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  {m.name}
                </a>
              ))}
            </div>
            <div className="sm:ml-auto shrink-0">
              <Link href="/press">
                <span className="text-xs text-primary dark:text-secondary hover:opacity-80 transition-opacity cursor-pointer flex items-center gap-1">
                  Τύπος & Νέα <ArrowRight size={12} />
                </span>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
        >
          {[
            { icon: Shield, title: "GDPR Συμμόρφωση", desc: "Πλήρης προστασία δεδομένων", color: "text-accent" },
            { icon: Globe, title: "Β. Ήπειρος", desc: "41 χωριά — πλήρης κάλυψη", color: "text-secondary" },
            { icon: Smartphone, title: "PWA Εφαρμογή", desc: "Εγκαταστήστε στο κινητό", color: "text-primary dark:text-secondary" },
            { icon: Newspaper, title: "Δωρεάν Πρόσβαση", desc: "Πάντα δωρεάν για όλους", color: "text-accent" },
          ].map((badge, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className="glass-card rounded-xl p-4 flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-current/5 flex items-center justify-center shrink-0 mt-0.5">
                <badge.icon size={16} className={badge.color} />
              </div>
              <div>
                <p className="text-xs font-bold leading-tight">{badge.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{badge.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* AdSense */}
        <div>
          <AdSenseSlot adSlot="7994234180" adFormat="horizontal" className="hidden md:block rounded-xl shadow-sm" />
          <AdSenseSlot adSlot="7994234180" adFormat="horizontal" className="md:hidden rounded-xl shadow-sm" />
        </div>

        {/* Main grid: content + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">

            {/* Featured Articles */}
            <section aria-labelledby="featured-heading">
              <div className="flex items-end justify-between mb-6">
                <h2 id="featured-heading" className="font-serif text-3xl font-bold text-foreground relative">
                  Κύριες Ειδήσεις
                  <span className="absolute -bottom-2 left-0 w-12 h-0.5 bg-secondary rounded-full" />
                </h2>
              </div>

              {featuredLoading ? (
                <div className="space-y-6">
                  <Skeleton className="h-[380px] w-full rounded-2xl" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-52 w-full rounded-2xl" />
                    <Skeleton className="h-52 w-full rounded-2xl" />
                  </div>
                </div>
              ) : featuredArticles && featuredArticles.length > 0 ? (
                <motion.div
                  className="space-y-6"
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.1 }}
                  variants={stagger}
                >
                  {/* Hero Featured */}
                  <motion.div variants={fadeUp}>
                    <Link href={`/news/${featuredArticles[0].id}`}>
                      <div className="group relative rounded-2xl overflow-hidden shadow-xl aspect-video md:aspect-[21/9] cursor-pointer">
                        <img
                          src={featuredArticles[0].imageUrl || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=70"}
                          alt={featuredArticles[0].title}
                          loading="lazy"
                          className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                          onError={e => { (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=70"; }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
                          <div className="mb-3">
                            <span className="bg-secondary text-secondary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                              {featuredArticles[0].category}
                            </span>
                          </div>
                          <h3 className="text-2xl md:text-4xl font-serif font-bold text-white mb-2 leading-tight group-hover:text-secondary transition-colors text-shadow-hero">
                            {featuredArticles[0].title}
                          </h3>
                          {featuredArticles[0].excerpt && (
                            <p className="text-white/75 line-clamp-2 md:text-lg mb-2">{featuredArticles[0].excerpt}</p>
                          )}
                          <span className="text-white/50 text-sm">
                            {format(new Date(featuredArticles[0].createdAt), "d MMMM yyyy", { locale: el })}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>

                  {/* Secondary featured */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {featuredArticles.slice(1, 3).map((article) => (
                      <motion.div key={article.id} variants={fadeUp}>
                        <Link href={`/news/${article.id}`}>
                          <div className="group rounded-2xl overflow-hidden shadow-md glass-card flex flex-col h-full cursor-pointer hover:shadow-xl transition-all duration-300">
                            <div className="aspect-video overflow-hidden">
                              <img
                                src={article.imageUrl || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&q=70"}
                                alt={article.title}
                                loading="lazy"
                                className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                                onError={e => { (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&q=70"; }}
                              />
                            </div>
                            <div className="p-4 flex flex-col flex-grow">
                              <span className="text-primary dark:text-secondary text-xs font-bold uppercase tracking-wider mb-2">{article.category}</span>
                              <h4 className="font-serif text-lg font-bold mb-2 line-clamp-2 group-hover:text-primary dark:group-hover:text-secondary transition-colors">{article.title}</h4>
                              <span className="text-muted-foreground text-xs mt-auto">
                                {format(new Date(article.createdAt), "d MMMM yyyy", { locale: el })}
                              </span>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <p className="text-muted-foreground italic">Δεν υπάρχουν κύριες ειδήσεις.</p>
              )}
            </section>

            {/* News Feed */}
            <section aria-labelledby="newsfeed-heading">
              <div className="flex justify-between items-end mb-6">
                <h2 id="newsfeed-heading" className="font-serif text-2xl font-bold text-foreground relative">
                  Ροή Ειδήσεων
                  <span className="absolute -bottom-2 left-0 w-10 h-0.5 bg-secondary rounded-full" />
                </h2>
                <Link href="/news" className="flex items-center gap-1 text-primary dark:text-secondary hover:opacity-80 text-sm font-medium transition-opacity">
                  Όλες οι ειδήσεις <ArrowRight size={14} />
                </Link>
              </div>

              <div className="space-y-4">
                {recentLoading ? (
                  Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
                ) : recentArticles && recentArticles.length > 0 ? (
                  <motion.div
                    className="space-y-4"
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.1 }}
                    variants={stagger}
                  >
                    {recentArticles.map((article) => (
                      <motion.div key={article.id} variants={fadeUp}>
                        <Link
                          href={`/news/${article.id}`}
                          className="group flex flex-col sm:flex-row gap-4 glass-card rounded-xl p-4 hover:shadow-lg transition-all duration-300"
                        >
                          <div className="sm:w-32 md:w-40 aspect-video sm:aspect-square rounded-lg overflow-hidden shrink-0">
                            <img
                              src={article.imageUrl || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=200&q=70"}
                              alt={article.title}
                              loading="lazy"
                              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                              onError={e => { (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=200&q=70"; }}
                            />
                          </div>
                          <div className="flex flex-col flex-grow justify-center">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-primary dark:text-secondary text-xs font-bold uppercase tracking-wider">{article.category}</span>
                              {article.category === COMMUNITY_CATEGORY && (
                                <span className="inline-flex items-center gap-0.5 bg-secondary/15 text-secondary text-[10px] font-semibold px-1.5 py-0.5 rounded border border-secondary/25 uppercase tracking-wide">
                                  <UsersRound className="w-2.5 h-2.5" />
                                  Κοινότητα
                                </span>
                              )}
                              <span className="text-muted-foreground text-xs">• {format(new Date(article.createdAt), "d MMM yyyy", { locale: el })}</span>
                            </div>
                            <h4 className="font-serif text-lg font-bold mb-1.5 group-hover:text-primary dark:group-hover:text-secondary transition-colors line-clamp-2">{article.title}</h4>
                            {article.excerpt && <p className="text-muted-foreground text-sm line-clamp-2">{article.excerpt}</p>}
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <p className="text-muted-foreground italic">Δεν βρέθηκαν ειδήσεις.</p>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="glass-card rounded-2xl p-6 shadow-sm"
            >
              <h3 className="font-serif text-xl font-bold mb-1 text-foreground">Σχετικά με τη Δρόπολη</h3>
              <div className="w-8 h-0.5 bg-secondary rounded mb-4" />
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                Η Δρόπολη είναι ιστορική περιοχή και δήμος του νομού Αργυροκάστρου της νότιας Αλβανίας, που κατοικείται από την Ελληνική Μειονότητα. Αποτελείται από δεκάδες γραφικά χωριά, πλούσια σε ιστορία, πολιτισμό και παραδόσεις.
              </p>
              <div className="grid grid-cols-2 gap-2 mb-5 text-xs">
                {[
                  { label: "Δήμος", value: "Δρόπολης" },
                  { label: "Νομός", value: "Αργυροκάστρου" },
                  { label: "Χωριά", value: "41" },
                  { label: "Περιοχή", value: "Β. Ήπειρος" },
                ].map((item) => (
                  <div key={item.label} className="bg-muted/50 rounded-lg p-2.5 text-center">
                    <div className="text-muted-foreground">{item.label}</div>
                    <div className="font-semibold text-foreground mt-0.5">{item.value}</div>
                  </div>
                ))}
              </div>
              <Link href="/villages">
                <span className="flex items-center gap-1.5 text-primary dark:text-secondary text-sm font-medium hover:opacity-80 transition-opacity cursor-pointer">
                  Ανακαλύψτε τα χωριά <ArrowRight size={14} />
                </span>
              </Link>

              <div className="mt-5 pt-5 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                  Έχεις φωτογραφία από κάποιο χωριό της Δρόπολης; Στείλ' την στο φωτογραφικό αρχείο.
                </p>
                <Link href="/upload-photo">
                  <span className="inline-flex items-center gap-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground px-4 py-2 text-sm font-semibold transition-colors cursor-pointer">
                    <Camera size={14} />
                    Ανέβασε φωτογραφία χωριού
                  </span>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="glass-card rounded-2xl p-5 shadow-sm"
            >
              <h4 className="font-serif text-base font-bold mb-3 text-foreground">Γρήγορη Πλοήγηση</h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { href: "/photos", label: "📸 Φωτογραφίες" },
                  { href: "/videos", label: "🎬 Βίντεο" },
                  { href: "/chat", label: "💬 Συζήτηση" },
                  { href: "/villages", label: "🏘️ Χωριά" },
                ].map((item) => (
                  <Link key={item.href} href={item.href}>
                    <span className="block text-center text-xs font-medium px-2 py-2.5 rounded-lg bg-muted/60 hover:bg-primary/10 hover:text-primary dark:hover:text-secondary transition-all cursor-pointer">
                      {item.label}
                    </span>
                  </Link>
                ))}
              </div>
            </motion.div>

            <div className="sticky top-24">
              <AdSenseSlot adSlot="7994234180" adFormat="rectangle" className="rounded-xl shadow-sm" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
