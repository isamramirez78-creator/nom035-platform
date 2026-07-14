import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const at = () => localStorage.getItem("admin_token");
const h = () => ({ "Content-Type": "application/json", ...(at() ? { Authorization: `Bearer ${at()}` } : {}) });

const PLAN_LABELS: Record<string, string> = {
  trial: "Prueba", basic: "Básico", professional: "Profesional", enterprise: "Enterprise"
};
const PLAN_COLORS: Record<string, string> = {
  trial: "#64748B", basic: "#3B82F6", professional: "#8B5CF6", enterprise: "#F59E0B"
};

function logout() { localStorage.removeItem("admin_token"); window.location.replace("/admin"); }

function FacturacionTab({ companies }: { companies: any[] }) {
  const pendientes = companies.filter(c => !c.is_admin);
  return (
    <div>
      <h3 style={{ color: "white", fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
        Facturación pendiente — {pendientes.filter(c => !c.datos_fiscales_completos).length} empresas sin datos fiscales
      </h3>
      <div style={{ background: "#1E293B", borderRadius: 16, overflow: "hidden", border: "1px solid #334155" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#0F172A" }}>
              {["Empresa","RFC","Régimen","CP Fiscal","Datos Fiscales","Plan","Acción"].map(h2 => (
                <th key={h2} style={{ padding: "12px 16px", textAlign: "left", color: "#64748B", fontSize: 11, fontWeight: 600 }}>{h2.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pendientes.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "#64748B" }}>No hay empresas</td></tr>
            ) : pendientes.map((c: any, i: number) => (
              <tr key={c.id} style={{ borderTop: "1px solid #334155", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                <td style={{ padding: "12px 16px", color: "white", fontSize: 13 }}>{c.razon_social || c.correo_electronico}</td>
                <td style={{ padding: "12px 16px", color: "#94A3B8", fontSize: 12 }}>{c.rfc || "—"}</td>
                <td style={{ padding: "12px 16px", color: "#94A3B8", fontSize: 12 }}>{c.regimen_fiscal || "—"}</td>
                <td style={{ padding: "12px 16px", color: "#94A3B8", fontSize: 12 }}>{c.codigo_postal_fiscal || "—"}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ background: c.datos_fiscales_completos ? "#10B98120" : "#EF444420", color: c.datos_fiscales_completos ? "#10B981" : "#EF4444", borderRadius: 99, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>
                    {c.datos_fiscales_completos ? "✅ Completos" : "⚠️ Pendiente"}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", color: "#94A3B8", fontSize: 12 }}>{c.subscription_plan || "trial"}</td>
                <td style={{ padding: "12px 16px" }}>
                  <button style={{ background: "#1E3A5F", color: "#84CC16", border: "none", borderRadius: 6, padding: "4px 12px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}
                    onClick={() => alert(`CFDI para ${c.correo_electronico} — Integración con PAC próximamente`)}>
                    Emitir CFDI
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");
  const [selected, setSelected] = useState<any>(null);
  const [tab, setTab] = useState<"empresas"|"facturacion">("empresas");

  const { data: companies, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/companies"],
    queryFn: async () => {
      const r = await fetch("/api/admin/companies", { headers: h() });
      if (!r.ok) { logout(); return []; }
      return r.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const r = await fetch(`/api/admin/companies/${id}`, { method: "PATCH", headers: h(), body: JSON.stringify(updates) });
      const json = await r.json();
      if (!r.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/companies"] }); toast({ title: "✅ Empresa actualizada" }); setSelected(null); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filtered = (companies || []).filter(c => {
    if (filterPlan !== "all" && c.subscription_plan !== filterPlan) return false;
    if (search && !c.razon_social?.toLowerCase().includes(search.toLowerCase()) && !c.correo_electronico?.toLowerCase().includes(search.toLowerCase())) return false;
    return !c.is_admin;
  });

  const stats = {
    total: filtered.length,
    activas: filtered.filter(c => c.is_active).length,
    inactivas: filtered.filter(c => !c.is_active).length,
    trial: filtered.filter(c => c.subscription_plan === "trial").length,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0F172A", fontFamily: "Inter,sans-serif" }}>
      {/* Header */}
      <header style={{ background: "#1E293B", borderBottom: "1px solid #334155", padding: "0 2rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, background: "#84CC16", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <span style={{ color: "white", fontWeight: 700, fontSize: 15 }}>Panel Administrativo NOM-035</span>
          </div>
          <button onClick={logout} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #334155", borderRadius: 8, padding: "6px 14px", color: "#94A3B8", fontSize: 12, cursor: "pointer" }}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "2rem" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[["empresas","🏢 Empresas "],["facturacion","🧾 Facturación"]].map(([id,label]) => (
            <button key={id} onClick={() => setTab(id as any)}
              style={{ padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600,
                background: tab === id ? "#84CC16" : "rgba(255,255,255,0.05)", color: tab === id ? "#1E3A5F" : "#94A3B8" }}>
              {label}
            </button>
          ))}
        </div>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Total empresas", value: stats.total, color: "#84CC16" },
            { label: "Activas", value: stats.activas, color: "#10B981" },
            { label: "Inactivas", value: stats.inactivas, color: "#EF4444" },
            { label: "En prueba", value: stats.trial, color: "#F59E0B" },
          ].map(k => (
            <div key={k.label} style={{ background: "#1E293B", borderRadius: 12, padding: "1.25rem", borderTop: `3px solid ${k.color}` }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: k.color }}>{k.value}</div>
              <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {tab === "facturacion" ? (
          <FacturacionTab companies={filtered} />
        ) : (<>
        {/* Filtros */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar empresa o correo..."
            style={{ flex: 1, background: "#1E293B", border: "1px solid #334155", borderRadius: 8, padding: "8px 12px", color: "white", fontSize: 13, outline: "none" }} />
          <Select value={filterPlan} onValueChange={setFilterPlan}>
            <SelectTrigger style={{ width: 180, background: "#1E293B", border: "1px solid #334155", color: "white" }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los planes</SelectItem>
              {Object.entries(PLAN_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Tabla */}
        <div style={{ background: "#1E293B", borderRadius: 16, overflow: "hidden", border: "1px solid #334155" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#0F172A" }}>
                {["Empresa","Correo","Plan","Empleados","Evaluaciones","Estado","Registro","Acciones"].map(h2 => (
                  <th key={h2} style={{ padding: "12px 16px", textAlign: "left", color: "#64748B", fontSize: 11, fontWeight: 600, letterSpacing: 1 }}>{h2.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "#64748B" }}>Cargando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "#64748B" }}>No hay empresas registradas</td></tr>
              ) : filtered.map((c: any, i: number) => (
                <tr key={c.id} style={{ borderTop: "1px solid #334155", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ color: "white", fontWeight: 600, fontSize: 13 }}>{c.razon_social || "—"}</div>
                    <div style={{ color: "#64748B", fontSize: 11 }}>RFC: {c.rfc || "—"}</div>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#94A3B8", fontSize: 12 }}>{c.correo_electronico}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ background: PLAN_COLORS[c.subscription_plan] + "20", color: PLAN_COLORS[c.subscription_plan], borderRadius: 99, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>
                      {PLAN_LABELS[c.subscription_plan] || c.subscription_plan}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#94A3B8", fontSize: 13, textAlign: "center" }}>{c.employee_count || 0}</td>
                  <td style={{ padding: "12px 16px", color: "#94A3B8", fontSize: 13, textAlign: "center" }}>{c.evaluation_count || 0}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ background: c.is_active ? "#10B98120" : "#EF444420", color: c.is_active ? "#10B981" : "#EF4444", borderRadius: 99, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>
                      {c.is_active ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#64748B", fontSize: 11 }}>
                    {c.created_at ? new Date(c.created_at).toLocaleDateString("es-MX") : "—"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <button onClick={() => setSelected(c)}
                      style={{ background: "#1E3A5F", color: "#84CC16", border: "none", borderRadius: 6, padding: "4px 12px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
                      Gestionar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

        </>)}
      {/* Modal gestionar empresa */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#1E293B", borderRadius: 20, padding: "2rem", width: "100%", maxWidth: 480, border: "1px solid #334155" }}>
            <h2 style={{ color: "white", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{selected.razon_social}</h2>
            <p style={{ color: "#64748B", fontSize: 13, marginBottom: 20 }}>{selected.correo_electronico}</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ color: "#94A3B8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>PLAN</label>
                <select defaultValue={selected.subscription_plan} id="plan-select"
                  style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: 8, padding: "8px 12px", color: "white", fontSize: 13 }}>
                  {Object.entries(PLAN_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: "#94A3B8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>LÍMITE DE EMPLEADOS</label>
                <input type="number" defaultValue={selected.max_employees || 5} id="max-emp"
                  style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: 8, padding: "8px 12px", color: "white", fontSize: 13 }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <Button onClick={() => setSelected(null)} variant="outline" style={{ flex: 1, borderColor: "#334155", color: "#94A3B8" }}>Cancelar</Button>
              <Button onClick={() => updateMutation.mutate({ id: selected.id, updates: { is_active: !selected.is_active } })}
                style={{ flex: 1, background: selected.is_active ? "#EF4444" : "#10B981", color: "white" }}>
                {selected.is_active ? "Desactivar" : "Activar"}
              </Button>
              <Button onClick={() => {
                const plan = (document.getElementById("plan-select") as HTMLSelectElement)?.value;
                const maxEmp = parseInt((document.getElementById("max-emp") as HTMLInputElement)?.value || "5");
                updateMutation.mutate({ id: selected.id, updates: { subscription_plan: plan, max_employees: maxEmp } });
              }} style={{ flex: 1, background: "#84CC16", color: "#1E3A5F", fontWeight: 700 }}
                disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
