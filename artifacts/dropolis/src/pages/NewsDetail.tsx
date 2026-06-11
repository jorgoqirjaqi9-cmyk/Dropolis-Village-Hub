import React from "react";
import { useRoute, Link } from "wouter";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { useGetArticle, getGetArticleQueryKey, useListArticles, getListArticlesQueryKey } from "@workspace/api-client-react";
import { SEO } from "@/components/SEO";
import { AdSenseSlot } from "@/components/AdSenseSlot";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, User, MapPin, Tag, BookOpen } from "lucide-react";

export default function NewsDetail() {
  const [, params] = useRoute("/news/:id");
  const id = params?.id ? parseInt(params.id, 10) : 0;
  
  const { data: article, isLoading, isError } = useGetArticle(id, { 
    query: { enabled: !!id, queryKey: getGetArticleQueryKey(id) } 
  });
  
  const { data: relatedArticles } = useListArticles(
    { category: article?.category, limit: 4 },
    { query: { enabled: !!article?.category, queryKey: getListArticlesQueryKey({ category: article?.category, limit: 4 }) } }
  );

  const displayRelated = relatedArticles?.filter(a => a.id !== id).slice(0, 3);

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8 text-center py-24">
        <h2 className="text-2xl font-bold text-destructive mb-2">Σφάλμα</h2>
        <p className="text-muted-foreground">Το άρθρο δεν βρέθηκε ή διεγράφη.</p>
        <Link href="/news" className="text-primary hover:underline mt-4 inline-block">Επιστροφή στις ειδήσεις</Link>
      </div>
    );
  }

  if (isLoading || !article) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <Skeleton className="h-8 w-3/4 rounded" />
        <Skeleton className="h-4 w-1/4 rounded" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-5/6 rounded" />
        </div>
      </div>
    );
  }

  // Reading time estimate
  const wordCount = article.content.split(/\s+/).filter(Boolean).length;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 180));

  // Split content by paragraphs to insert ad after 2nd paragraph
  const paragraphs = article.content.split('\n\n').filter(p => p.trim() !== '');

  const BASE = typeof window !== "undefined" ? window.location.origin : "https://dropolis.net";
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "@id": `${BASE}/news/${article.id}`,
    headline: article.title,
    description: article.excerpt || "",
    image: article.imageUrl ? [article.imageUrl] : [],
    datePublished: article.createdAt,
    dateModified: article.updatedAt ?? article.createdAt,
    url: `${BASE}/news/${article.id}`,
    author: {
      "@type": "Person",
      name: article.author || "Dropolis",
    },
    publisher: {
      "@type": "Organization",
      "@id": `${BASE}/#organization`,
      name: "Δρόπολη (Dropolis)",
      logo: {
        "@type": "ImageObject",
        url: `${BASE}/favicon.svg`,
        width: 512,
        height: 512,
      },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${BASE}/news/${article.id}` },
    isPartOf: { "@id": `${BASE}/#website` },
    articleSection: article.category,
    inLanguage: "el",
    keywords: article.tags || article.category,
  };

  return (
    <article className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-12">
      <SEO
        title={article.title}
        description={article.excerpt || `Διαβάστε το άρθρο: ${article.title}`}
        image={article.imageUrl || undefined}
        type="article"
        article={{
          author: article.author || undefined,
          publishedTime: article.createdAt,
          modifiedTime: article.createdAt,
          section: article.category,
        }}
        breadcrumbs={[
          { name: "Ειδήσεις", url: "/news" },
          { name: article.title, url: `/news/${article.id}` },
        ]}
        jsonLd={articleSchema}
      />
      
      {/* Main Content */}
      <div className="lg:col-span-3 space-y-8">
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/news?category=${article.category}`}>
              <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-secondary hover:text-secondary-foreground transition-colors">
                {article.category}
              </span>
            </Link>
            {article.villageName && (
              <Link href={`/villages?search=${article.villageName}`}>
                <span className="bg-accent/10 text-accent px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 cursor-pointer hover:bg-accent/20 transition-colors">
                  <MapPin className="w-3 h-3" /> {article.villageName}
                </span>
              </Link>
            )}
          </div>
          
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground leading-tight">
            {article.title}
          </h1>
          
          {article.excerpt && (
            <p className="text-xl text-muted-foreground font-serif italic border-l-4 border-secondary pl-4">
              {article.excerpt}
            </p>
          )}
          
          <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-muted-foreground border-y border-border py-3">
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              <span className="font-medium text-foreground">{article.author}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <time dateTime={article.createdAt}>
                {format(new Date(article.createdAt), "d MMMM yyyy, HH:mm", { locale: el })}
              </time>
            </div>
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              <span>{readingMinutes} λεπτά ανάγνωση</span>
            </div>
            {article.viewCount !== undefined && (
              <div className="text-xs ml-auto">
                {article.viewCount} προβολές
              </div>
            )}
          </div>
        </header>

        {article.imageUrl && (
          <figure className="rounded-xl overflow-hidden shadow-lg bg-card">
            <img 
              src={article.imageUrl} 
              alt={article.title} 
              className="w-full h-auto object-cover max-h-[600px]"
            />
          </figure>
        )}

        <div className="prose prose-lg dark:prose-invert max-w-none font-sans text-foreground/90 leading-relaxed">
          {paragraphs.map((paragraph, idx) => (
            <React.Fragment key={idx}>
              <p className="mb-6 whitespace-pre-wrap">{paragraph}</p>
              {idx === 1 && (
                <div className="my-8">
                  <AdSenseSlot adSlot="7994234180" adFormat="horizontal" className="hidden sm:block rounded shadow-sm" />
                  <AdSenseSlot adSlot="7994234180" adFormat="rectangle" className="sm:hidden rounded shadow-sm" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {article.tags && (
          <div className="pt-6 border-t border-border flex flex-wrap items-center gap-2">
            <Tag className="w-4 h-4 text-muted-foreground" />
            {article.tags.split(',').map(tag => (
              <span key={tag.trim()} className="bg-muted text-muted-foreground px-2 py-1 rounded text-xs">
                {tag.trim()}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Sidebar */}
      <aside className="lg:col-span-1 space-y-8">
        <div className="sticky top-24 space-y-8">
          <AdSenseSlot adSlot="7994234180" adFormat="rectangle" className="rounded-lg shadow-sm" />
          
          {displayRelated && displayRelated.length > 0 && (
            <div className="bg-card rounded-xl p-5 shadow-sm border border-card-border">
              <h3 className="font-serif text-lg font-bold mb-4 border-b border-border pb-2">Σχετικά Άρθρα</h3>
              <div className="space-y-4">
                {displayRelated.map(related => (
                  <Link key={related.id} href={`/news/${related.id}`} className="group block">
                    <div className="flex gap-3">
                      {related.imageUrl && (
                        <div className="w-20 h-20 rounded-md overflow-hidden shrink-0">
                          <img src={related.imageUrl} alt={related.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-sm line-clamp-2 group-hover:text-primary transition-colors">{related.title}</h4>
                        <span className="text-xs text-muted-foreground block mt-1">
                          {format(new Date(related.createdAt), "d MMM yyyy", { locale: el })}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          
          <AdSenseSlot adSlot="7994234180" adFormat="vertical" className="rounded-lg shadow-sm hidden lg:block" />
        </div>
      </aside>
    </article>
  );
}
