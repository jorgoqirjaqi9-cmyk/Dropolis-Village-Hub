import { Link } from "wouter";
import { SEO } from "@/components/SEO";
import { motion } from "framer-motion";
import { Image, Camera, ArrowRight } from "lucide-react";

const fade = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const themes = [
  { title: "Village Life", desc: "Daily life, streets, churches, and community gatherings from the 41 villages of Dropull." },
  { title: "Landscapes", desc: "The mountain valleys, rivers, and seasonal scenery of the Drino River corridor in southern Albania." },
  { title: "Cultural Heritage", desc: "Traditional costumes, festivals, Orthodox religious celebrations, and historical sites." },
  { title: "Historical Archive", desc: "Digitized photographs from the Greek community's history — schools, families, and village landmarks across decades." },
];

export default function EnPhotos() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl space-y-10">
      <SEO
        title="Photo Gallery — Dropull Villages"
        description="Browse photographs from the 41 villages of Dropull, Northern Epirus — landscapes, village life, cultural heritage, and the Greek minority communities of southern Albania."
        breadcrumbs={[{ name: "English", url: "/en" }, { name: "Photos", url: "/en/photos" }]}
        hreflang={[
          { lang: "el-GR", href: "https://dropolis.net/photos" },
          { lang: "en",    href: "https://dropolis.net/en/photos" },
          { lang: "x-default", href: "https://dropolis.net/photos" },
        ]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ImageGallery",
          name: "Photo Gallery — Dropull Villages",
          description: "Photographs from the 41 Greek minority villages of Dropull, Northern Epirus, Albania.",
          url: "https://dropolis.net/en/photos",
          inLanguage: "en",
          about: {
            "@type": "Place",
            name: "Dropull",
            alternateName: ["Δρόπολη", "Dropoli"],
            containedInPlace: {
              "@type": "Country",
              name: "Albania",
            },
          },
        }}
      />

      <motion.header initial="hidden" animate="show" variants={fade}>
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary/70 bg-primary/8 px-3 py-1.5 rounded-full mb-4">
          🇬🇧 English · Photos
        </div>
        <h1 className="text-4xl font-serif font-bold text-foreground mb-4">
          Photo Gallery — Dropull Villages
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          A visual archive of the 41 villages of Dropull municipality in southern Albania — home to one of the oldest continuous Greek-speaking communities in the world. Browse landscapes, village life, cultural celebrations, and historical photographs.
        </p>
      </motion.header>

      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
        className="space-y-4"
      >
        <h2 className="text-xl font-semibold text-foreground mb-2">What you'll find</h2>
        {themes.map(({ title, desc }, i) => (
          <motion.div
            key={i}
            variants={fade}
            className="glass-card rounded-xl p-5 flex gap-4 items-start"
          >
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              {i % 2 === 0 ? <Image className="w-4 h-4 text-primary" /> : <Camera className="w-4 h-4 text-primary" />}
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground mb-1">{title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.section>

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        variants={fade}
        className="rounded-2xl bg-primary/5 border border-primary/10 p-6 text-center space-y-4"
      >
        <p className="text-muted-foreground text-sm leading-relaxed">
          The full photo gallery — including filters by village — is available in the Greek-language section of the site.
        </p>
        <Link
          href="/photos"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Browse the full gallery
          <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        variants={fade}
        className="rounded-2xl border border-border/60 p-6 space-y-3"
      >
        <h2 className="font-semibold text-foreground">Submit a photo</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Have a photograph from Dropull — historic or recent? We welcome community submissions.
          Send your images to{" "}
          <a href="mailto:info@dropolis.net" className="text-primary underline underline-offset-4">
            info@dropolis.net
          </a>{" "}
          with a short caption and the village name.
        </p>
        <p className="text-xs text-muted-foreground">
          See also:{" "}
          <Link href="/en" className="text-primary hover:underline">English overview</Link>
          {" · "}
          <Link href="/en/villages" className="text-primary hover:underline">Villages</Link>
          {" · "}
          <Link href="/en/contact" className="text-primary hover:underline">Contact</Link>
        </p>
      </motion.div>
    </div>
  );
}
