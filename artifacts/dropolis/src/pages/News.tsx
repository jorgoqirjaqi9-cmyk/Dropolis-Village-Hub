import React, { useState } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { useListArticles, useListCategories, useListVillages } from "@workspace/api-client-react";
import { SEO } from "@/components/SEO";
import { AdSenseSlot } from "@/components/AdSenseSlot";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function News() {
  const [category, setCategory] = useState<string>("");
  const [village, setVillage] = useState<string>("");
  
  const { data: categories } = useListCategories();
  const { data: villages } = useListVillages();
  
  const { data: articles, isLoading } = useListArticles({ 
    category: category || undefined,
    village: village || undefined,
    limit: 50 // simplistic pagination for now
  });

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
          url: "https://dropolis.replit.app/news",
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
            <p className="text-primary-foreground/70">Τελευταία νέα και ρεπορτάζ από τη Δρόπολη.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              className="bg-white/15 border border-white/20 text-primary-foreground text-sm rounded-xl px-4 py-2.5 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-secondary"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="" className="text-foreground bg-background">Όλες οι Κατηγορίες</option>
              {categories?.map(c => (
                <option key={c.name} value={c.name} className="text-foreground bg-background">{c.name} ({c.count})</option>
              ))}
            </select>
            <select
              className="bg-white/15 border border-white/20 text-primary-foreground text-sm rounded-xl px-4 py-2.5 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-secondary"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
            >
              <option value="" className="text-foreground bg-background">Όλα τα Χωριά</option>
              {villages?.map(v => (
                <option key={v.id} value={v.nameEl} className="text-foreground bg-background">{v.nameEl}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))
        ) : articles && articles.length > 0 ? (
          articles.map((article, index) => (
            <React.Fragment key={article.id}>
              <Link href={`/news/${article.id}`} className="group flex flex-col md:flex-row gap-6 glass-card rounded-2xl p-6 hover:shadow-xl transition-all duration-300">
                <div className="md:w-1/3 lg:w-1/4 aspect-video rounded-lg overflow-hidden shrink-0">
                  <img 
                    src={article.imageUrl || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&q=70"} 
                    alt={article.title}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    onError={e => { (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&q=70"; }}
                  />
                </div>
                <div className="flex flex-col flex-grow">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">{article.category}</span>
                    {article.villageName && (
                      <span className="bg-accent/10 text-accent px-2 py-1 rounded text-xs font-medium">{article.villageName}</span>
                    )}
                    <span className="text-muted-foreground text-xs ml-auto">
                      {format(new Date(article.createdAt), "d MMMM yyyy", { locale: el })}
                    </span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-serif font-bold mb-3 group-hover:text-primary transition-colors">{article.title}</h3>
                  <p className="text-muted-foreground leading-relaxed line-clamp-3 mb-4">{article.excerpt || article.content.substring(0, 150) + "..."}</p>
                  
                  <div className="mt-auto flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground/80">{article.author}</span>
                    <span className="text-primary font-medium group-hover:text-secondary transition-colors">Διαβάστε περισσότερα &rarr;</span>
                  </div>
                </div>
              </Link>
              
              {/* Inject AdSense every 5 articles */}
              {(index + 1) % 5 === 0 && index !== articles.length - 1 && (
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
            <Button variant="outline" className="mt-4" onClick={() => { setCategory(""); setVillage(""); }}>
              Καθαρισμός Φίλτρων
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
