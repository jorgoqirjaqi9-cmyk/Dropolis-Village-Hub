import { useState, useRef, useEffect } from "react";
import { useSearch } from "wouter";
import { SEO } from "@/components/SEO";
import { useListVillages } from "@workspace/api-client-react";
import { Camera, Upload, CheckCircle, AlertCircle, ImageIcon, X } from "lucide-react";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

type Step = "form" | "uploading" | "success" | "error";

export default function UploadPhoto() {
  const search = useSearch();
  const { data: villages } = useListVillages();

  // Pre-select village from query param ?villageId=83
  const paramVillageId = new URLSearchParams(search).get("villageId") ?? "";

  const [step, setStep] = useState<Step>("form");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const [title, setTitle] = useState("");
  const [villageId, setVillageId] = useState<string>(paramVillageId);

  // Sync if query param changes (e.g. navigating between villages)
  useEffect(() => {
    setVillageId(paramVillageId);
  }, [paramVillageId]);
  const [photographer, setPhotographer] = useState("");
  const [uploaderName, setUploaderName] = useState("");
  const [copyright, setCopyright] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileError(null);

    if (!ALLOWED_TYPES.includes(f.type)) {
      setFileError("Μόνο αρχεία JPG, PNG και WEBP επιτρέπονται.");
      return;
    }
    if (f.size > MAX_SIZE) {
      setFileError("Το αρχείο δεν πρέπει να υπερβαίνει τα 5 MB.");
      return;
    }

    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  }

  function clearFile() {
    setFile(null);
    setPreview(null);
    setFileError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setFileError("Επιλέξτε αρχείο εικόνας."); return; }
    if (!copyright) { setSubmitError("Απαιτείται η αποδοχή δήλωσης πνευματικών δικαιωμάτων."); return; }

    setStep("uploading");
    setProgress(10);
    setSubmitError(null);

    try {
      // Step 1: get presigned URL
      const urlRes = await fetch("/api/photos/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });

      if (!urlRes.ok) {
        const err = await urlRes.json().catch(() => ({ error: "Αποτυχία δημιουργίας URL." }));
        throw new Error(err.error || "Αποτυχία δημιουργίας URL αποστολής.");
      }

      const { uploadURL, objectPath } = await urlRes.json();
      setProgress(30);

      // Step 2: upload directly to GCS
      const uploadRes = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadRes.ok) throw new Error("Η αποστολή στο αποθηκευτικό χώρο απέτυχε.");
      setProgress(75);

      // Step 3: submit metadata
      const selectedVillage = villages?.find((v) => v.id === Number(villageId));
      const submitRes = await fetch("/api/photos/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          objectPath,
          villageId: villageId ? Number(villageId) : undefined,
          villageName: selectedVillage?.name ?? undefined,
          photographer: photographer.trim() || undefined,
          uploaderName: uploaderName.trim() || undefined,
          copyrightConfirmed: copyright,
        }),
      });

      if (!submitRes.ok) {
        const err = await submitRes.json().catch(() => ({ error: "Αποτυχία υποβολής." }));
        throw new Error(err.error || "Αποτυχία υποβολής φωτογραφίας.");
      }

      setProgress(100);
      setStep("success");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Κάτι πήγε στραβά.");
      setStep("error");
    }
  }

  if (step === "success") {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg text-center space-y-6">
        <SEO title="Η φωτογραφία υποβλήθηκε" description="Η φωτογραφία σας υποβλήθηκε και εκκρεμεί αξιολόγηση από την ομάδα του Dropolis." />
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-6">
            <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <h1 className="text-3xl font-serif font-bold">Η φωτογραφία υποβλήθηκε!</h1>
        <p className="text-muted-foreground text-lg">
          Ευχαριστούμε για τη συνεισφορά σας. Η φωτογραφία εκκρεμεί αξιολόγηση από την ομάδα του Dropolis και θα εμφανιστεί στο αρχείο μόλις εγκριθεί.
        </p>
        <button
          onClick={() => {
            setStep("form");
            setFile(null);
            setPreview(null);
            setTitle("");
            setVillageId("");
            setPhotographer("");
            setUploaderName("");
            setCopyright(false);
            setProgress(0);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3 font-semibold hover:bg-primary/90 transition-colors"
        >
          <Camera className="w-4 h-4" />
          Υποβολή άλλης φωτογραφίας
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-8">
      <SEO
        title="Υποβολή Φωτογραφίας"
        description="Στείλτε τη δική σας φωτογραφία από τα χωριά της Δρόπολης. Γενικό αρχείο ή για συγκεκριμένο χωριό — η ομάδα μας αξιολογεί κάθε υποβολή."
        breadcrumbs={[{ name: "Υποβολή Φωτογραφίας", url: "/upload-photo" }]}
      />

      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden bg-primary text-primary-foreground p-8 shadow-lg text-center">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 50% 50%, white 0%, transparent 60%)" }} />
        <div className="relative z-10">
          <Camera className="w-10 h-10 mx-auto mb-4 text-secondary" />
          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">Υποβολή Φωτογραφίας</h1>
          <p className="text-primary-foreground/70 text-sm max-w-md mx-auto">
            Κάθε υποβολή αξιολογείται από την ομάδα πριν δημοσιευτεί. JPG · PNG · WEBP · έως 5 MB.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-card rounded-2xl border p-6 shadow-sm">

        {/* File picker */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold">
            Αρχείο εικόνας <span className="text-destructive">*</span>
          </label>

          {preview ? (
            <div className="relative rounded-xl overflow-hidden border">
              <img src={preview} alt="Προεπισκόπηση" className="w-full max-h-72 object-contain bg-muted" />
              <button
                type="button"
                onClick={clearFile}
                className="absolute top-2 right-2 rounded-full bg-black/60 text-white p-1 hover:bg-black/80 transition-colors"
                aria-label="Αφαίρεση αρχείου"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="px-3 py-2 bg-muted text-xs text-muted-foreground flex items-center gap-2">
                <ImageIcon className="w-3 h-3" />
                {file?.name} — {file ? (file.size / 1024 / 1024).toFixed(2) : ""}  MB
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-3 cursor-pointer rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors p-8">
              <Upload className="w-8 h-8 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium text-sm">Κάντε κλικ για επιλογή αρχείου</p>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP — έως 5 MB</p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
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
          <input
            type="text"
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="π.χ. Πανήγυρι Αγίου Γεωργίου στη Δερβιτσιάνη"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Village selector */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold">Χωριό</label>
          <select
            value={villageId}
            onChange={(e) => setVillageId(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">— Γενικό φωτογραφικό αρχείο —</option>
            {villages?.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Αν η φωτογραφία αφορά συγκεκριμένο χωριό, επιλέξτε το. Διαφορετικά εμφανίζεται μόνο στο γενικό αρχείο.
          </p>
        </div>

        {/* Photographer */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold">Φωτογράφος (προαιρετικό)</label>
          <input
            type="text"
            maxLength={100}
            value={photographer}
            onChange={(e) => setPhotographer(e.target.value)}
            placeholder="Όνομα φωτογράφου ή πηγή"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Uploader name */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold">Το όνομά σας (προαιρετικό)</label>
          <input
            type="text"
            maxLength={100}
            value={uploaderName}
            onChange={(e) => setUploaderName(e.target.value)}
            placeholder="Πώς να σας αναφέρουμε"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Copyright checkbox */}
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={copyright}
            onChange={(e) => setCopyright(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border accent-primary flex-shrink-0"
          />
          <span className="text-sm leading-relaxed">
            <span className="font-semibold text-destructive">* </span>
            Βεβαιώνω ότι είμαι ο δημιουργός ή κάτοχος των δικαιωμάτων της φωτογραφίας, ή ότι έχω άδεια δημοσίευσής της, και συναινώ στη δημοσίευσή της στο Dropolis.
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
        {step === "uploading" && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Αποστολή σε εξέλιξη…</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={step === "uploading" || !file || !title.trim() || !copyright}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3 font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {step === "uploading" ? (
            <>
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
              Αποστολή…
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Υποβολή Φωτογραφίας
            </>
          )}
        </button>

        <p className="text-xs text-muted-foreground text-center">
          Επιτρέπονται έως 5 υποβολές ανά 15 λεπτά από την ίδια σύνδεση.
        </p>
      </form>
    </div>
  );
}
