import { Link } from "wouter";
import { SEO } from "@/components/SEO";
import { motion } from "framer-motion";
import { Mail, Camera, Newspaper, HelpCircle } from "lucide-react";

const fade = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const reasons = [
  { icon: Newspaper, title: "News tips", desc: "Know something happening in Dropull that deserves coverage? Email us with the details — we respond in both Greek and English." },
  { icon: Camera, title: "Photo & historical submissions", desc: "Have photographs, documents, or stories from the villages? We'd love to hear from you. Include context about the location, date, and people in the image if known." },
  { icon: HelpCircle, title: "General enquiries", desc: "Research questions, interview requests, collaboration proposals, or any other matter — we'll get back to you within 1-2 working days." },
];

export default function EnContact() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl space-y-10">
      <SEO
        title="Contact Dropolis"
        description="Get in touch with the Dropolis team in English — news tips, photo submissions, research enquiries and partnership proposals."
        breadcrumbs={[{ name: "English", url: "/en" }, { name: "Contact", url: "/en/contact" }]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: "Contact Dropolis",
          description: "English-language contact page for the Dropolis community portal.",
          url: "https://dropolis.net/en/contact",
          inLanguage: "en",
        }}
        hreflang={[
          { lang: "el-GR", href: "https://dropolis.net/contact" },
          { lang: "en",    href: "https://dropolis.net/en/contact" },
          { lang: "x-default", href: "https://dropolis.net/contact" },
        ]}
      />

      <motion.header initial="hidden" animate="show" variants={fade}>
        <h1 className="text-4xl font-serif font-bold text-foreground mb-3">Contact Dropolis</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          We welcome messages in English. Whether you have a news tip, a photo to share, or a question about the Dropull community — we'll get back to you.
        </p>
      </motion.header>

      <div className="space-y-4">
        {reasons.map(({ icon: Icon, title, desc }, i) => (
          <motion.div
            key={title}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0, transition: { delay: i * 0.08 } } }}
            className="glass-card rounded-2xl p-5 flex gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground mb-1">{title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade} className="glass-card rounded-2xl p-6 border border-primary/15 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Mail className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="text-muted-foreground text-sm mb-2">Send your message to:</p>
          <a
            href="mailto:info@dropolis.net"
            className="text-xl font-semibold text-primary hover:underline"
          >
            info@dropolis.net
          </a>
        </div>
        <p className="text-xs text-muted-foreground">We reply in both Greek and English.</p>
        <div className="pt-1">
          <Link href="/contact/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Greek-language contact page →
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
