import { useState, useEffect } from "react";
import { useSearch, Link } from "wouter";
import { SEO } from "@/components/SEO";
import { useListVillages, useCreateNewsSubmission } from "@workspace/api-client-react";
import { CheckCircle, Send, AlertCircle } from "lucide-react";

export default function SubmitNews() {
  const search = useSearch();
  const { data: villages } = useListVillages();

  const paramVillageId = new URLSearchParams(search).get("villageId") ?? "";

  const { mutate: submitNews, isPending } = useCreateNewsSubmission();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [villageId, setVillageId] = useState<string>(paramVillageId);
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);
  const [website, setWebsite] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (paramVillageId) setVillageId(paramVillageId);
  }, [paramVillageId]);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (title.trim().length < 5) newErrors["title"] = "Ο τίτλος πρέπει να έχει τουλάχιστον 5 χαρακτήρες.";
    if (content.trim().length < 80) newErrors["content"] = `Το κείμενο πρέπει να έχει τουλάχιστον 80 χαρακτήρες (τώρα: ${content.trim().length}).`;
    if (senderName.trim().length < 2) newErrors["senderName"] = "Το όνομα πρέπει να έχει τουλάχιστον 2 χαρακτήρες.";
    if (!eventDate) newErrors["eventDate"] = "Η ημερομηνία εκδήλωσης είναι υποχρεωτική.";
    if (senderEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) newErrors["senderEmail"] = "Μη έγκυρη διεύθυνση email.";
    if (imageUrl && !/^https?:\/\/.+/.test(imageUrl)) newErrors["imageUrl"] = "Μη έγκυρη διεύθυνση URL εικόνας.";
    if (!consentGiven) newErrors["consentGiven"] = "Πρέπει να αποδεχτείτε τους όρους υποβολής.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    submitNews(
      {
        data: {
          title: title.trim(),
          content: content.trim(),
          villageId: villageId ? parseInt(villageId, 10) : undefined,
          senderName: senderName.trim(),
          senderEmail: senderEmail.trim() || undefined,
          eventDate,
          eventTime: eventTime || undefined,
          imageUrl: imageUrl.trim() || undefined,
          consentGiven: true,
          website: website || undefined,
        },
      },
      {
        onSuccess: () => setSubmitted(true),
        onError: (err) => {
          const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
          setSubmitError(msg ?? "Παρουσιάστηκε σφάλμα κατά την υποβολή. Δοκιμάστε ξανά.");
        },
      }
    );
  }

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl text-center space-y-6">
        <SEO
          title="Υποβολή Είδησης — Ευχαριστούμε"
          description="Η είδησή σας υποβλήθηκε επιτυχώς και βρίσκεται υπό αξιολόγηση."
        />
        <div className="flex justify-center">
          <CheckCircle className="w-20 h-20 text-green-500" />
        </div>
        <h1 className="text-3xl font-serif font-bold">Ευχαριστούμε!</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Η είδησή σας υποβλήθηκε επιτυχώς και βρίσκεται υπό συντακτική αξιολόγηση.
          Μόλις εγκριθεί, θα εμφανιστεί στη σελίδα των ειδήσεων.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link
            href="/news/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3 font-semibold hover:bg-primary/90 transition-colors"
          >
            Πίσω στις Ειδήσεις
          </Link>
          <button
            onClick={() => {
              setSubmitted(false);
              setTitle("");
              setContent("");
              setVillageId(paramVillageId);
              setSenderName("");
              setSenderEmail("");
              setEventDate("");
              setEventTime("");
              setImageUrl("");
              setConsentGiven(false);
              setWebsite("");
              setErrors({});
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3 font-semibold hover:bg-muted transition-colors"
          >
            Υποβολή Νέας Είδησης
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-8">
      <SEO
        title="Στείλτε Είδηση"
        description="Υποβάλετε είδηση για τη Δρόπολη και τα χωριά της. Κάθε υποβολή ελέγχεται από τη συντακτική ομάδα πριν δημοσιευτεί."
        breadcrumbs={[{ name: "Στείλτε Είδηση", url: "/submit-news" }]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Υποβολή Είδησης — Δρόπολη",
          description: "Υποβάλετε είδηση για τη Δρόπολη και τα χωριά της.",
          url: "https://dropolis.net/submit-news",
          inLanguage: "el",
        }}
      />

      <div className="relative rounded-2xl overflow-hidden bg-primary text-primary-foreground p-8 shadow-lg">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 70% 50%, white 0%, transparent 60%)" }} />
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">Στείλτε Είδηση</h1>
          <p className="text-primary-foreground/80">
            Μοιραστείτε νέα από τα χωριά της Δρόπολης. Κάθε υποβολή ελέγχεται από τη συντακτική ομάδα πριν δημοσιευτεί.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-card rounded-2xl border border-card-border p-6 md:p-8 shadow-sm">

        {/* Honeypot — hidden from real users; bots fill it in */}
        <div style={{ position: "absolute", left: "-9999px", top: "-9999px", width: 0, height: 0, overflow: "hidden", opacity: 0 }} aria-hidden="true">
          <label htmlFor="hp-website">Website</label>
          <input
            id="hp-website"
            type="text"
            name="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-foreground">
            Τίτλος <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Εισάγετε τον τίτλο της είδησης…"
            className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            maxLength={200}
          />
          {errors["title"] && (
            <p className="text-destructive text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors["title"]}</p>
          )}
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-foreground">
            Κείμενο Είδησης <span className="text-destructive">*</span>
            <span className="font-normal text-muted-foreground ml-2">(τουλάχιστον 80 χαρακτήρες)</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Γράψτε το κείμενο της είδησής σας εδώ…"
            rows={8}
            className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
          />
          <div className="flex items-center justify-between">
            {errors["content"] ? (
              <p className="text-destructive text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors["content"]}</p>
            ) : <span />}
            <span className={`text-xs ml-auto ${content.trim().length < 80 ? "text-muted-foreground" : "text-green-600 dark:text-green-400"}`}>
              {content.trim().length} χαρακτήρες
            </span>
          </div>
        </div>

        {/* Village */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-foreground">Χωριό</label>
          <select
            value={villageId}
            onChange={(e) => setVillageId(e.target.value)}
            className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">Γενική είδηση (χωρίς χωριό)</option>
            {villages
              ?.slice()
              .sort((a, b) => a.nameEl.localeCompare(b.nameEl, "el"))
              .map((v) => (
                <option key={v.id} value={String(v.id)}>
                  {v.nameEl}
                </option>
              ))}
          </select>
        </div>

        {/* Event date and time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-foreground">
              Ημερομηνία Εκδήλωσης <span className="text-destructive">*</span>
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {errors["eventDate"] && (
              <p className="text-destructive text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors["eventDate"]}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-foreground">
              Ώρα Εκδήλωσης <span className="text-muted-foreground font-normal">(προαιρετικό)</span>
            </label>
            <input
              type="time"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
              className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Image URL */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-foreground">
            Σύνδεσμος Εικόνας <span className="text-muted-foreground font-normal">(προαιρετικό)</span>
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://…"
            className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {errors["imageUrl"] && (
            <p className="text-destructive text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors["imageUrl"]}</p>
          )}
          <p className="text-xs text-muted-foreground">Εισάγετε τον σύνδεσμο (URL) μιας εικόνας στο internet που σχετίζεται με την είδηση.</p>
        </div>

        <hr className="border-border" />

        {/* Sender info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-foreground">
              Ονοματεπώνυμο <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="Το όνομά σας…"
              className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              maxLength={100}
            />
            {errors["senderName"] && (
              <p className="text-destructive text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors["senderName"]}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-foreground">
              Email <span className="text-muted-foreground font-normal">(προαιρετικό)</span>
            </label>
            <input
              type="email"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              maxLength={200}
            />
            {errors["senderEmail"] && (
              <p className="text-destructive text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors["senderEmail"]}</p>
            )}
            <p className="text-xs text-muted-foreground">Δεν θα δημοσιευτεί. Χρησιμοποιείται μόνο για επικοινωνία.</p>
          </div>
        </div>

        {/* Consent */}
        <div className="space-y-2">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-border accent-primary flex-shrink-0"
            />
            <span className="text-sm text-foreground/80 leading-relaxed group-hover:text-foreground transition-colors">
              Δηλώνω ότι το περιεχόμενο που υποβάλλω είναι αληθές, δεν παραβιάζει πνευματικά δικαιώματα τρίτων και
              αποδέχομαι τους{" "}
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

        <button
          type="submit"
          disabled={isPending}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3 font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          {isPending ? "Υποβολή…" : "Υποβολή Είδησης"}
        </button>

        <p className="text-xs text-muted-foreground text-center">
          Η είδηση θα ελεγχθεί από τη συντακτική ομάδα. Μόλις εγκριθεί, θα δημοσιευτεί αυτόματα.
        </p>
      </form>
    </div>
  );
}
