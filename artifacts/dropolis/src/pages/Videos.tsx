import React from "react";
import { Link } from "wouter";
import { useListVideos } from "@workspace/api-client-react";
import { SEO } from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, MapPin, Clock, Upload, User, Calendar } from "lucide-react";
import { VoteButtons } from "@/components/VoteButtons";

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
                itemListElement: videos.slice(0, 30).filter(v => v.youtubeId).map((v, i) => ({
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
          <p className="text-primary-foreground/70 max-w-2xl mx-auto mb-6">
            Ντοκιμαντέρ, εκδηλώσεις και ειδησεογραφικά ρεπορτάζ από τα χωριά της Δρόπολης.
          </p>
          <Link
            href="/submit-video"
            className="inline-flex items-center gap-2 rounded-xl bg-secondary text-secondary-foreground px-5 py-2.5 text-sm font-semibold hover:bg-secondary/90 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Ανεβάστε βίντεο
          </Link>
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
            <div key={video.youtubeId ? `yt-${video.id}` : `sv-${video.id}`} className="group glass-card rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full">
              <div className="aspect-video w-full relative bg-black">
                {video.youtubeId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${video.youtubeId}?rel=0`}
                    title={video.title}
                    className="absolute inset-0 w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : video.videoUrl ? (
                  <video
                    src={video.videoUrl}
                    controls
                    className="absolute inset-0 w-full h-full object-cover"
                    preload="metadata"
                    poster={video.thumbnailUrl ?? undefined}
                  />
                ) : null}
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

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-4 border-t border-border mt-auto">
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
                  {video.uploaderName && (
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" /> {video.uploaderName}
                    </span>
                  )}
                  {video.eventDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {video.eventDate}
                    </span>
                  )}
                  {video.duration && (
                    <span className="flex items-center gap-1 ml-auto font-mono">
                      <Clock className="w-3 h-3" /> {video.duration}
                    </span>
                  )}
                </div>
                <div className="pt-3 border-t border-border/40 mt-2">
                  <VoteButtons
                    contentType={video.contentType}
                    contentId={video.id}
                    likesCount={video.likesCount}
                    dislikesCount={video.dislikesCount}
                    compact
                  />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-24 text-muted-foreground bg-card rounded-xl border border-dashed border-border">
            <Play className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="mb-4">Δεν υπάρχουν διαθέσιμα βίντεο αυτή τη στιγμή.</p>
            <Link
              href="/submit-video"
              className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Ανεβάστε το πρώτο βίντεο
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
