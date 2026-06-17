import { useState, useEffect, useCallback } from "react";
import { useSearch } from "wouter";
import { SEO } from "@/components/SEO";
import {
  Plus, Pencil, Trash2, Eye, EyeOff, RefreshCw, Search,
  Star, StarOff, AlertCircle, CheckCircle, X, ExternalLink,
  Sparkles,
} from "lucide-react";
import {
  AdminLayout, AdminAuthGate, StatusBadge, ConfirmModal,
  useAdminAuth, adminFetch,
} from "@/components/AdminLayout";
import { format } from "date-fns";
import { el } from "date-fns/locale";

const CATEGORIES = [
  "Ειδήσεις", "Ιστορία", "Πολιτισμός", "Αθλητισμός", "Εκπαίδευση",
  "Οικονομία", "Κοινωνία", "Τουρισμός", "Περιβάλλον", "Τεχνολογία",
];

type Article = {
  id: number; title: string; excerpt: string | null; content: string;
  category: string; author: string; imageUrl: string | null;
  villageName: string | null; tags: string | null;
  seoTitle: string | null; metaDescription: string | null; slug: string | null;
  score: number; viewCount: number; published: boolean; featured: boolean;
  createdAt: string; updatedAt: string;
};

type ArticleForm = {
  title: string; excerpt: string; content: string; category: string;
  author: string; imageUrl: string; villageName: string; tags: string;
  seoTitle: string; metaDescription: string; slug: string;
  published: boolean; featured: boolean;
};

const EMPTY_FORM: ArticleForm = {
  title: "", excerpt: "", content: "", category: "Ειδήσεις",
  author: "Σύνταξη Dropolis", imageUrl: "", villageName: "", tags: "",
  seoTitle: "", metaDescription: "", slug: "",
  published: true, featured: false,
};

function articleToForm(a: Article): ArticleForm {
  return {
    title: a.title, excerpt: a.excerpt ?? "", content: a.content,
    category: a.category, author: a.author, imageUrl: a.imageUrl ?? "",
    villageName: a.villageName ?? "", tags: a.tags ?? "",
    seoTitle: a.seoTitle ?? "", metaDescription: a.metaDescription ?? "",
    slug: a.slug ?? "", published: a.published, featured: a.featured,
  };
}

export default function AdminArticles() {
  const { token, authenticated, login, logout } = useAdminAuth();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const openNew = params.get("action") === "new";
  const editId = params.get("edit") ? Number(params.get("edit")) : null;

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Filters
  const [searchQ, setSearchQ] = useState("");
  const [filterPublished, setFilterPublished] = useState<"all" | "true" | "false">("all");
  const [filterCategory, setFilterCategory] = useState("");

  // Modals
  const [modalOpen, setModalOpen] = useState(openNew);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [form, setForm] = useState<ArticleForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [sanitizing, setSanitizing] = useState(false);
  const [sanitizeChanges, setSanitizeChanges] = useState<Array<{ field: string; reason: string }> | null>(null);

  const fetchArticles = useCallback(async (t: string) => {
    setLoading(true); setError(null);
    try {
      const q = new URLSearchParams({ limit: "100", published: filterPublished });
      if (filterCategory) q.set("category", filterCategory);
      if (searchQ) q.set("search", searchQ);
      const res = await adminFetch(`/api/admin/articles?${q}`, t);
      if (res.status === 401) { logout(); return; }
      if (!res.ok) throw new Error("Αποτυχία φόρτωσης άρθρων");
      setArticles(await res.json());
    } catch (e) { setError(e instanceof Error ? e.message : "Σφάλμα"); }
    finally { setLoading(false); }
  }, [filterPublished, filterCategory, searchQ]);

  useEffect(() => { if (authenticated && token) fetchArticles(token); }, [authenticated, token, filterPublished, filterCategory]);

  // If editId in URL, open that article for editing
  useEffect(() => {
    if (editId && articles.length) {
      const a = articles.find(x => x.id === editId);
      if (a) { openEdit(a); }
    }
  }, [editId, articles]);

  function openNew2() { setEditingArticle(null); setForm(EMPTY_FORM); setSanitizeChanges(null); setModalOpen(true); }
  function openEdit(a: Article) { setEditingArticle(a); setForm(articleToForm(a)); setSanitizeChanges(null); setModalOpen(true); }
  function closeModal() { setModalOpen(false); setEditingArticle(null); setSanitizeChanges(null); }

  const showMsg = (m: string) => { setMessage(m); setTimeout(() => setMessage(null), 3500); };

  async function saveArticle() {
    setSaving(true);
    try {
      const body = {
        title: form.title.trim(), excerpt: form.excerpt.trim() || null,
        content: form.content.trim(), category: form.category,
        author: form.author.trim(), imageUrl: form.imageUrl.trim() || null,
        villageName: form.villageName.trim() || null, tags: form.tags.trim() || null,
        seoTitle: form.seoTitle.trim() || null, metaDescription: form.metaDescription.trim() || null,
        slug: form.slug.trim() || null, published: form.published, featured: form.featured,
      };

      if (editingArticle) {
        const res = await adminFetch(`/api/articles/${editingArticle.id}`, token, { method: "PATCH", body: JSON.stringify(body) });
        if (!res.ok) throw new Error(await res.text());
        showMsg("Το άρθρο ενημερώθηκε ✓");
      } else {
        const res = await adminFetch("/api/articles", token, { method: "POST", body: JSON.stringify(body) });
        if (!res.ok) throw new Error(await res.text());
        showMsg("Το άρθρο δημιουργήθηκε ✓");
      }
      closeModal();
      fetchArticles(token);
    } catch (e) { setError(e instanceof Error ? e.message : "Σφάλμα αποθήκευσης"); }
    finally { setSaving(false); }
  }

  async function togglePublish(a: Article) {
    setActionLoading(a.id);
    try {
      const res = await adminFetch(`/api/articles/${a.id}`, token, {
        method: "PATCH", body: JSON.stringify({ published: !a.published }),
      });
      if (!res.ok) throw new Error();
      showMsg(a.published ? "Αποκρύφθηκε" : "Δημοσιεύθηκε ✓");
      setArticles(prev => prev.map(x => x.id === a.id ? { ...x, published: !a.published } : x));
    } catch { setError("Αποτυχία ενέργειας"); }
    finally { setActionLoading(null); }
  }

  async function toggleFeatured(a: Article) {
    setActionLoading(a.id);
    try {
      const res = await adminFetch(`/api/articles/${a.id}`, token, {
        method: "PATCH", body: JSON.stringify({ featured: !a.featured }),
      });
      if (!res.ok) throw new Error();
      setArticles(prev => prev.map(x => x.id === a.id ? { ...x, featured: !a.featured } : x));
    } catch { setError("Αποτυχία ενέργειας"); }
    finally { setActionLoading(null); }
  }

  async function deleteArticle(id: number) {
    setActionLoading(id);
    try {
      const res = await adminFetch(`/api/articles/${id}`, token, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error();
      showMsg("Διαγράφηκε ✓");
      setArticles(prev => prev.filter(x => x.id !== id));
    } catch { setError("Αποτυχία διαγραφής"); }
    finally { setActionLoading(null); setDeleteId(null); }
  }

  async function applySanitize() {
    setSanitizing(true);
    setSanitizeChanges(null);
    try {
      const payload = {
        title:           form.title            || null,
        content:         form.content          || null,
        excerpt:         form.excerpt          || null,
        metaDescription: form.metaDescription  || null,
        tags:            form.tags             || null,
        villageName:     form.villageName      || null,
        category:        form.category,
      };
      const res = await adminFetch("/api/admin/seo-sanitize", token, {
        method: "POST", body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const result = await res.json() as {
        title?: string; content?: string; excerpt?: string;
        metaDescription?: string; tags?: string;
        changes: Array<{ field: string; reason: string }>;
      };
      setForm(f => ({
        ...f,
        ...(result.title           != null && { title:           result.title }),
        ...(result.content         != null && { content:         result.content }),
        ...(result.excerpt         != null && { excerpt:         result.excerpt }),
        ...(result.metaDescription != null && { metaDescription: result.metaDescription }),
        ...(result.tags            != null && { tags:            result.tags }),
      }));
      setSanitizeChanges(
        result.changes?.length > 0
          ? result.changes
          : [{ field: '✓', reason: 'Δεν εντοπίστηκαν αλλαγές — το περιεχόμενο ήταν ήδη καθαρό!' }],
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Αποτυχία SEO sanitize");
    } finally {
      setSanitizing(false);
    }
  }

  if (!authenticated) return <AdminAuthGate onAuth={login} />;

  const filtered = articles.filter(a =>
    !searchQ || a.title.toLowerCase().includes(searchQ.toLowerCase()) || (a.author ?? "").toLowerCase().includes(searchQ.toLowerCase())
  );

  return (
    <>
      <SEO title="Διαχείριση Άρθρων — Admin" noindex />
      <AdminLayout token={token} onLogout={logout} title="Διαχείριση Άρθρων">
        <div className="max-w-6xl mx-auto space-y-4">

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

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                onKeyDown={e => e.key === "Enter" && fetchArticles(token)}
                placeholder="Αναζήτηση τίτλου ή συγγραφέα..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select value={filterPublished} onChange={e => setFilterPublished(e.target.value as "all" | "true" | "false")}
              className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="all">Όλα</option>
              <option value="true">Δημοσιευμένα</option>
              <option value="false">Πρόχειρα</option>
            </select>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">Όλες κατηγορίες</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={() => fetchArticles(token)} disabled={loading}
              className="p-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button onClick={openNew2}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity shrink-0">
              <Plus className="w-4 h-4" /> Νέο Άρθρο
            </button>
          </div>

          {/* Count */}
          <p className="text-xs text-muted-foreground">{filtered.length} άρθρα</p>

          {/* Table */}
          <div className="bg-background rounded-xl border border-border overflow-hidden">
            {filtered.length === 0 && !loading ? (
              <p className="text-sm text-muted-foreground text-center py-12">Δεν βρέθηκαν άρθρα</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Τίτλος</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs hidden md:table-cell">Κατηγορία</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs hidden lg:table-cell">Συγγραφέας</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Κατάσταση</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs hidden lg:table-cell">Ημερομηνία</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs">Ενέργειες</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map(a => (
                      <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {a.featured && <Star className="w-3.5 h-3.5 text-yellow-500 shrink-0" />}
                            <span className="font-medium text-foreground line-clamp-1 max-w-xs">{a.title}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 md:hidden">{a.category}</p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-xs bg-muted px-2 py-1 rounded-lg">{a.category}</span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell text-xs">{a.author}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={a.published ? "published" : "draft"} />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell text-xs whitespace-nowrap">
                          {format(new Date(a.createdAt), "d MMM yyyy", { locale: el })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {a.published && (
                              <a href={`/news/${a.id}`} target="_blank" rel="noopener noreferrer"
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button onClick={() => toggleFeatured(a)} disabled={actionLoading === a.id}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/10 transition-colors disabled:opacity-50"
                              title={a.featured ? "Αφαίρεση από προτεινόμενα" : "Προσθήκη στα προτεινόμενα"}>
                              {a.featured ? <Star className="w-3.5 h-3.5 text-yellow-500" /> : <StarOff className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={() => togglePublish(a)} disabled={actionLoading === a.id}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                              title={a.published ? "Απόκρυψη" : "Δημοσίευση"}>
                              {a.published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={() => openEdit(a)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setDeleteId(a.id)} disabled={actionLoading === a.id}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Article form modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
            <div className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-3xl my-4">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="font-semibold text-foreground">{editingArticle ? "Επεξεργασία Άρθρου" : "Νέο Άρθρο"}</h2>
                <button onClick={closeModal} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-6 space-y-5">
                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm">{error}</div>
                )}

                {sanitizeChanges && (
                  <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                        <span className="text-xs font-semibold text-teal-700 dark:text-teal-300">
                          SEO Sanitize —{" "}
                          {sanitizeChanges.length === 1 && sanitizeChanges[0].field === "✓"
                            ? "καμία αλλαγή"
                            : `${sanitizeChanges.length} διόρθωσ${sanitizeChanges.length === 1 ? "η" : "εις"} εφαρμόστηκαν`}
                        </span>
                      </div>
                      <button onClick={() => setSanitizeChanges(null)} className="text-teal-500 hover:text-teal-700 transition-colors shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <ul className="space-y-0.5">
                      {sanitizeChanges.map((c, i) => (
                        <li key={i} className="text-xs text-teal-700 dark:text-teal-300 flex gap-1.5">
                          <span className="font-semibold shrink-0">[{c.field}]</span>
                          <span>{c.reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Basic info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Τίτλος *</label>
                    <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Κατηγορία *</label>
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Συγγραφέας *</label>
                    <input value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Χωριό</label>
                    <input value={form.villageName} onChange={e => setForm(f => ({ ...f, villageName: e.target.value }))}
                      placeholder="π.χ. Δερβιτσάνη"
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Εικόνα (URL)</label>
                    <input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                      placeholder="https://..."
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tags (κόμμα)</label>
                    <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                      placeholder="Δρόπολη, Ήπειρος, ..."
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>

                {/* Excerpt */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Σύνοψη</label>
                  <textarea value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
                    rows={2} placeholder="Σύντομη περιγραφή..."
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Περιεχόμενο *</label>
                  <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                    rows={10} placeholder="Κείμενο άρθρου..."
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-y font-mono" />
                </div>

                {/* SEO */}
                <details className="group">
                  <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground list-none flex items-center gap-1">
                    <span className="group-open:rotate-90 transition-transform inline-block">▶</span> SEO & Metadata
                  </summary>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-border">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">SEO Title</label>
                      <input value={form.seoTitle} onChange={e => setForm(f => ({ ...f, seoTitle: e.target.value }))}
                        placeholder={form.title}
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Meta Description</label>
                      <textarea value={form.metaDescription} onChange={e => setForm(f => ({ ...f, metaDescription: e.target.value }))}
                        rows={2} maxLength={160}
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                      <p className="text-xs text-muted-foreground mt-1">{form.metaDescription.length}/160 χαρακτήρες</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Slug (URL)</label>
                      <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                        placeholder="arthro-gia-dropoli"
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                  </div>
                </details>

                {/* Toggles */}
                <div className="flex gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.published} onChange={e => setForm(f => ({ ...f, published: e.target.checked }))}
                      className="w-4 h-4 rounded accent-primary" />
                    <span className="text-sm text-foreground">Δημοσιευμένο</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))}
                      className="w-4 h-4 rounded accent-primary" />
                    <span className="text-sm text-foreground">Προτεινόμενο</span>
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 px-6 py-4 border-t border-border">
                <button onClick={closeModal} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
                  Ακύρωση
                </button>
                <button
                  onClick={applySanitize}
                  disabled={sanitizing || !form.content.trim()}
                  title="Αυτόματο καθάρισμα τίτλου, τυπογραφίας, links και μεταδεδομένων SEO"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-teal-500/50 bg-teal-500/10 text-teal-700 dark:text-teal-300 text-sm font-medium hover:bg-teal-500/20 transition-colors disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${sanitizing ? "animate-pulse" : ""}`} />
                  {sanitizing ? "Sanitize…" : "SEO Fix"}
                </button>
                <button onClick={saveArticle} disabled={saving || !form.title.trim() || !form.content.trim()}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                  {saving ? "Αποθήκευση..." : editingArticle ? "Ενημέρωση" : "Δημιουργία"}
                </button>
              </div>
            </div>
          </div>
        )}

        {deleteId && (
          <ConfirmModal
            message="Διαγραφή αυτού του άρθρου; Η ενέργεια δεν αναιρείται."
            onConfirm={() => deleteArticle(deleteId)}
            onCancel={() => setDeleteId(null)}
          />
        )}
      </AdminLayout>
    </>
  );
}
