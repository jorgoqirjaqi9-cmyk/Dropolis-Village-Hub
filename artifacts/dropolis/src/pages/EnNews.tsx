import { Link } from "wouter";
import { SEO } from "@/components/SEO";
import { motion } from "framer-motion";
import { Newspaper } from "lucide-react";

const fade = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const categories = [
  { el: "Τοπικά Νέα", en: "Local news — municipal decisions, infrastructure, local events" },
  { el: "Πολιτισμός", en: "Culture — festivals, traditions, music, village celebrations" },
  { el: "Ομογένεια", en: "Diaspora — news relevant to Greeks from Dropull living abroad" },
  { el: "Τουρισμός", en: "Tourism — travel to the region, accommodation, routes" },
  { el: "Αλβανία", en: "Albania — national politics and policies affecting the Greek minority" },
  { el: "Ελλάδα", en: "Greece — news from Greece relevant to the community" },
];

export default function EnNews() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl space-y-10">
      <SEO
        title="News from Dropull, Northern Epirus"
        description="Guide to Dropolis news coverage — what we report on, news categories, and how to find articles about the Greek minority of Dropull, Northern Epirus."
        breadcrumbs={[{ name: "English", url: "/en/" }, { name: "News", url: "/en/news/" }]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "News from Dropull — Dropolis",
          description: "Guide to news coverage about Dropull and the Greek minority of Northern Epirus.",
          url: "https://dropolis.net/en/news/",
          inLanguage: "en",
        }}
        hreflang={[
          { lang: "el-GR", href: "https://dropolis.net/news/" },
          { lang: "en",    href: "https://dropolis.net/en/news/" },
          { lang: "x-default", href: "https://dropolis.net/news/" },
        ]}
      />

      <motion.header initial="hidden" animate="show" variants={fade}>
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary/70 bg-primary/8 px-3 py-1.5 rounded-full mb-4">
          <Newspaper size={12} /> News
        </div>
        <h1 className="text-4xl font-serif font-bold text-foreground mb-3">News from Dropull</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Dropolis covers news from and about the Dropull municipality and the broader Greek minority community in Albania. Articles are published in Greek — this page explains what we cover and how to navigate the news section.
        </p>
      </motion.header>

      <div className="space-y-6">
        <motion.section initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-4">What we cover</h2>
          <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
            News is aggregated from Greek-language media via RSS and, in some cases, translated from Albanian sources. Every article credits its original source. We also accept news tips and local reports from community members.
          </p>
          <div className="glass-card rounded-2xl divide-y divide-border/50">
            {categories.map(({ el, en }) => (
              <div key={el} className="flex items-start gap-4 p-4">
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0 mt-0.5">{el}</span>
                <span className="text-sm text-muted-foreground">{en}</span>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-3">Translation and AI</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Articles originally in Albanian or English are machine-translated into Greek using AI, then reviewed for quality before publication. The original source and language are always credited. We do not present AI-generated text as original reporting.
          </p>
        </motion.section>
      </div>

      <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade} className="glass-card rounded-2xl p-6 flex flex-col sm:flex-row gap-4 items-start">
        <div className="flex-grow">
          <h3 className="font-serif font-bold text-foreground mb-1">Browse the news archive</h3>
          <p className="text-sm text-muted-foreground">All articles are in Greek. You can use the category filter to narrow results.</p>
        </div>
        <Link href="/news/" className="shrink-0 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors">
          Open news →
        </Link>
      </motion.div>
    </div>
  );
}
