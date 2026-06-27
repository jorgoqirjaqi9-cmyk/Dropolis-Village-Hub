import { Smartphone, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface Props {
  showIOSModal: boolean;
  setShowIOSModal: (v: boolean) => void;
  showGenericModal: boolean;
  setShowGenericModal: (v: boolean) => void;
}

export default function PWAInstallDialogs({ showIOSModal, setShowIOSModal, showGenericModal, setShowGenericModal }: Props) {
  return (
    <>
      <Dialog open={showIOSModal} onOpenChange={setShowIOSModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif">
              <Smartphone size={20} className="text-primary" /> Εγκατάσταση στο iPhone / iPad
            </DialogTitle>
            <DialogDescription>
              Το Safari δεν υποστηρίζει αυτόματη εγκατάσταση. Ακολουθήστε τα παρακάτω βήματα:
            </DialogDescription>
          </DialogHeader>
          <ol className="space-y-4 mt-2">
            <li className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
              <div>
                <p className="text-sm font-medium">Πατήστε το κουμπί Κοινοποίηση</p>
                <p className="text-xs text-muted-foreground mt-0.5">Βρίσκεται στο κάτω μέρος του Safari <span className="inline-block">⬆️</span></p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
              <div>
                <p className="text-sm font-medium">Επιλέξτε «Προσθήκη στην οθόνη αφετηρίας»</p>
                <p className="text-xs text-muted-foreground mt-0.5">Κυλήστε προς τα κάτω στο μενού επιλογών</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
              <div>
                <p className="text-sm font-medium">Πατήστε «Προσθήκη»</p>
                <p className="text-xs text-muted-foreground mt-0.5">Το Dropolis θα εμφανιστεί στην αρχική οθόνη σας</p>
              </div>
            </li>
          </ol>
        </DialogContent>
      </Dialog>

      <Dialog open={showGenericModal} onOpenChange={setShowGenericModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif">
              <Download size={20} className="text-primary" /> Εγκατάσταση εφαρμογής
            </DialogTitle>
            <DialogDescription>
              Ο browser σας μπορεί να υποστηρίζει εγκατάσταση ως εφαρμογή.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-3 text-sm text-foreground">
            <p>Ανοίξτε το μενού του browser σας <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">⋮</span> ή <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">≡</span> και επιλέξτε:</p>
            <ul className="space-y-2 pl-2">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <span><strong>«Install app»</strong> ή <strong>«Εγκατάσταση εφαρμογής»</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <span><strong>«Add to Home screen»</strong> ή <strong>«Προσθήκη στην αρχική»</strong></span>
              </li>
            </ul>
            <p className="text-muted-foreground text-xs">Αν δεν εμφανίζεται αυτή η επιλογή, ο browser σας ενδέχεται να μην υποστηρίζει PWA εγκατάσταση.</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
