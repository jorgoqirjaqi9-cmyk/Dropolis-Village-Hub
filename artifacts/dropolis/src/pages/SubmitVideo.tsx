import { useState, useEffect, useRef } from "react";
import { useSearch, Link } from "wouter";
import { SEO } from "@/components/SEO";
import { useListVillages } from "@workspace/api-client-react";
import { CheckCircle, Video, AlertCircle, Upload } from "lucide-react";

const ALLOWED_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const MAX_SIZE_MB = 25;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

type UploadStage = "idle" | "uploading-file" | "submitting" | "done" | "error";

export default function SubmitVideo() {
  const search = useSearch();
  const { data: villages } = useListVillages();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const paramVillageId = new URLSearchParams(search).get("villageId") ?? "";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [villageId, setVillageId] = useState<string>(paramVillageId);
  const [uploaderName, setUploaderName] = useState("");
  const [uploaderEmail, setUploaderEmail] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [copyrightConfirmed, setCopyrightConfirmed] = useState(false);
  const [website, setWebsite] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stage, setStage] = useState<UploadStage>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (paramVillageId) setVillageId(paramVillageId);
  }, [paramVillageId]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) { setSelectedFile(null); return; }
    const newErrors: Record<string, string> = { ...errors };
    if (!ALLOWED_TYPES.includes(file.type)) {
      newErrors["file"] = "Μόνο MP4, MOV και WebM επιτρέπονται.";
    } else if (file.size > MAX_SIZE_BYTES) {
      newErrors["file"] = `Το βίντεο δεν πρέπει να υπερβαίνει τα ${MAX_SIZE_MB} MB.`;
    } else {
      delete newErrors["file"];
    }
    setErrors(newErrors);
    setSelectedFile(file);
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (title.trim().length < 3) e["title"] = "Ο τίτλος πρέπει να έχει τουλάχιστον 3 χαρακτήρες.";
    if (!selectedFile) e["file"] = "Επιλέξτε ένα αρχείο βίντεο.";
    else if (!ALLOWED_TYPES.includes(selectedFile.type)) e["file"] = "Μόνο MP4, MOV και WebM επιτρέπονται.";
    else if (selectedFile.size > MAX_SIZE_BYTES) e["file"] = `Το βίντεο δεν πρέπει να υπερβαίνει τα ${MAX_SIZE_MB} MB.`;
    if (uploaderEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(uploaderEmail)) e["uploaderEmail"] = "Μη έγκυρη διεύθυνση email.";
    if (!copyrightConfirmed) e["copyright"] = "Πρέπει να αποδεχτείτε τη δήλωση πνευματικών δικαιωμάτων.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;
    if (!selectedFile) return;

    try {
      setStage("uploading-file");
      setUploadProgress(0);

      // 1) Request presigned URL
      const urlRes = await fetch("/api/video-submissions/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: selectedFile.name, size: selectedFile.size, contentType: selectedFile.type }),
      });
      if (!urlRes.ok) {
        const data = await urlRes.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Αποτυχία δημιουργίας URL αποστολής.");
      }
      const { uploadURL, objectPath } = (await urlRes.json()) as { uploadURL: string; objectPath: string };

      // 2) PUT file directly to presigned URL
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadURL, true);
        xhr.setRequestHeader("Content-Type", selectedFile.type);
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setUploadProgress(Math.round((ev.loaded / ev.total) * 90));
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Αποτυχία αποστολής αρχείου.")));
        xhr.onerror = () => reject(new Error("Σφάλμα δικτύου κατά την αποστολή."));
        xhr.send(selectedFile);
      });
      setUploadProgress(95);

      // 3) Submit metadata
      setStage("submitting");
      const submitRes = await fetch("/api/video-submissions/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          objectPath,
          villageId: villageId ? parseInt(villageId, 10) : undefined,
          uploaderName: uploaderName.trim() || undefined,
          uploaderEmail: uploaderEmail.trim() || undefined,
          eventDate: eventDate || undefined,
          copyrightConfirmed: true,
          website: website || undefined,
        }),
      });
      if (!submitRes.ok) {
        const data = await submitRes.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Αποτυχία υποβολής.");
      }

      setUploadProgress(100);
      setStage("done");
    } catch (err) {
      setStage("error");
      setSubmitError(err instanceof Error ? err.message : "Παρουσιάστηκε σφάλμα.");
    }
  }

  if (stage === "done") {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl text-center space-y-6">
        <SEO
          title="Υποβολή Βίντεο — Ευχαριστούμε"
          description="Το βίντεό σας υποβλήθηκε επιτυχώς και βρίσκεται υπό αξιολόγηση."
        />
        <div className="flex justify-center">
          <CheckCircle className="w-20 h-20 text-green-500" />
        </div>
        <h1 className="text-3xl font-serif font-bold">Ευχαριστούμε!</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Το βίντεό σας υποβλήθηκε επιτυχώς και βρίσκεται υπό αξιολόγηση.
          Μόλις εγκριθεί, θα εμφανιστεί στη σελίδα των βίντεο.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link
            href="/videos/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3 font-semibold hover:bg-primary/90 transition-colors"
          >
            Πίσω στα Βίντεο
          </Link>
          <button
            onClick={() => {
              setStage("idle");
              setTitle(""); setDescription(""); setVillageId(paramVillageId);
              setUploaderName(""); setUploaderEmail(""); setEventDate("");
              setCopyrightConfirmed(false); setWebsite(""); setSelectedFile(null);
              setErrors({}); setUploadProgress(0);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3 font-semibold hover:bg-muted transition-colors"
          >
            Υποβολή Νέου Βίντεο
          </button>
        </div>
      </div>
    );
  }

  const isUploading = stage === "uploading-file" || stage === "submitting";

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-8">
      <SEO
        title="Ανεβάστε Βίντεο"
        description="Υποβάλετε βίντεο από τα χωριά της Δρόπολης. Κάθε υποβολή ελέγχεται πριν δημοσιευτεί."
        breadcrumbs={[{ name: "Ανεβάστε Βίντεο", url: "/submit-video/" }]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Υποβολή Βίντεο — Δρόπολη",
          description: "Υποβάλετε βίντεο από τα χωριά της Δρόπολης.",
          url: "https://dropolis.net/submit-video",
          inLanguage: "el",
        }}
      />

      <div className="relative rounded-2xl overflow-hidden bg-primary text-primary-foreground p-8 shadow-lg">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 70% 50%, white 0%, transparent 60%)" }} />
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">Ανεβάστε Βίντεο</h1>
          <p className="text-primary-foreground/80">
            Μοιραστείτε βίντεο από τα χωριά της Δρόπολης. Κάθε υποβολή ελέγχεται πριν δημοσιευτεί.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-card rounded-2xl border border-card-border p-6 md:p-8 shadow-sm">

        {/* Honeypot */}
        <div style={{ position: "absolute", left: "-9999px", top: "-9999px", width: 0, height: 0, overflow: "hidden", opacity: 0 }} aria-hidden="true">
          <label htmlFor="hp-website-vid">Website</label>
          <input id="hp-website-vid" type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" />
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
            placeholder="Εισάγετε τον τίτλο του βίντεο…"
            className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            maxLength={200}
            disabled={isUploading}
          />
          {errors["title"] && (
            <p className="text-destructive text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors["title"]}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-foreground">
            Περιγραφή <span className="text-muted-foreground font-normal">(προαιρετικό)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Σύντομη περιγραφή του βίντεο…"
            rows={3}
            className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
            disabled={isUploading}
          />
        </div>

        {/* Video file */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-foreground">
            Αρχείο Βίντεο <span className="text-destructive">*</span>
          </label>
          <div
            className="relative border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              onChange={handleFileChange}
              className="sr-only"
              disabled={isUploading}
            />
            {selectedFile ? (
              <div className="space-y-1">
                <Video className="w-8 h-8 mx-auto text-primary" />
                <p className="font-semibold text-sm text-foreground">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Κάντε κλικ ή σύρετε ένα αρχείο εδώ</p>
                <p className="text-xs text-muted-foreground">MP4, MOV, WebM — έως {MAX_SIZE_MB} MB</p>
              </div>
            )}
          </div>
          {errors["file"] && (
            <p className="text-destructive text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors["file"]}</p>
          )}
        </div>

        {/* Upload progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {stage === "uploading-file" ? "Αποστολή αρχείου…" : "Υποβολή…"}
              </span>
              <span className="font-mono text-xs">{uploadProgress}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Village */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-foreground">Χωριό</label>
          <select
            value={villageId}
            onChange={(e) => setVillageId(e.target.value)}
            className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            disabled={isUploading}
          >
            <option value="">Γενικό βίντεο (χωρίς χωριό)</option>
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

        {/* Event date */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-foreground">
            Ημερομηνία <span className="text-muted-foreground font-normal">(προαιρετικό)</span>
          </label>
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            disabled={isUploading}
          />
        </div>

        <hr className="border-border" />

        {/* Uploader info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-foreground">
              Ονοματεπώνυμο <span className="text-muted-foreground font-normal">(προαιρετικό)</span>
            </label>
            <input
              type="text"
              value={uploaderName}
              onChange={(e) => setUploaderName(e.target.value)}
              placeholder="Το όνομά σας…"
              className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              maxLength={100}
              disabled={isUploading}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-foreground">
              Email <span className="text-muted-foreground font-normal">(προαιρετικό)</span>
            </label>
            <input
              type="email"
              value={uploaderEmail}
              onChange={(e) => setUploaderEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              maxLength={200}
              disabled={isUploading}
            />
            {errors["uploaderEmail"] && (
              <p className="text-destructive text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors["uploaderEmail"]}</p>
            )}
            <p className="text-xs text-muted-foreground">Δεν θα δημοσιευτεί.</p>
          </div>
        </div>

        {/* Copyright */}
        <div className="space-y-2">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={copyrightConfirmed}
              onChange={(e) => setCopyrightConfirmed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-border accent-primary flex-shrink-0"
              disabled={isUploading}
            />
            <span className="text-sm text-foreground/80 leading-relaxed group-hover:text-foreground transition-colors">
              Δηλώνω ότι είμαι ο κάτοχος του βίντεο ή έχω άδεια χρήσης, δεν παραβιάζει πνευματικά δικαιώματα τρίτων και
              αποδέχομαι τους{" "}
              <Link href="/terms/" className="text-primary hover:underline">Όρους Χρήσης</Link>{" "}
              του Dropolis. <span className="text-destructive">*</span>
            </span>
          </label>
          {errors["copyright"] && (
            <p className="text-destructive text-xs flex items-center gap-1 ml-7"><AlertCircle className="w-3 h-3" />{errors["copyright"]}</p>
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
          disabled={isUploading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3 font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Video className="w-4 h-4" />
          {isUploading ? "Αποστολή…" : "Υποβολή Βίντεο"}
        </button>

        <p className="text-xs text-muted-foreground text-center">
          Το βίντεο θα ελεγχθεί από τη διαχείριση. Μόλις εγκριθεί, θα εμφανιστεί στη σελίδα βίντεο.
        </p>
      </form>
    </div>
  );
}
