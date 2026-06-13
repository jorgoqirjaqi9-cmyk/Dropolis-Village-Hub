import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { useListArticles, useListCategories, useListVillages } from "@workspace/api-client-react";
import { SEO } from "@/components/SEO";
import { AdSenseSlot } from "@/components/AdSenseSlot";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Send, Users } from "lucide-react";
import { VoteButtons } from "@/components/VoteButtons";

const COMMUNITY_CATEGORY = "Ειδήσεις Κοινότητας";

const PAGE_SIZE = 50;

function buildNewsUrl(params: { category?: string; village?: string; page?: number }) {
  const qs = new URLSearchParams();
  if (params.category) qs.set("category", params.category);
  if (params.village) qs.set("village", params.village);
  if (params.page && params.page > 1) qs.set("page", String(params.page));
  const str = qs.toString();
  return str ? `/news?${str}` : "/news";
}

export default function News() {
  const [category, setCategory] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("category") ?? "";
    }
    return "";
  });
  const [village, setVillage] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("village") ?? "";
    }
    return "";
  });
  const [page, setPage] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const p = parseInt(new URLSearchParams(window.location.search).get("page") ?? "1", 10);
      return isNaN(p) || p < 1 ? 1 : p;
    }
    return 1;
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlCategory = params.get("category") ?? "";
    const urlVillage = params.get("village") ?? "";
    const urlPage = parseInt(params.get("page") ?? "1", 10);
    if (urlCategory) setCategory(urlCategory);
    if (urlVillage) setVillage(urlVillage);
    if (!isNaN(urlPage) && urlPage >= 1) setPage(urlPage);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (village) params.set("village", village);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", newUrl);
  }, [category, village, page]);

  const { data: categories } = useListCategories();
  const { data: villages } = useListVillages();

  const offset = (page - 1) * PAGE_SIZE;

  const { data: articles, isLoading } = useListArticles({
    category: category || undefined,
    village: village || undefined,
    limit: PAGE_SIZE + 1,
    offset,
  });

  const hasNextPage = articles !== undefined && articles.length > PAGE_SIZE;
  const displayArticles = articles ? articles.slice(0, PAGE_SIZE) : [];

  function handleCategoryChange(val: string) {
    setCategory(val);
    setPage(1);
  }

  function handleVillageChange(val: string) {
    setVillage(val);
    setPage(1);
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <SEO
        title="Ειδήσεις"
        description="Τελευταία νέα, ρεπορτάζ και ειδήσεις από τη Δρόπολη και τα χωριά της Βόρειας Ηπείρου."
        breadcrumbs={[{ name: "Ειδήσεις", url: "/news" }]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Ειδήσεις — Δρόπολη",
          description: "Τελευταία νέα και ρεπορτάζ από τη Δρόπολη.",
          url: "https://dropolis.net/news",
          inLanguage: "el",
        }}
      />

      {/* Page header */}
      <div className="relative rounded-2xl overflow-hidden bg-primary text-primary-foreground p-8 md:p-12 shadow-lg">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 70% 50%, white 0%, transparent 60%)" }} />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-2">Ειδήσεις</h1>
            <p className="text-primary-foreground/70">Τελευταία νέα και ρεπορτάζ.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/submit-news"
              className="inline-flex items-center gap-2 rounded-xl bg-secondary text-secondary-foreground px-4 py-2.5 text-sm font-semibold hover:bg-secondary/90 transition-colors"
            >
              <Send className="w-4 h-4" />
              Στείλτε είδηση
            </Link>
            <select
              className="bg-white/15 border border-white/20 text-primary-foreground text-sm rounded-xl px-4 py-2.5 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-secondary"
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              <option value="" className="text-foreground bg-background">Όλες οι Κατηγορίες</option>
              {categories?.map(c => (
                <option key={c.name} value={c.name} className="text-foreground bg-background">{c.name} ({c.count})</option>
              ))}
            </select>
            <select
              className="bg-white/15 border border-white/20 text-primary-foreground text-sm rounded-xl px-4 py-2.5 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-secondary"
              value={village}
              onChange={(e) => handleVillageChange(e.target.value)}
            >
              <option value="" className="text-foreground bg-background">Όλα τα Χωριά</option>
              {villages?.map(v => (
                <option key={v.id} value={v.nameEl} className="text-foreground bg-background">{v.nameEl}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Community filter shortcut pill */}
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={() => handleCategoryChange(category === COMMUNITY_CATEGORY ? "" : COMMUNITY_CATEGORY)}
          className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
            category === COMMUNITY_CATEGORY
              ? "bg-secondary text-secondary-foreground border-secondary shadow-sm"
              : "bg-secondary/10 text-secondary border-secondary/30 hover:bg-secondary/20"
          }`}
        >
          <Users className="w-3 h-3" />
          Κοινότητα
        </button>
        {category === COMMUNITY_CATEGORY && (
          <button
            onClick={() => handleCategoryChange("")}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
          >
            Εμφάνιση όλων
          </button>
        )}
      </div>

      {/* Village filter links — crawlable anchor links for each village archive */}
      {villages && villages.length > 0 && !village && !category && (
        <nav aria-label="Αρχεία ανά χωριό" className="flex flex-wrap gap-2">
          {villages.map(v => (
            <Link
              key={v.id}
              href={`/news?village=${encodeURIComponent(v.nameEl)}`}
              className="bg-accent/10 text-accent hover:bg-accent/20 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
            >
              {v.nameEl}
            </Link>
          ))}
        </nav>
      )}

      <div className="space-y-6">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))
        ) : displayArticles.length > 0 ? (
          displayArticles.map((article, index) => (
            <React.Fragment key={article.id}>
              {/* Card as div to allow village badge as a real nested link */}
              <div className="group flex flex-col md:flex-row gap-6 glass-card rounded-2xl p-6 hover:shadow-xl transition-all duration-300">
                <Link href={`/news/${article.id}`} className="md:w-1/3 lg:w-1/4 aspect-video rounded-lg overflow-hidden shrink-0 block">
                  <img
                    src={article.imageUrl || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&q=70"}
                    alt={article.title}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    onError={e => { (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&q=70"; }}
                  />
                </Link>
                <div className="flex flex-col flex-grow">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Link href={buildNewsUrl({ category: article.category, page: 1 })}>
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-bold uppercase tracking-wider hover:bg-primary/20 transition-colors">{article.category}</span>
                    </Link>
                    {article.category === COMMUNITY_CATEGORY && (
                      <span className="inline-flex items-center gap-1 bg-secondary/15 text-secondary px-2 py-1 rounded text-xs font-semibold border border-secondary/25">
                        <Users className="w-3 h-3" />
                        Κοινότητα
                      </span>
                    )}
                    {article.villageName && (
                      <Link href={`/news?village=${encodeURIComponent(article.villageName)}`}>
                        <span className="bg-accent/10 text-accent px-2 py-1 rounded text-xs font-medium hover:bg-accent/20 transition-colors">{article.villageName}</span>
                      </Link>
                    )}
                    <span className="text-muted-foreground text-xs ml-auto">
                      {format(new Date(article.createdAt), "d MMMM yyyy", { locale: el })}
                    </span>
                  </div>
                  <Link href={`/news/${article.id}`} className="flex flex-col flex-grow">
                    <h3 className="text-xl md:text-2xl font-serif font-bold mb-3 group-hover:text-primary transition-colors">{article.title}</h3>
                    <p className="text-muted-foreground leading-relaxed line-clamp-3 mb-4">{article.excerpt || article.content.substring(0, 150) + "..."}</p>
                    <div className="mt-auto flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground/80">{article.author}</span>
                      <span className="text-primary font-medium group-hover:text-secondary transition-colors">Διαβάστε περισσότερα &rarr;</span>
                    </div>
                  </Link>
                  {article.category === COMMUNITY_CATEGORY && (
                    <div className="pt-3 mt-2 border-t border-border/40">
                      <VoteButtons
                        contentType="news"
                        contentId={article.id}
                        likesCount={article.likesCount ?? 0}
                        dislikesCount={article.dislikesCount ?? 0}
                        compact
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Inject AdSense every 5 articles */}
              {(index + 1) % 5 === 0 && index !== displayArticles.length - 1 && (
                <div className="py-4">
                  <AdSenseSlot adSlot="7994234180" adFormat="horizontal" className="hidden md:block rounded-lg shadow-sm" />
                  <AdSenseSlot adSlot="7994234180" adFormat="rectangle" className="md:hidden rounded-lg shadow-sm" />
                </div>
              )}
            </React.Fragment>
          ))
        ) : (
          <div className="text-center py-12 bg-card rounded-xl border border-card-border border-dashed">
            <p className="text-muted-foreground text-lg">Δεν βρέθηκαν ειδήσεις με αυτά τα κριτήρια.</p>
            <Button variant="outline" className="mt-4" onClick={() => { setCategory(""); setVillage(""); setPage(1); }}>
              Καθαρισμός Φίλτρων
            </Button>
          </div>
        )}
      </div>

      {/* Crawlable pagination */}
      {(page > 1 || hasNextPage) && (
        <nav aria-label="Σελιδοποίηση αρχείου ειδήσεων" className="flex items-center justify-center gap-4 pt-4">
          {page > 1 ? (
            <Link
              href={buildNewsUrl({ category, village, page: page - 1 })}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-sm font-medium"
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
              Προηγούμενη σελίδα
            </Link>
          ) : (
            <span className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium opacity-40 cursor-default">
              <ChevronLeft className="w-4 h-4" />
              Προηγούμενη σελίδα
            </span>
          )}

          <span className="text-sm text-muted-foreground font-medium">Σελίδα {page}</span>

          {hasNextPage ? (
            <Link
              href={buildNewsUrl({ category, village, page: page + 1 })}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-sm font-medium"
              onClick={() => setPage(p => p + 1)}
            >
              Επόμενη σελίδα
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <span className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium opacity-40 cursor-default">
              Επόμενη σελίδα
              <ChevronRight className="w-4 h-4" />
            </span>
          )}
        </nav>
      )}
    </div>
  );
}
