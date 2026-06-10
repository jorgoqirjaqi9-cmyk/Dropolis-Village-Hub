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
    <div className="space-y-8">
      <SEO title="Ειδήσεις" description="Όλες οι ειδήσεις και τα νέα από τη Δρόπολη και τα χωριά της." />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-serif font-bold text-foreground border-b-2 border-primary inline-block pb-2">Ειδήσεις</h1>
        
        <div className="flex flex-wrap gap-2">
          <select 
            className="bg-card border-card-border text-sm rounded-md px-3 py-2 shadow-sm focus:ring-primary focus:border-primary"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Όλες οι Κατηγορίες</option>
            {categories?.map(c => (
              <option key={c.name} value={c.name}>{c.name} ({c.count})</option>
            ))}
          </select>
          
          <select 
            className="bg-card border-card-border text-sm rounded-md px-3 py-2 shadow-sm focus:ring-primary focus:border-primary"
            value={village}
            onChange={(e) => setVillage(e.target.value)}
          >
            <option value="">Όλα τα Χωριά</option>
            {villages?.map(v => (
              <option key={v.id} value={v.nameEl}>{v.nameEl}</option>
            ))}
          </select>
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
              <Link href={`/news/${article.id}`} className="group flex flex-col md:flex-row gap-6 bg-card rounded-xl p-6 shadow-sm border border-card-border hover:shadow-md transition-all">
                <div className="md:w-1/3 lg:w-1/4 aspect-video rounded-lg overflow-hidden shrink-0">
                  <img 
                    src={article.imageUrl || "https://placehold.co/400x300/2a4365/ffffff?text=Dropolis"} 
                    alt={article.title}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
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
                  <AdSenseSlot adSlot="1234567890" adFormat="horizontal" className="hidden md:block rounded-lg shadow-sm" />
                  <AdSenseSlot adSlot="0987654321" adFormat="rectangle" className="md:hidden rounded-lg shadow-sm" />
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
