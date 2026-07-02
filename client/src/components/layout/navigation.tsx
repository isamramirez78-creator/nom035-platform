import { useLocation, Link } from "wouter";

export default function Navigation() {
  const [location] = useLocation();
  const navItems = [
    { path: "/dashboard",            label: "Panel",          icon: "fas fa-tachometer-alt" },
    { path: "/employees",            label: "Empleados",      icon: "fas fa-users" },
    { path: "/invitations",          label: "Cuestionarios",  icon: "fas fa-paper-plane" },
    { path: "/reports",              label: "Reportes",       icon: "fas fa-chart-bar" },
    { path: "/expedientes",          label: "Expedientes",    icon: "fas fa-folder-open" },
    { path: "/compliance-dashboard", label: "Cumplimiento",   icon: "fas fa-shield-alt" },
    { path: "/interventions",        label: "Intervenciones", icon: "fas fa-hand-holding-heart" },
  ];
  return (
    <nav className="app-nav">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex overflow-x-auto scrollbar-none">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <button className={`nav-item ${location === item.path || location.startsWith(item.path + "/") ? "active" : ""}`}>
                <i className={`${item.icon} mr-1.5 text-xs`}></i>
                {item.label}
              </button>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
