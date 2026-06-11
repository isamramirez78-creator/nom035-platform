import { useLocation } from "wouter";
import { Link } from "wouter";

export default function Navigation() {
  const [location] = useLocation();

  const navItems = [
    { id: "dashboard", path: "/dashboard", label: "Panel Principal", icon: "fas fa-tachometer-alt" },
    { id: "employees", path: "/employees", label: "Empleados", icon: "fas fa-users" },
    { id: "import", path: "/import", label: "Importar", icon: "fas fa-upload" },
    { id: "questionnaires", path: "/questionnaires", label: "Cuestionarios", icon: "fas fa-clipboard-list" },
    { id: "reports", path: "/reports", label: "Reportes", icon: "fas fa-chart-bar" },
  ];

  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {navItems.map((item) => (
            <Link key={item.id} href={item.path}>
              <button
                className={`nav-item ${
                  location === item.path ? "active" : ""
                }`}
              >
                <i className={`${item.icon} mr-2`}></i>
                {item.label}
              </button>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
