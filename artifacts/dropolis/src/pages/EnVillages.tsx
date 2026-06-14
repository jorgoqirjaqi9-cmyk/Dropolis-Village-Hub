import { Link } from "wouter";
import { SEO } from "@/components/SEO";
import { motion } from "framer-motion";

const fade = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };


export default function EnVillages() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl space-y-10">
      <SEO
        title="The 41 Villages of Dropull, Northern Epirus"
        description="Explore the 41 villages of the Dropull municipality in southern Albania — geography, history, and the Greek minority heritage of Northern Epirus."
        breadcrumbs={[{ name: "English", url: "/en" }, { name: "Villages", url: "/en/villages" }]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "The 41 Villages of Dropull",
          description: "The villages of the Dropull municipality in southern Albania, home to the Greek minority of Northern Epirus.",
          url: "https://dropolis.net/en/villages",
          inLanguage: "en",
          numberOfItems: 41,
        }}
      />

      <motion.header initial="hidden" animate="show" variants={fade}>
        <h1 className="text-4xl font-serif font-bold text-foreground mb-3">The 41 Villages of Dropull</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          The Dropull municipality in Gjirokastër County, southern Albania, contains 41 villages — most of them historically Greek-speaking. Together they form a distinct cultural landscape in a region often called Northern Epirus.
        </p>
      </motion.header>

      <div className="prose prose-neutral dark:prose-invert max-w-none text-foreground/80 leading-relaxed space-y-5">
        <motion.section initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-3">Geography</h2>
          <p>
            Dropull occupies the Drinos river valley and the surrounding hills between Gjirokastër (Argirocastro) and the Greek border at Kakavia. The terrain varies from fertile valley floor to mountainous slopes, giving each village a distinct character and microclimate. The Greek town of Ioannina lies just across the border.
          </p>
        </motion.section>

        <motion.section initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-3">Language and culture</h2>
          <p>
            Greek has been spoken in these villages for centuries. After the fall of the communist regime in Albania (1990), tens of thousands emigrated — mostly to Greece — but a significant community remains, and many maintain strong ties to their villages. The Orthodox Christian faith is central to community identity: village churches, name-day feasts, and Easter celebrations continue to bring people together across borders.
          </p>
        </motion.section>
      </div>

      <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade} className="glass-card rounded-2xl p-6 space-y-3">
        <p className="text-sm text-muted-foreground">
          The full village directory, with individual pages for each of the 41 villages (in Greek), is available on the main site:
        </p>
        <Link href="/villages" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors">
          View village directory (Greek) →
        </Link>
      </motion.div>
    </div>
  );
}
