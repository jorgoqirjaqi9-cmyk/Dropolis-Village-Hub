import { useState, useEffect, useCallback } from "react";
import { SEO } from "@/components/SEO";
import { Pencil, X, RefreshCw, Search, AlertCircle, CheckCircle, MapPin, Images, Check } from "lucide-react";
import { AdminLayout, AdminAuthGate, ConfirmModal, useAdminAuth, adminFetch } from "@/components/AdminLayout";

type Village = {
  id: number; name: string; nameEl: string; description: string;
  municipalUnit: string | null; population: number | null; elevation: number | null;
  imageUrl: string | null; latitude: number | null; longitude: number | null;
  createdAt: string;
};

type VillageForm = {
  name: string; nameEl: string; description: string;
  municipalUnit: string; population: string; elevation: string;
  imageUrl: string; latitude: string; longitude: string;
};

type Photo = {
  id: number;
  url: string;
  thumbnailUrl: string | null;
  title: string | null;
  villageId: number | null;
};

const EMPTY_FORM: VillageForm = {
  name: "", nameEl: "", description: "",
  municipalUnit: "", population: "", elevation: "",
  imageUrl: "", latitude: "", longitude: "",
};

function toForm(v: Village): VillageForm {
  return {
    name: v.name, nameEl: v.nameEl, description: v.description,
    municipalUnit: v.municipalUnit ?? "", population: v.population?.toString() ?? "",
    elevation: v.elevation?.toString() ?? "", imageUrl: v.imageUrl ?? "",
    latitude: v.latitude?.toString() ?? "", longitude: v.longitude?.toString() ?? "",
  };
}

export default function AdminVillages() {
  const { token, authenticated, login, logout } = useAdminAuth();
  const [villages, setVillages] = useState<Village[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Village | null>(null);
  const [form, setForm] = useState<VillageForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Photo picker state
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [villagePhotos, setVillagePhotos] = useState<Photo[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);

  const fetchVillages = useCallback(async (t: string) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/villages");
      if (!res.ok) throw new Error("Αποτυχία φόρτωσης");
      setVillages(await res.json());
    } catch (e) { setError(e instanceof Error ? e.message : "Σφάλμα"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (authenticated && token) fetchVillages(token); }, [authenticated, token]);

  const showMsg = (m: string) => { setMessage(m); setTimeout(() => setMessage(null), 3000); };

  function openEdit(v: Village) {
    setEditing(v);
    setForm(toForm(v));
    setShowPhotoPicker(false);
    setVillagePhotos([]);
  }
  function closeModal() { setEditing(null); setShowPhotoPicker(false); setVillagePhotos([]); }

  async function openPhotoPicker() {
    if (!editing) return;
    setShowPhotoPicker(true);
    setPhotosLoading(true);
    try {
      const res = await fetch(`/api/photos?village_id=${editing.id}&limit=60`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setVillagePhotos(Array.isArray(data) ? data : (data.photos ?? []));
    } catch {
      setVillagePhotos([]);
    } finally {
      setPhotosLoading(false);
    }
  }

  function selectPhoto(photo: Photo) {
    setForm(f => ({ ...f, imageUrl: photo.url }));
    setShowPhotoPicker(false);
  }

  async function saveVillage() {
    if (!editing) return;
    setSaving(true); setError(null);
    try {
      const body: Record<string, string | number | null> = {
        name: form.name.trim(), nameEl: form.nameEl.trim(),
        description: form.description.trim(),
        municipalUnit: form.municipalUnit.trim() || null,
        population: form.population ? parseInt(form.population) : null,
        elevation: form.elevation ? parseInt(form.elevation) : null,
        imageUrl: form.imageUrl.trim() || null,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      };
      const res = await adminFetch(`/api/villages/${editing.id}`, token, { method: "PATCH", body: JSON.stringify(body) });
      if (!res.ok) throw new Error(await res.text());
      showMsg("Το χωριό ενημερώθηκε ✓");
      closeModal();
      fetchVillages(token);
    } catch (e) { setError(e instanceof Error ? e.message : "Σφάλμα αποθήκευσης"); }
    finally { setSaving(false); }
  }

  async function deleteVillage(id: number) {
    try {
      const res = await adminFetch(`/api/villages/${id}`, token, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error();
      showMsg("Διαγράφηκε ✓");
      setVillages(prev => prev.filter(v => v.id !== id));
    } catch { setError("Αποτυχία διαγραφής"); }
    finally { setDeleteId(null); }
  }

  if (!authenticated) return <AdminAuthGate onAuth={login} />;

  const filtered = villages.filter(v =>
    !search || v.nameEl.toLowerCase().includes(search.toLowerCase()) || v.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <SEO title="Διαχείριση Χωριών — Admin" noindex />
      <AdminLayout token={token} onLogout={logout} title="Διαχείριση Χωριών">
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

          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Αναζήτηση χωριού..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <button onClick={() => fetchVillages(token)} disabled={loading}
              className="p-2.5 rounded-xl border border-border text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          <p className="text-xs text-muted-foreground">{filtered.length} χωριά</p>

          <div className="bg-background rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Χωριό</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs hidden md:table-cell">Latin</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs hidden lg:table-cell">Πληθυσμός</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs hidden lg:table-cell">Υψόμετρο</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs hidden lg:table-cell">Συντεταγμένες</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs">Ενέργειες</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(v => (
                    <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {v.imageUrl
                            ? <img src={v.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" loading="lazy" decoding="async" />
                            : <div className="w-8 h-8 rounded-lg bg-muted shrink-0 flex items-center justify-center"><Images className="w-3.5 h-3.5 text-muted-foreground" /></div>
                          }
                          <div>
                            <p className="font-medium text-foreground">{v.nameEl}</p>
                            <p className="text-xs text-muted-foreground md:hidden">{v.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">{v.name}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell text-xs">{v.population ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell text-xs">{v.elevation ? `${v.elevation}μ` : "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell text-xs">
                        {v.latitude && v.longitude ? `${v.latitude.toFixed(4)}, ${v.longitude.toFixed(4)}` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <a href={`/villages/${v.id}`} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                            <MapPin className="w-3.5 h-3.5" />
                          </a>
                          <button onClick={() => openEdit(v)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Edit modal */}
        {editing && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
            <div className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-2xl my-4">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="font-semibold text-foreground">Επεξεργασία: {editing.nameEl}</h2>
                <button onClick={closeModal} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm">{error}</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: "nameEl", label: "Ελληνικό Όνομα *", placeholder: "Δερβιτσάνη" },
                    { key: "name", label: "Latin Όνομα *", placeholder: "Dervician" },
                    { key: "municipalUnit", label: "Δημοτική Ενότητα", placeholder: "" },
                    { key: "population", label: "Πληθυσμός", placeholder: "350", type: "number" },
                    { key: "elevation", label: "Υψόμετρο (μ)", placeholder: "600", type: "number" },
                    { key: "latitude", label: "Γεωγρ. Πλάτος", placeholder: "40.1234", type: "number" },
                    { key: "longitude", label: "Γεωγρ. Μήκος", placeholder: "20.1234", type: "number" },
                  ].map(({ key, label, placeholder, type = "text" }) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
                      <input
                        type={type}
                        value={form[key as keyof VillageForm]}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        placeholder={placeholder}
                        step={type === "number" ? "any" : undefined}
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  ))}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Περιγραφή *</label>
                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                  </div>
                </div>

                {/* ── Κεντρική Φωτογραφία ── */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-muted-foreground">Κεντρική Φωτογραφία</label>

                  {/* Preview + URL input */}
                  <div className="flex gap-3 items-start">
                    <div className="shrink-0 w-20 h-20 rounded-xl border border-border overflow-hidden bg-muted flex items-center justify-center">
                      {form.imageUrl
                        ? <img src={form.imageUrl} alt="preview" className="w-full h-full object-cover" />
                        : <Images className="w-6 h-6 text-muted-foreground" />
                      }
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={form.imageUrl}
                        onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                        placeholder="https://..."
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={openPhotoPicker}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                        >
                          <Images className="w-3.5 h-3.5" />
                          Επιλογή από γκαλερί
                        </button>
                        {form.imageUrl && (
                          <button
                            type="button"
                            onClick={() => setForm(f => ({ ...f, imageUrl: "" }))}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-muted-foreground text-xs hover:bg-muted transition-colors"
                          >
                            <X className="w-3 h-3" />
                            Καθαρισμός
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Photo picker grid */}
                  {showPhotoPicker && (
                    <div className="rounded-xl border border-border overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
                        <span className="text-xs font-medium text-muted-foreground">
                          Φωτογραφίες {editing.nameEl} ({villagePhotos.length})
                        </span>
                        <button onClick={() => setShowPhotoPicker(false)} className="text-muted-foreground hover:text-foreground">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="p-3 max-h-64 overflow-y-auto">
                        {photosLoading ? (
                          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                            <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Φόρτωση...
                          </div>
                        ) : villagePhotos.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground gap-2">
                            <Images className="w-8 h-8 opacity-40" />
                            <p>Δεν υπάρχουν φωτογραφίες για αυτό το χωριό</p>
                            <p className="text-xs">Μπορείς να εισάγεις URL χειροκίνητα παραπάνω</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                            {villagePhotos.map(photo => {
                              const isSelected = form.imageUrl === photo.url;
                              return (
                                <button
                                  key={photo.id}
                                  type="button"
                                  onClick={() => selectPhoto(photo)}
                                  title={photo.title ?? ""}
                                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                                    isSelected
                                      ? "border-primary shadow-md shadow-primary/30"
                                      : "border-transparent hover:border-primary/50"
                                  }`}
                                >
                                  <img
                                    src={photo.thumbnailUrl ?? photo.url}
                                    alt={photo.title ?? ""}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                  {isSelected && (
                                    <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                                      <Check className="w-5 h-5 text-white drop-shadow" />
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 px-6 py-4 border-t border-border">
                <button onClick={closeModal} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
                  Ακύρωση
                </button>
                <button onClick={saveVillage} disabled={saving || !form.nameEl.trim() || !form.name.trim()}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                  {saving ? "Αποθήκευση..." : "Ενημέρωση"}
                </button>
              </div>
            </div>
          </div>
        )}

        {deleteId && (
          <ConfirmModal
            message="Διαγραφή αυτού του χωριού;"
            onConfirm={() => deleteVillage(deleteId)}
            onCancel={() => setDeleteId(null)}
          />
        )}
      </AdminLayout>
    </>
  );
}
