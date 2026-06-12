import React from "react";
import { Link } from "wouter";
import { useListVideos } from "@workspace/api-client-react";
import { SEO } from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, MapPin, Clock } from "lucide-react";

export default function Videos() {
  const { data: videos, isLoading } = useListVideos({ limit: 200 });

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <SEO
        title="Βίντεο & Ρεπορτάζ"
        description="Ντοκιμαντέρ, ρεπορτάζ και βίντεο από τα χωριά της Δρόπολης, Βόρεια Ήπειρος. YouTube βίντεο για την ελληνική μειονότητα."
        breadcrumbs={[{ name: "Βίντεο", url: "/videos" }]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Βίντεο & Ρεπορτάζ — Δρόπολη",
          description: "Βίντεο και ρεπορτάζ από τη Δρόπολη.",
          url: "https://dropolis.net/videos",
          inLanguage: "el",
          numberOfItems: videos?.length ?? 0,
          ...(videos && videos.length > 0
            ? {
                itemListElement: videos.slice(0, 30).map((v, i) => ({
                  "@type": "ListItem",
                  position: i + 1,
                  item: {
                    "@type": "VideoObject",
                    name: v.title,
                    description: v.description ?? "",
                    thumbnailUrl: `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`,
                    embedUrl: `https://www.youtube.com/embed/${v.youtubeId}`,
                    url: `https://www.youtube.com/watch?v=${v.youtubeId}`,
                    inLanguage: "el",
                  },
                })),
              }
            : {}),
        }}
      />

      <div className="relative rounded-2xl overflow-hidden bg-primary text-primary-foreground p-8 md:p-12 text-center shadow-lg">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 50% 50%, white 0%, transparent 60%)" }} />
        <div className="relative z-10">
          <Play className="w-10 h-10 mx-auto mb-4 text-secondary" />
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-3">Βίντεο & Ρεπορτάζ</h1>
          <p className="text-primary-foreground/70 max-w-2xl mx-auto">
            Ντοκιμαντέρ, εκδηλώσεις και ειδησεογραφικά ρεπορτάζ από τα χωριά της Δρόπολης.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-video w-full rounded-xl" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))
        ) : videos && videos.length > 0 ? (
          videos.map(video => (
            <div key={video.id} className="group glass-card rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full">
              <div className="aspect-video w-full relative bg-black">
                <iframe 
                  src={`https://www.youtube.com/embed/${video.youtubeId}?rel=0`} 
                  title={video.title}
                  className="absolute inset-0 w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              </div>
              <div className="p-5 flex flex-col flex-grow">
                <h3 className="font-bold text-lg font-serif mb-2 line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                  {video.title}
                </h3>
                {video.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-grow">
                    {video.description}
                  </p>
                )}
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-4 border-t border-border mt-auto">
                  {video.villageId && video.villageName ? (
                    <Link href={`/villages/${video.villageId}`}>
                      <span className="flex items-center gap-1 bg-accent/10 text-accent px-2 py-1 rounded font-medium hover:bg-accent/20 transition-colors">
                        <MapPin className="w-3 h-3" /> {video.villageName}
                      </span>
                    </Link>
                  ) : video.villageName ? (
                    <span className="flex items-center gap-1 bg-accent/10 text-accent px-2 py-1 rounded font-medium">
                      <MapPin className="w-3 h-3" /> {video.villageName}
                    </span>
                  ) : null}
                  {video.duration && (
                    <span className="flex items-center gap-1 ml-auto font-mono">
                      <Clock className="w-3 h-3" /> {video.duration}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-24 text-muted-foreground bg-card rounded-xl border border-dashed border-border">
            Δεν υπάρχουν διαθέσιμα βίντεο αυτή τη στιγμή.
          </div>
        )}
      </div>
    </div>
  );
}
