import { Link } from "wouter";
import { SEO } from "@/components/SEO";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

const fade = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function EnAbout() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl space-y-10">
      <SEO
        title="About Dropolis"
        description="Learn about Dropolis — the digital community platform for the 41 villages of Dropull, Northern Epirus, covering news, history and culture of the Greek minority in Albania."
        breadcrumbs={[{ name: "English", url: "/en" }, { name: "About", url: "/en/about" }]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: "About Dropolis",
          description: "Community news portal for the Greek-speaking villages of Dropull, Northern Epirus.",
          url: "https://dropolis.net/en/about",
          inLanguage: "en",
        }}
        hreflang={[
          { lang: "el-GR", href: "https://dropolis.net/about" },
          { lang: "en",    href: "https://dropolis.net/en/about" },
          { lang: "x-default", href: "https://dropolis.net/about" },
        ]}
      />

      <motion.header initial="hidden" animate="show" variants={fade}>
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary/70 bg-primary/8 px-3 py-1.5 rounded-full mb-4">
          <MapPin size={12} /> Dropull · Northern Epirus
        </div>
        <h1 className="text-4xl font-serif font-bold text-foreground mb-3">About Dropolis</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Dropolis is a volunteer-run, community-funded news and culture portal dedicated to the Greek-speaking villages of the Dropull municipality in southern Albania.
        </p>
      </motion.header>

      <div className="prose prose-neutral dark:prose-invert max-w-none text-foreground/80 leading-relaxed space-y-5">
        <motion.section initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-3">What is Dropull?</h2>
          <p>
            Dropull (Greek: Δρόπολη) is a municipality in the Gjirokastër County of southern Albania. It encompasses 41 villages that are home to one of the oldest documented Greek-speaking communities outside modern Greece, with a continuous presence stretching back more than two thousand years.
          </p>
          <p>
            The region is known in Greece as part of <em>Northern Epirus</em> — a term used by the Greek-speaking community to describe the territory of historic Epirus that falls within Albania's borders. Today, the Greek minority community here maintains its language, Orthodox Christian traditions, and distinct cultural identity despite decades of isolation under communist rule.
          </p>
        </motion.section>

        <motion.section initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-3">What Dropolis covers</h2>
          <p>
            The platform aggregates and publishes news relevant to the Dropull community: local governance, cultural events, news from the Greek minority press, stories about village life, photo archives, and video documentation. Content is primarily in Modern Greek (Demotic), as the platform serves a Greek-speaking readership. Some content is translated from Albanian sources when it directly affects the community.
          </p>
          <p>
            Dropolis also maintains an automated translation pipeline — articles from Albanian and English sources are machine-translated and reviewed before publication, with original sources always credited.
          </p>
        </motion.section>

        <motion.section initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-3">Who runs it?</h2>
          <p>
            Dropolis is maintained by a small team of volunteers — residents, diaspora members, and friends of the Dropull community. The platform is not affiliated with any political party, government body, or external organisation. Revenue comes from Google AdSense display advertising.
          </p>
        </motion.section>
      </div>

      <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade} className="flex flex-wrap gap-3">
        <Link href="/en/villages" className="bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors">
          Explore the villages
        </Link>
        <Link href="/en/news" className="border border-border text-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:bg-muted transition-colors">
          News coverage
        </Link>
        <Link href="/en/contact" className="border border-border text-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:bg-muted transition-colors">
          Contact us
        </Link>
      </motion.div>
    </div>
  );
}
