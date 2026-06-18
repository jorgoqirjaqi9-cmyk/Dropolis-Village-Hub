import { useState, useCallback, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { CheckCircle, XCircle, ImageIcon, MapPin, User, RefreshCw, Pencil, X, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import {
  AdminLayout, AdminAuthGate, StatusBadge, ConfirmModal,
  useAdminAuth, adminFetch,
} from "@/components/AdminLayout";

type AdminPhoto = {
  id: number; title: string; description: string | null; url: string;
  thumbnailUrl: string | null; villageId: number | null; villageName: string | null;
  photographer: string | null; status: string; objectPath: string | null;
  copyrightConfirmed: boolean; uploaderName: string | null; createdAt: string;
};

type StatusFilter = "pending" | "approved" | "rejected";

type EditForm = { title: string; description: string; photographer: string };

export default function AdminPhotos() {
  const { token, authenticated, login, logout } = useAdminAuth();
  const [photos, setPhotos] = useState<AdminPhoto[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editing, setEditing] = useState<AdminPhoto | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ title: "", description: "", photographer: "" });
  const [saving, setSaving] = useState(false);

  const fetchPhotos = useCallback(async (t: string, status: StatusFilter) => {
    setLoading(true); setError(null);
    try {
      const res = await adminFetch(`/api/admin/photos?status=${status}`, t);
      if (res.status === 401) { logout(); return; }
      if (!res.ok) throw new Error("Αποτυχία φόρτωσης φωτογραφιών.");
      setPhotos(await res.json());
    } catch (e) { setError(e instanceof Error ? e.message : "Σφάλμα."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (authenticated && token) fetchPhotos(token, statusFilter); }, [authenticated, token]);

  const showMsg = (m: string) => { setMessage(m); setTimeout(() => setMessage(null), 3000); };

  function changeFilter(s: StatusFilter) {
    setStatusFilter(s);
    if (authenticated && token) fetchPhotos(token, s);
  }

  async function approve(id: number) {
    setActionLoading(id);
    try {
      const res = await adminFetch(`/api/admin/photos/${id}/approve`, token, { method: "PUT" });
      if (!res.ok) throw new Error();
      setPhotos(prev => prev.filter(p => p.id !== id));
      showMsg("✓ Η φωτογραφία εγκρίθηκε.");
    } catch { setError("Αποτυχία έγκρισης."); }
    finally { setActionLoading(null); }
  }

  async function rejectPhoto(id: number) {
    setActionLoading(id);
    try {
      const res = await adminFetch(`/api/admin/photos/${id}/reject`, token, { method: "PUT" });
      if (!res.ok) throw new Error();
      setPhotos(prev => prev.filter(p => p.id !== id));
      showMsg("✓ Απορρίφθηκε.");
    } catch { setError("Αποτυχία απόρριψης."); }
    finally { setActionLoading(null); }
  }

  async function deletePhoto(id: number) {
    setActionLoading(id);
    try {
      const res = await adminFetch(`/api/admin/photos/${id}`, token, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error();
      setPhotos(prev => prev.filter(p => p.id !== id));
      showMsg("✓ Διαγράφηκε.");
    } catch { setError("Αποτυχία διαγραφής."); }
    finally { setActionLoading(null); setDeleteId(null); }
  }

  function openEdit(p: AdminPhoto) {
    setEditing(p);
    setEditForm({ title: p.title, description: p.description ?? "", photographer: p.photographer ?? "" });
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await adminFetch(`/api/admin/photos/${editing.id}`, token, {
        method: "PATCH",
        body: JSON.stringify({
          title: editForm.title.trim(),
          description: editForm.description.trim() || null,
          photographer: editForm.photographer.trim() || null,
        }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setPhotos(prev => prev.map(p => p.id === editing.id ? { ...p, ...updated } : p));
      showMsg("✓ Ενημερώθηκε.");
      setEditing(null);
    } catch { setError("Αποτυχία αποθήκευσης."); }
    finally { setSaving(false); }
  }

  if (!authenticated) return <AdminAuthGate onAuth={login} />;

  return (
    <>
      <SEO title="Διαχείριση Φωτογραφιών — Admin" noindex />
      <AdminLayout token={token} onLogout={logout} title="Διαχείριση Φωτογραφιών">
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

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {(["pending", "approved", "rejected"] as StatusFilter[]).map(s => (
              <button key={s} onClick={() => changeFilter(s)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                {s === "pending" ? "Αναμονή" : s === "approved" ? "Εγκεκριμένες" : "Απορριφθείσες"}
              </button>
            ))}
            <button onClick={() => fetchPhotos(token, statusFilter)} disabled={loading}
              className="ml-auto p-2 rounded-xl border border-border text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {loading && <div className="text-center py-12"><RefreshCw className="w-6 h-6 animate-spin text-muted-foreground mx-auto" /></div>}

          {!loading && photos.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Δεν υπάρχουν φωτογραφίες σε αυτή την κατηγορία.</p>
            </div>
          )}

          <div className="space-y-4">
            {photos.map(photo => (
              <div key={photo.id} className="bg-background rounded-2xl border border-border overflow-hidden flex flex-col sm:flex-row shadow-sm">
                <div className="sm:w-44 shrink-0 bg-muted">
                  <img src={photo.thumbnailUrl ?? photo.url} alt={photo.title}
                    className="w-full h-44 sm:h-full object-cover"
                    loading="lazy" decoding="async"
                    onError={e => { (e.target as HTMLImageElement).src = "/opengraph.jpg"; }} />
                </div>
                <div className="flex-1 p-4 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-foreground">{photo.title}</h3>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                        <span>#{photo.id}</span>
                        <span>{format(new Date(photo.createdAt), "d MMM yyyy HH:mm", { locale: el })}</span>
                        {photo.villageName && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{photo.villageName}</span>}
                        {photo.uploaderName && <span className="flex items-center gap-1"><User className="w-3 h-3" />{photo.uploaderName}</span>}
                        {photo.photographer && <span>📷 {photo.photographer}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <StatusBadge status={photo.status} />
                      <button onClick={() => openEdit(photo)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {photo.description && <p className="text-xs text-muted-foreground line-clamp-2">{photo.description}</p>}

                  <span className={`text-xs font-medium w-fit ${photo.copyrightConfirmed ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                    {photo.copyrightConfirmed ? "✓ Copyright OK" : "✗ Χωρίς copyright"}
                  </span>

                  <div className="flex flex-wrap gap-2 mt-auto pt-2">
                    {statusFilter === "pending" && (
                      <>
                        <button onClick={() => approve(photo.id)} disabled={actionLoading === photo.id}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50">
                          <CheckCircle className="w-4 h-4" /> Έγκριση
                        </button>
                        <button onClick={() => rejectPhoto(photo.id)} disabled={actionLoading === photo.id}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50">
                          <XCircle className="w-4 h-4" /> Απόρριψη
                        </button>
                      </>
                    )}
                    {statusFilter === "approved" && (
                      <button onClick={() => rejectPhoto(photo.id)} disabled={actionLoading === photo.id}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-500 text-amber-500 text-sm font-medium hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors disabled:opacity-50">
                        <XCircle className="w-4 h-4" /> Απόρριψη
                      </button>
                    )}
                    <button onClick={() => setDeleteId(photo.id)} disabled={actionLoading === photo.id}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-500 text-red-500 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors disabled:opacity-50">
                      Διαγραφή
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Edit modal */}
        {editing && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="font-semibold text-foreground">Επεξεργασία Φωτογραφίας</h2>
                <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Τίτλος</label>
                  <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Περιγραφή</label>
                  <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                    rows={3} className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Φωτογράφος</label>
                  <input value={editForm.photographer} onChange={e => setEditForm(f => ({ ...f, photographer: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <div className="flex gap-3 px-6 py-4 border-t border-border">
                <button onClick={() => setEditing(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">Ακύρωση</button>
                <button onClick={saveEdit} disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                  {saving ? "Αποθήκευση..." : "Αποθήκευση"}
                </button>
              </div>
            </div>
          </div>
        )}

        {deleteId && (
          <ConfirmModal
            message="Διαγραφή αυτής της φωτογραφίας; Η ενέργεια δεν αναιρείται."
            onConfirm={() => deletePhoto(deleteId)}
            onCancel={() => setDeleteId(null)}
          />
        )}
      </AdminLayout>
    </>
  );
}
