import { useState, useRef } from "react";
import { SEO } from "@/components/SEO";
import { Globe, Upload, CheckCircle, AlertCircle, ImageIcon, X, Users, Heart, MapPin } from "lucide-react";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_RAW_SIZE = 20 * 1024 * 1024;
const MAX_COMPRESSED_SIZE = 3 * 1024 * 1024;

type Step = "form" | "compressing" | "uploading" | "success" | "error";

function resizeCanvas(img: HTMLImageElement, maxPx: number): HTMLCanvasElement {
  let { width, height } = img;
  if (width > maxPx || height > maxPx) {
    if (width >= height) { height = Math.round((height * maxPx) / width); width = maxPx; }
    else { width = Math.round((width * maxPx) / height); height = maxPx; }
  }
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
  return canvas;
}

async function blobFromCanvas(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))), "image/jpeg", quality);
  });
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Αδύνατη φόρτωση εικόνας.")); };
    img.src = url;
  });
}

async function compressImage(file: File, maxPx: number, maxBytes: number, baseName: string): Promise<File> {
  const img = await loadImage(file);
  const canvas = resizeCanvas(img, maxPx);
  for (const q of [0.85, 0.78, 0.70, 0.62, 0.54, 0.50]) {
    const blob = await blobFromCanvas(canvas, q);
    if (blob.size <= maxBytes) return new File([blob], baseName, { type: "image/jpeg" });
  }
  const blob = await blobFromCanvas(canvas, 0.45);
  return new File([blob], baseName, { type: "image/jpeg" });
}

export default function Diaspora() {
  const [step, setStep] = useState<Step>("form");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [copyright, setCopyright] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileError(null);
    setCompressedSize(null);
    if (!ALLOWED_TYPES.includes(f.type)) { setFileError("Μόνο αρχεία JPG, PNG και WEBP επιτρέπονται."); return; }
    if (f.size > MAX_RAW_SIZE) { setFileError("Το αρχείο είναι πολύ μεγάλο (μέγ. 20 MB)."); return; }
    if (f.size > 5 * 1024 * 1024) { setFileError("Το αρχείο υπερβαίνει τα 5 MB. Επιλέξτε μικρότερο αρχείο."); return; }
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  }

  function clearFile() {
    setFile(null); setPreview(null); setFileError(null); setCompressedSize(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function resetForm() {
    setStep("form"); setFile(null); setPreview(null); setFileError(null); setSubmitError(null);
    setTitle(""); setCountry(""); setCity(""); setDescription(""); setSenderName(""); setSenderEmail("");
    setCopyright(false); setProgress(0); setCompressedSize(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setFileError("Επιλέξτε αρχείο εικόνας."); return; }
    if (!copyright) { setSubmitError("Απαιτείται η αποδοχή δήλωσης πνευματικών δικαιωμάτων."); return; }

    setStep("compressing"); setProgress(5); setSubmitError(null);

    try {
      const mainFile = await compressImage(file, 1600, MAX_COMPRESSED_SIZE, "photo.jpg");
      setCompressedSize(mainFile.size); setProgress(20);
      const thumbFile = await compressImage(file, 600, 200 * 1024, "thumb.jpg");
      setProgress(30);

      setStep("uploading");

      const [mainUrlRes, thumbUrlRes] = await Promise.all([
        fetch("/api/photos/upload-url", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: mainFile.name, size: mainFile.size, contentType: "image/jpeg" }),
        }),
        fetch("/api/photos/upload-url", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: thumbFile.name, size: thumbFile.size, contentType: "image/jpeg" }),
        }),
      ]);

      if (!mainUrlRes.ok) { const e = await mainUrlRes.json().catch(() => ({ error: "Σφάλμα URL." })); throw new Error(e.error); }
      if (!thumbUrlRes.ok) { const e = await thumbUrlRes.json().catch(() => ({ error: "Σφάλμα URL." })); throw new Error(e.error); }

      const { uploadURL: mainUploadURL, objectPath: mainObjectPath } = await mainUrlRes.json();
      const { uploadURL: thumbUploadURL, objectPath: thumbObjectPath } = await thumbUrlRes.json();
      setProgress(50);

      const [up1, up2] = await Promise.all([
        fetch(mainUploadURL, { method: "PUT", body: mainFile, headers: { "Content-Type": "image/jpeg" } }),
        fetch(thumbUploadURL, { method: "PUT", body: thumbFile, headers: { "Content-Type": "image/jpeg" } }),
      ]);
      if (!up1.ok) throw new Error("Αποτυχία αποστολής φωτογραφίας.");
      if (!up2.ok) throw new Error("Αποτυχία αποστολής thumbnail.");
      setProgress(80);

      const fullDescription = [
        "Κατηγορία: Ελληνισμός της Διασποράς / Dropolis Diaspora",
        city && country ? `Τοποθεσία: ${city}, ${country}` : country ? `Χώρα: ${country}` : "",
        description.trim() ? description.trim() : "",
      ].filter(Boolean).join("\n\n");

      const submitRes = await fetch("/api/photos/submit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: fullDescription,
          objectPath: mainObjectPath,
          thumbnailObjectPath: thumbObjectPath,
          photographer: [city, country].filter(Boolean).join(", ") || undefined,
          uploaderName: senderName.trim() || undefined,
          uploaderEmail: senderEmail.trim() || undefined,
          copyrightConfirmed: copyright,
        }),
      });

      if (!submitRes.ok) {
        const err = await submitRes.json().catch(() => ({ error: "Αποτυχία υποβολής." }));
        throw new Error(err.error || "Αποτυχία υποβολής φωτογραφίας.");
      }

      setProgress(100); setStep("success");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Κάτι πήγε στραβά.");
      setStep("error");
    }
  }

  if (step === "success") {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg text-center space-y-6">
        <SEO title="Η φωτογραφία υποβλήθηκε — Ομογένεια" description="Η φωτογραφία σας υποβλήθηκε και εκκρεμεί αξιολόγηση." noindex />
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-6">
            <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <h1 className="text-3xl font-serif font-bold">Η φωτογραφία υποβλήθηκε!</h1>
        <p className="text-muted-foreground text-lg">
          Ευχαριστούμε για τη συνεισφορά σας. Η φωτογραφία θα εμφανιστεί στο φωτογραφικό αρχείο μόλις εγκριθεί από την ομάδα του Dropolis.
        </p>
        <button
          onClick={resetForm}
          className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3 font-semibold hover:bg-primary/90 transition-colors"
        >
          <Globe className="w-4 h-4" />
          Υποβολή άλλης φωτογραφίας
        </button>
      </div>
    );
  }

  const isBusy = step === "compressing" || step === "uploading";

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-8">
      <SEO
        title="Έλληνες της Διασποράς | Δρόπολη"
        description="Σελίδα για Δροπολίτες, Βορειοηπειρώτες και ελληνική ομογένεια ανά τον κόσμο. Μοιραστείτε φωτογραφίες και ιστορίες από τη ζωή σας στο εξωτερικό."
        keywords="Δροπολίτες διασπορά, Βορειοηπειρώτες εξωτερικό, ελληνική ομογένεια, Greeks diaspora Dropull, Έλληνες Αλβανία εξωτερικό"
        breadcrumbs={[{ name: "Ομογένεια", url: "/diaspora/" }]}
      />

      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden bg-primary text-primary-foreground p-8 shadow-lg text-center">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 50% 50%, white 0%, transparent 60%)" }} />
        <div className="relative z-10">
          <Globe className="w-10 h-10 mx-auto mb-4 text-secondary" />
          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">Ελληνισμός της Διασποράς</h1>
          <p className="text-primary-foreground/80 text-sm max-w-lg mx-auto leading-relaxed">
            Για Δροπολίτες, Βορειοηπειρώτες και ελληνική ομογένεια ανά τον κόσμο. Μοιραστείτε φωτογραφίες και ιστορίες από τη ζωή σας στο εξωτερικό.
          </p>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Users, title: "Κοινότητα", text: "Ενωνόμαστε ανεξαρτήτως αποστάσεων" },
          { icon: Heart, title: "Ρίζες", text: "Κρατάμε ζωντανή τη μνήμη και τον πολιτισμό" },
          { icon: MapPin, title: "Παντού", text: "Δροπολίτες από κάθε γωνιά της γης" },
        ].map(({ icon: Icon, title: t, text }) => (
          <div key={t} className="bg-card rounded-xl border p-4 text-center">
            <Icon className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="font-semibold text-sm">{t}</p>
            <p className="text-xs text-muted-foreground mt-1">{text}</p>
          </div>
        ))}
      </div>

      {/* Upload form */}
      <form onSubmit={handleSubmit} className="space-y-6 bg-card rounded-2xl border p-6 shadow-sm">
        <div>
          <h2 className="font-serif text-xl font-bold mb-1">Αποστολή Φωτογραφίας</h2>
          <p className="text-sm text-muted-foreground">Κάθε υποβολή αξιολογείται πριν δημοσιευτεί.</p>
        </div>

        {/* File picker */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold">
            Αρχείο εικόνας <span className="text-destructive">*</span>
            <span className="font-normal text-muted-foreground ml-1">(JPG/PNG/WEBP, έως 5MB)</span>
          </label>
          {preview ? (
            <div className="relative rounded-xl overflow-hidden border">
              <img src={preview} alt="Προεπισκόπηση" className="w-full max-h-64 object-contain bg-muted" loading="lazy" decoding="async" />
              <button type="button" onClick={clearFile} disabled={isBusy}
                className="absolute top-2 right-2 rounded-full bg-black/60 text-white p-1 hover:bg-black/80 transition-colors disabled:opacity-50"
                aria-label="Αφαίρεση αρχείου">
                <X className="w-4 h-4" />
              </button>
              <div className="px-3 py-2 bg-muted text-xs text-muted-foreground flex items-center gap-2">
                <ImageIcon className="w-3 h-3" />
                {file?.name}
                {compressedSize !== null && (
                  <span className="ml-auto text-green-600 dark:text-green-400 font-medium">
                    → {(compressedSize / 1024).toFixed(0)} KB μετά συμπίεση
                  </span>
                )}
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-3 cursor-pointer rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors p-8">
              <Upload className="w-8 h-8 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium text-sm">Κάντε κλικ για επιλογή αρχείου</p>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP — αυτόματη συμπίεση πριν την αποστολή</p>
              </div>
              <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
            </label>
          )}
          {fileError && (
            <p className="flex items-center gap-1.5 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {fileError}
            </p>
          )}
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold">
            Τίτλος φωτογραφίας <span className="text-destructive">*</span>
          </label>
          <input type="text" required maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="π.χ. Πανηγύρι Δροπολιτών στο Σίδνεϊ, 2024"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>

        {/* Country + City */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold">
              Χώρα <span className="text-destructive">*</span>
            </label>
            <input type="text" required maxLength={100} value={country} onChange={(e) => setCountry(e.target.value)}
              placeholder="π.χ. Αυστραλία"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold">Πόλη</label>
            <input type="text" maxLength={100} value={city} onChange={(e) => setCity(e.target.value)}
              placeholder="π.χ. Σίδνεϊ"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold">Περιγραφή / Ιστορία</label>
          <textarea maxLength={1000} value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
            placeholder="Πείτε μας την ιστορία πίσω από τη φωτογραφία — πότε τραβήχτηκε, τι απεικονίζει, τι σημαίνει για εσάς..."
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
          <p className="text-xs text-muted-foreground text-right">{description.length}/1000</p>
        </div>

        {/* Sender name */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold">Όνομα αποστολέα</label>
          <input type="text" maxLength={100} value={senderName} onChange={(e) => setSenderName(e.target.value)}
            placeholder="Πώς να σας αναφέρουμε"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold">
            Email <span className="text-muted-foreground font-normal">(προαιρετικό)</span>
          </label>
          <input type="email" maxLength={200} value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)}
            placeholder="Για επικοινωνία αν χρειαστεί"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>

        {/* Copyright */}
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input type="checkbox" checked={copyright} onChange={(e) => setCopyright(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border accent-primary flex-shrink-0" />
          <span className="text-sm leading-relaxed">
            <span className="font-semibold text-destructive">* </span>
            Βεβαιώνω ότι είμαι ο δημιουργός ή κάτοχος των δικαιωμάτων αυτής της φωτογραφίας, ή ότι έχω άδεια δημοσίευσής της, και συναινώ στη δημοσίευσή της στο Dropolis.
          </span>
        </label>

        {/* Error */}
        {step === "error" && submitError && (
          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 text-destructive px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {submitError}
          </div>
        )}

        {/* Progress */}
        {isBusy && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{step === "compressing" ? "Συμπίεση εικόνας…" : "Αποστολή στον διακομιστή…"}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Submit */}
        <button type="submit" disabled={isBusy || !file || !title.trim() || !country.trim() || !copyright}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3 font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {isBusy ? (
            <>
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
              {step === "compressing" ? "Συμπίεση…" : "Αποστολή…"}
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Υποβολή Φωτογραφίας
            </>
          )}
        </button>

        <p className="text-xs text-muted-foreground text-center">
          Επιτρέπονται έως 3 υποβολές ανά ώρα από την ίδια σύνδεση.
        </p>
      </form>
    </div>
  );
}
