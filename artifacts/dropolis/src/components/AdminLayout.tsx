import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Newspaper, Image, Video, MapPin,
  FileText, Share2, LogOut, Menu, X, Shield, ChevronRight,
  ExternalLink, Link2,
} from "lucide-react";

const NAV = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { path: "/admin/articles", label: "Άρθρα", icon: Newspaper },
  { path: "/admin/photos", label: "Φωτογραφίες", icon: Image },
  { path: "/admin/videos", label: "Βίντεο", icon: Video },
  { path: "/admin/villages", label: "Χωριά", icon: MapPin },
  { path: "/admin/news", label: "Υποβολές Ειδήσεων", icon: FileText },
  { path: "/admin/captions", label: "Social Captions", icon: Share2 },
  { path: "/admin/internal-links", label: "Internal Linking", icon: Link2 },
  { path: "/admin/indexing", label: "Indexing Log", icon: Shield },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  token: string;
  onLogout: () => void;
  title: string;
}

export function AdminLayout({ children, token: _token, onLogout, title }: AdminLayoutProps) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path: string, exact = false) => {
    if (exact) return location === path || location === path + "/";
    return location === path || location === path + "/" || location.startsWith(path + "/");
  };

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-background border-r border-border flex flex-col transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:z-auto`}>
        <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">Dropolis</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Admin Panel</p>
            </div>
          </Link>
          <button className="lg:hidden text-muted-foreground" aria-label="Κλείσιμο μενού" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ path, label, icon: Icon, exact }) => {
            const active = isActive(path, exact);
            return (
              <Link key={path} href={path}>
                <span
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1">{label}</span>
                  {active && <ChevronRight className="w-3 h-3 opacity-60" />}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border shrink-0">
          <Link href="/">
            <span className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer">
              <ExternalLink className="w-4 h-4" />
              Προβολή site
            </span>
          </Link>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Αποσύνδεση
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-background border-b border-border px-4 h-14 flex items-center gap-3 sticky top-0 z-10 shrink-0">
          <button className="lg:hidden text-muted-foreground hover:text-foreground" aria-label="Άνοιγμα μενού" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-foreground text-sm">{title}</h1>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export function AdminAuthGate({ onAuth }: { onAuth: (token: string) => void }) {
  const [input, setInput] = useState("");
  const [show, setShow] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sessionStorage.setItem("admin_token", input.trim());
    onAuth(input.trim());
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="bg-background rounded-2xl border border-border shadow-lg p-8 w-full max-w-sm">
        <div className="flex items-center justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-7 h-7 text-primary" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-center text-foreground mb-1">Admin Panel</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">Εισάγετε το Admin Token για πρόσβαση</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Admin Token"
              className="w-full px-4 py-3 rounded-xl border border-border bg-muted/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary pr-24"
            />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground">
              {show ? "Απόκρυψη" : "Εμφάνιση"}
            </button>
          </div>
          <button type="submit" className="w-full bg-primary text-primary-foreground py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
            Σύνδεση
          </button>
        </form>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    published: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  };
  const labels: Record<string, string> = {
    pending: "Αναμονή", approved: "Εγκεκριμένο", rejected: "Απορρίφθηκε",
    published: "Δημοσιευμένο", draft: "Πρόχειρο",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-700"}`}>
      {labels[status] ?? status}
    </span>
  );
}

export function StatCard({ label, value, icon: Icon, color = "primary", sub, href }: {
  label: string; value: number | string; icon: React.ElementType; color?: string; sub?: string; href?: string;
}) {
  const colors: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    green: "bg-green-500/10 text-green-500",
    blue: "bg-blue-500/10 text-blue-500",
    yellow: "bg-yellow-500/10 text-yellow-600",
    purple: "bg-purple-500/10 text-purple-500",
    red: "bg-red-500/10 text-red-500",
    orange: "bg-orange-500/10 text-orange-500",
  };
  const inner = (
    <div className={`bg-background rounded-xl border border-border p-5 flex items-center gap-4 ${href ? "hover:bg-muted/60 transition-colors cursor-pointer" : ""}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colors[color] ?? colors.primary}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}

export function ConfirmModal({ message, onConfirm, onCancel, confirmLabel = "Διαγραφή", danger = true }: {
  message: string; onConfirm: () => void; onCancel: () => void; confirmLabel?: string; danger?: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl border border-border shadow-xl p-6 max-w-sm w-full">
        <p className="text-sm text-foreground mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
            Ακύρωση
          </button>
          <button onClick={onConfirm} className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors text-white ${danger ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:opacity-90"}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useAdminAuth() {
  const [token, setToken] = useState(() => sessionStorage.getItem("admin_token") ?? "");
  const [authenticated, setAuthenticated] = useState(() => !!sessionStorage.getItem("admin_token"));

  const login = (t: string) => { setToken(t); setAuthenticated(true); };
  const logout = () => { sessionStorage.removeItem("admin_token"); setToken(""); setAuthenticated(false); };

  return { token, authenticated, login, logout };
}

export function adminFetch(url: string, token: string, options: RequestInit = {}) {
  return fetch(url, {
    ...options,
    headers: { "x-admin-api-key": token, "Content-Type": "application/json", ...(options.headers ?? {}) },
  });
}
