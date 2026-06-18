import { lazy, Suspense, useEffect } from "react";
import { Switch, Route, Redirect, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setBaseUrl } from "@workspace/api-client-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import { ScrollToTop } from "@/components/ScrollToTop";
// Home is imported eagerly so React renders the hero section immediately on
// mount — no lazy-chunk download on the critical path, which was responsible
// for the 2,150 ms Element Render Delay seen in Lighthouse.
import Home from "@/pages/Home";

// Ensure all generated API hooks use the exact origin the browser is connected
// to. This covers dev preview (proxied iframe), staging, and production without
// any hardcoded port or hostname.
setBaseUrl(window.location.origin);

const NotFound        = lazy(() => import("@/pages/not-found"));
const News            = lazy(() => import("@/pages/News"));
const NewsDetail      = lazy(() => import("@/pages/NewsDetail"));
const Villages        = lazy(() => import("@/pages/Villages"));
const VillageDetail   = lazy(() => import("@/pages/VillageDetail"));
const VillageMap      = lazy(() => import("@/pages/VillageMap"));
const Photos          = lazy(() => import("@/pages/Photos"));
const Videos          = lazy(() => import("@/pages/Videos"));

const About           = lazy(() => import("@/pages/About"));
const Contact         = lazy(() => import("@/pages/Contact"));
const Privacy         = lazy(() => import("@/pages/Privacy"));
const Terms           = lazy(() => import("@/pages/Terms"));
const CookiePolicy    = lazy(() => import("@/pages/CookiePolicy"));
const Disclaimer      = lazy(() => import("@/pages/Disclaimer"));
const Press           = lazy(() => import("@/pages/Press"));
const Help            = lazy(() => import("@/pages/Help"));
const FAQ             = lazy(() => import("@/pages/FAQ"));
const Sitemap         = lazy(() => import("@/pages/Sitemap"));
const EditorialPolicy   = lazy(() => import("@/pages/EditorialPolicy"));
const CorrectionsPolicy = lazy(() => import("@/pages/CorrectionsPolicy"));
const Contributors    = lazy(() => import("@/pages/Contributors"));
const Advertise       = lazy(() => import("@/pages/Advertise"));
const EnIndex         = lazy(() => import("@/pages/EnIndex"));
const EnAbout         = lazy(() => import("@/pages/EnAbout"));
const EnVillages      = lazy(() => import("@/pages/EnVillages"));
const EnNews          = lazy(() => import("@/pages/EnNews"));
const EnContact       = lazy(() => import("@/pages/EnContact"));
const EnPhotos        = lazy(() => import("@/pages/EnPhotos"));
const UploadPhoto     = lazy(() => import("@/pages/UploadPhoto"));
const Diaspora        = lazy(() => import("@/pages/Diaspora"));
const Finiq           = lazy(() => import("@/pages/Finiq"));
const SubmitNews        = lazy(() => import("@/pages/SubmitNews"));
const SubmitVideo       = lazy(() => import("@/pages/SubmitVideo"));
const TraditionalFood   = lazy(() => import("@/pages/TraditionalFood"));
const Villages41        = lazy(() => import("@/pages/Villages41"));

// Admin pages — full-screen (no Layout wrapper, include their own AdminLayout)
const AdminDashboard  = lazy(() => import("@/pages/AdminDashboard"));
const AdminArticles   = lazy(() => import("@/pages/AdminArticles"));
const AdminPhotos     = lazy(() => import("@/pages/AdminPhotos"));
const AdminVideos     = lazy(() => import("@/pages/AdminVideos"));
const AdminNews       = lazy(() => import("@/pages/AdminNews"));
const AdminVillages   = lazy(() => import("@/pages/AdminVillages"));
const AdminCaptions   = lazy(() => import("@/pages/AdminCaptions"));
const AdminIndexingLog = lazy(() => import("@/pages/AdminIndexingLog"));

export function PageLoader({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="sr-only">Φόρτωση...</div>}>
      {children}
    </Suspense>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

function Router() {
  return (
    <Switch>
      {/* Admin routes — full-screen with AdminLayout sidebar (no public header/footer) */}
      <Route path="/admin">
        <PageLoader><AdminDashboard /></PageLoader>
      </Route>
      <Route path="/admin/">
        <PageLoader><AdminDashboard /></PageLoader>
      </Route>
      <Route path="/admin/articles">
        <PageLoader><AdminArticles /></PageLoader>
      </Route>
      <Route path="/admin/articles/">
        <PageLoader><AdminArticles /></PageLoader>
      </Route>
      <Route path="/admin/photos">
        <PageLoader><AdminPhotos /></PageLoader>
      </Route>
      <Route path="/admin/photos/">
        <PageLoader><AdminPhotos /></PageLoader>
      </Route>
      <Route path="/admin/videos">
        <PageLoader><AdminVideos /></PageLoader>
      </Route>
      <Route path="/admin/videos/">
        <PageLoader><AdminVideos /></PageLoader>
      </Route>
      <Route path="/admin/news">
        <PageLoader><AdminNews /></PageLoader>
      </Route>
      <Route path="/admin/news/">
        <PageLoader><AdminNews /></PageLoader>
      </Route>
      <Route path="/admin/villages">
        <PageLoader><AdminVillages /></PageLoader>
      </Route>
      <Route path="/admin/villages/">
        <PageLoader><AdminVillages /></PageLoader>
      </Route>
      <Route path="/admin/captions">
        <PageLoader><AdminCaptions /></PageLoader>
      </Route>
      <Route path="/admin/captions/">
        <PageLoader><AdminCaptions /></PageLoader>
      </Route>
      <Route path="/admin/indexing">
        <PageLoader><AdminIndexingLog /></PageLoader>
      </Route>
      <Route path="/admin/indexing/">
        <PageLoader><AdminIndexingLog /></PageLoader>
      </Route>

      {/* All other pages use the standard public Layout */}
      <Route>
        <Layout>
          <PageLoader>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/news" component={News} />
              <Route path="/news/" component={News} />
              <Route path="/news/:id" component={NewsDetail} />
              {/* Trailing-slash variant: dynamic sitemap emits /news/:id/ so
                  Googlebot crawls that URL — without this route, wouter falls
                  through to <NotFound> which sets noindex ("Discovered - not
                  indexed" in GSC). */}
              <Route path="/news/:id/" component={NewsDetail} />
              <Route path="/villages" component={Villages} />
              <Route path="/villages/" component={Villages} />
              <Route path="/villages/map" component={VillageMap} />
              <Route path="/villages/map/" component={VillageMap} />
              <Route path="/villages/:id" component={VillageDetail} />
              {/* Same fix for village detail pages */}
              <Route path="/villages/:id/" component={VillageDetail} />
              <Route path="/photos" component={Photos} />
              <Route path="/photos/" component={Photos} />
              <Route path="/videos" component={Videos} />
              <Route path="/videos/" component={Videos} />
              <Route path="/about" component={About} />
              <Route path="/about/" component={About} />
              <Route path="/contact" component={Contact} />
              <Route path="/contact/" component={Contact} />
              <Route path="/privacy" component={Privacy} />
              <Route path="/privacy/" component={Privacy} />
              <Route path="/privacy-policy">
                {/* Redirect to canonical URL with trailing slash — must match
                    the server-side 301 in redirects.ts and the SEO.tsx
                    canonical so Google doesn't flag a redirect chain. */}
                <Redirect to="/privacy/" />
              </Route>
              <Route path="/terms" component={Terms} />
              <Route path="/terms/" component={Terms} />
              <Route path="/terms-of-service">
                <Redirect to="/terms/" />
              </Route>
              <Route path="/cookie-policy" component={CookiePolicy} />
              <Route path="/cookie-policy/" component={CookiePolicy} />
              <Route path="/disclaimer" component={Disclaimer} />
              <Route path="/disclaimer/" component={Disclaimer} />
              <Route path="/press" component={Press} />
              <Route path="/press/" component={Press} />
              <Route path="/help" component={Help} />
              <Route path="/help/" component={Help} />
              <Route path="/faq" component={FAQ} />
              <Route path="/faq/" component={FAQ} />
              <Route path="/sitemap" component={Sitemap} />
              <Route path="/sitemap/" component={Sitemap} />
              <Route path="/editorial-policy" component={EditorialPolicy} />
              <Route path="/editorial-policy/" component={EditorialPolicy} />
              <Route path="/corrections-policy" component={CorrectionsPolicy} />
              <Route path="/corrections-policy/" component={CorrectionsPolicy} />
              <Route path="/contributors" component={Contributors} />
              <Route path="/contributors/" component={Contributors} />
              <Route path="/advertise" component={Advertise} />
              <Route path="/advertise/" component={Advertise} />
              <Route path="/en" component={EnIndex} />
              <Route path="/en/" component={EnIndex} />
              <Route path="/en/about" component={EnAbout} />
              <Route path="/en/about/" component={EnAbout} />
              <Route path="/en/villages" component={EnVillages} />
              <Route path="/en/villages/" component={EnVillages} />
              <Route path="/en/news" component={EnNews} />
              <Route path="/en/news/" component={EnNews} />
              <Route path="/en/contact" component={EnContact} />
              <Route path="/en/contact/" component={EnContact} />
              <Route path="/en/photos" component={EnPhotos} />
              <Route path="/en/photos/" component={EnPhotos} />
              <Route path="/upload-photo" component={UploadPhoto} />
              <Route path="/upload-photo/" component={UploadPhoto} />
              <Route path="/diaspora" component={Diaspora} />
              <Route path="/diaspora/" component={Diaspora} />
              <Route path="/finiq" component={Finiq} />
              <Route path="/finiq/" component={Finiq} />
              <Route path="/submit-news" component={SubmitNews} />
              <Route path="/submit-news/" component={SubmitNews} />
              <Route path="/submit-video" component={SubmitVideo} />
              <Route path="/submit-video/" component={SubmitVideo} />
              <Route path="/paradosiaka-faghta" component={TraditionalFood} />
              <Route path="/paradosiaka-faghta/" component={TraditionalFood} />
              <Route path="/ta-41-xoria-tis-dropolis" component={Villages41} />
              <Route path="/ta-41-xoria-tis-dropolis/" component={Villages41} />
              <Route component={NotFound} />
            </Switch>
          </PageLoader>
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  // GA4 + Clarity: load lazily after first user interaction OR 5 s timeout —
  // whichever comes first. Nothing analytics-related runs at parse/paint time.
  useEffect(() => {
    let loaded = false;

    const loadAnalytics = () => {
      if (loaded) return;
      loaded = true;

      // Google Analytics 4
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      w.dataLayer = w.dataLayer || [];
      // eslint-disable-next-line prefer-rest-params
      w.gtag = function () { w.dataLayer.push(arguments); };
      w.gtag("js", new Date());
      w.gtag("config", "G-R96FYBFRYQ");
      const gaScript = document.createElement("script");
      gaScript.async = true;
      gaScript.src = "https://www.googletagmanager.com/gtag/js?id=G-R96FYBFRYQ";
      document.head.appendChild(gaScript);

      // Microsoft Clarity
      w.clarity = w.clarity || function () {
        // eslint-disable-next-line prefer-rest-params
        (w.clarity.q = w.clarity.q || []).push(arguments);
      };
      const clarityScript = document.createElement("script");
      clarityScript.async = true;
      clarityScript.src = "https://www.clarity.ms/tag/x8zr0riq8m";
      document.head.appendChild(clarityScript);
    };

    const EVENTS = ["click", "scroll", "keydown", "touchstart"] as const;
    EVENTS.forEach((e) =>
      window.addEventListener(e, loadAnalytics, { once: true, passive: true }),
    );
    const timer = setTimeout(loadAnalytics, 5000);

    return () => {
      clearTimeout(timer);
      EVENTS.forEach((e) => window.removeEventListener(e, loadAnalytics));
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <ScrollToTop />
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
