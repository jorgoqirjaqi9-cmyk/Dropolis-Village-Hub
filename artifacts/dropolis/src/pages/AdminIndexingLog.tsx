import { useState, useCallback } from "react";
import { SEO } from "@/components/SEO";
import { RefreshCw, Eye, EyeOff, CheckCircle, XCircle, MinusCircle, Search } from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";

type IndexingEvent = {
  ts: string;
  type: "google-ping" | "bing-ping" | "indexnow" | "google-indexing-api";
  status: "ok" | "fail" | "skipped";
  url?: string;
  detail?: string;
};

type Summary = {
  total: number;
  ok: number;
  fail: number;
  skipped: number;
  googleIndexingApiEnabled: boolean;
};

const TYPE_LABELS: Record<IndexingEvent["type"], string> = {
  "google-ping": "Google Sitemap",
  "bing-ping": "Bing Sitemap",
  indexnow: "IndexNow",
  "google-indexing-api": "Google API",
};

const STATUS_ICON: Record<IndexingEvent["status"], React.ReactNode> = {
  ok: <CheckCircle className="w-4 h-4 text-green-500" />,
  fail: <XCircle className="w-4 h-4 text-red-500" />,
  skipped: <MinusCircle className="w-4 h-4 text-amber-500" />,
};

const STATUS_ROW_CLASS: Record<IndexingEvent["status"], string> = {
  ok: "",
  fail: "bg-red-50 dark:bg-red-950/30",
  skipped: "bg-amber-50 dark:bg-amber-950/20",
};

const STATUS_LABEL: Record<IndexingEvent["status"], string> = {
  ok: "OK",
  fail: "Αποτυχία",
  skipped: "Παράλειψη",
};

export default function AdminIndexingLog() {
  const [token, setToken] = useState(() => sessionStorage.getItem("admin_token") ?? "");
  const [tokenInput, setTokenInput] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [authenticated, setAuthenticated] = useState(() => !!sessionStorage.getItem("admin_token"));

  const [events, setEvents] = useState<IndexingEvent[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | IndexingEvent["status"]>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | IndexingEvent["type"]>("all");
  const [search, setSearch] = useState("");

  const fetchEvents = useCallback(async (currentToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/indexing/events", {
        headers: { "x-admin-api-key": currentToken },
      });
      if (res.status === 401) {
        setError("Μη εξουσιοδοτημένη πρόσβαση. Ελέγξτε το Admin Token.");
        setAuthenticated(false);
        sessionStorage.removeItem("admin_token");
        return;
      }
      if (!res.ok) throw new Error("Αποτυχία φόρτωσης αρχείου καταγραφής.");
      const data = await res.json() as { summary: Summary; events: IndexingEvent[] };
      setSummary(data.summary);
      setEvents(data.events);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Σφάλμα.");
    } finally {
      setLoading(false);
    }
  }, []);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const t = tokenInput.trim();
    if (!t) return;
    sessionStorage.setItem("admin_token", t);
    setToken(t);
    setAuthenticated(true);
    fetchEvents(t);
  }

  function handleLogout() {
    sessionStorage.removeItem("admin_token");
    setToken("");
    setAuthenticated(false);
    setEvents([]);
    setSummary(null);
  }

  const filtered = events.filter((ev) => {
    if (statusFilter !== "all" && ev.status !== statusFilter) return false;
    if (typeFilter !== "all" && ev.type !== typeFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        (ev.url?.toLowerCase().includes(q) ?? false) ||
        (ev.detail?.toLowerCase().includes(q) ?? false) ||
        TYPE_LABELS[ev.type].toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      <SEO
        title="Αρχείο Καταγραφής Ευρετηρίασης"
        description="Admin: αρχείο καταγραφής ευρετηρίασης άρθρων σε μηχανές αναζήτησης."
        noindex
      />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif font-bold">Αρχείο Καταγραφής Ευρετηρίασης</h1>
        {authenticated && (
          <button
            onClick={handleLogout}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            Αποσύνδεση
          </button>
        )}
      </div>

      {!authenticated && (
        <form onSubmit={handleLogin} className="bg-card rounded-2xl border p-6 space-y-4 max-w-md">
          <h2 className="font-semibold">Εισαγωγή Admin Token</h2>
          <div className="relative">
            <input
              type={showToken ? "text" : "password"}
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Admin token…"
              className="w-full rounded-lg border bg-background px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowToken((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showToken ? "Απόκρυψη" : "Εμφάνιση"}
            >
              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <button
            type="submit"
            className="rounded-xl bg-primary text-primary-foreground px-5 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Είσοδος
          </button>
        </form>
      )}

      {authenticated && (
        <>
          {summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-card rounded-xl border p-4 text-center">
                <p className="text-2xl font-bold">{summary.total}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Σύνολο</p>
              </div>
              <div className="bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800 p-4 text-center">
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{summary.ok}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Επιτυχία</p>
              </div>
              <div className="bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-800 p-4 text-center">
                <p className="text-2xl font-bold text-red-700 dark:text-red-400">{summary.fail}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Αποτυχίες</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800 p-4 text-center">
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{summary.skipped}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Παραλείψεις</p>
              </div>
            </div>
          )}

          {summary && !summary.googleIndexingApiEnabled && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
              Το Google Indexing API δεν είναι ενεργοποιημένο (λείπουν τα GOOGLE_INDEXING_CLIENT_EMAIL / GOOGLE_INDEXING_PRIVATE_KEY).
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-2">
              {(["all", "ok", "fail", "skipped"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                    statusFilter === s
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {s === "all" ? "Όλα" : s === "ok" ? "Επιτυχία" : s === "fail" ? "Αποτυχία" : "Παράλειψη"}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {(["all", "google-ping", "bing-ping", "indexnow", "google-indexing-api"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                    typeFilter === t
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {t === "all" ? "Όλοι οι τύποι" : TYPE_LABELS[t]}
                </button>
              ))}
            </div>

            <div className="relative ml-auto">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Αναζήτηση URL…"
                className="rounded-lg border bg-background pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 w-48"
              />
            </div>

            <button
              onClick={() => fetchEvents(token)}
              disabled={loading}
              className="rounded-lg px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Ανανέωση
            </button>
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 text-destructive px-4 py-2 text-sm">{error}</div>
          )}

          {loading && (
            <div className="text-center py-12 text-muted-foreground text-sm">Φόρτωση…</div>
          )}

          {!loading && events.length === 0 && !error && (
            <div className="text-center py-16 text-muted-foreground">
              <p className="mb-3">Δεν υπάρχουν καταγεγραμμένα γεγονότα ευρετηρίασης.</p>
              <p className="text-xs">Τα δεδομένα αποθηκεύονται στη μνήμη του server και χάνονται με κάθε επανεκκίνηση.</p>
            </div>
          )}

          {!loading && events.length > 0 && filtered.length === 0 && (
            <div className="text-center py-10 text-muted-foreground text-sm">
              Δεν βρέθηκαν γεγονότα με τα επιλεγμένα φίλτρα.
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="rounded-xl border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs whitespace-nowrap">Χρόνος</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs whitespace-nowrap">Τύπος</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs whitespace-nowrap">Κατάσταση</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">URL</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Λεπτομέρεια</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filtered.map((ev, i) => (
                      <tr key={i} className={`${STATUS_ROW_CLASS[ev.status]} hover:bg-muted/30 transition-colors`}>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground font-mono">
                          {format(new Date(ev.ts), "d MMM HH:mm:ss", { locale: el })}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-xs font-medium">{TYPE_LABELS[ev.type]}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="flex items-center gap-1.5">
                            {STATUS_ICON[ev.status]}
                            <span className={`text-xs font-medium ${
                              ev.status === "ok"
                                ? "text-green-700 dark:text-green-400"
                                : ev.status === "fail"
                                ? "text-red-700 dark:text-red-400"
                                : "text-amber-700 dark:text-amber-400"
                            }`}>
                              {STATUS_LABEL[ev.status]}
                            </span>
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          {ev.url ? (
                            <a
                              href={ev.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline break-all"
                            >
                              {ev.url}
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 max-w-sm">
                          {ev.detail ? (
                            <span className={`text-xs break-words ${ev.status === "fail" ? "text-red-700 dark:text-red-400" : "text-muted-foreground"}`}>
                              {ev.detail}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t px-4 py-2 text-xs text-muted-foreground bg-muted/30">
                {filtered.length} από {events.length} γεγονότα · Τα δεδομένα αποθηκεύονται στη μνήμη (μέγ. 200) και μηδενίζονται με κάθε επανεκκίνηση του server.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
