import React from "react";
import { Link } from "wouter";
import { useListPhotos } from "@workspace/api-client-react";
import { SEO, seoPages } from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";
import { VoteButtons } from "@/components/VoteButtons";
import { Camera, MapPin, Upload } from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";

export default function Photos() {
  const { data: photos, isLoading } = useListPhotos();

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <SEO
        title={seoPages.photos.title}
        standalone={true}
        description={seoPages.photos.description}
        image={seoPages.photos.image}
        keywords="φωτογραφίες Δρόπολης, εικόνες χωριών Βόρεια Ήπειρος, ελληνική μειονότητα φωτογραφίες, Dropull photos, Δερόπολη εικόνες, παραδοσιακά χωριά"
        breadcrumbs={[{ name: "Φωτογραφίες", url: "/photos/" }]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ImageGallery",
          name: "Φωτογραφικό Αρχείο — Δρόπολη",
          description: "Πλούσιο φωτογραφικό αρχείο από τα χωριά, τις εκδηλώσεις και τους ανθρώπους της Δρόπολης, Βόρεια Ήπειρος.",
          url: "https://dropolis.net/photos/",
          inLanguage: "el",
          about: { "@type": "Place", name: "Δρόπολη", containedInPlace: { "@type": "Place", name: "Βόρεια Ήπειρος, Αλβανία" } },
          publisher: { "@type": "Organization", "@id": "https://dropolis.net/#organization", name: "Δρόπολη (Dropolis)" },
        }}
        hreflang={[
          { lang: "el-GR",     href: "https://dropolis.net/photos/" },
          { lang: "en",        href: "https://dropolis.net/en/photos/" },
          { lang: "x-default", href: "https://dropolis.net/photos/" },
        ]}
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

      {/* Upload CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/5 px-6 py-4">
        <div>
          <p className="font-semibold text-foreground">Έχεις φωτογραφίες από τη Δρόπολη;</p>
          <p className="text-sm text-muted-foreground mt-0.5">Κάθε υποβολή αξιολογείται από την ομάδα μας πριν δημοσιευτεί.</p>
        </div>
        <Link
          href="/upload-photo/"
          className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Upload className="w-4 h-4" />
          Ανέβασε τη δική σου φωτογραφία
        </Link>
      </div>

      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {isLoading ? (
          Array(12).fill(0).map((_, i) => (
            <Skeleton key={i} className="w-full h-48 rounded-xl" />
          ))
        ) : photos && photos.length > 0 ? (
          photos.map(photo => (
            <div key={photo.id} className="break-inside-avoid mb-4 bg-card rounded-2xl shadow-md">
              {/* Image with hover overlay */}
              <div className="relative group overflow-hidden rounded-t-2xl">
                <img
                  src={photo.thumbnailUrl || photo.url}
                  alt={photo.title}
                  className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <h2 className="text-white font-bold text-lg leading-tight mb-1">{photo.title}</h2>
                  <div className="flex flex-wrap items-center gap-3 text-white/80 text-xs">
                    {photo.villageId && photo.villageName ? (
                      <Link href={`/villages/${photo.villageId}/`} onClick={e => e.stopPropagation()}>
                        <span className="flex items-center gap-1 bg-primary/80 px-2 py-0.5 rounded backdrop-blur-sm hover:bg-primary transition-colors">
                          <MapPin className="w-3 h-3" /> {photo.villageName}
                        </span>
                      </Link>
                    ) : photo.villageName ? (
                      <span className="flex items-center gap-1 bg-primary/80 px-2 py-0.5 rounded backdrop-blur-sm">
                        <MapPin className="w-3 h-3" /> {photo.villageName}
                      </span>
                    ) : null}
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
              {/* Like / dislike bar */}
              <div className="px-3 py-2 border-t border-border/40">
                <VoteButtons
                  contentType="photo"
                  contentId={photo.id}
                  likesCount={photo.likes}
                  dislikesCount={photo.dislikes}
                />
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
