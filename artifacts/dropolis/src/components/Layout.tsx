import React from "react";
import { Link, useLocation } from "wouter";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Αρχική" },
    { href: "/news", label: "Ειδήσεις" },
    { href: "/villages", label: "Χωριά" },
    { href: "/photos", label: "Φωτογραφίες" },
    { href: "/videos", label: "Βίντεο" },
    { href: "/chat", label: "Συζήτηση" }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-primary-foreground border-b-4 border-secondary sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="font-serif text-2xl font-bold tracking-wider text-secondary">
            Δρόπολη
          </Link>
          <nav className="hidden md:flex gap-6">
            {navItems.map(item => (
              <Link key={item.href} href={item.href} className={`text-sm font-medium transition-colors hover:text-secondary ${location === item.href ? "text-secondary" : "text-primary-foreground/90"}`}>
                {item.label}
              </Link>
            ))}
          </nav>
          <Button variant="ghost" size="icon" className="md:hidden text-primary-foreground">
            <Menu />
          </Button>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="bg-foreground text-background py-12 mt-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-2xl text-secondary mb-4">Δρόπολη</h2>
          <p className="text-muted-foreground mb-8">Η ψηφιακή πλατεία της ελληνικής μειονότητας.</p>
          <div className="flex justify-center gap-6 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-secondary">Αρχική</Link>
            <Link href="/news" className="hover:text-secondary">Ειδήσεις</Link>
            <Link href="/villages" className="hover:text-secondary">Χωριά</Link>
            <Link href="/chat" className="hover:text-secondary">Συζήτηση</Link>
          </div>
          <div className="mt-8 text-xs text-muted-foreground/50">
            &copy; {new Date().getFullYear()} Dropolis. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
