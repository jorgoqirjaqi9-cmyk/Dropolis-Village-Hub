import { useState, useCallback, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { CheckCircle, XCircle, Trash2, RefreshCw, MapPin, User, Calendar, ExternalLink, AlertCircle, X } from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { AdminLayout, AdminAuthGate, ConfirmModal, useAdminAuth, adminFetch } from "@/components/AdminLayout";

type VideoSubmission = {
  id: number; title: string; description: string | null; videoUrl: string;
  objectPath: string; thumbnailUrl: string | null; villageId: number | null;
  villageName: string | null; uploaderName: string | null; uploaderEmail: string | null;
  eventDate: string | null; copyrightConfirmed: boolean; status: string;
  createdAt: string; reviewedAt: string | null;
};

type StatusFilter = "pending" | "approved" | "rejected";

export default function AdminVideos() {
  const { token, authenticated, login, logout } = useAdminAuth();
  const [submissions, setSubmissions] = useState<VideoSubmission[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchSubmissions = useCallback(async (t: string, status: StatusFilter) => {
    setLoading(true); setError(null);
    try {
      const res = await adminFetch(`/api/admin/video-submissions?status=${status}`, t);
      if (res.status === 401) { logout(); return; }
      if (!res.ok) throw new Error("Αποτυχία φόρτωσης βίντεο.");
      setSubmissions(await res.json());
    } catch (e) { setError(e instanceof Error ? e.message : "Σφάλμα."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (authenticated && token) fetchSubmissions(token, statusFilter); }, [authenticated, token]);

  const showMsg = (m: string) => { setMessage(m); setTimeout(() => setMessage(null), 3000); };

  function changeFilter(s: StatusFilter) {
    setStatusFilter(s);
    if (authenticated && token) fetchSubmissions(token, s);
  }

  async function approve(id: number) {
    setActionLoading(id);
    try {
      const res = await adminFetch(`/api/admin/video-submissions/${id}/approve`, token, { method: "PUT" });
      if (!res.ok) throw new Error();
      setSubmissions(prev => prev.filter(s => s.id !== id));
      showMsg("✓ Το βίντεο εγκρίθηκε.");
    } catch { setError("Αποτυχία έγκρισης."); }
    finally { setActionLoading(null); }
  }

  async function reject(id: number) {
    setActionLoading(id);
    try {
      const res = await adminFetch(`/api/admin/video-submissions/${id}/reject`, token, { method: "PUT" });
      if (!res.ok) throw new Error();
      setSubmissions(prev => prev.filter(s => s.id !== id));
      showMsg("✓ Απορρίφθηκε.");
    } catch { setError("Αποτυχία απόρριψης."); }
    finally { setActionLoading(null); }
  }

  async function deleteSubmission(id: number) {
    setActionLoading(id);
    try {
      const res = await adminFetch(`/api/admin/video-submissions/${id}`, token, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error();
      setSubmissions(prev => prev.filter(s => s.id !== id));
      showMsg("✓ Διαγράφηκε.");
    } catch { setError("Αποτυχία διαγραφής."); }
    finally { setActionLoading(null); setDeleteId(null); }
  }

  if (!authenticated) return <AdminAuthGate onAuth={login} />;

  const statusLabel: Record<StatusFilter, string> = { pending: "Αναμονή", approved: "Εγκεκριμένα", rejected: "Απορριφθέντα" };

  return (
    <>
      <SEO title="Διαχείριση Βίντεο — Admin" noindex />
      <AdminLayout token={token} onLogout={logout} title="Διαχείριση Υποβολών Βίντεο">
        <div className="max-w-5xl mx-auto space-y-4">

          {message && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 text-sm">
              <CheckCircle className="w-4 h-4 shrink-0" /> {message}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {(["pending", "approved", "rejected"] as StatusFilter[]).map(s => (
              <button key={s} onClick={() => changeFilter(s)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                {statusLabel[s]}
              </button>
            ))}
            <button onClick={() => fetchSubmissions(token, statusFilter)} disabled={loading}
              className="ml-auto p-2 rounded-xl border border-border text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {loading && <div className="text-center py-12"><RefreshCw className="w-6 h-6 animate-spin text-muted-foreground mx-auto" /></div>}

          {!loading && submissions.length === 0 && (
            <div className="text-center py-16 text-muted-foreground text-sm">Δεν υπάρχουν βίντεο σε αυτή την κατηγορία.</div>
          )}

          <div className="space-y-4">
            {submissions.map(sub => (
              <div key={sub.id} className="bg-background rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{sub.title}</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                        <span>#{sub.id}</span>
                        <span>{format(new Date(sub.createdAt), "d MMM yyyy HH:mm", { locale: el })}</span>
                        {sub.uploaderName && <span className="flex items-center gap-1"><User className="w-3 h-3" />{sub.uploaderName}{sub.uploaderEmail && ` <${sub.uploaderEmail}>`}</span>}
                        {sub.villageName && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{sub.villageName}</span>}
                        {sub.eventDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{sub.eventDate}</span>}
                        <a href={sub.videoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                          <ExternalLink className="w-3 h-3" /> Βίντεο
                        </a>
                      </div>
                    </div>
                    <button onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
                      className="text-xs text-primary hover:underline shrink-0">
                      {expandedId === sub.id ? "Απόκρυψη" : "Προβολή"}
                    </button>
                  </div>

                  {expandedId === sub.id && (
                    <div className="mt-4">
                      <video src={sub.videoUrl} controls className="w-full max-h-64 rounded-xl bg-black" preload="metadata" />
                      {sub.description && <p className="mt-2 text-sm text-muted-foreground">{sub.description}</p>}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mt-4">
                    {statusFilter === "pending" && (
                      <>
                        <button onClick={() => approve(sub.id)} disabled={actionLoading === sub.id}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50">
                          <CheckCircle className="w-4 h-4" /> Έγκριση
                        </button>
                        <button onClick={() => reject(sub.id)} disabled={actionLoading === sub.id}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50">
                          <XCircle className="w-4 h-4" /> Απόρριψη
                        </button>
                      </>
                    )}
                    {statusFilter === "approved" && (
                      <button onClick={() => reject(sub.id)} disabled={actionLoading === sub.id}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-500 text-amber-500 text-sm font-medium hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors disabled:opacity-50">
                        <XCircle className="w-4 h-4" /> Απόρριψη
                      </button>
                    )}
                    <button onClick={() => setDeleteId(sub.id)} disabled={actionLoading === sub.id}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-500 text-red-500 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors disabled:opacity-50">
                      <Trash2 className="w-4 h-4" /> Διαγραφή
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {deleteId && (
          <ConfirmModal
            message="Διαγραφή αυτού του βίντεο; Η ενέργεια δεν αναιρείται."
            onConfirm={() => deleteSubmission(deleteId)}
            onCancel={() => setDeleteId(null)}
          />
        )}
      </AdminLayout>
    </>
  );
}
