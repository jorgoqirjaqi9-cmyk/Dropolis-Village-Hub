import { useState, useCallback } from "react";
import { SEO } from "@/components/SEO";
import { CheckCircle, XCircle, ImageIcon, MapPin, User, Eye, EyeOff, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";

type AdminPhoto = {
  id: number;
  title: string;
  description: string | null;
  url: string;
  thumbnailUrl: string | null;
  villageId: number | null;
  villageName: string | null;
  photographer: string | null;
  status: string;
  objectPath: string | null;
  copyrightConfirmed: boolean;
  uploaderName: string | null;
  createdAt: string;
};

type StatusFilter = "pending" | "approved" | "rejected";

export default function AdminPhotos() {
  const [token, setToken] = useState(() => sessionStorage.getItem("admin_token") ?? "");
  const [tokenInput, setTokenInput] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [authenticated, setAuthenticated] = useState(() => !!sessionStorage.getItem("admin_token"));

  const [photos, setPhotos] = useState<AdminPhoto[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchPhotos = useCallback(async (currentToken: string, status: StatusFilter) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/photos?status=${status}`, {
        headers: { "x-admin-api-key": currentToken },
      });
      if (res.status === 401) {
        setError("Μη εξουσιοδοτημένη πρόσβαση. Ελέγξτε το Admin Token.");
        setAuthenticated(false);
        sessionStorage.removeItem("admin_token");
        return;
      }
      if (!res.ok) throw new Error("Αποτυχία φόρτωσης φωτογραφιών.");
      const data = await res.json();
      setPhotos(data);
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
    fetchPhotos(t, statusFilter);
  }

  function handleLogout() {
    sessionStorage.removeItem("admin_token");
    setToken("");
    setAuthenticated(false);
    setPhotos([]);
  }

  function handleFilterChange(s: StatusFilter) {
    setStatusFilter(s);
    if (authenticated && token) fetchPhotos(token, s);
  }

  async function approve(id: number) {
    setActionLoading(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/photos/${id}/approve`, {
        method: "PUT",
        headers: { "x-admin-api-key": token },
      });
      if (!res.ok) throw new Error("Αποτυχία έγκρισης.");
      setPhotos((prev) => prev.filter((p) => p.id !== id));
      setMessage("✓ Η φωτογραφία εγκρίθηκε.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Σφάλμα.");
    } finally {
      setActionLoading(null);
    }
  }

  async function reject(id: number) {
    if (!confirm("Να διαγραφεί η φωτογραφία;")) return;
    setActionLoading(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/photos/${id}`, {
        method: "DELETE",
        headers: { "x-admin-api-key": token },
      });
      if (!res.ok && res.status !== 204) throw new Error("Αποτυχία απόρριψης.");
      setPhotos((prev) => prev.filter((p) => p.id !== id));
      setMessage("✓ Η φωτογραφία απορρίφθηκε.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Σφάλμα.");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
      <SEO
        title="Διαχείριση Φωτογραφιών"
        description="Σελίδα διαχείρισης φωτογραφιών Dropolis."
        noindex
      />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif font-bold">Διαχείριση Φωτογραφιών</h1>
        {authenticated && (
          <button onClick={handleLogout} className="text-xs text-muted-foreground hover:text-destructive transition-colors">
            Αποσύνδεση
          </button>
        )}
      </div>

      {/* Login form */}
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

      {/* Controls */}
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
                {s === "pending" ? "Σε αναμονή" : s === "approved" ? "Εγκεκριμένες" : "Απορριφθείσες"}
              </button>
            ))}
            <button
              onClick={() => fetchPhotos(token, statusFilter)}
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

          {!loading && photos.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Δεν υπάρχουν φωτογραφίες σε αυτή την κατηγορία.</p>
              <button
                onClick={() => fetchPhotos(token, statusFilter)}
                className="mt-3 text-sm text-primary hover:underline"
              >
                Φόρτωση
              </button>
            </div>
          )}

          <div className="space-y-4">
            {photos.map((photo) => (
              <div key={photo.id} className="bg-card rounded-2xl border shadow-sm overflow-hidden flex flex-col sm:flex-row">
                {/* Thumbnail */}
                <div className="sm:w-48 flex-shrink-0 bg-muted">
                  <img
                    src={photo.url}
                    alt={photo.title}
                    className="w-full h-48 sm:h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/opengraph.jpg";
                    }}
                  />
                </div>

                {/* Details */}
                <div className="flex-1 p-4 flex flex-col gap-3">
                  <div>
                    <h3 className="font-semibold text-lg leading-snug">{photo.title}</h3>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                      <span>ID: {photo.id}</span>
                      <span>{format(new Date(photo.createdAt), "d MMM yyyy HH:mm", { locale: el })}</span>
                      {photo.villageId && photo.villageName && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {photo.villageName}
                        </span>
                      )}
                      {!photo.villageId && (
                        <span className="text-muted-foreground italic">Γενικό αρχείο</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    {photo.uploaderName && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <User className="w-3 h-3" /> {photo.uploaderName}
                      </span>
                    )}
                    {photo.photographer && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        📷 {photo.photographer}
                      </span>
                    )}
                    <span className={`font-medium ${photo.copyrightConfirmed ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
                      {photo.copyrightConfirmed ? "✓ Copyright OK" : "✗ Χωρίς copyright"}
                    </span>
                  </div>

                  {photo.objectPath && (
                    <p className="text-xs text-muted-foreground font-mono truncate">{photo.objectPath}</p>
                  )}

                  {/* Actions */}
                  {statusFilter === "pending" && (
                    <div className="flex gap-3 mt-auto pt-2">
                      <button
                        onClick={() => approve(photo.id)}
                        disabled={actionLoading === photo.id}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-green-600 text-white px-4 py-2 text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Έγκριση
                      </button>
                      <button
                        onClick={() => reject(photo.id)}
                        disabled={actionLoading === photo.id}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-destructive text-destructive-foreground px-4 py-2 text-sm font-semibold hover:bg-destructive/90 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Απόρριψη
                      </button>
                    </div>
                  )}

                  {statusFilter === "approved" && (
                    <button
                      onClick={() => reject(photo.id)}
                      disabled={actionLoading === photo.id}
                      className="mt-auto inline-flex items-center gap-1.5 rounded-xl border border-destructive text-destructive px-4 py-2 text-sm font-semibold hover:bg-destructive/10 transition-colors disabled:opacity-50 w-fit"
                    >
                      <XCircle className="w-4 h-4" />
                      Διαγραφή
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
