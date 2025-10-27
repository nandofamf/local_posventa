import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

/**
 * Layout a pantalla completa, sin "container" ni max-w.
 * Sidebar fijo a la izquierda y el contenido ocupa todo el resto.
 */
export default function MainLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-screen bg-[#f6f7f9]">
        {/* Lateral */}
        <AppSidebar />

        {/* Contenido principal */}
        <div className="flex-1 flex flex-col w-full">
          {/* Header simple (opcional) */}
          <header className="h-14 shrink-0 border-b bg-white px-6 flex items-center">
            <h1 className="text-lg font-semibold">Sistema de Punto de Venta</h1>
          </header>

          {/* Contenido: ocupa 100% del ancho/alto */}
          <main className="flex-1 w-full p-6">
            <div className="w-full h-full">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
