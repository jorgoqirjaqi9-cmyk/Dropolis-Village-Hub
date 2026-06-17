import React from "react";
import { useRoute, Link } from "wouter";
import { useGetVillage, getGetVillageQueryKey, useListArticles, getListArticlesQueryKey, useListPhotos, getListPhotosQueryKey } from "@workspace/api-client-react";
import { SEO } from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Mountain, Map, ArrowLeft, Image as ImageIcon, Newspaper, MapPin, Camera, Send, Video } from "lucide-react";
import { OptimizedImg } from "@/components/OptimizedImg";
import { VoteButtons } from "@/components/VoteButtons";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { VILLAGE_COORDINATES } from "@/lib/village-coordinates";

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
        <Link href="/villages/" className="text-primary hover:underline mt-4 inline-flex items-center gap-2">
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
      <SEO
        title={`${village.nameEl} - Δρόπολη`}
        description={village.description || `Ανακαλύψτε το χωριό ${village.nameEl} στη Δρόπολη, Βόρεια Ήπειρος.`}
        image={village.imageUrl || undefined}
        breadcrumbs={[
          { name: "Χωριά", url: "/villages" },
          { name: village.nameEl, url: `/villages/${village.id}` },
        ]}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "City",
            "@id": `https://dropolis.net/villages/${village.id}`,
            name: village.nameEl,
            alternateName: village.name,
            description: village.description,
            image: village.imageUrl || undefined,
            url: `https://dropolis.net/villages/${village.id}`,
            inLanguage: "el",
            containedInPlace: {
              "@type": "AdministrativeArea",
              name: "Δήμος Δρόπολης",
              containedInPlace: {
                "@type": "Country",
                name: "Αλβανία",
                sameAs: "https://www.wikidata.org/wiki/Q222",
              },
            },
            ...(village.population ? { population: village.population } : {}),
            ...(village.elevation ? { elevation: `${village.elevation} m` } : {}),
            ...(village.latitude && village.longitude
              ? {
                  geo: {
                    "@type": "GeoCoordinates",
                    latitude: village.latitude,
                    longitude: village.longitude,
                  },
                }
              : {}),
          },
          {
            "@context": "https://schema.org",
            "@type": "TouristAttraction",
            name: village.nameEl,
            description: village.description,
            image: village.imageUrl || undefined,
            url: `https://dropolis.net/villages/${village.id}`,
            touristType: [
              { "@type": "Audience", audienceType: "Cultural tourists" },
              { "@type": "Audience", audienceType: "Greek diaspora" },
            ],
            containedInPlace: {
              "@type": "TouristDestination",
              name: "Δρόπολη",
              url: "https://dropolis.net",
            },
          },
        ]}
      />
      
      <Link href="/villages/" className="inline-flex items-center gap-2 text-primary hover:text-secondary text-sm font-medium transition-colors mb-4">
        <ArrowLeft className="w-4 h-4" /> Πίσω στα χωριά
      </Link>

      <div className="relative rounded-3xl overflow-hidden bg-card shadow-lg border border-card-border">
        {village.imageUrl && (
          <div className="aspect-[21/9] w-full relative bg-muted">
            <OptimizedImg
              src={village.imageUrl}
              alt={village.nameEl}
              priority
              quality={75}
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 80vw, 1200px"
              width={1200}
              height={514}
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

          <section>
              <div className="flex items-center justify-between gap-2 mb-6">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-serif font-bold text-foreground">Φωτογραφίες</h2>
                </div>
                <Link
                  href={`/upload-photo?villageId=${id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground px-3 py-1.5 text-xs font-semibold transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Ανέβασε φωτογραφία
                </Link>
              </div>
              {photos && photos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {photos.map(photo => (
                    <div key={photo.id} className="rounded-xl bg-card shadow-sm border border-border/40 overflow-hidden">
                      {/* Image */}
                      <div className="aspect-square overflow-hidden relative group cursor-pointer">
                        <img
                          src={photo.thumbnailUrl || photo.url}
                          alt={photo.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                          <span className="text-white text-sm font-medium line-clamp-1">{photo.title}</span>
                        </div>
                      </div>
                      {/* Like / dislike */}
                      <div className="px-2 py-1.5 border-t border-border/40">
                        <VoteButtons
                          contentType="photo"
                          contentId={photo.id}
                          likesCount={photo.likes}
                          dislikesCount={photo.dislikes}
                          compact
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-muted/30 py-10 text-center">
                  <Camera className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground mb-4">Δεν υπάρχουν ακόμα φωτογραφίες για αυτό το χωριό.</p>
                  <Link
                    href={`/upload-photo?villageId=${id}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    Ανέβασε φωτογραφία για αυτό το χωριό
                  </Link>
                </div>
              )}
            </section>
        </div>

        <aside className="space-y-8">
          <div className="bg-card rounded-xl p-6 shadow-sm border border-card-border">
            <div className="flex items-center gap-2 mb-6">
              <Map className="w-5 h-5 text-primary" />
              <h3 className="font-serif text-xl font-bold">Τοποθεσία</h3>
            </div>
            {(() => {
              const lat = village.latitude ?? VILLAGE_COORDINATES[village.nameEl]?.lat ?? VILLAGE_COORDINATES[village.name]?.lat;
              const lng = village.longitude ?? VILLAGE_COORDINATES[village.nameEl]?.lng ?? VILLAGE_COORDINATES[village.name]?.lng;
              const delta = 0.04;
              if (lat && lng) {
                const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
                const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
                const osmLink = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=14/${lat}/${lng}`;
                return (
                  <div className="space-y-2">
                    <div className="rounded-lg overflow-hidden border border-border" style={{ height: 260 }}>
                      <iframe
                        title={`Χάρτης ${village.nameEl}`}
                        src={src}
                        className="w-full h-full"
                        style={{ border: 0 }}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <a
                      href={osmLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      <MapPin className="w-3 h-3" />
                      {lat.toFixed(4)}, {lng.toFixed(4)} — Άνοιγμα σε OpenStreetMap
                    </a>
                  </div>
                );
              }
              return <p className="text-sm text-muted-foreground">Δεν υπάρχουν διαθέσιμες συντεταγμένες.</p>;
            })()}
          </div>

          <div className="bg-card rounded-xl p-6 shadow-sm border border-card-border">
            <div className="flex items-center gap-2 mb-4">
              <Newspaper className="w-5 h-5 text-primary" />
              <h3 className="font-serif text-xl font-bold">Νέα του Χωριού</h3>
            </div>
            {news && news.length > 0 ? (
              <>
                <div className="space-y-4 mb-4">
                  {news.map(article => (
                    <Link key={article.id} href={`/news/${article.id}`} className="group block border-b border-border last:border-0 pb-4 last:pb-0">
                      <h4 className="font-bold text-sm leading-snug group-hover:text-primary transition-colors mb-2 line-clamp-2">{article.title}</h4>
                      <span className="text-xs text-muted-foreground block">
                        {format(new Date(article.createdAt), "d MMMM yyyy", { locale: el })}
                      </span>
                    </Link>
                  ))}
                </div>
                <Link
                  href={`/news?village=${encodeURIComponent(village.nameEl)}`}
                  className="flex items-center justify-center gap-1 text-xs font-medium text-primary hover:text-secondary border border-primary/30 hover:border-secondary/50 rounded-lg py-2 px-3 transition-colors mb-3"
                >
                  Όλα τα νέα για {village.nameEl} &rarr;
                </Link>
              </>
            ) : (
              <p className="text-sm text-muted-foreground mb-4">Δεν υπάρχουν ακόμα νέα για αυτό το χωριό.</p>
            )}
            <Link
              href={`/submit-news?villageId=${id}`}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground px-4 py-2.5 text-sm font-semibold transition-colors"
            >
              <Send className="w-4 h-4" />
              Στείλτε είδηση για αυτό το χωριό
            </Link>
            <Link
              href={`/submit-video?villageId=${id}`}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground px-4 py-2.5 text-sm font-semibold transition-colors"
            >
              <Video className="w-4 h-4" />
              Ανεβάστε βίντεο για αυτό το χωριό
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
