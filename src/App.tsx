import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import MainLayout from "@/components/Layout/MainLayout";
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import Inventory from "@/pages/Inventory";
import WorkOrder from "@/pages/WorkOrder";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            {/* Rutas que usan el layout con sidebar */}
            <Route element={<MainLayout />}>
              <Route index element={<Index />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="inventario" element={<Inventory />} />
              <Route path="orden" element={<WorkOrder />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
