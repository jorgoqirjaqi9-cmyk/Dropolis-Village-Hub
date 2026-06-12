import { Switch, Route, Redirect, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import NotFound from "@/pages/not-found";

import Home from "@/pages/Home";
import News from "@/pages/News";
import NewsDetail from "@/pages/NewsDetail";
import Villages from "@/pages/Villages";
import VillageDetail from "@/pages/VillageDetail";
import Photos from "@/pages/Photos";
import Videos from "@/pages/Videos";
import Chat from "@/pages/Chat";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import CookiePolicy from "@/pages/CookiePolicy";
import Disclaimer from "@/pages/Disclaimer";
import Press from "@/pages/Press";
import Help from "@/pages/Help";
import Sitemap from "@/pages/Sitemap";

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
      <Route path="/chat" component={Chat} />

      {/* All other pages use the standard Layout */}
      <Route>
        <Layout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/news" component={News} />
            <Route path="/news/:id" component={NewsDetail} />
            <Route path="/villages" component={Villages} />
            <Route path="/villages/:id" component={VillageDetail} />
            <Route path="/photos" component={Photos} />
            <Route path="/videos" component={Videos} />
            <Route path="/about" component={About} />
            <Route path="/contact" component={Contact} />
            <Route path="/privacy" component={Privacy} />
            <Route path="/privacy-policy">
              <Redirect to="/privacy" />
            </Route>
            <Route path="/terms" component={Terms} />
            <Route path="/terms-of-service">
              <Redirect to="/terms" />
            </Route>
            <Route path="/cookie-policy" component={CookiePolicy} />
            <Route path="/disclaimer" component={Disclaimer} />
            <Route path="/press" component={Press} />
            <Route path="/help" component={Help} />
            <Route path="/sitemap" component={Sitemap} />
            <Route component={NotFound} />
          </Switch>
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
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
