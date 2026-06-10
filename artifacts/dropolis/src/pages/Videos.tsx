import React from "react";
import { useListVideos } from "@workspace/api-client-react";
import { SEO } from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, MapPin, Clock } from "lucide-react";

export default function Videos() {
  const { data: videos, isLoading } = useListVideos();

  return (
    <div className="space-y-8">
      <SEO title="Βίντεο" description="Βίντεο, ρεπορτάζ και αφιερώματα από τη Δρόπολη." />
      
      <div className="bg-primary text-primary-foreground rounded-2xl p-8 md:p-12 text-center relative overflow-hidden shadow-lg border border-primary-border mb-12">
        <div className="absolute inset-0 bg-[url('https://placehold.co/1000x400/222/222?text=texture')] opacity-10 mix-blend-overlay"></div>
        <div className="relative z-10">
          <Play className="w-12 h-12 mx-auto mb-4 text-secondary" />
          <h1 className="text-3xl md:text-5xl font-serif font-bold mb-4">Βίντεο & Ρεπορτάζ</h1>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto text-lg">
            Δείτε ντοκιμαντέρ, εκδηλώσεις και ειδησεογραφικά ρεπορτάζ από τα χωριά της Δερόπολης.
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
            <div key={video.id} className="group bg-card rounded-xl overflow-hidden shadow-sm border border-card-border hover:shadow-md transition-shadow flex flex-col h-full">
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
                  {video.villageName && (
                    <span className="flex items-center gap-1 bg-accent/10 text-accent px-2 py-1 rounded font-medium">
                      <MapPin className="w-3 h-3" /> {video.villageName}
                    </span>
                  )}
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
