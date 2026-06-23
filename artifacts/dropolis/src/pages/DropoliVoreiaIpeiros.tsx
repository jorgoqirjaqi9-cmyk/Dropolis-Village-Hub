import { Link } from "wouter";
import { SEO } from "@/components/SEO";
import {
  MapPin, Map, Image, Users, Music, Mountain,
  Globe, Newspaper, Camera, Video, Send, ChevronRight,
} from "lucide-react";

const BASE_URL = "https://dropolis.net";
const OG_IMAGE = `${BASE_URL}/og-home.jpg`;

export default function DropoliVoreiaIpeiros() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-16 max-w-4xl">
      <SEO
        title="Δρόπολη & Βόρεια Ήπειρος: 41 Χωριά, Ιστορία και Πολιτισμός"
        description="Ανακαλύψτε τη Δρόπολη και τη Βόρεια Ήπειρο: τα 41 ελληνικά χωριά, την ιστορία, την παράδοση, την ομογένεια, τα αξιοθέατα και τα νέα της περιοχής."
        image={OG_IMAGE}
        standalone
        breadcrumbs={[{ name: "Δρόπολη & Βόρεια Ήπειρος", url: "/dropoli-voreia-ipeiros/" }]}
        hreflang={[
          { lang: "el-GR",    href: `${BASE_URL}/dropoli-voreia-ipeiros/` },
          { lang: "x-default", href: `${BASE_URL}/dropoli-voreia-ipeiros/` },
        ]}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": `${BASE_URL}/dropoli-voreia-ipeiros/`,
            name: "Δρόπολη & Βόρεια Ήπειρος: 41 Χωριά, Ιστορία και Πολιτισμός",
            description: "Ανακαλύψτε τη Δρόπολη και τη Βόρεια Ήπειρο: τα 41 ελληνικά χωριά, την ιστορία, την παράδοση, την ομογένεια, τα αξιοθέατα και τα νέα της περιοχής.",
            url: `${BASE_URL}/dropoli-voreia-ipeiros/`,
            inLanguage: "el",
            isPartOf: { "@id": `${BASE_URL}/#website` },
            image: { "@type": "ImageObject", url: OG_IMAGE },
            about: {
              "@type": "TouristDestination",
              name: "Δρόπολη",
              description: "Ιστορική περιοχή στη νότια Αλβανία με ισχυρή παρουσία της ελληνικής μειονότητας.",
              containedInPlace: { "@type": "Country", name: "Αλβανία" },
              touristType: [
                { "@type": "Audience", audienceType: "Cultural tourists" },
                { "@type": "Audience", audienceType: "Greek diaspora" },
              ],
            },
            publisher: {
              "@type": "NewsMediaOrganization",
              "@id": `${BASE_URL}/#organization`,
              name: "Dropolis",
              url: BASE_URL,
              logo: { "@type": "ImageObject", url: `${BASE_URL}/logo.webp` },
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Αρχική", item: BASE_URL },
              { "@type": "ListItem", position: 2, name: "Δρόπολη & Βόρεια Ήπειρος", item: `${BASE_URL}/dropoli-voreia-ipeiros/` },
            ],
          },
        ]}
      />

      {/* Hero */}
      <header className="relative rounded-3xl overflow-hidden bg-primary text-primary-foreground min-h-[320px] flex items-end">
        <div className="absolute inset-0 opacity-15"
          style={{ backgroundImage: "radial-gradient(circle at 30% 60%, white 0%, transparent 55%)" }} />
        <img
          src={OG_IMAGE}
          alt="Χωριά της Δρόπολης στη Βόρεια Ήπειρο — πανοραμική θέα"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
          loading="eager"
        />
        <div className="relative z-10 p-8 md:p-14">
          <div className="flex items-center gap-2 text-secondary text-xs font-bold uppercase tracking-widest mb-3">
            <MapPin className="w-3.5 h-3.5" />
            Δήμος Δρόπολης · Νομός Αργυροκάστρου · Αλβανία
          </div>
          <h1 className="text-3xl md:text-5xl font-serif font-bold leading-tight max-w-2xl">
            Δρόπολη &amp; Βόρεια Ήπειρος: Τα 41 Χωριά, η Ιστορία και ο Πολιτισμός
          </h1>
          <p className="mt-4 text-primary-foreground/80 text-lg max-w-2xl leading-relaxed">
            Ένας πλήρης οδηγός για τη Δρόπολη — τη γη των 41 ελληνικών χωριών, την κοιτίδα
            της ελληνικής μειονότητας στη Βόρεια Ήπειρο.
          </p>
        </div>
      </header>

      {/* Τι είναι η Δρόπολη */}
      <section aria-labelledby="ti-einai-dropoli">
        <h2 id="ti-einai-dropoli" className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-6 pb-2 border-b-2 border-primary inline-block">
          Τι είναι η Δρόπολη
        </h2>
        <div className="prose prose-lg dark:prose-invert max-w-none text-foreground/85 leading-relaxed space-y-4">
          <p>
            Η <strong>Δρόπολη</strong> (αλβανικά: <em>Dropull</em>, αρχαιοελληνικά: <em>Δρόπολις</em>) είναι ιστορική
            περιοχή και σύγχρονος δήμος στον νομό Αργυροκάστρου της νότιας Αλβανίας. Βρίσκεται στην κοιλάδα
            του ποταμού <strong>Δρίνου</strong>, ανάμεσα στα βουνά της Μουργκάνας και των Λιάπηδων, σε απόσταση
            περίπου 25 χιλιομέτρων από το κέντρο του <strong>Αργυροκάστρου</strong>.
          </p>
          <p>
            Αποτελεί ένα από τα σπουδαιότερα κέντρα της <strong>ελληνικής μειονότητας στην Αλβανία</strong>,
            με αδιάλειπτη ελληνική παρουσία από την αρχαιότητα. Οι κάτοικοι μιλούν ελληνικά ως μητρική γλώσσα,
            τηρούν ορθόδοξα χριστιανικά έθιμα και διατηρούν ζωντανή μια ξεχωριστή πολιτιστική ταυτότητα
            που τη διαμόρφωσαν αιώνες ιστορίας, κατάκτησης και αντίστασης.
          </p>
          <p>
            Η Δρόπολη ανήκει γεωγραφικά και ιστορικά στη <strong>Βόρεια Ήπειρο</strong> — μια ευρύτερη
            γεωγραφική και πολιτιστική ενότητα στη νότια Αλβανία που συνδέεται με τις ελληνικές ρίζες
            της Ηπείρου. Σήμερα η περιοχή συνδέεται εύκολα με ελληνικά σύνορα μέσω της διάβασης
            της <strong>Κακαβιάς</strong>, και αποτελεί δημοφιλή προορισμό για Έλληνες της διασποράς
            που επισκέπτονται τα χωριά της καταγωγής τους.
          </p>
        </div>
      </section>

      {/* Τα 41 χωριά */}
      <section aria-labelledby="ta-41-xoria">
        <h2 id="ta-41-xoria" className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-6 pb-2 border-b-2 border-primary inline-block">
          Τα 41 Χωριά της Δρόπολης
        </h2>
        <div className="prose prose-lg dark:prose-invert max-w-none text-foreground/85 leading-relaxed space-y-4">
          <p>
            Ο Δήμος Δρόπολης περιλαμβάνει συνολικά <strong>41 χωριά</strong>, κατανεμημένα σε τρεις
            δημοτικές ενότητες. Κάθε χωριό έχει τη δική του ξεχωριστή ιστορία, χαρακτήρα και παράδοση —
            από τα μεγάλα κεφαλοχώρια που εξακολουθούν να κατοικούνται, ως τα μικρότερα ορεινά χωριά
            που διατηρούν αναλλοίωτη τη βυζαντινή αρχιτεκτονική τους.
          </p>
          <p>
            Ανάμεσα στα πιο γνωστά <strong>ελληνικά χωριά της Αλβανίας</strong> ξεχωρίζουν η
            <strong> Δερβιτσάνη</strong>, με την εκπληκτική εκκλησία και την πολύφωνη χορωδία της,
            τα <strong>Βουλιαράτες</strong>, κέντρο της ελληνοαλβανικής κοινότητας,
            η <strong>Βόδριστα</strong> και η <strong>Βρυσερά</strong>, με τα
            παραδοσιακά πέτρινα σπίτια και τις κρύες πηγές. Τα <strong>Γιωργουτσάτες</strong>
            (Gjergucatë) αποτελούν το διοικητικό κέντρο του Δήμου, ενώ η <strong>Κακαβιά</strong>
            λειτουργεί ως πύλη εισόδου από και προς την Ελλάδα.
          </p>
          <p>
            Τα χωριά του Δήμου Δρόπολης — γνωστά διεθνώς και ως <em>Dropull villages</em> ή
            <em> Gjirokastër villages</em> — αποτελούν αντικείμενο ιστορικής και πολιτισμικής μελέτης
            για τους ερευνητές της Βόρειας Ηπείρου και της ελληνικής μειονότητας.
          </p>
          <div className="flex flex-wrap gap-3 not-prose mt-6">
            <Link
              href="/villages/"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors text-sm"
            >
              <Users className="w-4 h-4" />
              Εξερευνήστε τα 41 χωριά
            </Link>
            <Link
              href="/villages/map/"
              className="inline-flex items-center gap-2 border border-primary text-primary px-5 py-2.5 rounded-xl font-semibold hover:bg-primary/5 transition-colors text-sm"
            >
              <Map className="w-4 h-4" />
              Διαδραστικός χάρτης
            </Link>
          </div>
        </div>
      </section>

      {/* Ιστορία */}
      <section aria-labelledby="istoria-voreia-ipeiros">
        <h2 id="istoria-voreia-ipeiros" className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-6 pb-2 border-b-2 border-primary inline-block">
          Ιστορία της Βόρειας Ηπείρου και της Ελληνικής Μειονότητας
        </h2>
        <div className="prose prose-lg dark:prose-invert max-w-none text-foreground/85 leading-relaxed space-y-4">
          <p>
            Η <strong>Βόρεια Ήπειρος</strong> — η νότια Αλβανία ιστορικά — κατοικείται από ελληνόφωνους
            πληθυσμούς από την κλασική αρχαιότητα. Οι αρχαίοι Ηπειρώτες, συγγενείς των Μακεδόνων
            και των νότιων Ελλήνων, άφησαν βαθύ ίχνος στη γλώσσα, τα τοπωνύμια και τους θεσμούς
            της περιοχής.
          </p>
          <p>
            Κατά τη βυζαντινή περίοδο, η Δρόπολη ανήκε στο Δεσποτάτο της Ηπείρου. Εκείνη
            την εποχή ιδρύθηκαν πολλές από τις ορθόδοξες εκκλησίες που στέκουν ακόμα σήμερα
            στα χωριά. Με την οθωμανική κατάκτηση (15ος αι.) η περιοχή διατήρησε σε μεγάλο
            βαθμό τον ελληνικό της χαρακτήρα, χάρη στη δύναμη της Εκκλησίας και στη
            συνέχεια της γλώσσας.
          </p>
          <p>
            Το 1913, με τη <strong>Συνθήκη του Λονδίνου</strong>, η Βόρεια Ήπειρος περιήλθε στο
            νέο αλβανικό κράτος, παρά τις έντονες διαμαρτυρίες των ελληνόφωνων κατοίκων.
            Τη δεκαετία του 1990, με την κατάρρευση του κομμουνιστικού καθεστώτος στην Αλβανία,
            μεγάλος αριθμός <strong>Ελλήνων της Αλβανίας</strong> μετανάστευσε στην Ελλάδα,
            αδειάζοντας αρκετά χωριά. Ωστόσο, σήμερα παρατηρείται σταδιακή επιστροφή, με νέους
            ανθρώπους που επιλέγουν να ξαναζήσουν στα πατρογονικά χωριά τους.
          </p>
          <p>
            Η <strong>ελληνική μειονότητα της Αλβανίας</strong> — επίσημα αναγνωρισμένη από το
            αλβανικό κράτος — διατηρεί σχολεία, εκκλησίες και πολιτιστικούς συλλόγους.
            Η γλωσσική και πολιτιστική κληρονομιά παραμένει ζωντανή χάρη στη <em>Northern Epirus</em>
            κοινότητα σε Ελλάδα, Αμερική, Αυστραλία και Ευρώπη.
          </p>
        </div>
      </section>

      {/* Πολιτισμός */}
      <section aria-labelledby="politismos-paradosi">
        <h2 id="politismos-paradosi" className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-6 pb-2 border-b-2 border-primary inline-block">
          Πολιτισμός, Παράδοση και Πολυφωνικό Τραγούδι
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { icon: Music,    title: "Πολυφωνικό Τραγούδι", desc: "Η Βόρεια Ήπειρος αποτελεί κοιτίδα του πολυφωνικού τραγουδιού, ανεγνωρισμένου από την UNESCO ως άυλη πολιτιστική κληρονομιά." },
            { icon: Mountain, title: "Βυζαντινά Μνημεία",   desc: "Δεκάδες ορθόδοξες εκκλησίες, παλαιοχριστιανικοί ναοί και βυζαντινές τοιχογραφίες κοσμούν τα χωριά της Δρόπολης." },
            { icon: Users,    title: "Πανηγύρια & Έθιμα",   desc: "Από του Αγίου Βασιλείου ως της Παναγιάς, τα πανηγύρια της Δρόπολης φέρνουν κοντά κατοίκους, ομογενείς και επισκέπτες." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-card rounded-xl p-5 border border-card-border shadow-sm">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-serif font-bold text-base mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
        <div className="prose prose-lg dark:prose-invert max-w-none text-foreground/85 leading-relaxed space-y-4">
          <p>
            Από τα αρχαία χρόνια, η <strong>ηπειρώτικη παράδοση</strong> δεν υπήρξε ποτέ απλώς
            μια σειρά από έθιμα — ήταν ο τρόπος με τον οποίο οι κοινότητες επιβίωναν και επέμεναν.
            Το <strong>πολυφωνικό τραγούδι της Βόρειας Ηπείρου</strong>, με τις μακρόσυρτες
            φωνητικές γραμμές και τα αντίφωνα, ανακηρύχθηκε από την UNESCO μέρος της άυλης
            πολιτιστικής κληρονομιάς της ανθρωπότητας.
          </p>
          <p>
            Τα <strong>πανηγύρια της Δρόπολης</strong> είναι ακόμα οι μεγαλύτερες εορτές της
            περιοχής. Δεκάδες χωριά γιορτάζουν τον πολιούχο άγιό τους με λειτουργία, πολυφωνικά
            τραγούδια, παραδοσιακούς χορούς και γιορτινό τραπέζι. Οι <strong>ορθόδοξες εκκλησίες</strong>
            — πολλές χτισμένες τον 13ο-18ο αιώνα — φέρουν εντυπωσιακές τοιχογραφίες, ξυλόγλυπτα
            τέμπλα και βυζαντινά εικονίσματα.
          </p>
          <p>
            Η <strong>πολιτιστική κληρονομιά</strong> της Δρόπολης εκφράζεται επίσης στην
            παραδοσιακή αρχιτεκτονική: τα πέτρινα σπίτια με τα κεραμιδένια στέγαστρα και τα
            ξύλινα σαχνισιά αποτελούν στοιχεία βυζαντινής και οθωμανικής κληρονομιάς που
            παραμένουν σε αρκετά χωριά σε εξαιρετική κατάσταση.
          </p>
        </div>
      </section>

      {/* Ταξίδι */}
      <section aria-labelledby="taxidi-aksiotheata">
        <h2 id="taxidi-aksiotheata" className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-6 pb-2 border-b-2 border-primary inline-block">
          Ταξίδι και Αξιοθέατα στη Δρόπολη
        </h2>
        <div className="prose prose-lg dark:prose-invert max-w-none text-foreground/85 leading-relaxed space-y-4">
          <p>
            Το <strong>ταξίδι στη Δρόπολη</strong> είναι μια εμπειρία που συνδυάζει φυσική ομορφιά,
            ιστορία και ζεστή φιλοξενία. Η περιοχή ανήκει στο ευρύτερο <em>Southern Albania travel</em>
            δίκτυο, με πρόσβαση από την Ελλάδα μέσω Ιωαννίνων-Κακαβιάς (περίπου 45 λεπτά από τα
            ελληνικά σύνορα) ή από Αργυρόκαστρο (30 λεπτά).
          </p>
          <p>
            <strong>Τι να δω στη Δρόπολη:</strong> Αρχίστε από τη <strong>Δερβιτσάνη</strong>,
            με τη μεγάλη εκκλησία και τα πέτρινα σοκάκια. Επισκεφθείτε τα
            <strong> Βουλιαράτες</strong> για τη ζωηρή αγορά και τις ταβέρνες με παραδοσιακό φαγητό.
            Περάστε από <strong>Βόδριστα</strong>, <strong>Σωφράτικα</strong> και
            <strong> Ραντάτι</strong> για εκπληκτικά αρχιτεκτονικά δείγματα. Ανεβείτε στα ορεινά
            χωριά — <strong>Κρα</strong>, <strong>Λόγγος</strong>, <strong>Λοβίνα</strong> — για
            πανοραμική θέα σε ολόκληρη την κοιλάδα του Δρίνου.
          </p>
          <p>
            Τα <strong>αξιοθέατα της Δρόπολης</strong> δεν περιορίζονται στα χωριά. Το κάστρο
            του Αργυροκάστρου — ένα από τα μεγαλύτερα βυζαντινά κάστρα στα Βαλκάνια — βρίσκεται
            μόλις 25 χιλιόμετρα μακριά. Η περιοχή αποτελεί και κομμάτι των μεγάλων
            <em> Albania Greek villages travel</em> και <em>Gjirokastër district travel</em> διαδρομών.
          </p>
          <div className="flex flex-wrap gap-3 not-prose mt-4">
            <Link
              href="/en/travel-guide/"
              className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-5 py-2.5 rounded-xl font-semibold hover:bg-secondary/90 transition-colors text-sm"
            >
              <Globe className="w-4 h-4" />
              Travel Guide (English)
            </Link>
            <Link
              href="/photos/"
              className="inline-flex items-center gap-2 border border-secondary text-secondary px-5 py-2.5 rounded-xl font-semibold hover:bg-secondary/5 transition-colors text-sm"
            >
              <Image className="w-4 h-4" />
              Φωτογραφίες Δρόπολης
            </Link>
          </div>
        </div>
      </section>

      {/* Ομογένεια */}
      <section aria-labelledby="omogeneia-diaspora">
        <h2 id="omogeneia-diaspora" className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-6 pb-2 border-b-2 border-primary inline-block">
          Ομογένεια και Διασπορά
        </h2>
        <div className="prose prose-lg dark:prose-invert max-w-none text-foreground/85 leading-relaxed space-y-4">
          <p>
            Η μεγάλη έξοδος των <strong>Βορειοηπειρωτών</strong> προς την Ελλάδα, την Αμερική,
            την Αυστραλία και την Ευρώπη κατά τη δεκαετία του 1990 δεν έσβησε τους δεσμούς
            με τη γενέτειρα. Αντίθετα, η <strong>ελληνική ομογένεια της Αλβανίας</strong> έχει
            δημιουργήσει ισχυρούς συλλόγους και δίκτυα σε δεκάδες χώρες, που επαγρυπνούν για
            τα δικαιώματα της μειονότητας και ενισχύουν τις κοινότητες που παρέμειναν.
          </p>
          <p>
            Για όσους αναζητούν τις <strong>οικογενειακές ρίζες στη Βόρεια Ήπειρο</strong> —
            <em> family roots Northern Epirus</em> — το Dropolis αποτελεί το ψηφιακό αρχείο
            της κοινότητας: φωτογραφίες χωριών, ιστορίες οικογενειών, παλιές εκκλησιαστικές
            εγγραφές και προφορικές μαρτυρίες. Αν αναζητάτε στοιχεία για τη
            <strong> γενεαλογία στη Βόρεια Ήπειρο</strong> (<em>genealogy Northern Epirus</em>),
            βρίσκεστε στο σωστό μέρος.
          </p>
          <p>
            Η σελίδα <Link href="/diaspora/" className="text-primary hover:underline font-medium">Ομογένεια</Link> του
            Dropolis λειτουργεί ως σημείο συνάντησης Βορειοηπειρωτών απανταχού — ένα ψηφιακό
            σπίτι για κάθε οικογένεια που κράτησε ζωντανή τη σύνδεση με τη Δρόπολη.
          </p>
        </div>
      </section>

      {/* Νέα */}
      <section aria-labelledby="nea-enimerosi">
        <h2 id="nea-enimerosi" className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-6 pb-2 border-b-2 border-primary inline-block">
          Νέα και Ενημέρωση από τη Δρόπολη
        </h2>
        <div className="prose prose-lg dark:prose-invert max-w-none text-foreground/85 leading-relaxed space-y-4">
          <p>
            Το Dropolis παρακολουθεί και καταγράφει τα <strong>νέα της Δρόπολης</strong> και τις
            <strong> ειδήσεις της Βόρειας Ηπείρου</strong> σε πραγματικό χρόνο. Τοπικά γεγονότα,
            πολιτισμικές εκδηλώσεις, κοινοτικά ζητήματα και ειδήσεις για την
            <strong> ελληνική μειονότητα</strong> — όλα καταγράφονται εδώ ως ζωντανή ιστορία.
          </p>
          <p>
            Παράλληλα, το Dropolis συγκεντρώνει <em>Albania Greek minority news</em> και
            <em> Northern Epirus news</em> από διεθνείς πηγές, ώστε η κοινότητα να
            ενημερώνεται πρώτη για ό,τι αφορά τη Δρόπολη, το Αργυρόκαστρο και τη Βόρεια Ήπειρο.
          </p>
          <div className="flex flex-wrap gap-3 not-prose mt-4">
            <Link
              href="/news/"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors text-sm"
            >
              <Newspaper className="w-4 h-4" />
              Τελευταία Νέα
            </Link>
            <Link
              href="/submit-news/"
              className="inline-flex items-center gap-2 border border-primary text-primary px-5 py-2.5 rounded-xl font-semibold hover:bg-primary/5 transition-colors text-sm"
            >
              <Send className="w-4 h-4" />
              Στείλτε είδηση
            </Link>
          </div>
        </div>
      </section>

      {/* Φωτογραφίες, βίντεο & κοινότητα */}
      <section aria-labelledby="fotografies-koinotita">
        <h2 id="fotografies-koinotita" className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-6 pb-2 border-b-2 border-primary inline-block">
          Φωτογραφίες, Βίντεο και Συμμετοχή Κοινότητας
        </h2>
        <div className="prose prose-lg dark:prose-invert max-w-none text-foreground/85 leading-relaxed space-y-4">
          <p>
            Το Dropolis δεν είναι μόνο μια πηγή πληροφόρησης — είναι ένα ζωντανό αρχείο
            που χτίζεται από την ίδια την κοινότητα. Κάθε φωτογραφία ενός χωριού, κάθε
            βίντεο από πανηγύρι, κάθε ιστορία που μοιράζεστε προσθέτει ένα ακόμα κομμάτι
            στην ψηφιακή μνήμη της Δρόπολης.
          </p>
          <p>
            Ανεβάστε φωτογραφίες από το χωριό σας — τοπία, σπίτια, εκκλησίες, αγαπημένα
            πρόσωπα. Μοιραστείτε βίντεο από πανηγύρια, παραδοσιακούς χορούς ή απλές
            στιγμές καθημερινής ζωής. Στείλτε ειδήσεις και ιστορίες που αξίζουν να
            γνωρίζει η κοινότητα.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {[
            { href: "/upload-photo/",  icon: Camera,   label: "Ανέβασε φωτογραφία" },
            { href: "/photos/",        icon: Image,    label: "Δες τη γκαλερί" },
            { href: "/submit-video/",  icon: Video,    label: "Ανέβασε βίντεο" },
            { href: "/videos/",        icon: Globe,    label: "Δες τα βίντεο" },
          ].map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href}
              className="bg-card border border-card-border rounded-xl p-4 flex flex-col items-center gap-2 text-center hover:border-primary/50 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm font-medium leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section aria-labelledby="cta-arxeio" className="bg-primary text-primary-foreground rounded-3xl p-8 md:p-12">
        <div className="text-center mb-8">
          <h2 id="cta-arxeio" className="text-2xl md:text-3xl font-serif font-bold mb-3">
            Συμμετέχετε στο Αρχείο της Δρόπολης
          </h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto leading-relaxed">
            Κάθε φωτογραφία, κάθε ιστορία, κάθε είδηση που μοιράζεστε γίνεται μέρος
            του κοινού μας αρχείου. Η Δρόπολη ζει μέσα από την κοινότητά της.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/villages/"
            className="inline-flex items-center gap-2 bg-white text-primary px-5 py-3 rounded-xl font-semibold hover:bg-white/90 transition-colors text-sm"
          >
            <Users className="w-4 h-4" />
            Ανακαλύψτε τα χωριά
          </Link>
          <Link
            href="/upload-photo/"
            className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-5 py-3 rounded-xl font-semibold hover:bg-secondary/90 transition-colors text-sm"
          >
            <Camera className="w-4 h-4" />
            Ανεβάστε φωτογραφία
          </Link>
          <Link
            href="/submit-news/"
            className="inline-flex items-center gap-2 bg-white/15 border border-white/30 text-white px-5 py-3 rounded-xl font-semibold hover:bg-white/25 transition-colors text-sm"
          >
            <Send className="w-4 h-4" />
            Στείλτε είδηση
          </Link>
          <Link
            href="/villages/map/"
            className="inline-flex items-center gap-2 bg-white/15 border border-white/30 text-white px-5 py-3 rounded-xl font-semibold hover:bg-white/25 transition-colors text-sm"
          >
            <Map className="w-4 h-4" />
            Δείτε τον χάρτη
          </Link>
        </div>
      </section>

      {/* Related links */}
      <nav aria-label="Σχετικές σελίδες" className="border-t border-border pt-8">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Εξερευνήστε επίσης</p>
        <div className="flex flex-wrap gap-3">
          {[
            { href: "/ta-41-xoria-tis-dropolis/",  label: "Τα 41 Χωριά" },
            { href: "/diaspora/",                   label: "Ομογένεια" },
            { href: "/paradosiaka-faghta/",         label: "Παραδοσιακά Φαγητά" },
            { href: "/about/",                      label: "Σχετικά με το Dropolis" },
            { href: "/en/travel-guide/",            label: "Travel Guide (EN)" },
            { href: "/news/",                       label: "Νέα" },
            { href: "/photos/",                     label: "Φωτογραφίες" },
            { href: "/videos/",                     label: "Βίντεο" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex items-center gap-1.5 text-sm text-primary border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
