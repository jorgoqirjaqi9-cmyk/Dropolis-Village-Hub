import { Link } from "wouter";
import { SEO } from "@/components/SEO";
import { motion } from "framer-motion";
import { Newspaper, MapPin, Globe, Mail } from "lucide-react";

const fade = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const sections = [
  { icon: Newspaper, title: "News", desc: "Greek-language news from Dropull — local events, politics affecting the minority, cultural life.", href: "/en/news", cta: "Browse news coverage" },
  { icon: MapPin, title: "41 Villages", desc: "Explore the villages of Dropull municipality — history, geography, and the Greek communities that call them home.", href: "/en/villages", cta: "Explore the villages" },
  { icon: Globe, title: "About Dropolis", desc: "Learn who we are, what we cover, and why this community platform exists.", href: "/en/about", cta: "About us" },
  { icon: Mail, title: "Contact", desc: "Submit a news tip, photo, or reach us for any inquiry. We respond to English messages.", href: "/en/contact", cta: "Get in touch" },
];

export default function EnIndex() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl space-y-14">
      <SEO
        title="Dropolis — Northern Epirus News Portal (English)"
        description="English-language guide to Dropolis — the digital community portal for Dropull (Northern Epirus, Albania) and the Greek minority villages."
        breadcrumbs={[{ name: "English", url: "/en" }]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Dropolis — Northern Epirus in English",
          description: "English-language portal for Dropull, Northern Epirus. News, villages, and community from the Greek minority of Albania.",
          url: "https://dropolis.net/en",
          inLanguage: "en",
        }}
      />

      <motion.header initial="hidden" animate="show" variants={fade} className="text-center space-y-5">
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary/70 bg-primary/8 px-3 py-1.5 rounded-full">
          🇬🇧 English
        </div>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground leading-tight">
          Dropolis — The Digital Voice<br />of Northern Epirus
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
          Dropolis is a community news portal covering the 41 villages of the Dropull municipality in southern Albania — home to one of the oldest continuous Greek-speaking communities in the world.
        </p>
        <p className="text-sm text-muted-foreground">
          The site is primarily in Greek. This section is for English-speaking visitors, researchers, and diaspora members.
        </p>
      </motion.header>

      <div className="grid sm:grid-cols-2 gap-5">
        {sections.map(({ icon: Icon, title, desc, href, cta }, i) => (
          <motion.div
            key={href}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { delay: i * 0.1 } } }}
            className="glass-card rounded-2xl p-6 flex flex-col gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-grow">
              <h2 className="font-serif text-xl font-bold text-foreground mb-2">{title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
            <Link href={href} className="text-primary text-sm font-medium hover:underline mt-1">
              {cta} →
            </Link>
          </motion.div>
        ))}
      </div>

      <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade} className="glass-card rounded-2xl p-6 text-center space-y-3">
        <p className="text-sm text-muted-foreground">
          To access the full Greek-language site, use the language switcher in the top navigation bar, or go directly to{" "}
          <Link href="/" className="text-primary hover:underline font-medium">the homepage</Link>.
        </p>
      </motion.div>
    </div>
  );
}
