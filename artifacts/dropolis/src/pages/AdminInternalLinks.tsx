import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { SEO } from "@/components/SEO";
import {
  Link2, ExternalLink, Copy, Check, RefreshCw, ChevronDown, ChevronUp,
  AlertCircle, Loader2, ArrowRight,
} from "lucide-react";
import { AdminLayout, AdminAuthGate, useAdminAuth, adminFetch } from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ArticleRef = {
  id: number;
  title: string;
  slug: string | null;
  url: string;
};

type Suggestion = {
  score: number;
  source: ArticleRef;
  target: ArticleRef;
  reasons: string[];
  anchorText: string;
  context: string | null;
};

type ApiResponse = {
  total: number;
  suggestions: Suggestion[];
};

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 10 ? "bg-green-600 text-white"
    : score >= 7 ? "bg-blue-600 text-white"
    : score >= 5 ? "bg-yellow-500 text-white"
    : "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center justify-center rounded-full text-xs font-bold px-2 py-0.5 min-w-[2rem] ${color}`}>
      {score}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={handleCopy}
      title="Αντιγραφή anchor text"
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

function SuggestionRow({ s }: { s: Suggestion }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-border rounded-lg p-4 bg-background hover:border-primary/40 transition-colors">
      <div className="flex items-start gap-3">
        <ScoreBadge score={s.score} />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{s.source.title}</p>
              <p className="text-xs text-muted-foreground">Άρθρο πηγή</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-primary truncate">{s.target.title}</p>
              <p className="text-xs text-muted-foreground">Σύνδεσμος-στόχος</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-2">
            {s.reasons.map((r, i) => (
              <Badge key={i} variant="secondary" className="text-xs">{r}</Badge>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-muted rounded px-2 py-1 text-xs font-mono">
              <span className="text-muted-foreground">anchor:</span>
              <span className="text-foreground font-medium truncate max-w-[200px]">{s.anchorText}</span>
              <CopyButton text={s.anchorText} />
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <a
                href={`https://dropolis.net${s.source.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
              >
                Άρθρο <ExternalLink className="w-3 h-3" />
              </a>
              <Link
                href={`/admin/articles?edit=${s.source.id}`}
                className="text-xs text-primary hover:underline"
              >
                Επεξεργασία
              </Link>
              {s.context && (
                <button
                  onClick={() => setExpanded((x) => !x)}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  Πλαίσιο
                  {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
            </div>
          </div>

          {expanded && s.context && (
            <div className="mt-2 p-2 bg-muted/50 rounded text-xs text-muted-foreground border-l-2 border-primary/40 italic">
              "…{s.context}…"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InternalLinksContent({ token }: { token: string }) {
  const { logout } = useAdminAuth();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [minScore, setMinScore] = useState("3");
  const [limit, setLimit] = useState("100");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ minScore, limit });
      const res = await adminFetch(`/api/admin/internal-links?${params}`, token);
      if (res.status === 401) { logout(); return; }
      if (!res.ok) throw new Error("Αποτυχία φόρτωσης");
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Σφάλμα");
    } finally {
      setLoading(false);
    }
  }, [token, minScore, limit, logout]);

  useEffect(() => { load(); }, [load]);

  const filtered = (data?.suggestions ?? []).filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.source.title.toLowerCase().includes(q) ||
      s.target.title.toLowerCase().includes(q) ||
      s.reasons.some((r) => r.toLowerCase().includes(q))
    );
  });

  return (
    <AdminLayout token={token} onLogout={logout} title="Internal Linking">
      <SEO
        title="Internal Linking — Admin"
        description="Προτάσεις εσωτερικής διασύνδεσης άρθρων"
        noindex
      />

      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Link2 className="w-6 h-6 text-primary" />
            Internal Linking
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Αυτόματες προτάσεις εσωτερικής διασύνδεσης — το #1 εργαλείο για Google ranking.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground font-medium">Ελάχιστο Score</label>
            <Select value={minScore} onValueChange={setMinScore}>
              <SelectTrigger className="w-28 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">≥ 2</SelectItem>
                <SelectItem value="3">≥ 3</SelectItem>
                <SelectItem value="5">≥ 5</SelectItem>
                <SelectItem value="7">≥ 7</SelectItem>
                <SelectItem value="10">≥ 10</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground font-medium">Μέγιστο αριθμός</label>
            <Select value={limit} onValueChange={setLimit}>
              <SelectTrigger className="w-28 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={load} disabled={loading} size="sm" variant="outline" className="h-8">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span className="ml-1.5">Ανανέωση</span>
          </Button>

          <div className="flex-1 min-w-48">
            <Input
              placeholder="Φίλτρο τίτλου ή χωριού..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm p-3 bg-destructive/10 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Ανάλυση άρθρων…</span>
          </div>
        )}

        {!loading && data && (
          <>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                <strong className="text-foreground">{filtered.length}</strong> προτάσεις
                {search && ` (φίλτρο: "${search}")`}
                {data.total > filtered.length && ` από ${data.total} σύνολο`}
              </span>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded-full bg-green-600" /> ≥10 Πολύ δυνατό
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded-full bg-blue-600" /> ≥7 Δυνατό
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded-full bg-yellow-500" /> ≥5 Μέτριο
                </span>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Link2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>Δεν βρέθηκαν προτάσεις για τα επιλεγμένα κριτήρια.</p>
                <p className="text-xs mt-1">Δοκίμασε μικρότερο ελάχιστο score.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((s, i) => (
                  <SuggestionRow key={`${s.source.id}-${s.target.id}-${i}`} s={s} />
                ))}
              </div>
            )}
          </>
        )}

        <div className="border border-border rounded-lg p-4 bg-muted/20 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground mb-2">Πώς λειτουργεί το Score</p>
          <p>• <strong>+5</strong> — Ίδιο χωριό (ισχυρότερος δεσμός τοπικής συνάφειας)</p>
          <p>• <strong>+3</strong> — Αναφορά στο κείμενο (οι λέξεις του στόχου υπάρχουν στο κείμενο πηγή)</p>
          <p>• <strong>+2</strong> — Ίδια κατηγορία ή αναφορά χωριού στόχου</p>
          <p>• <strong>+1-4</strong> — Κοινές λέξεις-κλειδιά στον τίτλο</p>
          <p className="mt-2">Τα links που <em>υπάρχουν ήδη</em> στο κείμενο εξαιρούνται αυτόματα.</p>
        </div>
      </div>
    </AdminLayout>
  );
}

export default function AdminInternalLinks() {
  const { token, authenticated, login, logout } = useAdminAuth();
  if (!authenticated) {
    return <AdminAuthGate onAuth={login} />;
  }
  return <InternalLinksContent token={token} />;
}
