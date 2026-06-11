import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Sun, Moon, Newspaper, Mountain, Image, Video, MessageSquare, Home, Info, Mail, Download, Share } from "lucide-react";
import { usePWAInstall } from "../hooks/use-pwa-install";

const navItems = [
  { href: "/", label: "Αρχική", icon: Home },
  { href: "/news", label: "Ειδήσεις", icon: Newspaper },
  { href: "/villages", label: "Χωριά", icon: Mountain },
  { href: "/photos", label: "Φωτογραφίες", icon: Image },
  { href: "/videos", label: "Βίντεο", icon: Video },
  { href: "/chat", label: "Ζωντανή Συζήτηση", icon: MessageSquare },
  { href: "/about", label: "Σχετικά", icon: Info },
];

const legalLinks = [
  { href: "/privacy", label: "Πολιτική Απορρήτου" },
  { href: "/terms", label: "Όροι Χρήσης" },
  { href: "/cookie-policy", label: "Cookies" },
  { href: "/disclaimer", label: "Αποποίηση Ευθύνης" },
];

const resourceLinks = [
  { href: "/press", label: "Τύπος & Νέα" },
  { href: "/help", label: "Κέντρο Βοήθειας" },
  { href: "/about", label: "Σχετικά με εμάς" },
  { href: "/contact", label: "Επικοινωνία" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const { canInstall, isIOS, install } = usePWAInstall();
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
            <Link
              href="/contact"
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
              className={`md:hidden p-2 rounded-full transition-all ${
                scrolled
                  ? "text-foreground/70 hover:text-foreground hover:bg-muted"
                  : "text-primary-foreground/70 hover:text-white hover:bg-white/15"
              }`}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Μενού"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
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
                  href="/contact"
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
              <button onClick={() => setShowIOSHint(false)} className="p-1 rounded-full hover:bg-muted">
                <X size={18} />
              </button>
            </div>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">1</span>
                <span>Πάτα το κουμπί κοινής χρήσης <Share size={14} className="inline" /> στο κάτω μέρος του Safari</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">2</span>
                <span>Κύλισε κάτω και επίλεξε <strong className="text-foreground">«Προσθήκη στην οθόνη Αφετηρίας»</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">3</span>
                <span>Πάτα <strong className="text-foreground">«Προσθήκη»</strong> — η εφαρμογή θα εμφανιστεί στην αρχική οθόνη σου</span>
              </li>
            </ol>
            <p className="text-xs text-muted-foreground mt-4 p-3 bg-muted rounded-lg">
              💡 Λειτουργεί μόνο από τον <strong>Safari</strong>. Αν χρησιμοποιείς Chrome ή Firefox, άνοιξε τη σελίδα στο Safari.
            </p>
          </div>
        </div>
      )}

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-foreground text-background mt-16">
        <div className="container mx-auto px-4 pt-14 pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div>
              <h3 className="font-serif text-2xl font-bold text-secondary mb-3">Δρόπολη</h3>
              <p className="text-sm text-background/60 leading-relaxed mb-4">
                Η ψηφιακή πλατεία της ελληνικής μειονότητας. Ειδήσεις, ιστορία και πολιτισμός από τα 41 χωριά της Β. Ηπείρου.
              </p>
              <div className="flex gap-3">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-9 h-9 rounded-full bg-background/10 hover:bg-secondary/20 flex items-center justify-center transition-colors text-sm font-bold">
                  f
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="w-9 h-9 rounded-full bg-background/10 hover:bg-secondary/20 flex items-center justify-center transition-colors text-xs font-bold">
                  ▶
                </a>
                <a href="mailto:dropolis9@gmail.com"
                  aria-label="Email"
                  className="w-9 h-9 rounded-full bg-background/10 hover:bg-secondary/20 flex items-center justify-center transition-colors text-xs font-bold">
                  @
                </a>
              </div>
            </div>

            {/* Navigation */}
            <div>
              <h4 className="font-semibold text-secondary/80 text-xs uppercase tracking-widest mb-4">Πλοήγηση</h4>
              <ul className="space-y-2">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-sm text-background/60 hover:text-secondary transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/contact" className="text-sm text-background/60 hover:text-secondary transition-colors">Επικοινωνία</Link>
                </li>
              </ul>
            </div>

            {/* Δημοτικές Ενότητες */}
            <div>
              <h4 className="font-semibold text-secondary/80 text-xs uppercase tracking-widest mb-4">Δημοτικές Ενότητες</h4>
              <ul className="space-y-2 text-sm text-background/60">
                <li><Link href="/villages?unit=Δρόπολης" className="hover:text-secondary transition-colors">Δρόπολη</Link></li>
                <li><Link href="/villages?unit=Άνω+Δρόπολης" className="hover:text-secondary transition-colors">Άνω Δρόπολη</Link></li>
                <li><Link href="/villages?unit=Πωγωνίου" className="hover:text-secondary transition-colors">Πωγώνι</Link></li>
              </ul>
              <div className="mt-6">
                <h4 className="font-semibold text-secondary/80 text-xs uppercase tracking-widest mb-4">Κατηγορίες</h4>
                <ul className="space-y-2 text-sm text-background/60">
                  {["Τοπικά Νέα", "Πολιτισμός", "Τουρισμός", "Ιστορία"].map(c => (
                    <li key={c}>
                      <Link href={`/news?category=${encodeURIComponent(c)}`} className="hover:text-secondary transition-colors">{c}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Resources & Legal */}
            <div>
              <h4 className="font-semibold text-secondary/80 text-xs uppercase tracking-widest mb-4">Πληροφορίες</h4>
              <ul className="space-y-2 mb-6">
                {resourceLinks.map(({ href, label }) => (
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
              <div className="mt-5 space-y-1 text-xs text-background/40">
                <p className="mt-2">
                  <a href="mailto:dropolis9@gmail.com" className="hover:text-secondary transition-colors">dropolis9@gmail.com</a>
                </p>
              </div>
            </div>
          </div>

          <div className="section-divider mb-6" />

          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-background/40">
            <span>&copy; {new Date().getFullYear()} Dropolis. Με επιφύλαξη παντός δικαιώματος.</span>
            <div className="flex items-center gap-4">
              {legalLinks.map(({ href, label }) => (
                <Link key={href} href={href} className="hover:text-secondary transition-colors">{label}</Link>
              ))}
            </div>
            <span className="font-serif italic text-secondary/50">Η φωνή της Δρόπολης</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
