import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const token = () => localStorage.getItem("company_token");
const h = (json = true) => ({
  ...(json ? { "Content-Type": "application/json" } : {}),
  ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
});

const TODOS_TIPOS = [
  { value: "guia1", label: "Guía I — Acontec. traumáticos severos", desc: "Obligatoria para todos los tamaños de empresa", minEmployees: 0 },
  { value: "guia2", label: "Guía II — Factores de riesgo psicosocial", desc: "Empresas de 16 a 50 trabajadores", minEmployees: 16 },
  { value: "guia3", label: "Guía III — Evaluación completa NOM-035", desc: "Empresas con más de 50 trabajadores", minEmployees: 51 },
];

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: "#FEF9C3", color: "#854D0E", label: "Pendiente" },
  completed: { bg: "#DCFCE7", color: "#15803D", label: "Completada" },
  expired:   { bg: "#FEE2E2", color: "#991B1B", label: "Expirada" },
};

export default function EmployeeInvitations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<number[]>([]);
  const [tipo, setTipo] = useState("guia3");
  const [mensaje, setMensaje] = useState("");
  const [dias, setDias] = useState(10);
  const [search, setSearch] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const { data: access } = useQuery<any>({
    queryKey: ["/api/company/questionnaire-access"],
    queryFn: async () => {
      const res = await fetch("/api/company/questionnaire-access", { headers: h() });
      return res.ok ? res.json() : { guia1: true, guia2: false, guia3: false, numEmpleados: 0 };
    },
  });

  // Filtrar guías disponibles según plan y número de empleados
  const TIPOS = TODOS_TIPOS.filter(t => {
    if (t.value === "guia1") return true; // siempre disponible
    if (t.value === "guia2") return access?.guia2 || (access?.numEmpleados >= 16 && access?.numEmpleados <= 50);
    if (t.value === "guia3") return access?.guia3 || access?.numEmpleados > 50;
    return false;
  });

  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ["/api/employees"],
    queryFn: async () => { const r = await fetch("/api/employees", { headers: h() }); return r.ok ? r.json() : []; },
  });

  const { data: invitations = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/questionnaire-invitations"],
    queryFn: async () => { const r = await fetch("/api/questionnaire-invitations", { headers: h() }); return r.ok ? r.json() : []; },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!selected.length) throw new Error("Selecciona al menos un empleado");
      if (!tipo) throw new Error("Selecciona el tipo de cuestionario");
      const res = await fetch("/api/questionnaire-invitations", {
        method: "POST",
        headers: h(),
        body: JSON.stringify({ employeeIds: selected, questionnaireType: tipo, customMessage: mensaje, expirationDays: dias }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Error al enviar");
      return json;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/questionnaire-invitations"] });
      setSelected([]);
      toast({
        title: `${data.length || data.invitations?.length || "?"} invitaciones enviadas`,
        description: "Los empleados recibirán el link por email para completar su cuestionario.",
      });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const resendMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/questionnaire-invitations/${id}/resend`, { method: "POST", headers: h() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => toast({ title: "Invitación reenviada" }),
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const copyLink = (accessToken: string) => {
    const url = `${window.location.origin}/cuestionario/${accessToken}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(accessToken);
    setTimeout(() => setCopiedToken(null), 2000);
    toast({ title: "Link copiado", description: "Puedes enviarlo manualmente al empleado." });
  };

  const filtered = employees.filter((e: any) =>
    `${e.nombre} ${e.apellidoPaterno || e.apellidos || ""} ${e.area || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  const pending = invitations.filter((i: any) => i.status === "pending").length;
  const completed = invitations.filter((i: any) => i.status === "completed").length;
  const expired = invitations.filter((i: any) => i.status === "expired").length;

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center gap-3">
        <div style={{ width: 3, height: "2.5rem", background: "#84CC16", borderRadius: 2 }}/>
        <div>
          <h1 className="page-title">Envío de Cuestionarios</h1>
          <p className="page-subtitle">Invita a tus empleados a completar la evaluación NOM-035 desde su celular o computadora</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Pendientes", value: pending, color: "#EAB308" },
          { label: "Completadas", value: completed, color: "#22C55E" },
          { label: "Expiradas", value: expired, color: "#EF4444" },
        ].map(s => (
          <div key={s.label} className="kpi-card p-4">
            <div className="kpi-card-accent" style={{ background: s.color }}></div>
            <p className="text-xs text-slate-500 mt-1 mb-1">{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Enviar invitaciones */}
      <div className="section-card">
        <div className="section-header"><div className="lime-dot"/><h3>Enviar invitaciones</h3></div>
        <div className="p-5 space-y-4">

          {/* Tipo de cuestionario */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">Tipo de cuestionario *</label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TODOS_TIPOS.map(t => {
                    const available = TIPOS.find(tp => tp.value === t.value);
                    return (
                      <SelectItem key={t.value} value={t.value} disabled={!available}>
                        <div>
                          <div className={!available ? "text-slate-400" : ""}>{t.label}</div>
                          <div className="text-xs text-slate-400">{t.desc}{!available ? " — No disponible con tu plan/empleados" : ""}</div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {access && (
                <p className="text-xs text-slate-500 mt-1">
                  Tu empresa tiene <strong>{access.numEmpleados}</strong> empleados registrados.
                  {access.numEmpleados < 16 && " Solo aplica Guía I."}
                  {access.numEmpleados >= 16 && access.numEmpleados <= 50 && " Aplican Guías I y II."}
                  {access.numEmpleados > 50 && " Aplican Guías I, II y III."}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">Días de validez del link</label>
              <Input type="number" min={1} max={30} value={dias} onChange={e => setDias(parseInt(e.target.value) || 10)} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">Buscar empleado</label>
              <Input placeholder="Nombre, área..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          {/* Selección de empleados */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-500">
                Empleados a evaluar — {selected.length} seleccionados
              </label>
              <div className="flex gap-2">
                <button onClick={() => setSelected(filtered.map((e: any) => e.id))}
                  className="text-xs px-2 py-1 rounded-lg" style={{ background: "#EFF6FF", color: "#1E3A5F" }}>
                  Seleccionar todos
                </button>
                <button onClick={() => setSelected([])}
                  className="text-xs px-2 py-1 rounded-lg" style={{ background: "#F1F5F9", color: "#64748B" }}>
                  Limpiar
                </button>
              </div>
            </div>
            <div className="border rounded-xl overflow-hidden" style={{ borderColor: "#E2E8F0", maxHeight: "220px", overflowY: "auto" }}>
              {filtered.length === 0
                ? <div className="p-4 text-center text-sm text-slate-400">No hay empleados registrados</div>
                : filtered.map((emp: any) => {
                    const isSelected = selected.includes(emp.id);
                    const hasInvPending = invitations.some((i: any) => (i.employeeId || i.employee_id) === emp.id && i.status === "pending");
                    return (
                      <div key={emp.id}
                        onClick={() => setSelected(prev => isSelected ? prev.filter(i => i !== emp.id) : [...prev, emp.id])}
                        className="flex items-center gap-3 p-3 cursor-pointer border-b transition-colors"
                        style={{ borderBottomColor: "#F1F5F9", background: isSelected ? "#EFF6FF" : "white" }}>
                        <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                          style={{ background: isSelected ? "#1E3A5F" : "#F1F5F9", border: `1px solid ${isSelected ? "#1E3A5F" : "#CBD5E1"}` }}>
                          {isSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: "#1E3A5F" }}>
                            {emp.nombre} {emp.apellidoPaterno || emp.apellidos || ""}
                          </p>
                          <p className="text-xs text-slate-400">{emp.puesto} · {emp.area}</p>
                        </div>
                        {hasInvPending && (
                          <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: "#FEF9C3", color: "#854D0E" }}>Pendiente</span>
                        )}
                        {!emp.email && (
                          <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: "#FEE2E2", color: "#991B1B" }}>Sin email</span>
                        )}
                      </div>
                    );
                  })
              }
            </div>
            {filtered.some((e: any) => !e.email) && (
              <p className="text-xs mt-1.5" style={{ color: "#F97316" }}>
                ⚠ Algunos empleados no tienen email registrado — recibirás el link para enviarlo manualmente.
              </p>
            )}
          </div>

          {/* Mensaje personalizado */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block">
              Mensaje personalizado <span className="text-slate-400">(opcional)</span>
            </label>
            <Textarea
              placeholder="Estimado colaborador, te invitamos a completar la evaluación NOM-035..."
              rows={2} value={mensaje} onChange={e => setMensaje(e.target.value)} />
          </div>

          <Button
            onClick={() => sendMutation.mutate()}
            disabled={sendMutation.isPending || !selected.length}
            className="btn-lime gap-2">
            <i className="fas fa-paper-plane text-sm"></i>
            {sendMutation.isPending ? "Enviando..." : `Enviar ${selected.length} invitación${selected.length !== 1 ? "es" : ""}`}
          </Button>
        </div>
      </div>

      {/* Lista de invitaciones */}
      <div className="section-card">
        <div className="section-header"><div className="lime-dot"/><h3>Invitaciones enviadas ({invitations.length})</h3></div>
        {isLoading
          ? <div className="p-5 text-sm text-slate-500">Cargando...</div>
          : invitations.length === 0
            ? <div className="empty-state" style={{ minHeight: 100 }}>
                <i className="fas fa-envelope text-2xl text-slate-300"></i>
                <p className="text-sm">Sin invitaciones enviadas aún</p>
              </div>
            : <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr><th>Empleado</th><th>Tipo</th><th>Enviado</th><th>Expira</th><th>Estado</th><th>Acciones</th></tr>
                  </thead>
                  <tbody>
                    {invitations.map((inv: any) => {
                      const emp = employees.find((e: any) => e.id === (inv.employeeId || inv.employee_id));
                      const cfg = STATUS_COLORS[inv.status] || STATUS_COLORS.pending;
                      return (
                        <tr key={inv.id}>
                          <td>
                            <p className="font-medium text-sm" style={{ color: "#1E3A5F" }}>
                              {emp ? `${emp.nombre} ${emp.apellidoPaterno || emp.apellidos || ""}` : "—"}
                            </p>
                            <p className="text-xs text-slate-400">{emp?.area || "—"}</p>
                          </td>
                          <td className="text-xs">{TIPOS.find(t => t.value === (inv.questionnaireType || inv.questionnaire_type))?.label?.split("—")[0] || inv.questionnaireType}</td>
                          <td className="text-xs text-slate-500">{fmtDate(inv.createdAt || inv.created_at)}</td>
                          <td className="text-xs text-slate-500">{fmtDate(inv.expiresAt || inv.expires_at)}</td>
                          <td>
                            <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: cfg.bg, color: cfg.color }}>
                              {cfg.label}
                            </span>
                          </td>
                          <td>
                            <div className="flex gap-1">
                              <button
                                onClick={() => copyLink(inv.accessToken || inv.access_token)}
                                className="text-xs px-2 py-1 rounded-lg transition-colors"
                                style={{ background: "#EFF6FF", color: "#1E3A5F" }}
                                title="Copiar link">
                                {copiedToken === (inv.accessToken || inv.access_token) ? "✓" : "Link"}
                              </button>
                              {inv.status === "pending" && (
                                <button
                                  onClick={() => resendMutation.mutate(inv.id)}
                                  disabled={resendMutation.isPending}
                                  className="text-xs px-2 py-1 rounded-lg transition-colors"
                                  style={{ background: "#ECFCCB", color: "#3F6212" }}>
                                  Reenviar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
        }
      </div>
    </div>
  );
}
