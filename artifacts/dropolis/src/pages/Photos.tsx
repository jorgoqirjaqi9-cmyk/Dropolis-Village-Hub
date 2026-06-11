import React from "react";
import { useListPhotos } from "@workspace/api-client-react";
import { SEO } from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";
import { Camera, MapPin } from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";

export default function Photos() {
  const { data: photos, isLoading } = useListPhotos();

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <SEO
        title="Φωτογραφικό Αρχείο"
        description="Πλούσιο φωτογραφικό αρχείο από τα χωριά, τις εκδηλώσεις και τους ανθρώπους της Δρόπολης, Βόρεια Ήπειρος."
        breadcrumbs={[{ name: "Φωτογραφίες", url: "/photos" }]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ImageGallery",
          name: "Φωτογραφικό Αρχείο — Δρόπολη",
          description: "Φωτογραφίες από τα χωριά της Δρόπολης.",
          url: "https://dropolis.replit.app/photos",
          inLanguage: "el",
        }}
      />

      <div className="relative rounded-2xl overflow-hidden bg-primary text-primary-foreground p-8 md:p-12 shadow-lg text-center">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 50% 50%, white 0%, transparent 60%)" }} />
        <div className="relative z-10">
          <Camera className="w-10 h-10 mx-auto mb-4 text-secondary" />
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-3">Φωτογραφικό Αρχείο</h1>
          <p className="text-primary-foreground/70 max-w-xl mx-auto">Αποτυπώνοντας την ομορφιά, την παράδοση και την καθημερινότητα</p>
        </div>
      </div>

      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {isLoading ? (
          Array(12).fill(0).map((_, i) => (
            <Skeleton key={i} className="w-full rounded-xl" style={{ height: `${Math.floor(Math.random() * 200) + 150}px` }} />
          ))
        ) : photos && photos.length > 0 ? (
          photos.map(photo => (
            <div key={photo.id} className="break-inside-avoid relative group rounded-2xl overflow-hidden shadow-md mb-4 bg-card">
              <img 
                src={photo.url} 
                alt={photo.title} 
                className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700" 
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <h3 className="text-white font-bold text-lg leading-tight mb-1">{photo.title}</h3>
                <div className="flex flex-wrap items-center gap-3 text-white/80 text-xs">
                  {photo.villageName && (
                    <span className="flex items-center gap-1 bg-primary/80 px-2 py-0.5 rounded backdrop-blur-sm">
                      <MapPin className="w-3 h-3" /> {photo.villageName}
                    </span>
                  )}
                  {photo.photographer && (
                    <span className="flex items-center gap-1">
                      <Camera className="w-3 h-3" /> {photo.photographer}
                    </span>
                  )}
                  <span className="ml-auto opacity-60">
                    {format(new Date(photo.createdAt), "MMM yyyy", { locale: el })}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-24 text-muted-foreground bg-card rounded-xl border border-dashed border-border">
            Δεν υπάρχουν διαθέσιμες φωτογραφίες.
          </div>
        )}
      </div>
    </div>
  );
}
