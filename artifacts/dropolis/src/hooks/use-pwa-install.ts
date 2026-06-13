import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function usePWAInstall() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Already running as standalone PWA
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) {
      setIsInstalled(true);
      return;
    }

    const ua = navigator.userAgent;
    // iOS Safari: iPhone/iPad/iPod, excluding Chrome iOS and Firefox iOS
    setIsIOS(/iphone|ipad|ipod/i.test(ua) && !/crios/i.test(ua) && !/fxios/i.test(ua));

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setPrompt(null);
    });
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async (): Promise<boolean> => {
    if (!prompt) return false;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      setPrompt(null);
      setIsInstalled(true);
    }
    return outcome === "accepted";
  };

  const canNativeInstall = !!prompt;

  return { canNativeInstall, isIOS, isInstalled, install };
}
