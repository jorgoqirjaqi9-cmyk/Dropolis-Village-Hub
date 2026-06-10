import React, { useState } from "react";
import { Link } from "wouter";
import { useListVillages } from "@workspace/api-client-react";
import { SEO } from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { MapPin, Users, Mountain } from "lucide-react";

export default function Villages() {
  const { data: villages, isLoading } = useListVillages();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredVillages = villages?.filter(v => 
    v.nameEl.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <SEO title="Τα Χωριά της Δρόπολης" description="Ανακαλύψτε τα ιστορικά χωριά της Δρόπολης. Πληροφορίες, πληθυσμός και τοποθεσίες." />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-card p-6 md:p-10 rounded-2xl shadow-sm border border-card-border overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-4">Τα Χωριά μας</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Η Δρόπολη αποτελείται από δεκάδες ιστορικά χωριά, το καθένα με τη δική του μοναδική ομορφιά, 
            παράδοση και συμβολή στην ιστορία της Ελληνικής Μειονότητας.
          </p>
        </div>
        
        <div className="w-full md:w-72 relative z-10">
          <Input 
            placeholder="Αναζήτηση χωριού..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-background border-input w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array(9).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-[300px] w-full rounded-xl" />
          ))
        ) : filteredVillages && filteredVillages.length > 0 ? (
          filteredVillages.map((village) => (
            <Link key={village.id} href={`/villages/${village.id}`}>
              <div className="group bg-card rounded-xl overflow-hidden shadow-sm border border-card-border hover:shadow-xl hover:border-primary/40 transition-all duration-300 h-full flex flex-col cursor-pointer">
                <div className="aspect-[4/3] overflow-hidden relative bg-muted">
                  <img 
                    src={village.imageUrl || "https://placehold.co/600x450/4a5568/ffffff?text=" + encodeURIComponent(village.nameEl)} 
                    alt={village.nameEl}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="p-5 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-2xl font-serif font-bold group-hover:text-primary transition-colors">{village.nameEl}</h2>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{village.name}</span>
                  </div>
                  
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-4 flex-grow">
                    {village.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs font-medium text-foreground/70 border-t border-border pt-4 mt-auto">
                    {village.population !== null && (
                      <div className="flex items-center gap-1" title="Πληθυσμός">
                        <Users className="w-3.5 h-3.5 text-primary" />
                        <span>{village.population}</span>
                      </div>
                    )}
                    {village.elevation !== null && (
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
            Δεν βρέθηκαν χωριά με το όνομα "{searchTerm}".
          </div>
        )}
      </div>
    </div>
  );
}
