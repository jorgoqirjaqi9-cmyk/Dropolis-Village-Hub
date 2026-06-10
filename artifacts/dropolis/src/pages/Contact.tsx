import { useState } from "react";
import { SEO } from "@/components/SEO";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone, Send, CheckCircle } from "lucide-react";

const fade = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const faqItems = [
  { q: "Πώς μπορώ να υποβάλω άρθρο;", a: "Στείλτε μας το άρθρο σας μέσω της φόρμας ή στο email μας. Δεχόμαστε άρθρα σχετικά με τη Δρόπολη, την ιστορία, τον πολιτισμό και τον τουρισμό." },
  { q: "Σε πόσο χρόνο θα λάβω απάντηση;", a: "Απαντάμε συνήθως εντός 1-2 εργάσιμων ημερών." },
  { q: "Μπορώ να στείλω φωτογραφίες;", a: "Ναι! Αποδεχόμαστε φωτογραφίες από τα χωριά της Δρόπολης. Αναφέρετε τον τόπο, την ημερομηνία και τυχόν πληροφορίες για τη φωτογραφία." },
  { q: "Συνεργάζεστε με τουριστικούς φορείς;", a: "Ναι, είμαστε ανοιχτοί σε συνεργασίες με τουριστικές επιχειρήσεις, πολιτιστικούς φορείς και ΜΚΟ που δραστηριοποιούνται στη Β. Ήπειρο." },
];

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1000);
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map(f => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-12 max-w-5xl">
      <SEO
        title="Επικοινωνία"
        description="Επικοινωνήστε με το Dropolis. Υποβολή άρθρων, φωτογραφιών, ερωτήσεων και συνεργασιών για το portal της Δρόπολης."
        breadcrumbs={[{ name: "Επικοινωνία", url: "/contact" }]}
        jsonLd={faqLd}
      />

      {/* Hero */}
      <motion.header initial="hidden" animate="show" variants={fade}
        className="relative rounded-3xl overflow-hidden bg-primary text-primary-foreground p-10 md:p-14 shadow-2xl text-center"
      >
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 50% 50%, white 0%, transparent 65%)" }} />
        <div className="relative">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-3">Επικοινωνήστε μαζί μας</h1>
          <p className="text-primary-foreground/80 text-lg max-w-xl mx-auto">Ερωτήσεις, συνεργασίες, υποβολή περιεχομένου — είμαστε εδώ για εσάς.</p>
        </div>
      </motion.header>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Contact Info */}
        <motion.aside initial="hidden" animate="show" variants={fade} className="space-y-6">
          <h2 className="text-xl font-serif font-bold text-foreground">Στοιχεία Επικοινωνίας</h2>

          <div className="space-y-4">
            {[
              { icon: Mail, label: "Email", value: "info@dropolis.gr", href: "mailto:info@dropolis.gr" },
              { icon: Phone, label: "Τηλέφωνο", value: "+30 26530 00000", href: "tel:+302653000000" },
              { icon: MapPin, label: "Τοποθεσία", value: "Δρόπολη, Νομός Αργυροκάστρου, Αλβανία", href: undefined },
            ].map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="flex items-start gap-3 glass-card rounded-xl p-4">
                <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
                  {href ? (
                    <a href={href} className="text-sm text-foreground hover:text-primary transition-colors">{value}</a>
                  ) : (
                    <p className="text-sm text-foreground">{value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="glass-card rounded-xl p-5 space-y-2">
            <p className="font-semibold text-foreground text-sm">Ώρες Επικοινωνίας</p>
            <p className="text-xs text-muted-foreground">Δευτέρα – Παρασκευή<br />09:00 – 17:00 (EET)</p>
          </div>
        </motion.aside>

        {/* Form */}
        <motion.div initial="hidden" animate="show" variants={{ ...fade, show: { ...fade.show, transition: { duration: 0.5, delay: 0.1 } } }}
          className="md:col-span-2"
        >
          {submitted ? (
            <div className="glass-card rounded-2xl p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-foreground">Σας ευχαριστούμε!</h2>
              <p className="text-muted-foreground">Το μήνυμά σας ελήφθη. Θα σας απαντήσουμε εντός 1-2 εργάσιμων ημερών.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-8 space-y-5">
              <h2 className="text-xl font-serif font-bold text-foreground">Στείλτε μήνυμα</h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">Ονοματεπώνυμο *</label>
                  <input
                    id="name" type="text" required
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                    placeholder="Γιώργος Παπαδόπουλος"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">Email *</label>
                  <input
                    id="email" type="email" required
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-1.5">Θέμα *</label>
                <select
                  id="subject" required
                  value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                >
                  <option value="">Επιλέξτε θέμα...</option>
                  <option value="article">Υποβολή Άρθρου</option>
                  <option value="photo">Υποβολή Φωτογραφίας</option>
                  <option value="video">Υποβολή Βίντεο</option>
                  <option value="partner">Συνεργασία</option>
                  <option value="correction">Διόρθωση Λάθους</option>
                  <option value="other">Άλλο</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-foreground mb-1.5">Μήνυμα *</label>
                <textarea
                  id="message" required rows={5}
                  value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition resize-none"
                  placeholder="Γράψτε το μήνυμά σας..."
                />
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {loading ? "Αποστολή..." : <><Send size={16} /> Αποστολή Μηνύματος</>}
              </button>
            </form>
          )}
        </motion.div>
      </div>

      {/* FAQ */}
      <motion.section initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade} className="space-y-6">
        <h2 className="text-2xl font-serif font-bold text-foreground">Συχνές Ερωτήσεις</h2>
        <div className="space-y-3">
          {faqItems.map(({ q, a }) => (
            <details key={q} className="glass-card rounded-xl p-5 group cursor-pointer">
              <summary className="font-semibold text-foreground list-none flex justify-between items-center gap-4">
                {q}
                <span className="text-primary shrink-0 text-xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
