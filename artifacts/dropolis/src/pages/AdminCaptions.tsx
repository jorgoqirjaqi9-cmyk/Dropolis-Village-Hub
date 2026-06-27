import { useState, useEffect, useCallback } from "react";
import { SEO } from "@/components/SEO";
import {
  Share2, RefreshCw, Copy, Check, AlertCircle, Sparkles,
  Facebook, Search,
} from "lucide-react";
import { AdminLayout, AdminAuthGate, useAdminAuth, adminFetch } from "@/components/AdminLayout";

type Article = { id: number; title: string; category: string; published: boolean; createdAt: string };
type SocialPost = { articleId: number; articleTitle: string; fbPost: string; shortCaption: string; hashtags: string[] };

export default function AdminCaptions() {
  const { token, authenticated, login, logout } = useAdminAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<SocialPost | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchArticles = useCallback(async (t: string) => {
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/articles?limit=50&published=true", t);
      if (!res.ok) throw new Error();
      setArticles(await res.json());
    } catch { setError("Αποτυχία φόρτωσης άρθρων"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (authenticated && token) fetchArticles(token); }, [authenticated, token]);

  async function generate(articleId: number) {
    setGenerating(true); setError(null); setResult(null);
    try {
      const res = await adminFetch(`/api/social/publish/${articleId}`, token, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      setResult(await res.json());
    } catch (e) { setError(e instanceof Error ? e.message : "Αποτυχία δημιουργίας"); }
    finally { setGenerating(false); }
  }

  async function copyText(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  if (!authenticated) return <AdminAuthGate onAuth={login} />;

  const filtered = articles.filter(a =>
    !search || a.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <SEO title="Social Captions — Admin" noindex />
      <AdminLayout token={token} onLogout={logout} title="Social Caption Generator">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">AI Caption Generator (Gemini)</p>
              <p className="text-xs text-muted-foreground mt-1">
                Επιλέξτε ένα δημοσιευμένο άρθρο και το AI θα δημιουργήσει περιεχόμενο για Facebook και Instagram.
              </p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Article picker */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground text-sm">Επιλογή Άρθρου</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Αναζήτηση..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="bg-background rounded-xl border border-border divide-y divide-border max-h-[480px] overflow-y-auto">
                {loading && (
                  <div className="flex items-center justify-center py-10">
                    <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                )}
                {filtered.map(a => (
                  <button key={a.id} onClick={() => generate(a.id)} disabled={generating}
                    className={`w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors disabled:opacity-60 ${result?.articleId === a.id ? "bg-primary/5 border-l-2 border-primary" : ""}`}>
                    <p className="text-sm font-medium text-foreground line-clamp-2">{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{a.category} · #{a.id}</p>
                  </button>
                ))}
                {!loading && filtered.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">Δεν βρέθηκαν άρθρα</p>
                )}
              </div>
            </div>

            {/* Result panel */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground text-sm">Αποτέλεσμα</h3>

              {generating && (
                <div className="bg-background rounded-xl border border-border p-8 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                  </div>
                  <p className="text-sm text-muted-foreground">Δημιουργία με AI...</p>
                </div>
              )}

              {result && !generating && (
                <div className="space-y-3">
                  <div className="bg-background rounded-xl border border-border overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Facebook className="w-4 h-4 text-blue-500" />
                        Facebook Post
                      </div>
                      <button onClick={() => copyText(result.fbPost, "fb")}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted">
                        {copied === "fb" ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied === "fb" ? "Αντιγράφηκε!" : "Αντιγραφή"}
                      </button>
                    </div>
                    <pre className="p-4 text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">
                      {result.fbPost}
                    </pre>
                  </div>

                  <div className="bg-background rounded-xl border border-border overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Share2 className="w-4 h-4 text-pink-500" />
                        Instagram Caption
                      </div>
                      <button onClick={() => copyText(result.shortCaption, "ig")}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted">
                        {copied === "ig" ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied === "ig" ? "Αντιγράφηκε!" : "Αντιγραφή"}
                      </button>
                    </div>
                    <p className="p-4 text-xs text-foreground leading-relaxed">{result.shortCaption}</p>
                  </div>

                  <div className="bg-background rounded-xl border border-border overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                      <span className="text-sm font-medium text-foreground"># Hashtags</span>
                      <button onClick={() => copyText(result.hashtags.join(" "), "ht")}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted">
                        {copied === "ht" ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied === "ht" ? "Αντιγράφηκε!" : "Αντιγραφή"}
                      </button>
                    </div>
                    <div className="p-4 flex flex-wrap gap-1.5">
                      {result.hashtags.map((h, i) => (
                        <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-lg cursor-pointer hover:bg-primary/20 transition-colors"
                          onClick={() => copyText(h, `h${i}`)}>
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    Άρθρο: <strong>{result.articleTitle}</strong>
                  </p>
                </div>
              )}

              {!result && !generating && (
                <div className="bg-background rounded-xl border border-border border-dashed p-10 flex flex-col items-center gap-2 text-center">
                  <Share2 className="w-8 h-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">Επιλέξτε ένα άρθρο από αριστερά για να δημιουργηθεί το social content</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </AdminLayout>
    </>
  );
}
