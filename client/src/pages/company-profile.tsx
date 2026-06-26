import { useQuery } from "@tanstack/react-query";

export default function CompanyProfile() {
  const { data: company, isLoading } = useQuery<any>({
    queryKey: ["/api/company-info"],
    queryFn: async () => {
      const token = localStorage.getItem("company_token");
      const res = await fetch("/api/companies/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al cargar perfil");
      return res.json();
    },
  });

  if (isLoading) return <div className="page-container"><p className="text-slate-500">Cargando perfil...</p></div>;

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center gap-3">
        <div style={{ width: 3, height: "2.5rem", background: "#84CC16", borderRadius: 2 }}></div>
        <div>
          <h1 className="page-title">Perfil de la Empresa</h1>
          <p className="page-subtitle">Información de tu cuenta en la plataforma NOM-035</p>
        </div>
      </div>

      <div className="section-card">
        <div className="section-header">
          <div className="lime-dot"></div>
          <h3>Datos Generales</h3>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "Razón Social", value: company?.razonSocial || company?.razon_social || "—" },
            { label: "Nombre Empresa", value: company?.nombreEmpresa || company?.nombre_empresa || "—" },
            { label: "RFC", value: company?.rfc || "—" },
            { label: "Correo Electrónico", value: company?.correoElectronico || company?.correo_electronico || "—" },
            { label: "Teléfono", value: company?.telefono || "—" },
            { label: "Plan Activo", value: company?.subscriptionPlan || company?.subscription_plan || "trial" },
            { label: "Estado", value: company?.subscriptionStatus || company?.subscription_status || "active" },
            { label: "Límite de Empleados", value: company?.maxEmployees || company?.max_employees || 5 },
          ].map((item) => (
            <div key={item.label} className="p-3 rounded-lg" style={{ background: "#F8FAFC", border: "0.5px solid #E2E8F0" }}>
              <p className="text-xs font-medium text-slate-500 mb-1">{item.label}</p>
              <p className="text-sm font-semibold" style={{ color: "#1E3A5F" }}>{String(item.value)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
