import { Link } from "wouter";
import { SEO } from "@/components/SEO";
import { motion } from "framer-motion";
import {
  MapPin, Map, Image, Users, Music, Mountain,
  ChevronRight, Camera, Upload, Star, BookOpen, Globe,
} from "lucide-react";

const fade = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};
const stagger = (i: number) => ({
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.45 } },
});

const HERITAGE_PHOTOS: { src: string; alt: string; caption: string; ratio: string }[] = [
  {
    src: "/images/travel-guide/dropolis-orthodox-church.webp",
    alt: "Orthodox church in the Dropolis region of Northern Epirus",
    caption: "Byzantine Orthodox Church",
    ratio: "aspect-[4/3]",
  },
  {
    src: "/images/travel-guide/dropolis-stone-village.webp",
    alt: "Traditional stone village architecture in Dropolis Southern Albania",
    caption: "Stone Village Architecture",
    ratio: "aspect-[4/3]",
  },
  {
    src: "/images/travel-guide/northern-epirus-monument.webp",
    alt: "Memorial monument and cultural heritage site in Northern Epirus",
    caption: "Memorial Monument",
    ratio: "aspect-[4/3]",
  },
  {
    src: "/images/travel-guide/gjirokaster-heritage-landscape.webp",
    alt: "Mountain landscape near the Greek minority villages of Dropolis",
    caption: "Gjirokaster Heritage Landscape",
    ratio: "aspect-[16/9]",
  },
  {
    src: "/images/travel-guide/dropolis-village-cemetery.webp",
    alt: "Historic village cemetery and Orthodox heritage in Dropolis",
    caption: "Village Cemetery",
    ratio: "aspect-[4/3]",
  },
];

const FEATURES = [
  {
    icon: Users,
    color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
    title: "Greek-Minority Heritage",
    text: "Dropolis is strongly connected with the historic Greek minority of Albania. The Greek language, local customs, family memories and Orthodox traditions remain central to the identity of many villages.",
  },
  {
    icon: BookOpen,
    color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
    title: "Byzantine and Orthodox Landmarks",
    text: "Visitors can discover churches, monasteries, old cemeteries and sacred places that reflect centuries of Orthodox Christian life in Northern Epirus.",
  },
  {
    icon: Music,
    color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
    title: "Polyphonic Music and Living Tradition",
    text: "The region is known for its polyphonic singing, a powerful musical tradition of Epirus and Southern Albania. This sound carries the memory of villages, families and generations.",
  },
  {
    icon: Mountain,
    color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
    title: "Mountain Landscapes and Village Life",
    text: "From hillside settlements to valleys and stone paths, Dropolis is ideal for slow travel, photography, walking routes and meaningful encounters with local life.",
  },
];

const THINGS_TO_DO = [
  {
    icon: MapPin,
    title: "Explore the 41 Villages",
    text: "Each village has its own character, history and family roots. Travelers can use the Dropolis village directory to discover names, locations, stories, photographs and community updates.",
    href: "/en/villages/",
    cta: "Explore the 41 Villages",
  },
  {
    icon: Map,
    title: "Visit the Interactive Map",
    text: "The interactive map helps visitors understand the geography of Dropolis, find villages, plan routes and explore the wider region near Gjirokaster and the Greek border.",
    href: "/villages/map/",
    cta: "Open the Map",
  },
  {
    icon: Globe,
    title: "Discover Local History and Family Roots",
    text: "Dropolis is especially important for the Greek diaspora and families from Northern Epirus. The platform helps preserve memories, photographs, oral histories and village identity for future generations.",
    href: "/diaspora/",
    cta: "Diaspora Memories",
  },
  {
    icon: Star,
    title: "Taste Epirus and Balkan Gastronomy",
    text: "Traditional pies, mountain herbs, homemade products, local spirits and seasonal dishes are part of the everyday culture of the region. Food in Dropolis is tied to hospitality, family gatherings and village celebrations.",
    href: "/gastronomia/",
    cta: "Explore Local Food",
  },
];

const BEST_FOR = [
  "Cultural travelers interested in Northern Epirus",
  "Visitors exploring Greek-minority villages in Albania",
  "Photographers and documentary creators",
  "People researching family history and genealogy",
  "Travelers looking for authentic Southern Albania beyond mass tourism",
  "Diaspora families reconnecting with village roots",
];

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: "Dropolis Region",
    alternateName: ["Dropull", "Droupoli", "Dropolis Northern Epirus"],
    description:
      "Dropolis is a cultural and travel region in the Gjirokaster district of Southern Albania, known for its 41 traditional villages, Greek-minority heritage, Byzantine and Orthodox landmarks, polyphonic music and mountain landscapes.",
    url: "https://dropolis.net/en/travel-guide/",
    touristType: ["Cultural tourism", "Heritage tourism", "Genealogy tourism", "Slow travel"],
    address: {
      "@type": "PostalAddress",
      addressRegion: "Gjirokaster District",
      addressCountry: "AL",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 39.95,
      longitude: 20.25,
    },
    isPartOf: { "@type": "Place", name: "Northern Epirus" },
    image: HERITAGE_PHOTOS.map(p => `https://dropolis.net${p.src}`),
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://dropolis.net/en/" },
      { "@type": "ListItem", position: 2, name: "Travel Guide", item: "https://dropolis.net/en/travel-guide/" },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Visit Dropolis: Northern Epirus Travel Guide",
    url: "https://dropolis.net/en/travel-guide/",
    inLanguage: "en",
    about: "Dropolis Region, Northern Epirus, Greek minority Albania, cultural heritage",
    description:
      "Discover Dropolis in Northern Epirus, Southern Albania: 41 Greek-minority villages, Byzantine churches, polyphonic music, mountain landscapes and authentic Balkan culture.",
  },
];

export default function TravelGuide() {
  return (
    <div>
      <SEO
        title="Visit Dropolis: Northern Epirus Travel Guide | 41 Villages"
        standalone
        description="Discover Dropolis in Northern Epirus, Southern Albania: 41 Greek-minority villages, Byzantine churches, polyphonic music, mountain landscapes and authentic Balkan culture."
        keywords="Northern Epirus travel, Dropolis travel guide, Greek minority Albania, Dropolis villages, Southern Albania tourism, Byzantine churches Albania, Balkan cultural heritage, Gjirokaster district, Epirus villages, polyphonic music Albania, Orthodox heritage Albania, authentic Albania travel"
        type="article"
        image="https://dropolis.net/og-home.jpg"
        jsonLd={jsonLd}
        breadcrumbs={[
          { name: "English", url: "/en/" },
          { name: "Travel Guide", url: "/en/travel-guide/" },
        ]}
        hreflang={[
          { lang: "en", href: "https://dropolis.net/en/travel-guide/" },
          { lang: "el", href: "https://dropolis.net/" },
          { lang: "x-default", href: "https://dropolis.net/en/travel-guide/" },
        ]}
      />

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-primary via-primary/90 to-emerald-900 text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          aria-hidden="true"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.3' fill-rule='evenodd'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3Ccircle cx='0' cy='0' r='1.5'/%3E%3Ccircle cx='60' cy='0' r='1.5'/%3E%3Ccircle cx='0' cy='60' r='1.5'/%3E%3Ccircle cx='60' cy='60' r='1.5'/%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-white/60 text-sm mb-8">
            <Link href="/en/" className="hover:text-white/90 transition-colors">English</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white/90">Travel Guide</span>
          </nav>
          <motion.div initial="hidden" animate="show" variants={fade}>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest bg-white/10 border border-white/20 px-3 py-1.5 rounded-full mb-5">
              <MapPin className="w-3.5 h-3.5 text-secondary" /> Northern Epirus · Southern Albania
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold leading-tight mb-5 max-w-3xl">
              Dropolis: The Hidden Heart of{" "}
              <span className="text-secondary">Northern Epirus</span>
            </h1>
            <p className="text-white/85 text-base sm:text-lg leading-relaxed max-w-2xl mb-8">
              Experience the timeless charm of 41 historic villages, where Hellenic culture, Byzantine history and mountain serenity meet in Southern Albania.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/en/villages/"
                className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-secondary/90 transition-colors shadow-sm"
              >
                <MapPin className="w-4 h-4" /> Explore the 41 Villages
              </Link>
              <Link
                href="/villages/map/"
                className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/20 transition-colors"
              >
                <Map className="w-4 h-4" /> View the Interactive Map
              </Link>
              <Link
                href="/photos/"
                className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/20 transition-colors"
              >
                <Image className="w-4 h-4" /> Browse Photo Archive
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-16">

        {/* Why Visit */}
        <motion.section initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-4">Why Visit Dropolis?</h2>
          <div className="space-y-4 text-foreground/80 leading-relaxed">
            <p>
              Nestled in the Gjirokaster district of Southern Albania, Dropolis is one of the most meaningful
              cultural regions of Northern Epirus. Across 41 traditional villages, visitors encounter a living
              landscape of <strong>Greek-minority heritage</strong>, stone-built architecture, Orthodox Christian
              landmarks, mountain scenery and local traditions that continue through families, festivals and the diaspora.
            </p>
            <p>
              For travelers who want something more authentic than a crowded tourist route, Dropolis offers a quiet
              and deeply human experience. It is a place for history lovers, cultural explorers, photographers,
              genealogists, hikers and anyone interested in the shared heritage of Epirus and the Balkans.
            </p>
          </div>
        </motion.section>

        {/* What Makes it Unique — 4 feature cards */}
        <section>
          <motion.h2
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-6"
          >
            What Makes the Dropolis Region Unique?
          </motion.h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {FEATURES.map(({ icon: Icon, color, title, text }, i) => (
              <motion.div
                key={title}
                initial="hidden" whileInView="show" viewport={{ once: true }}
                variants={stagger(i)}
                className="rounded-2xl border border-border bg-card p-6 space-y-3"
              >
                <div className={`inline-flex w-10 h-10 rounded-xl items-center justify-center ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-lg font-bold text-foreground">{title}</h3>
                <p className="text-sm text-foreground/75 leading-relaxed">{text}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Things To Do */}
        <section>
          <motion.h2
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-6"
          >
            Things to Do in Dropolis
          </motion.h2>
          <div className="space-y-5">
            {THINGS_TO_DO.map(({ icon: Icon, title, text, href, cta }, i) => (
              <motion.div
                key={title}
                initial="hidden" whileInView="show" viewport={{ once: true }}
                variants={stagger(i)}
                className="flex gap-4 rounded-2xl border border-border bg-card p-5"
              >
                <div className="inline-flex w-10 h-10 rounded-xl items-center justify-center bg-primary/10 text-primary shrink-0 mt-0.5">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-serif text-lg font-bold text-foreground mb-1">{title}</h3>
                  <p className="text-sm text-foreground/75 leading-relaxed mb-3">{text}</p>
                  <Link
                    href={href}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    {cta} <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Where Is Dropolis */}
        <motion.section initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-4">Where Is Dropolis?</h2>
          <p className="text-foreground/80 leading-relaxed">
            Dropolis is located in the <strong>Gjirokaster district of Southern Albania</strong>, close to the
            Greek-Albanian border at Kakavia. Its position makes it accessible for travelers coming from Greece,
            Gjirokaster, Saranda, Tirana or the wider Epirus region.
          </p>
          <div className="mt-5">
            <Link
              href="/villages/map/"
              className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary px-4 py-2.5 text-sm font-semibold transition-colors"
            >
              <Map className="w-4 h-4" /> Open the Interactive Map
            </Link>
          </div>
        </motion.section>

        {/* Monuments & Heritage Photo Section */}
        <section>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-2">
              Monuments, Churches and Heritage Sites
            </h2>
            <p className="text-foreground/75 leading-relaxed mb-8 max-w-2xl">
              Dropolis is not only a landscape of villages, but also a region of memory. Its monuments, Orthodox
              churches, old stone houses, cemeteries, memorial sites and traditional paths reveal the long history
              of Northern Epirus and the cultural presence of the Greek minority in Southern Albania.
            </p>
          </motion.div>

          {/* Photo grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {HERITAGE_PHOTOS.map((photo, i) => (
              <motion.figure
                key={photo.src}
                initial="hidden" whileInView="show" viewport={{ once: true }}
                variants={stagger(i)}
                className={`rounded-2xl overflow-hidden bg-muted shadow-sm border border-border/50 ${i === 3 ? "sm:col-span-2 lg:col-span-2" : ""}`}
              >
                <div className={`${photo.ratio} overflow-hidden`}>
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    width={800}
                    height={600}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    onError={e => {
                      const img = e.currentTarget;
                      img.src = photo.src.replace(".webp", ".png");
                    }}
                  />
                </div>
                <figcaption className="px-4 py-2.5 text-xs text-muted-foreground font-medium">
                  {photo.caption}
                </figcaption>
              </motion.figure>
            ))}
          </div>

          {/* CTA under photo grid */}
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link
              href="/photos/"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Camera className="w-4 h-4" /> Explore Village Photos
            </Link>
            <Link
              href="/upload-photo/"
              className="inline-flex items-center gap-2 border border-border bg-card text-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted transition-colors"
            >
              <Upload className="w-4 h-4" /> Upload Your Heritage Photo
            </Link>
          </motion.div>
        </section>

        {/* Best For */}
        <motion.section initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-5">Best For</h2>
          <ul className="space-y-3">
            {BEST_FOR.map(item => (
              <li key={item} className="flex items-start gap-3 text-foreground/80">
                <span className="mt-0.5 inline-flex w-5 h-5 rounded-full bg-secondary/20 text-secondary items-center justify-center shrink-0">
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </motion.section>

        {/* Plan Your Visit */}
        <motion.section
          initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
          className="rounded-2xl bg-primary text-primary-foreground p-8 md:p-10 text-center space-y-5"
        >
          <h2 className="text-2xl sm:text-3xl font-serif font-bold">Plan Your Visit</h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto leading-relaxed">
            Use Dropolis.net as a starting point for your visit. Browse the villages, read local news, explore
            photographs, open the interactive map and discover stories from the community.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/en/villages/"
              className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-6 py-3 rounded-xl text-sm font-bold hover:bg-secondary/90 transition-colors shadow-sm"
            >
              Start Exploring Dropolis <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/en/"
              className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-white/20 transition-colors"
            >
              English Home
            </Link>
          </div>
        </motion.section>

      </main>
    </div>
  );
}
