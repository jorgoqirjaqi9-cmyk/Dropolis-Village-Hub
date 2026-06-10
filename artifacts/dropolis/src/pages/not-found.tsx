import { Link } from "wouter";
import { SEO } from "@/components/SEO";
import { Home, ArrowLeft, Search, Newspaper, MapPin } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-16">
      <SEO
        title="Σελίδα δεν βρέθηκε"
        description="Η σελίδα που ζητήσατε δεν υπάρχει. Επιστρέψτε στην αρχική σελίδα του Dropolis."
        noindex={true}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-lg w-full"
      >
        <div className="relative mb-8 mx-auto w-fit">
          <span className="text-[9rem] font-serif font-black text-primary/10 dark:text-primary/5 select-none leading-none block">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <Search className="w-16 h-16 text-primary/30" />
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-3">
          Η σελίδα δεν βρέθηκε
        </h1>
        <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
          Η διεύθυνση που ζητήσατε δεν υπάρχει ή έχει μετακινηθεί.<br className="hidden sm:block" />
          Δοκιμάστε μία από τις παρακάτω επιλογές.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <Link href="/">
            <div className="glass-card rounded-xl p-4 flex flex-col items-center gap-2 hover:border-primary/40 transition-colors cursor-pointer group">
              <Home className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-sm font-semibold">Αρχική</span>
            </div>
          </Link>
          <Link href="/news">
            <div className="glass-card rounded-xl p-4 flex flex-col items-center gap-2 hover:border-primary/40 transition-colors cursor-pointer group">
              <Newspaper className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-sm font-semibold">Ειδήσεις</span>
            </div>
          </Link>
          <Link href="/villages">
            <div className="glass-card rounded-xl p-4 flex flex-col items-center gap-2 hover:border-primary/40 transition-colors cursor-pointer group">
              <MapPin className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-sm font-semibold">Χωριά</span>
            </div>
          </Link>
        </div>

        <Link href="/">
          <button className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Επιστροφή στην αρχική
          </button>
        </Link>
      </motion.div>
    </div>
  );
}
