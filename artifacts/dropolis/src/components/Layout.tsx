import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Sun, Moon, Newspaper, Mountain, Image, Video, Home, Info, Mail, Download, Share, ChevronDown, Camera, Globe, Landmark, UtensilsCrossed, CalendarDays } from "lucide-react";
import { usePWAInstall } from "../hooks/use-pwa-install";
import { RadioPlayer } from "./RadioPlayer";
import { CookieConsent } from "./CookieConsent";

const AD_EXCLUDED_PREFIXES = [
  "/upload-photo", "/submit-news", "/submit-video", "/submit-event",
  "/admin", "/privacy", "/terms", "/cookie-policy", "/disclaimer", "/diaspora",
];

function AdSenseManager() {
  const [location] = useLocation();
  useEffect(() => {
    const allowed = !AD_EXCLUDED_PREFIXES.some(
      (p) => location === p || location.startsWith(p + "/")
    );
    if (allowed) {
      document.documentElement.removeAttribute("data-no-ads");
    } else {
      document.documentElement.setAttribute("data-no-ads", "");
    }
    return () => document.documentElement.removeAttribute("data-no-ads");
  }, [location]);
  return null;
}

const LANGUAGES = [
  { code: "el", label: "Ελληνικά", flag: "🇬🇷" },
  { code: "sq", label: "Shqip",    flag: "🇦🇱" },
  { code: "en", label: "English",  flag: "🇺🇸" },
];

const SITE_URL = "https://dropolis.net";

function switchLanguage(code: string) {
  if (code === "el") {
    // If we're on the Google Translate proxy, go back to original
    if (window.location.hostname.includes("translate.goog")) {
      window.location.href = SITE_URL + window.location.pathname + window.location.search;
    }
    return;
  }
  // Build the Google Translate proxy URL for the current page
  const currentPath = window.location.pathname + window.location.search + window.location.hash;
  const targetUrl = `https://dropolis-net.translate.goog${currentPath}?_x_tr_sl=el&_x_tr_tl=${code}&_x_tr_hl=${code}&_x_tr_pto=wapp`;
  window.location.href = targetUrl;
}

function LanguageSwitcher({ scrolled }: { scrolled: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Detect active language from hostname
  const isProxy = typeof window !== "undefined" && window.location.hostname.includes("translate.goog");
  const params = isProxy ? new URLSearchParams(window.location.search) : null;
  const activeLang = isProxy ? (params?.get("_x_tr_tl") ?? "el") : "el";

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const current = LANGUAGES.find(l => l.code === activeLang) ?? LANGUAGES[0];

  const btnBase = "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-all duration-200 border";
  const btnLight = "border-white/30 text-white/85 hover:bg-white/15 hover:text-white";
  const btnDark  = "border-border text-foreground/75 hover:bg-muted hover:text-foreground";

  return (
    <div ref={ref} className="relative" style={{ zIndex: 60 }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Επιλογή γλώσσας"
        className={`${btnBase} ${scrolled ? btnDark : btnLight}`}
      >
        <span>{current.flag}</span>
        <span className="hidden sm:inline">{current.label}</span>
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] min-w-[180px] rounded-lg border border-border bg-popover shadow-xl overflow-hidden">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => { setOpen(false); switchLanguage(lang.code); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left
                ${activeLang === lang.code
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-foreground hover:bg-muted"}`}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
          <div className="border-t border-border" />
          <Link
            href="/en/travel-guide/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
          >
            <span>🗺️</span>
            <span>Travel Guide</span>
          </Link>
          <Link
            href="/en/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
          >
            <span>🇬🇧</span>
            <span>English pages</span>
          </Link>
        </div>
      )}
    </div>
  );
}

const navItems = [
  { href: "/", label: "Αρχική", icon: Home },
  { href: "/news/", label: "Ειδήσεις", icon: Newspaper },
  { href: "/villages/", label: "Χωριά", icon: Mountain },
  { href: "/photos/", label: "Φωτογραφίες", icon: Image },
  { href: "/videos/", label: "Βίντεο", icon: Video },
  { href: "/diaspora/", label: "Ομογένεια", icon: Globe },
  { href: "/finiq/", label: "Φοινικαίοι", icon: Landmark },
  { href: "/paradosiaka-faghta/", label: "Γαστρονομία", icon: UtensilsCrossed },
  { href: "/events/", label: "Εκδηλώσεις", icon: CalendarDays },
  { href: "/about/", label: "Σχετικά", icon: Info },
];

const legalLinks = [
  { href: "/privacy/", label: "Πολιτική Απορρήτου" },
  { href: "/terms/", label: "Όροι Χρήσης" },
  { href: "/cookie-policy/", label: "Cookies" },
  { href: "/disclaimer/", label: "Αποποίηση Ευθύνης" },
];

const resourceLinks = [
  { href: "/press/", label: "Τύπος & Νέα" },
  { href: "/help/", label: "Κέντρο Βοήθειας", rel: "help" },
  { href: "/faq/",  label: "Συχνές Ερωτήσεις", rel: "help" },
  { href: "/about/", label: "Σχετικά με εμάς" },
  { href: "/contact/", label: "Επικοινωνία" },
  { href: "/sitemap/", label: "Χάρτης Ιστοτόπου" },
];

const trustLinks = [
  { href: "/editorial-policy/", label: "Συντακτική Πολιτική" },
  { href: "/corrections-policy/", label: "Πολιτική Διορθώσεων" },
  { href: "/contributors/", label: "Συνεισφορά" },
  { href: "/advertise/", label: "Διαφήμιση" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const { canNativeInstall, isIOS, isInstalled, install } = usePWAInstall();
  const canInstall = (canNativeInstall || isIOS) && !isInstalled;
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("dropolis-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("dropolis-theme", "light");
    }
  }, [isDark]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "glass shadow-lg shadow-black/10"
            : "bg-primary/95 backdrop-blur-sm"
        }`}
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span
              className={`font-serif text-2xl font-bold tracking-wide transition-colors ${
                scrolled ? "text-primary dark:text-secondary" : "text-secondary"
              }`}
            >
              Δρόπολη
            </span>
            <span
              className={`hidden sm:block text-xs font-medium tracking-widest uppercase mt-0.5 transition-colors ${
                scrolled ? "text-muted-foreground" : "text-primary-foreground/70"
              }`}
            >
              Β. Ήπειρος
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = location === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                    active
                      ? scrolled
                        ? "bg-primary text-primary-foreground"
                        : "bg-white/20 text-secondary"
                      : scrolled
                      ? "text-foreground/80 hover:text-foreground hover:bg-muted"
                      : "text-primary-foreground/80 hover:text-white hover:bg-white/15"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSwitcher scrolled={scrolled} />

            <Link
              href="/upload-photo/"
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                scrolled
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              <Camera size={14} /> Ανέβασε φωτογραφία
            </Link>

            <Link
              href="/contact/"
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                scrolled
                  ? "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  : "bg-secondary/80 text-secondary-foreground hover:bg-secondary"
              }`}
            >
              <Mail size={14} /> Επικοινωνία
            </Link>

            {canInstall && (
              <button
                onClick={() => isIOS ? setShowIOSHint(true) : install()}
                aria-label="Εγκατάσταση εφαρμογής"
                title="Εγκατάσταση εφαρμογής"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  scrolled
                    ? "text-primary border border-primary/30 hover:bg-primary/10"
                    : "text-white border border-white/30 hover:bg-white/15"
                }`}
              >
                <Download size={15} />
                <span className="hidden sm:inline">Εγκατάσταση</span>
              </button>
            )}

            <button
              onClick={() => setIsDark(!isDark)}
              aria-label="Εναλλαγή σκοτεινής λειτουργίας"
              className={`p-2 rounded-full transition-all duration-200 ${
                scrolled
                  ? "text-foreground/70 hover:text-foreground hover:bg-muted"
                  : "text-primary-foreground/70 hover:text-white hover:bg-white/15"
              }`}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              className={`md:hidden p-2.5 rounded-full transition-all ${
                scrolled
                  ? "text-foreground/70 hover:text-foreground hover:bg-muted"
                  : "text-primary-foreground/70 hover:text-white hover:bg-white/15"
              }`}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Μενού"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden glass border-t border-border/50 shadow-xl">
            <nav className="container mx-auto px-4 py-3 flex flex-col gap-1">
              {navItems.map((item) => {
                const active = location === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground/80 hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
              <div className="border-t border-border/50 mt-1 pt-1">
                <Link
                  href="/upload-photo/"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary bg-primary/5 hover:bg-primary/10 transition-all"
                >
                  <Camera size={16} /> Ανέβασε φωτογραφία
                </Link>
                <Link
                  href="/contact/"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-muted transition-all"
                >
                  <Mail size={16} /> Επικοινωνία
                </Link>
                {canInstall && (
                  <button
                    onClick={() => { setMobileOpen(false); isIOS ? setShowIOSHint(true) : install(); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-all"
                  >
                    <Download size={16} /> Εγκατάσταση εφαρμογής
                  </button>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {showIOSHint && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 flex items-end justify-center p-4"
          onClick={() => setShowIOSHint(false)}
        >
          <div
            className="bg-background rounded-2xl shadow-2xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-bold text-foreground">Εγκατάσταση στο iPhone</h3>
              <button onClick={() => setShowIOSHint(false)} aria-label="Κλείσιμο" className="p-1 rounded-full hover:bg-muted">
                <X size={18} />
              </button>
            </div>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">1</span>
                <span>Πατήστε το κουμπί κοινής χρήσης <Share size={14} className="inline" /> στο κάτω μέρος του Safari</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">2</span>
                <span>Κυλήστε κάτω και επιλέξτε <strong className="text-foreground">«Προσθήκη στην οθόνη αφετηρίας»</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">3</span>
                <span>Πατήστε <strong className="text-foreground">«Προσθήκη»</strong> — η εφαρμογή θα εμφανιστεί στην αρχική οθόνη σας</span>
              </li>
            </ol>
            <p className="text-xs text-muted-foreground mt-4 p-3 bg-muted rounded-lg">
              💡 Λειτουργεί μόνο από τον <strong>Safari</strong>. Αν χρησιμοποιείτε Chrome ή Firefox, ανοίξτε τη σελίδα στο Safari.
            </p>
          </div>
        </div>
      )}

      <main className="flex-grow min-h-[85vh]">
        {children}
      </main>

      <footer className="bg-foreground text-background mt-16">
        <div className="container mx-auto px-4 pt-10 pb-8">
          {/* Brand row — full width on mobile */}
          <div className="mb-8">
            <h3 className="font-serif text-2xl font-bold text-secondary mb-2">Δρόπολη</h3>
            <p className="text-sm text-background/60 leading-relaxed mb-4 max-w-sm">
              Η ψηφιακή πλατφόρμα της ελληνικής μειονότητας. Ειδήσεις, ιστορία και πολιτισμός από τα 41 χωριά της Β. Ηπείρου.
            </p>
            <div className="flex gap-3">
              <a href="https://www.facebook.com/profile.php?id=61590959938071" target="_blank" rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-9 h-9 rounded-full bg-background/10 hover:bg-secondary/20 flex items-center justify-center transition-colors text-sm font-bold">
                f
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer"
                aria-label="YouTube"
                className="w-9 h-9 rounded-full bg-background/10 hover:bg-secondary/20 flex items-center justify-center transition-colors text-xs font-bold">
                ▶
              </a>
              <a href="https://www.instagram.com/dropolis_net/" target="_blank" rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 rounded-full bg-background/10 hover:bg-secondary/20 flex items-center justify-center transition-colors text-xs font-bold">
                IG
              </a>
              <a href="https://x.com/dropolis_net" target="_blank" rel="noopener noreferrer"
                aria-label="X (Twitter)"
                className="w-9 h-9 rounded-full bg-background/10 hover:bg-secondary/20 flex items-center justify-center transition-colors text-xs font-bold">
                𝕏
              </a>
              <a href="https://www.reddit.com/r/DropolisNet/" target="_blank" rel="noopener noreferrer"
                aria-label="Reddit"
                className="w-9 h-9 rounded-full bg-background/10 hover:bg-secondary/20 flex items-center justify-center transition-colors text-xs font-bold">
                r/
              </a>
              <a href="mailto:info@dropolis.net"
                aria-label="Email"
                className="w-9 h-9 rounded-full bg-background/10 hover:bg-secondary/20 flex items-center justify-center transition-colors text-xs font-bold">
                @
              </a>
            </div>
          </div>

          {/* Link columns — 2 cols on mobile, 4 on desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            {/* Navigation */}
            <div>
              <h4 className="font-semibold text-secondary/80 text-xs uppercase tracking-widest mb-3">Πλοήγηση</h4>
              <ul className="space-y-2">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-sm text-background/60 hover:text-secondary transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/ta-41-xoria-tis-dropolis/" className="text-sm text-background/60 hover:text-secondary transition-colors">Τα 41 Χωριά</Link>
                </li>
                <li>
                  <Link href="/dropoli-voreia-ipeiros/" className="text-sm text-background/60 hover:text-secondary transition-colors">Δρόπολη & Β. Ήπειρος</Link>
                </li>
                <li>
                  <Link href="/contact/" className="text-sm text-background/60 hover:text-secondary transition-colors">Επικοινωνία</Link>
                </li>
              </ul>
            </div>

            {/* Κατηγορίες */}
            <div>
              <h4 className="font-semibold text-secondary/80 text-xs uppercase tracking-widest mb-3">Κατηγορίες</h4>
              <ul className="space-y-2 text-sm text-background/60">
                {["Τοπικά Νέα", "Πολιτισμός", "Τουρισμός", "Ιστορία"].map(c => (
                  <li key={c}>
                    <Link href={`/news?category=${encodeURIComponent(c)}`} className="hover:text-secondary transition-colors">{c}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Πληροφορίες */}
            <div>
              <h4 className="font-semibold text-secondary/80 text-xs uppercase tracking-widest mb-3">Πληροφορίες</h4>
              <ul className="space-y-2 mb-5">
                {resourceLinks.map(({ href, label, rel }) => (
                  <li key={href}>
                    <Link href={href} rel={rel} className="text-sm text-background/60 hover:text-secondary transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Δεοντολογία + Νομικά */}
            <div>
              <h4 className="font-semibold text-secondary/80 text-xs uppercase tracking-widest mb-3">Δεοντολογία</h4>
              <ul className="space-y-2 mb-5">
                {trustLinks.map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-background/60 hover:text-secondary transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
              <h4 className="font-semibold text-secondary/80 text-xs uppercase tracking-widest mb-3">Νομικά</h4>
              <ul className="space-y-2">
                {legalLinks.map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-background/60 hover:text-secondary transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
              <div className="mt-4 space-y-1 text-xs text-background/70">
                <p><a href="mailto:info@dropolis.net" className="hover:text-secondary transition-colors">info@dropolis.net</a></p>
                <p className="font-semibold text-secondary/80 uppercase tracking-widest mt-3 mb-1">English</p>
                <p><Link href="/en/travel-guide/" className="hover:text-secondary transition-colors">🗺️ Travel Guide</Link></p>
                <p><Link href="/en/villages/" className="hover:text-secondary transition-colors">🏘️ Villages</Link></p>
                <p><Link href="/en/news/" className="hover:text-secondary transition-colors">📰 News</Link></p>
                <p><Link href="/en/" className="hover:text-secondary transition-colors">🇬🇧 English Home</Link></p>
              </div>
            </div>
          </div>

          <div className="section-divider mb-6" />

          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-background/70">
            <span>&copy; {new Date().getFullYear()} Dropolis. Με επιφύλαξη παντός δικαιώματος.</span>
            <div className="hidden sm:flex items-center gap-4">
              {legalLinks.map(({ href, label }) => (
                <Link key={href} href={href} className="hover:text-secondary transition-colors">{label}</Link>
              ))}
            </div>
            <span className="font-serif italic text-secondary/70">Η φωνή της Δρόπολης</span>
          </div>
        </div>
      </footer>
      <AdSenseManager />
      <RadioPlayer />
      <CookieConsent />
    </div>
  );
}
