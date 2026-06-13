import { useState, useCallback } from "react";
import { SEO } from "@/components/SEO";
import { CheckCircle, XCircle, Trash2, Eye, EyeOff, RefreshCw, MapPin, User, Calendar, Clock, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";

type NewsSubmission = {
  id: number;
  title: string;
  content: string;
  villageId: number | null;
  senderName: string;
  senderEmail: string | null;
  eventDate: string;
  eventTime: string | null;
  imageUrl: string | null;
  status: string;
  consentGiven: boolean;
  submittedAt: string;
  reviewedAt: string | null;
};

type StatusFilter = "pending" | "approved" | "rejected";

export default function AdminNews() {
  const [token, setToken] = useState(() => sessionStorage.getItem("admin_token") ?? "");
  const [tokenInput, setTokenInput] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [authenticated, setAuthenticated] = useState(() => !!sessionStorage.getItem("admin_token"));

  const [submissions, setSubmissions] = useState<NewsSubmission[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchSubmissions = useCallback(async (currentToken: string, status: StatusFilter) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/news-submissions?status=${status}`, {
        headers: { "x-admin-api-key": currentToken },
      });
      if (res.status === 401) {
        setError("Μη εξουσιοδοτημένη πρόσβαση. Ελέγξτε το Admin Token.");
        setAuthenticated(false);
        sessionStorage.removeItem("admin_token");
        return;
      }
      if (!res.ok) throw new Error("Αποτυχία φόρτωσης υποβολών.");
      const data: NewsSubmission[] = await res.json();
      setSubmissions(data);
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
    fetchSubmissions(t, statusFilter);
  }

  function handleLogout() {
    sessionStorage.removeItem("admin_token");
    setToken("");
    setAuthenticated(false);
    setSubmissions([]);
  }

  function handleFilterChange(s: StatusFilter) {
    setStatusFilter(s);
    if (authenticated && token) fetchSubmissions(token, s);
  }

  async function approve(id: number) {
    setActionLoading(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/news-submissions/${id}`, {
        method: "PATCH",
        headers: {
          "x-admin-api-key": token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "approved" }),
      });
      if (!res.ok) throw new Error("Αποτυχία έγκρισης.");
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      setMessage("✓ Η υποβολή εγκρίθηκε και δημοσιεύτηκε ως άρθρο.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Σφάλμα.");
    } finally {
      setActionLoading(null);
    }
  }

  async function reject(id: number) {
    setActionLoading(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/news-submissions/${id}`, {
        method: "PATCH",
        headers: {
          "x-admin-api-key": token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "rejected" }),
      });
      if (!res.ok) throw new Error("Αποτυχία απόρριψης.");
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      setMessage("✓ Η υποβολή απορρίφθηκε.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Σφάλμα.");
    } finally {
      setActionLoading(null);
    }
  }

  async function deleteSubmission(id: number) {
    if (!confirm("Να διαγραφεί οριστικά η υποβολή;")) return;
    setActionLoading(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/news-submissions/${id}`, {
        method: "DELETE",
        headers: { "x-admin-api-key": token },
      });
      if (!res.ok && res.status !== 204) throw new Error("Αποτυχία διαγραφής.");
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      setMessage("✓ Η υποβολή διαγράφηκε.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Σφάλμα.");
    } finally {
      setActionLoading(null);
    }
  }

  const statusLabel = { pending: "Σε αναμονή", approved: "Εγκεκριμένες", rejected: "Απορριφθείσες" };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
      <SEO
        title="Διαχείριση Υποβολών Ειδήσεων"
        description="Σελίδα διαχείρισης υποβολών ειδήσεων Dropolis."
        noindex
      />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif font-bold">Διαχείριση Υποβολών Ειδήσεων</h1>
        {authenticated && (
          <button onClick={handleLogout} className="text-xs text-muted-foreground hover:text-destructive transition-colors">
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
          <div className="flex flex-wrap items-center gap-3">
            {(["pending", "approved", "rejected"] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => handleFilterChange(s)}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                  statusFilter === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {statusLabel[s]}
              </button>
            ))}
            <button
              onClick={() => fetchSubmissions(token, statusFilter)}
              disabled={loading}
              className="ml-auto rounded-lg px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Ανανέωση
            </button>
          </div>

          {message && (
            <div className="rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-4 py-2 text-sm">
              {message}
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-destructive/10 text-destructive px-4 py-2 text-sm">{error}</div>
          )}

          {loading && (
            <div className="text-center py-12 text-muted-foreground text-sm">Φόρτωση…</div>
          )}

          {!loading && submissions.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <p className="mb-3">Δεν υπάρχουν υποβολές σε αυτή την κατηγορία.</p>
              <button
                onClick={() => fetchSubmissions(token, statusFilter)}
                className="text-sm text-primary hover:underline"
              >
                Φόρτωση
              </button>
            </div>
          )}

          <div className="space-y-4">
            {submissions.map((sub) => (
              <div key={sub.id} className="bg-card rounded-2xl border shadow-sm overflow-hidden">
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg leading-snug truncate">{sub.title}</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                        <span>#{sub.id}</span>
                        <span>{format(new Date(sub.submittedAt), "d MMM yyyy HH:mm", { locale: el })}</span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" /> {sub.senderName}
                          {sub.senderEmail && ` <${sub.senderEmail}>`}
                        </span>
                        {sub.villageId && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> Χωριό #{sub.villageId}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {sub.eventDate}
                          {sub.eventTime && (
                            <><Clock className="w-3 h-3 ml-1" /> {sub.eventTime}</>
                          )}
                        </span>
                        {sub.imageUrl && (
                          <a
                            href={sub.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" /> Εικόνα
                          </a>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
                      className="text-xs text-primary hover:underline flex-shrink-0"
                    >
                      {expandedId === sub.id ? "Απόκρυψη" : "Εμφάνιση κειμένου"}
                    </button>
                  </div>

                  {/* Content */}
                  {expandedId === sub.id && (
                    <div className="mt-4 p-4 rounded-xl bg-muted/50 text-sm leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                      {sub.content}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {statusFilter === "pending" && (
                      <>
                        <button
                          onClick={() => approve(sub.id)}
                          disabled={actionLoading === sub.id}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 text-white px-4 py-2 text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4" /> Έγκριση
                        </button>
                        <button
                          onClick={() => reject(sub.id)}
                          disabled={actionLoading === sub.id}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 text-white px-4 py-2 text-sm font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" /> Απόρριψη
                        </button>
                      </>
                    )}
                    {statusFilter === "approved" && (
                      <button
                        onClick={() => reject(sub.id)}
                        disabled={actionLoading === sub.id}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500 text-amber-500 px-4 py-2 text-sm font-semibold hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" /> Απόρριψη
                      </button>
                    )}
                    <button
                      onClick={() => deleteSubmission(sub.id)}
                      disabled={actionLoading === sub.id}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-destructive text-destructive px-4 py-2 text-sm font-semibold hover:bg-destructive/10 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" /> Διαγραφή
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
