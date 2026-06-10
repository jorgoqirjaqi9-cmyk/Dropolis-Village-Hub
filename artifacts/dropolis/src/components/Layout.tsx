import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Sun, Moon, Newspaper, Mountain, Image, Video, MessageSquare, Home } from "lucide-react";

const navItems = [
  { href: "/", label: "Αρχική", icon: Home },
  { href: "/news", label: "Ειδήσεις", icon: Newspaper },
  { href: "/villages", label: "Χωριά", icon: Mountain },
  { href: "/photos", label: "Φωτογραφίες", icon: Image },
  { href: "/videos", label: "Βίντεο", icon: Video },
  { href: "/chat", label: "Συζήτηση", icon: MessageSquare },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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
            </nav>
          </div>
        )}
      </header>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-foreground text-background mt-16">
        <div className="container mx-auto px-4 pt-14 pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div>
              <h3 className="font-serif text-2xl font-bold text-secondary mb-3">Δρόπολη</h3>
              <p className="text-sm text-background/60 leading-relaxed mb-4">
                Η ψηφιακή πλατεία της ελληνικής μειονότητας. Ειδήσεις, ιστορία και πολιτισμός από τα χωριά της Β. Ηπείρου.
              </p>
              <div className="flex gap-3">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-background/10 hover:bg-secondary/20 flex items-center justify-center transition-colors text-xs font-bold">f</a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-background/10 hover:bg-secondary/20 flex items-center justify-center transition-colors text-xs font-bold">▶</a>
              </div>
            </div>

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
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-secondary/80 text-xs uppercase tracking-widest mb-4">Δημοτικές Ενότητες</h4>
              <ul className="space-y-2 text-sm text-background/60">
                <li>
                  <Link href="/villages" className="hover:text-secondary transition-colors">Δρόπολη</Link>
                </li>
                <li>
                  <Link href="/villages" className="hover:text-secondary transition-colors">Άνω Δρόπολη</Link>
                </li>
                <li>
                  <Link href="/villages" className="hover:text-secondary transition-colors">Πωγώνι</Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-secondary/80 text-xs uppercase tracking-widest mb-4">Σχετικά</h4>
              <p className="text-sm text-background/60 leading-relaxed">
                Δήμος Δρόπολης<br />
                Νομός Αργυροκάστρου<br />
                Αλβανία — Β. Ήπειρος
              </p>
            </div>
          </div>

          <div className="section-divider mb-6" />

          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-background/40">
            <span>&copy; {new Date().getFullYear()} Dropolis. Με επιφύλαξη παντός δικαιώματος.</span>
            <span className="font-serif italic text-secondary/50">Η φωνή της Δρόπολης</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
