import { lazy, Suspense } from "react";
import { Switch, Route, Redirect, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import { ScrollToTop } from "@/components/ScrollToTop";

const NotFound        = lazy(() => import("@/pages/not-found"));
const Home            = lazy(() => import("@/pages/Home"));
const News            = lazy(() => import("@/pages/News"));
const NewsDetail      = lazy(() => import("@/pages/NewsDetail"));
const Villages        = lazy(() => import("@/pages/Villages"));
const VillageDetail   = lazy(() => import("@/pages/VillageDetail"));
const Photos          = lazy(() => import("@/pages/Photos"));
const Videos          = lazy(() => import("@/pages/Videos"));
const Chat            = lazy(() => import("@/pages/Chat"));
const About           = lazy(() => import("@/pages/About"));
const Contact         = lazy(() => import("@/pages/Contact"));
const Privacy         = lazy(() => import("@/pages/Privacy"));
const Terms           = lazy(() => import("@/pages/Terms"));
const CookiePolicy    = lazy(() => import("@/pages/CookiePolicy"));
const Disclaimer      = lazy(() => import("@/pages/Disclaimer"));
const Press           = lazy(() => import("@/pages/Press"));
const Help            = lazy(() => import("@/pages/Help"));
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
const UploadPhoto     = lazy(() => import("@/pages/UploadPhoto"));
const AdminPhotos     = lazy(() => import("@/pages/AdminPhotos"));
const SubmitNews      = lazy(() => import("@/pages/SubmitNews"));
const AdminNews       = lazy(() => import("@/pages/AdminNews"));
const SubmitVideo     = lazy(() => import("@/pages/SubmitVideo"));
const AdminVideos     = lazy(() => import("@/pages/AdminVideos"));
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
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Switch>
      {/* Chat is full-screen — no Layout wrapper */}
      <Route path="/chat">
        <PageLoader><Chat /></PageLoader>
      </Route>
      <Route path="/chat/">
        <PageLoader><Chat /></PageLoader>
      </Route>

      {/* All other pages use the standard Layout */}
      <Route>
        <Layout>
          <PageLoader>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/news" component={News} />
              <Route path="/news/" component={News} />
              <Route path="/news/:id" component={NewsDetail} />
              <Route path="/villages" component={Villages} />
              <Route path="/villages/" component={Villages} />
              <Route path="/villages/:id" component={VillageDetail} />
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
                <Redirect to="/privacy" />
              </Route>
              <Route path="/terms" component={Terms} />
              <Route path="/terms/" component={Terms} />
              <Route path="/terms-of-service">
                <Redirect to="/terms" />
              </Route>
              <Route path="/cookie-policy" component={CookiePolicy} />
              <Route path="/cookie-policy/" component={CookiePolicy} />
              <Route path="/disclaimer" component={Disclaimer} />
              <Route path="/disclaimer/" component={Disclaimer} />
              <Route path="/press" component={Press} />
              <Route path="/press/" component={Press} />
              <Route path="/help" component={Help} />
              <Route path="/help/" component={Help} />
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
              <Route path="/upload-photo" component={UploadPhoto} />
              <Route path="/upload-photo/" component={UploadPhoto} />
              <Route path="/admin/photos" component={AdminPhotos} />
              <Route path="/admin/photos/" component={AdminPhotos} />
              <Route path="/submit-news" component={SubmitNews} />
              <Route path="/submit-news/" component={SubmitNews} />
              <Route path="/admin/news" component={AdminNews} />
              <Route path="/admin/news/" component={AdminNews} />
              <Route path="/submit-video" component={SubmitVideo} />
              <Route path="/submit-video/" component={SubmitVideo} />
              <Route path="/admin/videos" component={AdminVideos} />
              <Route path="/admin/videos/" component={AdminVideos} />
              <Route path="/admin/indexing" component={AdminIndexingLog} />
              <Route path="/admin/indexing/" component={AdminIndexingLog} />
              <Route component={NotFound} />
            </Switch>
          </PageLoader>
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
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
