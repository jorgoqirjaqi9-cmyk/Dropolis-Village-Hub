import { useState, useEffect } from "react";
import { Cookie, X, Check, Settings } from "lucide-react";
import { Link } from "wouter";

type ConsentState = "accepted" | "rejected" | "pending";

export function CookieConsent() {
  const [state, setState] = useState<ConsentState>("pending");
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [advertising, setAdvertising] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("dropolis-cookie-consent");
    if (stored) {
      setState(stored as ConsentState);
      return;
    }
    const t = setTimeout(() => setVisible(true), 400);
    return () => clearTimeout(t);
  }, []);

  const accept = () => {
    localStorage.setItem("dropolis-cookie-consent", "accepted");
    localStorage.setItem("dropolis-cookie-analytics", analytics ? "1" : "0");
    localStorage.setItem("dropolis-cookie-advertising", advertising ? "1" : "0");
    if (advertising && !document.querySelector('script[src*="adsbygoogle.js"]')) {
      const s = document.createElement("script");
      s.async = true;
      s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3960290713410584";
      s.crossOrigin = "anonymous";
      document.head.appendChild(s);
    }
    setVisible(false);
    setTimeout(() => setState("accepted"), 350);
  };

  const reject = () => {
    localStorage.setItem("dropolis-cookie-consent", "rejected");
    localStorage.setItem("dropolis-cookie-analytics", "0");
    localStorage.setItem("dropolis-cookie-advertising", "0");
    setVisible(false);
    setTimeout(() => setState("rejected"), 350);
  };

  if (state !== "pending") return null;

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-md z-50 transition-all duration-500 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0 pointer-events-none"
      }`}
    >
      <div className="glass rounded-2xl shadow-2xl shadow-black/20 border border-border/60 p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Cookie className="w-5 h-5 text-secondary shrink-0" />
            <h3 className="font-semibold text-foreground">Χρησιμοποιούμε Cookies</h3>
          </div>
          <button onClick={reject} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted">
            <X size={16} />
          </button>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          Χρησιμοποιούμε cookies για ανάλυση επισκεψιμότητας και εξατομικευμένες διαφημίσεις (Google AdSense). Διαβάστε την{" "}
          <Link href="/cookie-policy" className="text-primary hover:underline">Πολιτική Cookies</Link> μας.
        </p>

        <div
          className={`overflow-hidden transition-all duration-300 ease-out ${
            showDetails ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="space-y-3 pt-1">
            {[
              { label: "Απαραίτητα Cookies", desc: "Απαιτούνται για τη λειτουργία", checked: true, disabled: true, setter: undefined },
              { label: "Cookies Ανάλυσης", desc: "Google Analytics", checked: analytics, disabled: false, setter: setAnalytics },
              { label: "Cookies Διαφήμισης", desc: "Google AdSense", checked: advertising, disabled: false, setter: setAdvertising },
            ].map(({ label, desc, checked, disabled, setter }) => (
              <label key={label} className={`flex items-center justify-between gap-3 p-3 rounded-lg border border-border/60 ${disabled ? "opacity-60" : "cursor-pointer hover:bg-muted/50"}`}>
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <div
                  onClick={() => !disabled && setter && setter(!checked)}
                  className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${checked ? "bg-primary" : "bg-muted"}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={accept}
            className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 bg-primary text-primary-foreground py-2 px-4 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Check size={14} /> Αποδοχή
          </button>
          <button
            onClick={reject}
            className="flex-1 min-w-[100px] py-2 px-4 rounded-xl text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors"
          >
            Μόνο Απαραίτητα
          </button>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Ρυθμίσεις"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
