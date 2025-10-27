import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ClipboardList,
} from "lucide-react";

export function AppSidebar() {
  return (
    <aside className="w-64 bg-muted/40 border-r border-gray-200 h-screen flex flex-col">
      <div className="p-6 text-2xl font-extrabold text-blue-700 tracking-tight">
        Sistema POS
      </div>

      <nav className="flex flex-col space-y-2 px-4">
        <SidebarButton
          to="/"
          icon={<ShoppingCart className="h-6 w-6" />}
          label="Punto de Venta"
        />
        <SidebarButton
          to="/dashboard"
          icon={<LayoutDashboard className="h-6 w-6" />}
          label="Dashboard"
        />
        {/* OJO: rutas en español */}
        <SidebarButton
          to="/inventario"
          icon={<Package className="h-6 w-6" />}
          label="Inventario"
        />
        <SidebarButton
          to="/orden"
          icon={<ClipboardList className="h-6 w-6" />}
          label="Orden de Trabajo"
        />
      </nav>
    </aside>
  );
}

function SidebarButton({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `
        flex items-center gap-4 rounded-md p-3 text-[17px] font-medium transition-colors
        ${
          isActive
            ? "bg-blue-100 text-blue-700 border-l-4 border-blue-600"
            : "text-gray-700 hover:bg-gray-100"
        }
      `
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}
