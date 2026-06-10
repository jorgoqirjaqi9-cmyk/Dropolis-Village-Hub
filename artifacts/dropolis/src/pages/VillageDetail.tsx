import React from "react";
import { useRoute, Link } from "wouter";
import { useGetVillage, getGetVillageQueryKey, useListArticles, getListArticlesQueryKey, useListPhotos, getListPhotosQueryKey } from "@workspace/api-client-react";
import { SEO } from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Mountain, Map, ArrowLeft, Image as ImageIcon, Newspaper, MapPin } from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";

export default function VillageDetail() {
  const [, params] = useRoute("/villages/:id");
  const id = params?.id ? parseInt(params.id, 10) : 0;
  
  const { data: village, isLoading, isError } = useGetVillage(id, { 
    query: { enabled: !!id, queryKey: getGetVillageQueryKey(id) } 
  });
  
  const { data: news } = useListArticles(
    { village: village?.nameEl, limit: 3 },
    { query: { enabled: !!village?.nameEl, queryKey: getListArticlesQueryKey({ village: village?.nameEl, limit: 3 }) } }
  );
  const { data: photos } = useListPhotos(
    { village_id: id, limit: 6 },
    { query: { enabled: !!id, queryKey: getListPhotosQueryKey({ village_id: id, limit: 6 }) } }
  );

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8 text-center py-24">
        <h2 className="text-2xl font-bold text-destructive mb-2">Σφάλμα</h2>
        <p className="text-muted-foreground">Το χωριό δεν βρέθηκε.</p>
        <Link href="/villages" className="text-primary hover:underline mt-4 inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Επιστροφή στα χωριά
        </Link>
      </div>
    );
  }

  if (isLoading || !village) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        <Skeleton className="h-[400px] w-full rounded-2xl" />
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      <SEO title={`${village.nameEl} - Δρόπολη`} description={village.description} />
      
      <Link href="/villages" className="inline-flex items-center gap-2 text-primary hover:text-secondary text-sm font-medium transition-colors mb-4">
        <ArrowLeft className="w-4 h-4" /> Πίσω στα χωριά
      </Link>

      <div className="relative rounded-3xl overflow-hidden bg-card shadow-lg border border-card-border">
        {village.imageUrl && (
          <div className="aspect-[21/9] w-full relative">
            <img 
              src={village.imageUrl} 
              alt={village.nameEl} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
          </div>
        )}
        <div className={`p-8 md:p-12 ${village.imageUrl ? 'absolute bottom-0 left-0 w-full text-white' : ''}`}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className={`text-xs font-bold uppercase tracking-wider mb-2 block ${village.imageUrl ? 'text-secondary' : 'text-primary'}`}>
                {village.name} (Αλβανικά)
              </span>
              <h1 className="text-4xl md:text-6xl font-serif font-bold leading-tight">
                {village.nameEl}
              </h1>
            </div>
            
            <div className={`flex flex-wrap gap-4 ${village.imageUrl ? 'text-white/90' : 'text-muted-foreground'}`}>
              {village.population !== null && (
                <div className="flex items-center gap-2 bg-background/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/10">
                  <Users className="w-5 h-5 text-secondary" />
                  <div className="flex flex-col">
                    <span className="text-xs uppercase opacity-70">Πληθυσμός</span>
                    <span className="font-bold text-lg leading-none">{village.population}</span>
                  </div>
                </div>
              )}
              {village.elevation !== null && (
                <div className="flex items-center gap-2 bg-background/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/10">
                  <Mountain className="w-5 h-5 text-secondary" />
                  <div className="flex flex-col">
                    <span className="text-xs uppercase opacity-70">Υψόμετρο</span>
                    <span className="font-bold text-lg leading-none">{village.elevation}μ</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-10">
          <section>
            <h2 className="text-2xl font-serif font-bold text-foreground border-b-2 border-primary inline-block pb-2 mb-6">Ιστορία & Πληροφορίες</h2>
            <div className="prose prose-lg dark:prose-invert text-foreground/90 font-sans leading-relaxed whitespace-pre-wrap">
              {village.description}
            </div>
          </section>

          {photos && photos.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-6">
                <ImageIcon className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-serif font-bold text-foreground">Φωτογραφίες</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map(photo => (
                  <div key={photo.id} className="aspect-square rounded-lg overflow-hidden bg-muted relative group cursor-pointer shadow-sm">
                    <img 
                      src={photo.thumbnailUrl || photo.url} 
                      alt={photo.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                      <span className="text-white text-sm font-medium line-clamp-1">{photo.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-8">
          <div className="bg-card rounded-xl p-6 shadow-sm border border-card-border">
            <div className="flex items-center gap-2 mb-6">
              <Map className="w-5 h-5 text-primary" />
              <h3 className="font-serif text-xl font-bold">Τοποθεσία</h3>
            </div>
            {village.latitude && village.longitude ? (
              <div className="aspect-square rounded-lg bg-muted flex items-center justify-center border border-border">
                {/* Fallback map if no real map integration */}
                <div className="text-center p-4">
                  <MapPin className="w-8 h-8 text-primary mx-auto mb-2" />
                  <div className="font-mono text-xs text-muted-foreground">
                    {village.latitude.toFixed(4)}, {village.longitude.toFixed(4)}
                  </div>
                  <p className="text-sm mt-2 text-muted-foreground">Προβολή στο χάρτη</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Δεν υπάρχουν διαθέσιμες συντεταγμένες.</p>
            )}
          </div>

          {news && news.length > 0 && (
            <div className="bg-card rounded-xl p-6 shadow-sm border border-card-border">
              <div className="flex items-center gap-2 mb-6">
                <Newspaper className="w-5 h-5 text-primary" />
                <h3 className="font-serif text-xl font-bold">Νέα του Χωριού</h3>
              </div>
              <div className="space-y-4">
                {news.map(article => (
                  <Link key={article.id} href={`/news/${article.id}`} className="group block border-b border-border last:border-0 pb-4 last:pb-0">
                    <h4 className="font-bold text-sm leading-snug group-hover:text-primary transition-colors mb-2 line-clamp-2">{article.title}</h4>
                    <span className="text-xs text-muted-foreground block">
                      {format(new Date(article.createdAt), "d MMMM yyyy", { locale: el })}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
