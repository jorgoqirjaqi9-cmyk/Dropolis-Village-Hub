import React from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { useGetStats, useGetFeaturedArticles, useListArticles } from "@workspace/api-client-react";
import { SEO } from "@/components/SEO";
import { AdSenseSlot } from "@/components/AdSenseSlot";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Newspaper, Users, Image as ImageIcon, Video as VideoIcon, MessageSquare } from "lucide-react";

export default function Home() {
  const { data: stats, isLoading: statsLoading } = useGetStats();
  const { data: featuredArticles, isLoading: featuredLoading } = useGetFeaturedArticles();
  const { data: recentArticles, isLoading: recentLoading } = useListArticles({ limit: 6 });

  return (
    <div className="space-y-12">
      <SEO 
        title="Αρχική" 
        description="Η ψηφιακή πλατεία της ελληνικής μειονότητας. Ειδήσεις, χωριά και πολιτισμός της Δρόπολης." 
      />

      {/* Breaking News Ticker */}
      <div className="bg-primary text-primary-foreground py-2 px-4 rounded-md flex items-center gap-4 overflow-hidden shadow-md">
        <span className="font-bold whitespace-nowrap bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs uppercase tracking-wider">Τελευταίες Ειδήσεις</span>
        <div className="flex-grow overflow-hidden relative">
          <div className="animate-marquee whitespace-nowrap">
            {recentArticles?.slice(0, 3).map((article, i) => (
              <span key={article.id} className="mx-4 text-sm">
                <span className="opacity-50 mr-2">•</span>
                <Link href={`/news/${article.id}`} className="hover:underline">
                  {article.title}
                </Link>
              </span>
            )) || <span className="opacity-50 text-sm">Φόρτωση ειδήσεων...</span>}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 20s linear infinite;
        }
      `}} />

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { icon: Newspaper, label: "Άρθρα", value: stats?.totalArticles, loading: statsLoading },
          { icon: Users, label: "Χωριά", value: stats?.totalVillages, loading: statsLoading },
          { icon: ImageIcon, label: "Φωτογραφίες", value: stats?.totalPhotos, loading: statsLoading },
          { icon: VideoIcon, label: "Βίντεο", value: stats?.totalVideos, loading: statsLoading },
          { icon: MessageSquare, label: "Μηνύματα", value: stats?.totalMessages, loading: statsLoading },
        ].map((stat, i) => (
          <Card key={i} className="bg-card border-card-border shadow-sm">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <stat.icon className="h-6 w-6 text-primary mb-2 opacity-80" />
              {stat.loading ? (
                <Skeleton className="h-8 w-12 mb-1" />
              ) : (
                <span className="text-2xl font-bold font-serif text-secondary">{stat.value || 0}</span>
              )}
              <span className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-center my-8">
        <AdSenseSlot width={728} height={90} className="hidden md:flex rounded-lg shadow-sm" />
        <AdSenseSlot width={320} height={100} className="md:hidden rounded-lg shadow-sm" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-3xl font-serif font-bold text-foreground mb-6 border-b-2 border-primary inline-block pb-2">Κύριες Ειδήσεις</h2>
            
            {featuredLoading ? (
              <div className="space-y-6">
                <Skeleton className="h-[400px] w-full rounded-xl" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-48 w-full rounded-xl" />
                  <Skeleton className="h-48 w-full rounded-xl" />
                </div>
              </div>
            ) : featuredArticles && featuredArticles.length > 0 ? (
              <div className="space-y-6">
                {/* Hero Featured */}
                <Link href={`/news/${featuredArticles[0].id}`}>
                  <div className="group relative rounded-xl overflow-hidden shadow-lg aspect-video md:aspect-[21/9] cursor-pointer block">
                    <img 
                      src={featuredArticles[0].imageUrl || "https://placehold.co/800x400/2a4365/ffffff?text=Dropolis"} 
                      alt={featuredArticles[0].title}
                      className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-6 md:p-8">
                      <div className="flex gap-2 mb-3">
                        <span className="bg-secondary text-secondary-foreground text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                          {featuredArticles[0].category}
                        </span>
                      </div>
                      <h3 className="text-2xl md:text-4xl font-serif font-bold text-white mb-2 leading-tight group-hover:text-secondary transition-colors">
                        {featuredArticles[0].title}
                      </h3>
                      {featuredArticles[0].excerpt && (
                        <p className="text-white/80 line-clamp-2 md:text-lg mb-2">{featuredArticles[0].excerpt}</p>
                      )}
                      <div className="text-white/60 text-sm flex items-center gap-2">
                        <span>{format(new Date(featuredArticles[0].createdAt), "d MMMM yyyy", { locale: el })}</span>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Secondary Featured */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {featuredArticles.slice(1, 3).map(article => (
                    <Link key={article.id} href={`/news/${article.id}`}>
                      <div className="group rounded-xl overflow-hidden shadow-md bg-card flex flex-col h-full cursor-pointer border border-card-border hover:border-primary/30 transition-colors">
                        <div className="aspect-video overflow-hidden">
                          <img 
                            src={article.imageUrl || "https://placehold.co/400x225/2a4365/ffffff?text=Dropolis"} 
                            alt={article.title}
                            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                        <div className="p-4 flex flex-col flex-grow">
                          <span className="text-primary text-xs font-bold uppercase tracking-wider mb-2">{article.category}</span>
                          <h4 className="text-lg font-serif font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">{article.title}</h4>
                          <span className="text-muted-foreground text-xs mt-auto">
                            {format(new Date(article.createdAt), "d MMMM yyyy", { locale: el })}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground italic">Δεν υπάρχουν κύριες ειδήσεις.</p>
            )}
          </section>

          <section>
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-2xl font-serif font-bold text-foreground border-b-2 border-primary inline-block pb-2">Ροή Ειδήσεων</h2>
              <Link href="/news" className="text-primary hover:text-secondary text-sm font-medium transition-colors">Δείτε όλες &rarr;</Link>
            </div>
            
            <div className="space-y-4">
              {recentLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-lg" />
                ))
              ) : recentArticles && recentArticles.length > 0 ? (
                recentArticles.map(article => (
                  <Link key={article.id} href={`/news/${article.id}`} className="group flex flex-col sm:flex-row gap-4 bg-card rounded-lg p-4 shadow-sm border border-card-border hover:shadow-md transition-shadow">
                    <div className="sm:w-1/3 aspect-video sm:aspect-auto rounded-md overflow-hidden shrink-0">
                      <img 
                        src={article.imageUrl || "https://placehold.co/400x300/2a4365/ffffff?text=Dropolis"} 
                        alt={article.title}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="flex flex-col flex-grow justify-center">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-primary text-xs font-bold uppercase tracking-wider">{article.category}</span>
                        <span className="text-muted-foreground text-xs">• {format(new Date(article.createdAt), "d MMM yyyy", { locale: el })}</span>
                      </div>
                      <h4 className="text-lg font-serif font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">{article.title}</h4>
                      {article.excerpt && <p className="text-muted-foreground text-sm line-clamp-2">{article.excerpt}</p>}
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-muted-foreground italic">Δεν βρέθηκαν ειδήσεις.</p>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div className="bg-card rounded-xl p-6 shadow-sm border border-card-border">
            <h3 className="font-serif text-xl font-bold mb-4 text-foreground">Σχετικά με τη Δρόπολη</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Η Δρόπολη είναι ιστορική περιοχή και δήμος του νομού Αργυροκάστρου της νότιας Αλβανίας, που κατοικείται από την Ελληνική Μειονότητα. 
              Αποτελείται από δεκάδες γραφικά χωριά, πλούσια σε ιστορία, πολιτισμό και παραδόσεις.
            </p>
            <Link href="/villages">
              <span className="text-primary hover:text-secondary text-sm font-medium transition-colors cursor-pointer">Ανακαλύψτε τα χωριά &rarr;</span>
            </Link>
          </div>

          <div className="sticky top-24">
            <AdSenseSlot width={300} height={250} className="mx-auto rounded-lg shadow-sm bg-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
