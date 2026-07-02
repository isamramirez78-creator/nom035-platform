import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

const token = () => localStorage.getItem("company_token");
const h = () => ({ "Content-Type": "application/json", ...(token() ? { Authorization: `Bearer ${token()}` } : {}) });

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { data: stats } = useQuery<any>({
    queryKey: ["/api/stats"],
    queryFn: async () => { const r = await fetch("/api/stats", { headers: h() }); return r.ok ? r.json() : {}; },
  });
  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ["/api/employees"],
    queryFn: async () => { const r = await fetch("/api/employees", { headers: h() }); return r.ok ? r.json() : []; },
  });
  const { data: evals = [] } = useQuery<any[]>({
    queryKey: ["/api/evaluations"],
    queryFn: async () => { const r = await fetch("/api/evaluations", { headers: h() }); return r.ok ? r.json() : []; },
  });
  const { data: company } = useQuery<any>({
    queryKey: ["/api/company-info"],
    queryFn: async () => { const r = await fetch("/api/company-info", { headers: h() }); return r.ok ? r.json() : {}; },
  });

  const hasEmployees = employees.length > 0;
  const hasEvals = evals.filter((e: any) => e.completed).length > 0;
  const hasReport = hasEvals;
  const completedSteps = [hasEmployees, hasEvals, hasReport].filter(Boolean).length;
  const pct = Math.round((completedSteps / 3) * 100);

  const steps = [
    {
      num: 1, done: hasEmployees,
      title: "Registra tus empleados",
      desc: "Agrega los colaboradores de tu empresa individualmente o importa desde Excel/CSV.",
      action: "Ir a Empleados", path: "/employees",
      icon: "fas fa-users",
    },
    {
      num: 2, done: hasEvals,
      title: "Envía el cuestionario NOM-035",
      desc: "Envía el link de evaluación a cada empleado por email. Ellos lo llenan desde su celular o computadora.",
      action: "Enviar cuestionarios", path: "/invitations",
      icon: "fas fa-paper-plane",
      disabled: !hasEmployees,
    },
    {
      num: 3, done: hasReport,
      title: "Revisa resultados y genera reportes",
      desc: "Analiza los niveles de riesgo por empleado y área. Descarga reportes PDF para auditorías.",
      action: "Ver reportes", path: "/reports",
      icon: "fas fa-chart-bar",
      disabled: !hasEvals,
    },
  ];

  return (
    <div className="page-container space-y-6">
      {/* Bienvenida */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #1E3A5F 0%, #152B47 100%)", border: "3px solid #84CC16" }}>
        <div className="p-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: "#84CC16" }}>Bienvenido a NOM-035 Platform</p>
              <h1 className="text-2xl font-bold text-white mb-2">
                {company?.razonSocial || company?.nombre_empresa || "Tu empresa"}
              </h1>
              <p className="text-sm" style={{ color: "#94A3B8" }}>
                Sigue estos 3 pasos para cumplir con la NOM-035-STPS-2018 y estar listo para cualquier inspección de la STPS.
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold" style={{ color: "#84CC16" }}>{pct}%</div>
              <div className="text-xs" style={{ color: "#64748B" }}>completado</div>
            </div>
          </div>
          {/* Barra de progreso */}
          <div className="mt-5">
            <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
              <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: "#84CC16" }}></div>
            </div>
            <p className="text-xs mt-2" style={{ color: "#64748B" }}>{completedSteps} de 3 pasos completados</p>
          </div>
        </div>
      </div>

      {/* Pasos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((step) => (
          <div key={step.num} className="section-card relative overflow-hidden"
            style={{ opacity: step.disabled ? 0.6 : 1 }}>
            {step.done && (
              <div className="absolute top-3 right-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#84CC16" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              </div>
            )}
            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: step.done ? "#84CC16" : "#E2E8F0" }}></div>
            <div className="p-5 pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: step.done ? "#ECFCCB" : "#EFF6FF" }}>
                  <i className={`${step.icon} text-base`} style={{ color: step.done ? "#3F6212" : "#1E3A5F" }}></i>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: step.done ? "#ECFCCB" : "#F1F5F9", color: step.done ? "#3F6212" : "#64748B" }}>
                  Paso {step.num}
                </span>
              </div>
              <h3 className="font-semibold text-sm mb-1" style={{ color: "#1E3A5F" }}>{step.title}</h3>
              <p className="text-xs text-slate-500 mb-4">{step.desc}</p>
              <Button
                onClick={() => !step.disabled && setLocation(step.path)}
                disabled={step.disabled}
                className="w-full text-xs h-8"
                style={{ background: step.done ? "#1E3A5F" : "#84CC16", color: step.done ? "white" : "#1E3A5F" }}>
                {step.done ? "✓ Completado — Ver" : step.action}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Accesos rápidos */}
      <div className="section-card">
        <div className="section-header"><div className="lime-dot"/><h3>Accesos rápidos</h3></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
          {[
            { icon: "fas fa-file-pdf", label: "Generar Reporte", sub: "PDF ejecutivo", path: "/reports", color: "#DC2626" },
            { icon: "fas fa-folder-open", label: "Expedientes", sub: "Trabajadores en riesgo", path: "/expedientes", color: "#7C3AED" },
            { icon: "fas fa-shield-alt", label: "Cumplimiento", sub: "Estado NOM-035", path: "/compliance-dashboard", color: "#0891B2" },
            { icon: "fas fa-file-contract", label: "Documentos", sub: "Política y actas", path: "/expedientes", color: "#059669" },
          ].map((item) => (
            <button key={item.label} onClick={() => setLocation(item.path)}
              className="action-item flex-col items-start gap-2 p-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${item.color}15` }}>
                <i className={`${item.icon} text-sm`} style={{ color: item.color }}></i>
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#1E3A5F" }}>{item.label}</p>
                <p className="text-xs text-slate-400">{item.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Info normativa */}
      <div className="p-4 rounded-xl" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
        <div className="flex items-start gap-3">
          <i className="fas fa-info-circle text-amber-500 mt-0.5"></i>
          <div>
            <p className="text-sm font-semibold text-amber-800">Recuerda: la NOM-035 aplica por centro de trabajo</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Si tu empresa tiene múltiples sucursales, cada una debe evaluarse de forma independiente.
              Configura tus centros de trabajo en el Panel de Cumplimiento.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
