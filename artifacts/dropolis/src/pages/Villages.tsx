import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useListVillages } from "@workspace/api-client-react";
import { SEO } from "@/components/SEO";
import { OptimizedImg } from "@/components/OptimizedImg";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Users, Mountain, Camera, Map } from "lucide-react";

const UNITS = [
  { key: "all", label: "Όλα τα Χωριά" },
];

export default function Villages() {
  const { data: villages, isLoading } = useListVillages();
  const [searchTerm, setSearchTerm] = useState(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("search") ?? "";
    }
    return "";
  });
  const [activeUnit, setActiveUnit] = useState(() => {
    if (typeof window !== "undefined") {
      const unit = new URLSearchParams(window.location.search).get("unit");
      return unit ?? "all";
    }
    return "all";
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSearch = params.get("search") ?? "";
    const urlUnit = params.get("unit") ?? "";
    if (urlSearch) setSearchTerm(urlSearch);
    if (urlUnit) setActiveUnit(urlUnit);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    if (activeUnit && activeUnit !== "all") params.set("unit", activeUnit);
    const qs = params.toString();
    const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", newUrl);
  }, [searchTerm, activeUnit]);

  const filtered = villages?.filter(v => {
    const matchesSearch =
      v.nameEl.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUnit = activeUnit === "all" || v.municipalUnit === activeUnit;
    return matchesSearch && matchesUnit;
  });

  const countForUnit = (key: string) =>
    key === "all"
      ? (villages?.length ?? 0)
      : (villages?.filter(v => v.municipalUnit === key).length ?? 0);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <SEO
        title="Τα Χωριά της Δρόπολης"
        description="Ανακαλύψτε και τα 41 ιστορικά χωριά της Δρόπολης. Πληθυσμός, ιστορία και παραδόσεις."
        breadcrumbs={[{ name: "Χωριά", url: "/villages" }]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Τα Χωριά της Δρόπολης",
          description: "41 ιστορικά χωριά του Δήμου Δρόπολης.",
          url: "https://dropolis.net/villages",
          inLanguage: "el",
          numberOfItems: 41,
        }}
        hreflang={[
          { lang: "el-GR", href: "https://dropolis.net/villages" },
          { lang: "en",    href: "https://dropolis.net/en/villages" },
          { lang: "x-default", href: "https://dropolis.net/villages" },
        ]}
      />

      {/* Hero header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-primary text-primary-foreground p-6 md:p-10 rounded-2xl shadow-lg overflow-hidden relative">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 70% 50%, white 0%, transparent 60%)" }} />
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-serif font-bold mb-4">
            Τα Χωριά μας
          </h1>
          <p className="text-lg text-primary-foreground/75 leading-relaxed">
            41 ιστορικά χωριά του Δήμου Δρόπολης.
            Το καθένα με τη δική του μοναδική ομορφιά και παράδοση.
          </p>
        </div>
        <div className="w-full md:w-72 relative z-10 flex flex-col gap-3">
          <Input
            placeholder="Αναζήτηση χωριού..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-white/15 border-white/20 text-white placeholder:text-white/50 w-full focus-visible:ring-secondary"
            data-testid="input-village-search"
          />
          <Link
            href="/villages/map/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4 py-2 text-sm font-semibold transition-all shadow-sm"
          >
            <Map size={15} />
            Διαδραστικός χάρτης
          </Link>
          <Link
            href="/upload-photo/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/15 border border-white/30 text-white hover:bg-white/25 px-4 py-2 text-sm font-semibold transition-all backdrop-blur-sm"
          >
            <Camera size={15} />
            Ανέβασε φωτογραφία χωριού
          </Link>
        </div>
      </div>


      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array(9).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-[300px] w-full rounded-xl" />
          ))
        ) : filtered && filtered.length > 0 ? (
          filtered.map(village => (
            <Link key={village.id} href={`/villages/${village.id}/`}>
              <div
                data-testid={`card-village-${village.id}`}
                className="group glass-card rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/40 transition-all duration-300 h-full flex flex-col cursor-pointer"
              >
                <div className="aspect-[4/3] overflow-hidden relative bg-muted">
                  <OptimizedImg
                    src={village.imageUrl || `https://placehold.co/600x450/1e3a5f/ffffff?text=${encodeURIComponent(village.nameEl)}`}
                    alt={`Χωριό ${village.nameEl}`}
                    width={600}
                    height={450}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {village.municipalUnit && (
                    <div className="absolute top-3 left-3 bg-primary/90 text-primary-foreground text-xs font-semibold px-2 py-1 rounded-full backdrop-blur-sm">
                      {"Δρόπολη"}
                    </div>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-serif font-bold group-hover:text-primary transition-colors">
                      {village.nameEl}
                    </h2>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1 ml-2 shrink-0">
                      {village.name}
                    </span>
                  </div>

                  <p className="text-muted-foreground text-sm line-clamp-2 mb-4 flex-grow">
                    {village.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs font-medium text-foreground/70 border-t border-border pt-4 mt-auto">
                    {village.population != null && (
                      <div className="flex items-center gap-1" title="Πληθυσμός">
                        <Users className="w-3.5 h-3.5 text-primary" />
                        <span>{village.population}</span>
                      </div>
                    )}
                    {village.elevation != null && (
                      <div className="flex items-center gap-1" title="Υψόμετρο">
                        <Mountain className="w-3.5 h-3.5 text-primary" />
                        <span>{village.elevation}m</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 ml-auto group-hover:text-secondary transition-colors font-bold">
                      Περισσότερα &rarr;
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-muted-foreground bg-card rounded-xl border border-dashed border-border">
            {searchTerm
              ? `Δεν βρέθηκαν χωριά με το όνομα "${searchTerm}".`
              : "Δεν βρέθηκαν χωριά."}
          </div>
        )}
      </div>
    </div>
  );
}
