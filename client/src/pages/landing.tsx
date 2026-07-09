import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const [, setLocation] = useLocation();

  const features = [
    { icon: "fas fa-clipboard-check", title: "Evaluaciones Certificadas", desc: "Cuestionarios oficiales Guías I, II y III con cálculo automático de niveles de riesgo según NOM-035-STPS-2018." },
    { icon: "fas fa-users", title: "Gestión Centralizada", desc: "Administración de colaboradores, envío de cuestionarios por email y seguimiento de evaluaciones por área." },
    { icon: "fas fa-chart-bar", title: "Reportes Ejecutivos", desc: "Reportes PDF profesionales para auditorías gubernamentales, con análisis por dominio y recomendaciones." },
    { icon: "fas fa-folder-open", title: "Expedientes Digitales", desc: "Historial de seguimiento para trabajadores en riesgo: citas, intervenciones y evidencias documentadas." },
    { icon: "fas fa-shield-alt", title: "Control de Cumplimiento", desc: "Calendario de vencimientos, canal de denuncias y gestión de documentos normativos obligatorios." },
    { icon: "fas fa-building", title: "Multi-Centro de Trabajo", desc: "Gestión independiente por sucursal. La NOM-035 aplica por cada centro de trabajo." },
  ];

  const [isYearly, setIsYearly] = useState(false);
  const PLANS_DATA = [
    { name: "Plan Básico", monthlyPrice: 899, employees: "1-15 empleados", color: "#1E3A5F", popular: false, plan: "basic" },
    { name: "Plan Profesional", monthlyPrice: 1899, employees: "16-50 empleados", color: "#84CC16", popular: true, plan: "professional" },
    { name: "Plan Empresarial", price: "$3,499", period: "/mes", employees: "50+ empleados", color: "#1E3A5F", popular: false },
  ];

  const plans = PLANS_DATA.map(p => ({
    ...p,
    price: isYearly
      ? "$" + (p.monthlyPrice * 10).toLocaleString("es-MX")
      : "$" + p.monthlyPrice.toLocaleString("es-MX"),
    period: isYearly ? "/año" : "/mes",
    savings: isYearly ? `Ahorras $${(p.monthlyPrice * 2).toLocaleString("es-MX")}` : null,
  }));

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* Nav */}
      <nav style={{ background: "#1E3A5F", borderBottom: "3px solid #84CC16", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, background: "#84CC16", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>
              </svg>
            </div>
            <div>
              <div style={{ color: "white", fontWeight: 700, fontSize: 14 }}>NOM-035 STPS</div>
              <div style={{ color: "#94A3B8", fontSize: 11 }}>Plataforma de Evaluación Psicosocial</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="outline" onClick={() => setLocation("/login")}
              style={{ borderColor: "rgba(255,255,255,0.3)", color: "white", background: "transparent", fontSize: 13 }}>
              Iniciar sesión
            </Button>
            <Button onClick={() => setLocation("/company-register")}
              style={{ background: "#84CC16", color: "#1E3A5F", fontWeight: 700, fontSize: 13 }}>
              Prueba gratis
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ background: "linear-gradient(135deg, #152B47 0%, #1E3A5F 60%, #0F1E38 100%)", padding: "80px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(132,204,22,0.15)", border: "1px solid rgba(132,204,22,0.3)", borderRadius: 99, padding: "6px 16px", marginBottom: 24 }}>
            <div style={{ width: 8, height: 8, background: "#84CC16", borderRadius: "50%" }}></div>
            <span style={{ color: "#84CC16", fontSize: 12, fontWeight: 600 }}>Certificado NOM-035-STPS-2018</span>
          </div>
          <h1 style={{ color: "white", fontSize: 42, fontWeight: 800, lineHeight: 1.15, marginBottom: 20 }}>
            Plataforma Empresarial de<br />
            <span style={{ color: "#84CC16" }}>Evaluación Psicosocial</span>
          </h1>
          <p style={{ color: "#94A3B8", fontSize: 17, lineHeight: 1.7, marginBottom: 32 }}>
            Solución integral para el cumplimiento normativo de la NOM-035-STPS-2018.
            Gestiona evaluaciones, genera reportes oficiales y mantén el compliance de tu organización.
          </p>

          {/* Banner prueba gratis */}
          <div style={{ background: "rgba(132,204,22,0.1)", border: "1px solid rgba(132,204,22,0.3)", borderRadius: 16, padding: "16px 20px", marginBottom: 28, textAlign: "left", display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ background: "#84CC16", borderRadius: "50%", padding: 6, flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <p style={{ color: "#84CC16", fontWeight: 700, fontSize: 14, margin: 0 }}>Prueba gratis — Evalúa hasta 5 colaboradores sin costo</p>
              <p style={{ color: "#64748B", fontSize: 12, margin: "4px 0 0" }}>Aplica el cuestionario oficial NOM-035 y recibe tu reporte de resultados. Sin tarjeta de crédito.</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Button onClick={() => setLocation("/company-register")}
              style={{ background: "#84CC16", color: "#1E3A5F", fontWeight: 700, fontSize: 15, padding: "12px 28px", height: "auto" }}>
              Comenzar prueba gratuita →
            </Button>
            <Button variant="outline" onClick={() => setLocation("/login")}
              style={{ borderColor: "rgba(255,255,255,0.3)", color: "white", background: "transparent", fontSize: 15, padding: "12px 28px", height: "auto" }}>
              Portal Corporativo
            </Button>
          </div>
        </div>
      </section>

      {/* Características */}
      <section style={{ padding: "72px 24px", background: "#F8FAFC" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ color: "#1E3A5F", fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Todo lo que necesitas para cumplir la NOM-035</h2>
            <p style={{ color: "#64748B", fontSize: 15 }}>Herramientas diseñadas para garantizar el cumplimiento normativo ante cualquier inspección de la STPS</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
            {features.map((f, i) => (
              <div key={i} style={{ background: "white", borderRadius: 16, padding: "24px", border: "0.5px solid #E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ width: 44, height: 44, background: "#EFF6FF", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <i className={f.icon} style={{ color: "#1E3A5F", fontSize: 18 }}></i>
                </div>
                <div>
                  <h3 style={{ color: "#1E3A5F", fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{f.title}</h3>
                  <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance Matrix */}
      <section style={{ padding: "72px 24px", background: "white" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
          <div>
            <div style={{ display: "inline-block", background: "#ECFCCB", color: "#3F6212", fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 99, marginBottom: 16 }}>
              Certificación NOM-035-STPS-2018
            </div>
            <h2 style={{ color: "#1E3A5F", fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Compliance Empresarial Garantizado</h2>
            <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              Nuestra plataforma implementa exactamente todos los requerimientos establecidos por la Secretaría del Trabajo y Previsión Social, garantizando protección completa ante auditorías gubernamentales.
            </p>
            {[
              { title: "Metodología Oficial", desc: "Implementación exacta de las Guías de Referencia I, II y III" },
              { title: "Algoritmos Certificados", desc: "Cálculos de riesgo según especificaciones técnicas oficiales" },
              { title: "Documentación Integral", desc: "Registros completos y trazabilidad total para auditorías" },
            ].map(i => (
              <div key={i.title} style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "flex-start" }}>
                <div style={{ width: 24, height: 24, background: "#ECFCCB", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3F6212" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div>
                  <p style={{ color: "#1E3A5F", fontWeight: 600, fontSize: 14, margin: 0 }}>{i.title}</p>
                  <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>{i.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: "#F8FAFC", borderRadius: 20, padding: 24, border: "0.5px solid #E2E8F0" }}>
            <h3 style={{ color: "#1E3A5F", fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Matriz de Cumplimiento</h3>
            {[
              { size: "Microempresas (1-15)", nivel: "Básico", color: "#22C55E", bg: "#DCFCE7" },
              { size: "Pequeñas (16-50)", nivel: "Intermedio", color: "#EAB308", bg: "#FEF9C3" },
              { size: "Medianas y Grandes (50+)", nivel: "Completo", color: "#EF4444", bg: "#FEE2E2" },
            ].map(r => (
              <div key={r.size} style={{ background: "white", borderRadius: 12, padding: "16px", marginBottom: 12, borderLeft: `4px solid ${r.color}`, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ color: "#1E3A5F", fontWeight: 600, fontSize: 14 }}>{r.size}</span>
                  <span style={{ background: r.bg, color: r.color, fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 99 }}>{r.nivel}</span>
                </div>
                <p style={{ color: "#64748B", fontSize: 12, margin: 0 }}>Política de prevención + cuestionarios + reportes</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planes */}
      <section style={{ padding: "72px 24px", background: "#F8FAFC" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ color: "#1E3A5F", fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Planes Empresariales</h2>
            <p style={{ color: "#64748B", fontSize: 15 }}>Soluciones escalables para organizaciones de todos los tamaños</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {/* Toggle mensual/anual */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 32 }}>
              <span style={{ color: !isYearly ? "#1E3A5F" : "#94A3B8", fontWeight: !isYearly ? 600 : 400, fontSize: 14 }}>Mensual</span>
              <button onClick={() => setIsYearly(!isYearly)}
                style={{ width: 48, height: 26, borderRadius: 99, border: "none", cursor: "pointer", background: isYearly ? "#84CC16" : "#CBD5E1", position: "relative", transition: "background 0.2s" }}>
                <div style={{ position: "absolute", top: 3, width: 20, height: 20, borderRadius: "50%", background: "white", transition: "left 0.2s", left: isYearly ? "calc(100% - 23px)" : "3px", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}></div>
              </button>
              <span style={{ color: isYearly ? "#1E3A5F" : "#94A3B8", fontWeight: isYearly ? 600 : 400, fontSize: 14 }}>
                Anual <span style={{ background: "#ECFCCB", color: "#15803D", borderRadius: 99, padding: "2px 8px", fontSize: 11, fontWeight: 700, marginLeft: 4 }}>Ahorra 17%</span>
              </span>
            </div>

            {plans.map((plan) => (
              <div key={plan.name} style={{
                background: "white", borderRadius: 20, padding: "28px 24px",
                border: plan.popular ? `2px solid ${plan.color}` : "0.5px solid #E2E8F0",
                boxShadow: plan.popular ? "0 8px 24px rgba(132,204,22,0.2)" : "0 1px 4px rgba(0,0,0,0.05)",
                position: "relative",
              }}>
                {plan.popular && (
                  <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#84CC16", color: "#1E3A5F", fontSize: 11, fontWeight: 700, padding: "4px 16px", borderRadius: 99 }}>
                    MÁS POPULAR
                  </div>
                )}
                <h3 style={{ color: "#1E3A5F", fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{plan.name}</h3>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                  <span style={{ color: plan.popular ? "#84CC16" : "#1E3A5F", fontSize: 32, fontWeight: 800 }}>{plan.price}</span>
                  <span style={{ color: "#64748B", fontSize: 13 }}>{plan.period}</span>
                  {plan.savings && <span style={{ background: "#ECFCCB", color: "#15803D", borderRadius: 99, padding: "2px 8px", fontSize: 11, fontWeight: 600, marginLeft: 8 }}>{plan.savings}</span>}
                </div>
                <p style={{ color: "#64748B", fontSize: 13, marginBottom: 20 }}>{plan.employees}</p>
                <Button onClick={() => setLocation("/company-register")}
                  style={{ width: "100%", background: plan.popular ? "#84CC16" : "#1E3A5F", color: plan.popular ? "#1E3A5F" : "white", fontWeight: 600 }}>
                  Comenzar prueba gratis
                </Button>
              </div>
            ))}
          </div>
          <p style={{ textAlign: "center", color: "#64748B", fontSize: 13, marginTop: 20 }}>
            15% de descuento en planes anuales · Sin tarjeta de crédito para la prueba gratuita
          </p>
        </div>
      </section>

      {/* CTA Final */}
      <section style={{ background: "#1E3A5F", padding: "64px 24px", textAlign: "center", borderTop: "3px solid #84CC16" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ color: "white", fontSize: 26, fontWeight: 700, marginBottom: 12 }}>
            Transforma tu Gestión de Compliance
          </h2>
          <p style={{ color: "#94A3B8", fontSize: 15, marginBottom: 28 }}>
            Implementa una solución empresarial integral que garantice el cumplimiento normativo y proteja tu organización ante auditorías gubernamentales.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 32 }}>
            <Button onClick={() => setLocation("/company-register")}
              style={{ background: "#84CC16", color: "#1E3A5F", fontWeight: 700, fontSize: 15, padding: "12px 28px", height: "auto" }}>
              Solicitar demostración
            </Button>
            <Button variant="outline" onClick={() => setLocation("/login")}
              style={{ borderColor: "rgba(255,255,255,0.3)", color: "white", background: "transparent", fontSize: 15, padding: "12px 28px", height: "auto" }}>
              Acceso empresarial
            </Button>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
            {["100% Compliance", "24/7 Disponible", "Datos Seguros", "Soporte Incluido"].map(s => (
              <div key={s} style={{ textAlign: "center" }}>
                <div style={{ color: "#84CC16", fontWeight: 700, fontSize: 16 }}>{s.split(" ")[0]}</div>
                <div style={{ color: "#64748B", fontSize: 11 }}>{s.split(" ").slice(1).join(" ")}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: "#0F1E38", padding: "20px 24px", textAlign: "center" }}>
        <p style={{ color: "#475569", fontSize: 12, margin: 0 }}>
          © {new Date().getFullYear()} NOM-035 Platform · Sistema certificado para cumplimiento de NOM-035-STPS-2018
        </p>
      </footer>
    </div>
  );
}
