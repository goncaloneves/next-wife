import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { FilterProvider } from "@/contexts/FilterContext";
import { useIsMobile } from "@/hooks/use-mobile";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Discover from "./pages/Discover";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const location = useLocation();
  const isMobile = useIsMobile();
  
  const state = location.state as { backgroundLocation?: Location; isOverlay?: boolean } | null;
  const backgroundLocation = state?.backgroundLocation;
  const isOverlay = state?.isOverlay && !isMobile;

  return (
    <>
      <Routes location={isOverlay && backgroundLocation ? backgroundLocation : location}>
        <Route path="/" element={<Index />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      {isOverlay && location.pathname.startsWith('/profile/') && (
        <div className="fixed inset-0 z-50 bg-black">
          <Routes location={location}>
            <Route path="/profile/:id" element={<Profile isOverlay={true} />} />
          </Routes>
        </div>
      )}
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <FilterProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </FilterProvider>
  </QueryClientProvider>
);

export default App;
