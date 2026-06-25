import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { SEO } from "@/components/SEO";
import {
  Newspaper, Image, Video, MapPin, Clock, CheckCircle,
  TrendingUp, AlertCircle, RefreshCw, ExternalLink, Star, Download, CalendarDays,
} from "lucide-react";
import { AdminLayout, AdminAuthGate, StatCard, StatusBadge, useAdminAuth, adminFetch } from "@/components/AdminLayout";
import { format } from "date-fns";
import { el } from "date-fns/locale";

type DashboardData = {
  articles: { total: number; published: number; draft: number; featured: number; recentWeek: number };
  villages: { total: number };
  photos: { approved: number; pending: number };
  videos: { total: number; pendingSubmissions: number };
  events: { approved: number; pending: number };
  pendingApprovals: number;
  pendingNewsSubmissions: number;
  latestArticles: { id: number; title: string; category: string; published: boolean; createdAt: string }[];
};

export default function AdminDashboard() {
  const { token, authenticated, login, logout } = useAdminAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchMsg, setFetchMsg] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);

  async function triggerRssFetch() {
    setFetching(true);
    setFetchMsg(null);
    try {
      const res = await adminFetch("/api/rss/import", token, { method: "POST" });
      if (res.ok) {
        setFetchMsg("✓ Φόρτωση νέων άρθρων ξεκίνησε — θα εμφανιστούν σε 1-2 λεπτά");
      } else {
        setFetchMsg("✗ Αποτυχία εκκίνησης");
      }
    } catch {
      setFetchMsg("✗ Σφάλμα σύνδεσης");
    } finally {
      setFetching(false);
      setTimeout(() => setFetchMsg(null), 8000);
    }
  }

  const fetchData = useCallback(async (t: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch("/api/admin/dashboard", t);
      if (res.status === 401) { logout(); return; }
      if (!res.ok) throw new Error("Αποτυχία φόρτωσης");
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Σφάλμα");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authenticated || !token) return;
    fetchData(token);
    const interval = setInterval(() => fetchData(token), 30_000);
    return () => clearInterval(interval);
  }, [authenticated, token, fetchData]);

  if (!authenticated) return <AdminAuthGate onAuth={(t) => { login(t); fetchData(t); }} />;

  return (
    <>
      <SEO title="Admin Dashboard — Dropolis" noindex />
      <AdminLayout token={token} onLogout={logout} title="Dashboard">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">Καλωσήρθατε 👋</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Επισκόπηση περιεχομένου Dropolis.net</p>
            </div>
            <button
              onClick={() => fetchData(token)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Ανανέωση
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {data && (
            <>
              {/* Pending approvals alert */}
              {data.pendingApprovals > 0 && (
                <div className="flex items-center justify-between p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="text-sm font-medium">
                      {data.pendingApprovals} εκκρεμή {data.pendingApprovals === 1 ? "έγκριση" : "εγκρίσεις"} που απαιτούν προσοχή
                    </span>
                  </div>
                  <div className="flex gap-2 text-xs">
                    {data.photos.pending > 0 && (
                      <Link href="/admin/photos">
                        <span className="px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/30 transition-colors cursor-pointer font-medium">
                          {data.photos.pending} φωτ.
                        </span>
                      </Link>
                    )}
                    {data.videos.pendingSubmissions > 0 && (
                      <Link href="/admin/videos">
                        <span className="px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/30 transition-colors cursor-pointer font-medium">
                          {data.videos.pendingSubmissions} βίντεο
                        </span>
                      </Link>
                    )}
                    {data.pendingNewsSubmissions > 0 && (
                      <Link href="/admin/news">
                        <span className="px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/30 transition-colors cursor-pointer font-medium">
                          {data.pendingNewsSubmissions} ειδήσεις
                        </span>
                      </Link>
                    )}
                    {data.events.pending > 0 && (
                      <Link href="/admin/events">
                        <span className="px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/30 transition-colors cursor-pointer font-medium">
                          {data.events.pending} εκδηλώσεις
                        </span>
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Stats grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Άρθρα συνολικά" value={data.articles.total} icon={Newspaper} color="blue" sub={`${data.articles.published} δημοσιευμένα`} href="/admin/articles" />
                <StatCard label="Χωριά" value={data.villages.total} icon={MapPin} color="green" href="/admin/villages" />
                <StatCard label="Φωτογραφίες" value={data.photos.approved} icon={Image} color="purple" sub={data.photos.pending > 0 ? `${data.photos.pending} αναμένουν` : undefined} href="/admin/photos" />
                <StatCard label="Βίντεο" value={data.videos.total} icon={Video} color="red" href="/admin/videos" />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Εκδηλώσεις" value={data.events.approved} icon={CalendarDays} color="primary" sub={data.events.pending > 0 ? `${data.events.pending} αναμένουν` : undefined} href="/admin/events" />
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Δημοσιευμένα" value={data.articles.published} icon={CheckCircle} color="green" href="/admin/articles" />
                <StatCard label="Πρόχειρα" value={data.articles.draft} icon={Clock} color="yellow" href="/admin/articles" />
                <StatCard label="Προτεινόμενα" value={data.articles.featured} icon={Star} color="orange" href="/admin/articles" />
                <StatCard label="Νέα (7 ημέρες)" value={data.articles.recentWeek} icon={TrendingUp} color="primary" href="/admin/articles" />
              </div>

              {/* Quick actions */}
              <div className="bg-background rounded-xl border border-border p-5">
                <h3 className="font-semibold text-foreground text-sm mb-4">Γρήγορες ενέργειες</h3>
                <div className="flex flex-wrap gap-3">
                  <Link href="/admin/articles?action=new">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer">
                      <Newspaper className="w-4 h-4" />
                      Νέο Άρθρο
                    </span>
                  </Link>
                  <button
                    onClick={triggerRssFetch}
                    disabled={fetching}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-60"
                  >
                    <Download className={`w-4 h-4 ${fetching ? "animate-bounce" : ""}`} />
                    {fetching ? "Φόρτωση..." : "Άντλησε νέα άρθρα τώρα"}
                  </button>
                  <Link href="/admin/photos">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer">
                      <Image className="w-4 h-4" />
                      Φωτογραφίες
                    </span>
                  </Link>
                  <Link href="/admin/captions">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer">
                      <ExternalLink className="w-4 h-4" />
                      Social Captions
                    </span>
                  </Link>
                  <Link href="/admin/villages">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer">
                      <MapPin className="w-4 h-4" />
                      Χωριά
                    </span>
                  </Link>
                  <Link href="/admin/events">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer">
                      <CalendarDays className="w-4 h-4" />
                      Εκδηλώσεις
                    </span>
                  </Link>
                </div>
                {fetchMsg && (
                  <p className={`mt-3 text-sm font-medium ${fetchMsg.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>
                    {fetchMsg}
                  </p>
                )}
              </div>

              {/* Latest articles */}
              <div className="bg-background rounded-xl border border-border overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <h3 className="font-semibold text-foreground text-sm">Πρόσφατα Άρθρα</h3>
                  <Link href="/admin/articles">
                    <span className="text-xs text-primary hover:underline cursor-pointer">Όλα τα άρθρα →</span>
                  </Link>
                </div>
                <div className="divide-y divide-border">
                  {data.latestArticles.map((a) => (
                    <div key={a.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40 transition-colors">
                      <StatusBadge status={a.published ? "published" : "draft"} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground font-medium truncate">{a.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {a.category} · {format(new Date(a.createdAt), "d MMM yyyy", { locale: el })}
                        </p>
                      </div>
                      <Link href={`/admin/articles?edit=${a.id}`}>
                        <span className="text-xs text-primary hover:underline cursor-pointer shrink-0">Επεξεργασία</span>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {loading && !data && (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </AdminLayout>
    </>
  );
}
