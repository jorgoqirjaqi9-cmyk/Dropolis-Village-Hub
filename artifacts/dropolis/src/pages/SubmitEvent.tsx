import { useState, useEffect } from "react";
import { useSearch, Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { SEO } from "@/components/SEO";
import { useListVillages } from "@workspace/api-client-react";
import { CheckCircle, Send, AlertCircle, CalendarDays } from "lucide-react";

type EventCreate = {
  title: string;
  eventDate: string;
  eventTime?: string;
  villageId?: number;
  location?: string;
  description: string;
  imageUrl?: string;
  contactInfo?: string;
  senderName: string;
  consentGiven: boolean;
  website?: string;
};

async function submitEventApi(data: EventCreate): Promise<{ id: number; status: string }> {
  const res = await fetch("/api/events/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? "Σφάλμα κατά την υποβολή.");
  }
  return res.json();
}

export default function SubmitEvent() {
  const search = useSearch();
  const { data: villages } = useListVillages();
  const paramVillageId = new URLSearchParams(search).get("villageId") ?? "";

  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [villageId, setVillageId] = useState<string>(paramVillageId);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [senderName, setSenderName] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);
  const [website, setWebsite] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => { if (paramVillageId) setVillageId(paramVillageId); }, [paramVillageId]);

  const { mutate, isPending } = useMutation({
    mutationFn: submitEventApi,
    onSuccess: () => setSubmitted(true),
    onError: (err) => setSubmitError(err instanceof Error ? err.message : "Σφάλμα κατά την υποβολή. Δοκιμάστε ξανά."),
  });

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (title.trim().length < 3) errs["title"] = "Ο τίτλος πρέπει να έχει τουλάχιστον 3 χαρακτήρες.";
    if (!eventDate) errs["eventDate"] = "Η ημερομηνία εκδήλωσης είναι υποχρεωτική.";
    if (description.trim().length < 20) errs["description"] = `Η περιγραφή πρέπει να έχει τουλάχιστον 20 χαρακτήρες (τώρα: ${description.trim().length}).`;
    if (senderName.trim().length < 2) errs["senderName"] = "Το όνομα πρέπει να έχει τουλάχιστον 2 χαρακτήρες.";
    if (imageUrl && !/^https?:\/\/.+/.test(imageUrl)) errs["imageUrl"] = "Μη έγκυρη διεύθυνση URL εικόνας.";
    if (!consentGiven) errs["consentGiven"] = "Πρέπει να αποδεχτείτε τους όρους υποβολής.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;
    mutate({
      title: title.trim(),
      eventDate,
      eventTime: eventTime || undefined,
      villageId: villageId ? parseInt(villageId, 10) : undefined,
      location: location.trim() || undefined,
      description: description.trim(),
      imageUrl: imageUrl.trim() || undefined,
      contactInfo: contactInfo.trim() || undefined,
      senderName: senderName.trim(),
      consentGiven: true,
      website: website || undefined,
    });
  }

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl text-center space-y-6">
        <SEO title="Υποβολή Εκδήλωσης — Ευχαριστούμε" description="Η εκδήλωσή σας υποβλήθηκε επιτυχώς και βρίσκεται υπό αξιολόγηση." />
        <div className="flex justify-center">
          <CheckCircle className="w-20 h-20 text-green-500" />
        </div>
        <h1 className="text-3xl font-serif font-bold">Ευχαριστούμε!</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Η εκδήλωσή σας υποβλήθηκε επιτυχώς και βρίσκεται υπό αξιολόγηση.
          Μόλις εγκριθεί, θα εμφανιστεί στη σελίδα εκδηλώσεων.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link href="/events/" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3 font-semibold hover:bg-primary/90 transition-colors">
            <CalendarDays className="w-4 h-4" /> Εκδηλώσεις
          </Link>
          <button
            onClick={() => {
              setSubmitted(false);
              setTitle(""); setEventDate(""); setEventTime("");
              setVillageId(paramVillageId); setLocation("");
              setDescription(""); setImageUrl(""); setContactInfo("");
              setSenderName(""); setConsentGiven(false); setWebsite("");
              setErrors({});
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3 font-semibold hover:bg-muted transition-colors"
          >
            Υποβολή Νέας Εκδήλωσης
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-8">
      <SEO
        title="Καταχώρηση Εκδήλωσης — Dropolis"
        description="Υποβάλετε εκδήλωση ή πανηγύρι από τα χωριά της Δρόπολης. Η ομάδα μας αξιολογεί κάθε υποβολή πριν τη δημοσίευση."
        breadcrumbs={[{ name: "Καταχώρηση Εκδήλωσης", url: "/submit-event/" }]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Καταχώρηση Εκδήλωσης — Dropolis",
          description: "Υποβάλετε εκδήλωση ή πανηγύρι από τα χωριά της Δρόπολης.",
          url: "https://dropolis.net/submit-event",
          inLanguage: "el",
        }}
      />

      <div className="relative rounded-2xl overflow-hidden bg-primary text-primary-foreground p-8 shadow-lg">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 70% 50%, white 0%, transparent 60%)" }} />
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">Καταχώρηση Εκδήλωσης</h1>
          <p className="text-primary-foreground/80">
            Μοιραστείτε εκδηλώσεις, πανηγύρια και πολιτιστικές δραστηριότητες από τη Δρόπολη.
            Κάθε υποβολή ελέγχεται πριν δημοσιευτεί.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-card rounded-2xl border border-card-border p-6 md:p-8 shadow-sm">

        {/* Honeypot */}
        <div style={{ position: "absolute", left: "-9999px", top: "-9999px", width: 0, height: 0, overflow: "hidden", opacity: 0 }} aria-hidden="true">
          <label htmlFor="hp-website">Website</label>
          <input id="hp-website" type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" />
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-foreground">
            Τίτλος Εκδήλωσης <span className="text-destructive">*</span>
          </label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="π.χ. Ετήσιο Πανηγύρι Αγίου Γεωργίου στο Γλυνό"
            className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            maxLength={200} />
          {errors["title"] && <p className="text-destructive text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors["title"]}</p>}
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-foreground">
              Ημερομηνία <span className="text-destructive">*</span>
            </label>
            <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)}
              className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            {errors["eventDate"] && <p className="text-destructive text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors["eventDate"]}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-foreground">
              Ώρα <span className="text-muted-foreground font-normal">(προαιρετικό)</span>
            </label>
            <input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)}
              className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        </div>

        {/* Village & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-foreground">Χωριό</label>
            <select value={villageId} onChange={(e) => setVillageId(e.target.value)}
              className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
              <option value="">Γενική εκδήλωση (χωρίς χωριό)</option>
              {villages?.slice().sort((a, b) => a.nameEl.localeCompare(b.nameEl, "el")).map((v) => (
                <option key={v.id} value={String(v.id)}>{v.nameEl}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-foreground">
              Τοποθεσία <span className="text-muted-foreground font-normal">(προαιρετικό)</span>
            </label>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
              placeholder="π.χ. Πλατεία χωριού, εκκλησία…"
              className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              maxLength={200} />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-foreground">
            Περιγραφή <span className="text-destructive">*</span>
            <span className="font-normal text-muted-foreground ml-2">(τουλάχιστον 20 χαρακτήρες)</span>
          </label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Περιγράψτε την εκδήλωση, το πρόγραμμα, τι θα γίνει…"
            rows={5}
            className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y" />
          <div className="flex items-center justify-between">
            {errors["description"] ? (
              <p className="text-destructive text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors["description"]}</p>
            ) : <span />}
            <span className={`text-xs ml-auto ${description.trim().length < 20 ? "text-muted-foreground" : "text-green-600 dark:text-green-400"}`}>
              {description.trim().length} χαρακτήρες
            </span>
          </div>
        </div>

        {/* Image URL */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-foreground">
            Σύνδεσμος Εικόνας <span className="text-muted-foreground font-normal">(προαιρετικό)</span>
          </label>
          <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://…"
            className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          {errors["imageUrl"] && <p className="text-destructive text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors["imageUrl"]}</p>}
          <p className="text-xs text-muted-foreground">Εισάγετε τον σύνδεσμο (URL) μιας εικόνας που σχετίζεται με την εκδήλωση.</p>
        </div>

        {/* Contact info */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-foreground">
            Στοιχεία Επικοινωνίας <span className="text-muted-foreground font-normal">(προαιρετικό)</span>
          </label>
          <input type="text" value={contactInfo} onChange={(e) => setContactInfo(e.target.value)}
            placeholder="Τηλέφωνο, email ή άλλα στοιχεία επικοινωνίας…"
            className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            maxLength={300} />
          <p className="text-xs text-muted-foreground">Θα εμφανίζεται στη δημοσίευση για επικοινωνία ενδιαφερόμενων.</p>
        </div>

        <hr className="border-border" />

        {/* Sender name */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-foreground">
            Ονοματεπώνυμο <span className="text-destructive">*</span>
          </label>
          <input type="text" value={senderName} onChange={(e) => setSenderName(e.target.value)}
            placeholder="Το όνομά σας…"
            className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            maxLength={100} />
          {errors["senderName"] && <p className="text-destructive text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors["senderName"]}</p>}
          <p className="text-xs text-muted-foreground">Δεν θα δημοσιευτεί. Χρησιμοποιείται μόνο για επικοινωνία με τη συντακτική ομάδα.</p>
        </div>

        {/* Consent */}
        <div className="space-y-2">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input type="checkbox" checked={consentGiven} onChange={(e) => setConsentGiven(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-border accent-primary flex-shrink-0" />
            <span className="text-sm text-foreground/80 leading-relaxed group-hover:text-foreground transition-colors">
              Δηλώνω ότι οι πληροφορίες που υποβάλλω είναι αληθείς και αποδέχομαι τους{" "}
              <Link href="/terms/" className="text-primary hover:underline">Όρους Χρήσης</Link>{" "}
              και την{" "}
              <Link href="/editorial-policy/" className="text-primary hover:underline">Συντακτική Πολιτική</Link>{" "}
              του Dropolis. <span className="text-destructive">*</span>
            </span>
          </label>
          {errors["consentGiven"] && (
            <p className="text-destructive text-xs flex items-center gap-1 ml-7"><AlertCircle className="w-3 h-3" />{errors["consentGiven"]}</p>
          )}
        </div>

        {submitError && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {submitError}
          </div>
        )}

        <button type="submit" disabled={isPending}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3 font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
          <Send className="w-4 h-4" />
          {isPending ? "Υποβολή…" : "Υποβολή Εκδήλωσης"}
        </button>

        <p className="text-xs text-muted-foreground text-center">
          Η εκδήλωση θα ελεγχθεί από τη συντακτική ομάδα. Μόλις εγκριθεί, θα εμφανιστεί αυτόματα.
        </p>
      </form>
    </div>
  );
}
