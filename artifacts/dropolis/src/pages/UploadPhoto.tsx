import { useState, useRef, useEffect } from "react";
import { useSearch } from "wouter";
import { SEO } from "@/components/SEO";
import { useListVillages } from "@workspace/api-client-react";
import { Camera, Upload, CheckCircle, AlertCircle, ImageIcon, X } from "lucide-react";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_RAW_SIZE = 20 * 1024 * 1024; // 20 MB — raw file before compression
const MAX_COMPRESSED_SIZE = 3 * 1024 * 1024; // 3 MB final limit (server enforces too)

type Step = "form" | "compressing" | "uploading" | "success" | "error";

// ---------------------------------------------------------------------------
// Canvas helpers
// ---------------------------------------------------------------------------

function resizeCanvas(img: HTMLImageElement, maxPx: number): HTMLCanvasElement {
  let { width, height } = img;
  if (width > maxPx || height > maxPx) {
    if (width >= height) {
      height = Math.round((height * maxPx) / width);
      width = maxPx;
    } else {
      width = Math.round((width * maxPx) / height);
      height = maxPx;
    }
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
  return canvas;
}

async function blobFromCanvas(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))),
      "image/jpeg",
      quality
    );
  });
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Δεν ήταν δυνατή η φόρτωση της εικόνας.")); };
    img.src = url;
  });
}

/**
 * Compress image to JPEG, reducing quality until it fits under maxBytes.
 * Returns a File with content-type image/jpeg.
 */
async function compressImage(file: File, maxPx: number, maxBytes: number, baseName: string): Promise<File> {
  const img = await loadImage(file);
  const canvas = resizeCanvas(img, maxPx);

  // Try from quality 0.85 down to 0.50 in steps
  for (const q of [0.85, 0.78, 0.70, 0.62, 0.54, 0.50]) {
    const blob = await blobFromCanvas(canvas, q);
    if (blob.size <= maxBytes) {
      return new File([blob], baseName, { type: "image/jpeg" });
    }
  }
  // Last resort
  const blob = await blobFromCanvas(canvas, 0.45);
  return new File([blob], baseName, { type: "image/jpeg" });
}

// ---------------------------------------------------------------------------

export default function UploadPhoto() {
  const search = useSearch();
  const { data: villages } = useListVillages();

  const paramVillageId = new URLSearchParams(search).get("villageId") ?? "";

  const [step, setStep] = useState<Step>("form");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [villageId, setVillageId] = useState<string>(paramVillageId);

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
    setCompressedSize(null);

    if (!ALLOWED_TYPES.includes(f.type)) {
      setFileError("Μόνο αρχεία JPG, PNG και WEBP επιτρέπονται.");
      return;
    }
    if (f.size > MAX_RAW_SIZE) {
      setFileError("Το αρχείο είναι πολύ μεγάλο (μέγ. 20 MB πριν τη συμπίεση).");
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
    setCompressedSize(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setFileError("Επιλέξτε αρχείο εικόνας."); return; }
    if (!copyright) { setSubmitError("Απαιτείται η αποδοχή δήλωσης πνευματικών δικαιωμάτων."); return; }

    setStep("compressing");
    setProgress(5);
    setSubmitError(null);

    try {
      // ── Compress main image (max 1600px, ≤ 3 MB) ──────────────────────────
      const mainFile = await compressImage(file, 1600, MAX_COMPRESSED_SIZE, "photo.jpg");
      setCompressedSize(mainFile.size);
      setProgress(20);

      // ── Compress thumbnail (max 600px, ≤ 200 KB) ─────────────────────────
      const thumbFile = await compressImage(file, 600, 200 * 1024, "thumb.jpg");
      setProgress(30);

      setStep("uploading");

      // ── Get presigned URLs (main + thumbnail in parallel) ─────────────────
      const [mainUrlRes, thumbUrlRes] = await Promise.all([
        fetch("/api/photos/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: mainFile.name, size: mainFile.size, contentType: "image/jpeg" }),
        }),
        fetch("/api/photos/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: thumbFile.name, size: thumbFile.size, contentType: "image/jpeg" }),
        }),
      ]);

      if (!mainUrlRes.ok) {
        const err = await mainUrlRes.json().catch(() => ({ error: "Σφάλμα URL." }));
        throw new Error(err.error || "Αποτυχία δημιουργίας URL αποστολής.");
      }
      if (!thumbUrlRes.ok) {
        const err = await thumbUrlRes.json().catch(() => ({ error: "Σφάλμα URL thumbnail." }));
        throw new Error(err.error || "Αποτυχία δημιουργίας URL thumbnail.");
      }

      const { uploadURL: mainUploadURL, objectPath: mainObjectPath } = await mainUrlRes.json();
      const { uploadURL: thumbUploadURL, objectPath: thumbObjectPath } = await thumbUrlRes.json();
      setProgress(50);

      // ── Upload both to GCS in parallel ───────────────────────────────────
      const [uploadMain, uploadThumb] = await Promise.all([
        fetch(mainUploadURL, { method: "PUT", body: mainFile, headers: { "Content-Type": "image/jpeg" } }),
        fetch(thumbUploadURL, { method: "PUT", body: thumbFile, headers: { "Content-Type": "image/jpeg" } }),
      ]);

      if (!uploadMain.ok) throw new Error("Η αποστολή της φωτογραφίας στο αποθηκευτικό χώρο απέτυχε.");
      if (!uploadThumb.ok) throw new Error("Η αποστολή του thumbnail στο αποθηκευτικό χώρο απέτυχε.");
      setProgress(80);

      // ── Submit metadata ───────────────────────────────────────────────────
      const selectedVillage = villages?.find((v) => v.id === Number(villageId));
      const submitRes = await fetch("/api/photos/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          objectPath: mainObjectPath,
          thumbnailObjectPath: thumbObjectPath,
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
            setCompressedSize(null);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3 font-semibold hover:bg-primary/90 transition-colors"
        >
          <Camera className="w-4 h-4" />
          Υποβολή άλλης φωτογραφίας
        </button>
      </div>
    );
  }

  const isCompressing = step === "compressing";
  const isUploading = step === "uploading";
  const isBusy = isCompressing || isUploading;

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
            Κάθε υποβολή αξιολογείται από την ομάδα πριν δημοσιευτεί. JPG · PNG · WEBP · αυτόματη συμπίεση.
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
                disabled={isBusy}
                className="absolute top-2 right-2 rounded-full bg-black/60 text-white p-1 hover:bg-black/80 transition-colors disabled:opacity-50"
                aria-label="Αφαίρεση αρχείου"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="px-3 py-2 bg-muted text-xs text-muted-foreground flex items-center gap-2">
                <ImageIcon className="w-3 h-3" />
                {file?.name} — {file ? (file.size / 1024 / 1024).toFixed(2) : ""} MB αρχικά
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
              <option key={v.id} value={v.id}>{v.nameEl ?? v.name}</option>
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
        {isBusy && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{isCompressing ? "Συμπίεση εικόνας…" : "Αποστολή στον διακομιστή…"}</span>
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
          disabled={isBusy || !file || !title.trim() || !copyright}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3 font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isBusy ? (
            <>
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
              {isCompressing ? "Συμπίεση…" : "Αποστολή…"}
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
