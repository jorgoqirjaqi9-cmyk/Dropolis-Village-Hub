import { useState, useRef } from "react";
import { Link } from "wouter";
import { SEO } from "@/components/SEO";
import {
  Landmark, Upload, CheckCircle, AlertCircle, ImageIcon, X,
  MapPin, Users, Church, Send, Video, Newspaper, ChevronDown, ChevronUp,
} from "lucide-react";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_RAW_SIZE = 20 * 1024 * 1024;
const MAX_COMPRESSED_SIZE = 3 * 1024 * 1024;

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

const MUNICIPAL_UNITS: { name: string; nameAl: string; villages: string[] }[] = [
  {
    name: "Δημοτική Ενότητα Φοινίκης",
    nameAl: "Finiq",
    villages: [
      "Φοινίκη", "Βρυώνι", "Βρομερό", "Καραχάτζι",
      "Μαυρόπουλο", "Σιγιάννη (Αϊ-Γιάννης)", "Παραπόταμος", "Σελεγκάρι",
    ],
  },
  {
    name: "Δημοτική Ενότητα Δίβρης",
    nameAl: "Dibrë",
    villages: [
      "Δίβρη", "Άνω Λεσινίτσα", "Κάτω Λεσινίτσα", "Καρρόκι",
      "Σμίνετση", "Γριάζδανη", "Μάλτσανη", "Τσερκοβίτσα",
      "Λουψάτιο", "Γιαννιτσατίο", "Άγιος Ανδρέας", "Ναβαρίτσας",
      "Ρουμαντζά", "Μεμόραχη", "Γέρμας", "Αγία Σοφία (Ντερμισί)",
      "Γράβα", "Καισαράτιο", "Κόμματι", "Λαζάτιο",
    ],
  },
  {
    name: "Δημοτική Ενότητα Λιβαδειάς",
    nameAl: "Livadhja",
    villages: [
      "Λιβαδειά", "Άγιος Παντελεήμων", "Βαγκαλάτιο",
      "Σοπικό", "Καλτσατίο", "Καλύβια", "Κουλουρίτσα",
    ],
  },
  {
    name: "Δημοτική Ενότητα Αλύκου",
    nameAl: "Aliko",
    villages: ["Αλύκο", "Κρανιά", "Βελιάχοβο", "Αρδάσοβο"],
  },
  {
    name: "Δημοτική Ενότητα Μεσοποτάμου",
    nameAl: "Mesopotam",
    villages: ["Μεσοπόταμο", "Λέκλι", "Καλίβα", "Κώστεναρι", "Μπαράτ", "Τσαούς", "Βράχο"],
  },
];

type Step = "form" | "compressing" | "uploading" | "success" | "error";

export default function Finiq() {
  const [step, setStep] = useState<Step>("form");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [village, setVillage] = useState("");
  const [description, setDescription] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [copyright, setCopyright] = useState(false);

  const [openUnit, setOpenUnit] = useState<number | null>(null);

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
    setTitle(""); setVillage(""); setDescription(""); setSenderName(""); setSenderEmail("");
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
        "Κατηγορία: Δήμος Φοινικαίων / Bashkia Finiq",
        village.trim() ? `Τοποθεσία: ${village.trim()}` : "",
        description.trim() ? description.trim() : "",
      ].filter(Boolean).join("\n\n");

      const submitRes = await fetch("/api/photos/submit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: fullDescription,
          objectPath: mainObjectPath,
          thumbnailObjectPath: thumbObjectPath,
          photographer: village.trim() || undefined,
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
        <SEO title="Η φωτογραφία υποβλήθηκε — Δήμος Φοινικαίων" description="Η φωτογραφία σας υποβλήθηκε και εκκρεμεί αξιολόγηση." noindex />
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-6">
            <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <h1 className="text-3xl font-serif font-bold">Η φωτογραφία υποβλήθηκε!</h1>
        <p className="text-muted-foreground text-lg">
          Ευχαριστούμε. Η φωτογραφία θα εμφανιστεί στο φωτογραφικό αρχείο μόλις εγκριθεί από τη σύνταξη του Dropolis.
        </p>
        <button
          onClick={resetForm}
          className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3 font-semibold hover:bg-primary/90 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Υποβολή άλλης φωτογραφίας
        </button>
      </div>
    );
  }

  const isBusy = step === "compressing" || step === "uploading";

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-10">
      <SEO
        title="Δήμος Φοινικαίων | Βόρεια Ήπειρος"
        description="Ο Δήμος Φοινικαίων (Bashkia Finiq) της Βόρειας Ηπείρου. Κοινότητες, χωριά, φωτογραφίες, βίντεο και νέα από τη Φοινίκη, το Δελβινάκι και την ευρύτερη περιοχή."
        keywords="Δήμος Φοινικαίων, Bashkia Finiq, Φοινίκη, Δελβινάκι, Βόρεια Ήπειρος, Αλυκό, Λουκόβα, Βορς, ελληνική μειονότητα Αλβανία"
        breadcrumbs={[{ name: "Φοινικαίοι", url: "/finiq" }]}
      />

      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-amber-700 to-amber-900 text-white p-8 shadow-lg text-center">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 50% 50%, white 0%, transparent 60%)" }} />
        <div className="relative z-10">
          <Landmark className="w-10 h-10 mx-auto mb-4 text-amber-300" />
          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">Δήμος Φοινικαίων</h1>
          <p className="text-white/70 text-sm font-mono tracking-wide mb-4">Bashkia Finiq · Βόρεια Ήπειρος</p>
          <p className="text-white/85 text-sm max-w-xl mx-auto leading-relaxed">
            Ο Δήμος Φοινικαίων αγκαλιάζει μια από τις πλουσιότερες σε ιστορία και παράδοση περιοχές της Βόρειας Ηπείρου.
            Από τη Φοινίκη ως το Δελβινάκι και από τα βουνά της Τσουκέ ως τις ακτές του Ιονίου, η περιοχή ζει και αναπνέει
            τον ελληνικό πολιτισμό αδιάλειπτα για αιώνες.
          </p>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: MapPin,
            title: "Τοποθεσία",
            text: "Νοτιοδυτικά της Δρόπολης, στον νομό Γκυρόκαστρου — νότια Αλβανία",
          },
          {
            icon: Church,
            title: "Κληρονομιά",
            text: "Αρχαία Φοινίκη, βυζαντινές εκκλησίες, οθωμανική αρχιτεκτονική Δελβινακίου",
          },
          {
            icon: Users,
            title: "Κοινότητα",
            text: "Ελληνόφωνοι οικισμοί με αδιάκοπη παρουσία από την αρχαιότητα",
          },
        ].map(({ icon: Icon, title: t, text }) => (
          <div key={t} className="bg-card rounded-xl border p-4 text-center">
            <Icon className="w-6 h-6 text-amber-600 mx-auto mb-2" />
            <p className="font-semibold text-sm">{t}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{text}</p>
          </div>
        ))}
      </div>

      {/* About text */}
      <div className="bg-card rounded-2xl border p-6 shadow-sm space-y-4">
        <h2 className="font-serif text-2xl font-bold flex items-center gap-2">
          <Landmark className="w-5 h-5 text-amber-600" />
          Σχετικά με τον Δήμο
        </h2>
        <div className="text-sm text-foreground/80 leading-relaxed space-y-3">
          <p>
            Ο <strong>Δήμος Φοινικαίων</strong> (αλβ. <em>Bashkia Finiq</em>) συστάθηκε με την αναδιοργάνωση της
            τοπικής αυτοδιοίκησης της Αλβανίας το 2015 και ανήκει στον νομό Γκυρόκαστρου. Έδρα του είναι η
            <strong> Φοινίκη</strong> (Finiqi), ένας οικισμός με αρχαίες ρίζες — η πόλη της αρχαίας Φοινίκης
            αποτελούσε πρωτεύουσα των Χαόνων και σημαντικό κέντρο ήδη από τον 4ο αιώνα π.Χ.
          </p>
          <p>
            Δεύτερη σημαντική πόλη του Δήμου είναι το <strong>Δελβινάκι</strong> (Delvina), ιστορική πόλη που
            υπήρξε πρωτεύουσα του ομώνυμου σαντζακίου κατά την οθωμανική περίοδο. Η περιοχή αγγίζει στα νότια τις
            ακτές του Ιονίου, με χωριά όπως η Λουκόβα (Lukovë) και οι Βορς (Borsh) να απολαμβάνουν εκπληκτικές
            θέες προς τη θάλασσα.
          </p>
          <p>
            Η ελληνική παρουσία στον Δήμο Φοινικαίων είναι βαθιά ριζωμένη: εκκλησίες, σχολεία και τοπωνύμια
            μαρτυρούν αδιάλειπτη ελληνόφωνη κοινότητα, η οποία διατηρεί γλώσσα, ήθη και παραδόσεις ακόμα και
            σήμερα.
          </p>
        </div>
      </div>

      {/* Municipal units */}
      <div className="bg-card rounded-2xl border p-6 shadow-sm space-y-4">
        <h2 className="font-serif text-2xl font-bold flex items-center gap-2">
          <MapPin className="w-5 h-5 text-amber-600" />
          Δημοτικές Ενότητες &amp; Χωριά
        </h2>
        <p className="text-sm text-muted-foreground">
          Ο Δήμος Φοινικαίων περιλαμβάνει 8 δημοτικές ενότητες. Κάντε κλικ για να δείτε τα χωριά κάθε ενότητας.
        </p>
        <div className="space-y-2">
          {MUNICIPAL_UNITS.map((unit, i) => (
            <div key={unit.nameAl} className="rounded-xl border overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenUnit(openUnit === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
              >
                <span className="font-semibold text-sm">
                  {unit.name}
                  <span className="ml-2 text-xs text-muted-foreground font-normal">({unit.nameAl})</span>
                </span>
                {openUnit === i
                  ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
              </button>
              {openUnit === i && (
                <div className="px-4 pb-4 pt-1 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {unit.villages.map((v) => (
                    <div key={v} className="flex items-center gap-1.5 text-sm text-foreground/80">
                      <MapPin className="w-3 h-3 text-amber-600 flex-shrink-0" />
                      {v}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="bg-card rounded-2xl border p-6 shadow-sm space-y-4">
        <h2 className="font-serif text-xl font-bold">Συνεισφορά Περιεχομένου</h2>
        <p className="text-sm text-muted-foreground">
          Έχετε νέα, φωτογραφία ή βίντεο από τον Δήμο Φοινικαίων; Μοιραστείτε το με την κοινότητα.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/submit-news"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-muted hover:bg-muted/70 px-5 py-3 text-sm font-semibold transition-colors"
          >
            <Newspaper className="w-4 h-4" />
            Αποστολή Είδησης
          </Link>
          <Link
            href="/submit-video"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-muted hover:bg-muted/70 px-5 py-3 text-sm font-semibold transition-colors"
          >
            <Video className="w-4 h-4" />
            Αποστολή Βίντεο
          </Link>
        </div>
      </div>

      {/* Photo upload form */}
      <form onSubmit={handleSubmit} className="space-y-6 bg-card rounded-2xl border p-6 shadow-sm">
        <div>
          <h2 className="font-serif text-xl font-bold mb-1 flex items-center gap-2">
            <Send className="w-5 h-5 text-amber-600" />
            Αποστολή Φωτογραφίας
          </h2>
          <p className="text-sm text-muted-foreground">
            Κάθε υποβολή κατατάσσεται αυτόματα στην κατηγορία <strong>Δήμος Φοινικαίων / Bashkia Finiq</strong> και
            αξιολογείται πριν δημοσιευτεί.
          </p>
        </div>

        {/* File picker */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold">
            Αρχείο εικόνας <span className="text-destructive">*</span>
            <span className="font-normal text-muted-foreground ml-1">(JPG/PNG/WEBP, έως 5MB)</span>
          </label>
          {preview ? (
            <div className="relative rounded-xl overflow-hidden border">
              <img src={preview} alt="Προεπισκόπηση" className="w-full max-h-64 object-contain bg-muted" />
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
            <label className="flex flex-col items-center justify-center gap-3 cursor-pointer rounded-xl border-2 border-dashed border-border hover:border-amber-600 hover:bg-amber-50/30 dark:hover:bg-amber-950/20 transition-colors p-8">
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
            placeholder="π.χ. Εκκλησία Αγίου Βασιλείου, Φοινίκη 2024"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
        </div>

        {/* Village */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold">
            Χωριό / Κοινότητα <span className="text-destructive">*</span>
          </label>
          <input type="text" required maxLength={100} value={village} onChange={(e) => setVillage(e.target.value)}
            placeholder="π.χ. Φοινίκη, Δελβινάκι, Αλυκό…"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold">Περιγραφή</label>
          <textarea maxLength={1000} value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
            placeholder="Πείτε μας τι απεικονίζει η φωτογραφία, πότε τραβήχτηκε και ποιο είναι το ιστορικό ή πολιτισμικό της πλαίσιο…"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none" />
          <p className="text-xs text-muted-foreground text-right">{description.length}/1000</p>
        </div>

        {/* Sender name */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold">Όνομα αποστολέα</label>
          <input type="text" maxLength={100} value={senderName} onChange={(e) => setSenderName(e.target.value)}
            placeholder="Πώς να σας αναφέρουμε"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold">
            Email <span className="text-muted-foreground font-normal">(προαιρετικό)</span>
          </label>
          <input type="email" maxLength={200} value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)}
            placeholder="Για επικοινωνία αν χρειαστεί"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
        </div>

        {/* Copyright */}
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input type="checkbox" checked={copyright} onChange={(e) => setCopyright(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border accent-amber-600 flex-shrink-0" />
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
              <div className="h-full bg-amber-600 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Submit */}
        <button type="submit" disabled={isBusy || !file || !title.trim() || !village.trim() || !copyright}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-700 text-white px-6 py-3 font-semibold text-sm hover:bg-amber-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
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
