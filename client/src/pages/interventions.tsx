import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const tk = () => localStorage.getItem("company_token");
const h = (json = true) => ({
  ...(json ? { "Content-Type": "application/json" } : {}),
  ...(tk() ? { Authorization: `Bearer ${tk()}` } : {}),
});

const STATUS_FLOW: Record<string, { label: string; color: string; next?: string; nextLabel?: string }> = {
  planned:     { label: "Planeada",    color: "#64748B", next: "in_progress", nextLabel: "▶ Iniciar" },
  in_progress: { label: "En Progreso", color: "#F59E0B", next: "completed",   nextLabel: "✓ Completar" },
  completed:   { label: "Completada",  color: "#10B981", next: "closed",      nextLabel: "🔒 Cerrar" },
  on_hold:     { label: "En Espera",   color: "#8B5CF6", next: "in_progress", nextLabel: "▶ Reanudar" },
  closed:      { label: "Cerrada",     color: "#1E3A5F" },
  cancelled:   { label: "Cancelada",   color: "#EF4444" },
};

const TYPE_LABELS: Record<string, string> = {
  counseling:           "Orientación / Consejería",
  psychological_support:"Apoyo psicológico",
  training:             "Capacitación",
  medical:              "Atención médica",
  organizational:       "Medida organizacional",
  environmental:        "Mejora del entorno",
  other:                "Otra",
};

function normalize(i: any) {
  return {
    ...i,
    employeeId:       i.employee_id    || i.employeeId,
    type:             i.intervention_type || i.type || i.interventionType || "other",
    responsiblePerson:i.responsible_person || i.responsiblePerson || "",
    startDate:        i.start_date     || i.startDate,
    expectedEndDate:  i.expected_end_date || i.expectedEndDate,
    actualEndDate:    i.actual_end_date  || i.actualEndDate,
    followUpRequired: i.follow_up_required || i.followUpRequired,
    nombreEmpleado:   `${i.nombre || ""} ${i.apellidos || i.apellido_paterno || ""}`.trim(),
    areaEmpleado:     i.area || "",
  };
}

export default function Interventions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterEmployee, setFilterEmployee] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [noteText, setNoteText] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showClose, setShowClose] = useState<any>(null);
  const [closeResults, setCloseResults] = useState("");

  const [form, setForm] = useState({
    employeeId: "", type: "counseling", description: "", objective: "",
    responsiblePerson: "", startDate: "", expectedEndDate: "", priority: "medium",
  });

  const { data: employees } = useQuery<any[]>({
    queryKey: ["/api/employees"],
    queryFn: async () => {
      const r = await fetch("/api/employees", { headers: h(false) });
      return r.ok ? r.json() : [];
    },
  });

  const { data: interventions, isLoading } = useQuery<any[]>({
    queryKey: ["/api/interventions"],
    queryFn: async () => {
      const r = await fetch("/api/interventions", { headers: h(false) });
      const data = await r.json();
      return Array.isArray(data) ? data.map(normalize) : [];
    },
  });

  const { data: notes } = useQuery<any[]>({
    queryKey: ["/api/intervention-notes", selectedId],
    enabled: !!selectedId && showNotes,
    queryFn: async () => {
      const r = await fetch(`/api/intervention-notes?interventionId=${selectedId}`, { headers: h(false) });
      return r.ok ? r.json() : [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        employeeId: parseInt(data.employeeId),
        interventionType: data.type,
        title: TYPE_LABELS[data.type] || "Intervención NOM-035",
        description: data.description,
        objective: data.objective || null,
        actions: [],
        responsiblePerson: data.responsiblePerson || "RRHH",
        status: "planned",
        priority: data.priority || "medium",
        startDate: data.startDate || null,
        expectedEndDate: data.expectedEndDate || null,
      };
      const r = await fetch("/api/interventions", { method: "POST", headers: h(), body: JSON.stringify(payload) });
      const json = await r.json();
      if (!r.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interventions"] });
      toast({ title: "✅ Intervención creada correctamente" });
      setShowCreate(false);
      setForm({ employeeId:"", type:"counseling", description:"", objective:"", responsiblePerson:"", startDate:"", expectedEndDate:"", priority:"medium" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const r = await fetch(`/api/interventions/${id}`, { method: "PATCH", headers: h(), body: JSON.stringify(updates) });
      const json = await r.json();
      if (!r.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interventions"] });
      toast({ title: "✅ Estado actualizado" });
      setShowClose(null);
      setCloseResults("");
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const noteMutation = useMutation({
    mutationFn: async ({ interventionId, content }: { interventionId: number; content: string }) => {
      const r = await fetch("/api/intervention-notes", {
        method: "POST", headers: h(),
        body: JSON.stringify({ interventionId, content, author: "RRHH" }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intervention-notes", selectedId] });
      toast({ title: "✅ Nota agregada" });
      setNoteText("");
    },
  });

  const filtered = (interventions || []).filter(i => {
    if (filterStatus !== "all" && i.status !== filterStatus) return false;
    if (filterEmployee && !i.nombreEmpleado.toLowerCase().includes(filterEmployee.toLowerCase())) return false;
    return true;
  });

  const statusCounts = (interventions || []).reduce((acc: any, i: any) => {
    acc[i.status] = (acc[i.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ padding: "1.5rem", fontFamily: "Inter,sans-serif", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ color: "#1E3A5F", fontSize: 22, fontWeight: 700, margin: 0 }}>Programa de Intervenciones</h1>
          <p style={{ color: "#64748B", fontSize: 13, margin: "4px 0 0" }}>NOM-035-STPS-2018 Numeral 8.2 — Seguimiento de acciones correctivas</p>
        </div>
        <Button onClick={() => setShowCreate(true)} style={{ background: "#1E3A5F", color: "white" }}>
          + Nueva Intervención
        </Button>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total", value: interventions?.length || 0, color: "#1E3A5F" },
          { label: "Planeadas", value: statusCounts.planned || 0, color: "#64748B" },
          { label: "En Progreso", value: statusCounts.in_progress || 0, color: "#F59E0B" },
          { label: "Completadas", value: (statusCounts.completed || 0) + (statusCounts.closed || 0), color: "#10B981" },
        ].map(k => (
          <div key={k.label} style={{ background: "white", borderRadius: 12, padding: "1rem", textAlign: "center", border: "0.5px solid #E2E8F0", borderTop: `3px solid ${k.color}` }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 12, color: "#64748B" }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger style={{ width: 200 }}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(STATUS_FLOW).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input placeholder="Buscar por empleado..." value={filterEmployee}
          onChange={e => setFilterEmployee(e.target.value)} style={{ maxWidth: 250 }} />
      </div>

      {/* Lista */}
      {isLoading ? (
        <p style={{ color: "#64748B" }}>Cargando intervenciones...</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", background: "white", borderRadius: 16, border: "0.5px solid #E2E8F0" }}>
          <p style={{ color: "#94A3B8", fontSize: 15 }}>No hay intervenciones registradas</p>
          <Button onClick={() => setShowCreate(true)} style={{ marginTop: 12, background: "#1E3A5F", color: "white" }}>
            Crear primera intervención
          </Button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((iv: any) => {
            const st = STATUS_FLOW[iv.status] || STATUS_FLOW.planned;
            return (
              <div key={iv.id} style={{ background: "white", borderRadius: 16, padding: "1.25rem", border: "0.5px solid #E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", borderLeft: `4px solid ${st.color}` }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ background: st.color, color: "white", borderRadius: 99, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>{st.label}</span>
                      <span style={{ color: "#94A3B8", fontSize: 11 }}>#{iv.id}</span>
                      <span style={{ background: "#F8FAFC", borderRadius: 99, padding: "2px 8px", fontSize: 11, color: "#475569" }}>
                        {TYPE_LABELS[iv.type] || iv.type}
                      </span>
                    </div>
                    <p style={{ color: "#1E3A5F", fontWeight: 600, fontSize: 15, margin: 0 }}>{iv.nombreEmpleado || "—"}</p>
                    <p style={{ color: "#64748B", fontSize: 13, margin: "2px 0 0" }}>{iv.areaEmpleado}</p>
                  </div>
                  <div style={{ textAlign: "right", fontSize: 12, color: "#94A3B8" }}>
                    <div>Resp: {iv.responsiblePerson}</div>
                    {iv.startDate && <div>Inicio: {iv.startDate.toString().split("T")[0]}</div>}
                    {iv.expectedEndDate && <div>Fin est: {iv.expectedEndDate.toString().split("T")[0]}</div>}
                  </div>
                </div>

                <p style={{ color: "#475569", fontSize: 13, margin: "0 0 12px", lineHeight: 1.5 }}>{iv.description}</p>
                {iv.objective && <p style={{ color: "#64748B", fontSize: 12, margin: "0 0 12px" }}><strong>Objetivo:</strong> {iv.objective}</p>}
                {iv.results && <p style={{ background: "#F0FDF4", borderRadius: 8, padding: "8px 12px", color: "#15803D", fontSize: 12, margin: "0 0 12px" }}><strong>Resultados:</strong> {iv.results}</p>}

                {/* Acciones */}
                {iv.status !== "closed" && iv.status !== "cancelled" && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {st.next && (
                      <Button size="sm" onClick={() => {
                        if (st.next === "closed") { setShowClose(iv); }
                        else { updateMutation.mutate({ id: iv.id, updates: { status: st.next } }); }
                      }} style={{ background: "#1E3A5F", color: "white", fontSize: 12 }}>
                        {st.nextLabel}
                      </Button>
                    )}
                    {iv.status === "in_progress" && (
                      <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ id: iv.id, updates: { status: "on_hold" } })}
                        style={{ fontSize: 12 }}>
                        ⏸ Pausar
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => { setSelectedId(iv.id); setShowNotes(true); }}
                      style={{ fontSize: 12 }}>
                      📝 Notas de seguimiento
                    </Button>
                    {iv.status !== "cancelled" && iv.status !== "closed" && (
                      <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ id: iv.id, updates: { status: "cancelled" } })}
                        style={{ fontSize: 12, color: "#EF4444", borderColor: "#EF4444" }}>
                        ✕ Cancelar
                      </Button>
                    )}
                  </div>
                )}
                {(iv.status === "closed" || iv.status === "cancelled") && (
                  <div style={{ fontSize: 12, color: "#94A3B8" }}>
                    {iv.status === "closed" ? "🔒 Intervención cerrada" : "✕ Intervención cancelada"}
                    {iv.actualEndDate && ` — ${iv.actualEndDate.toString().split("T")[0]}`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog: Crear intervención */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent style={{ maxWidth: 560 }}>
          <DialogHeader><DialogTitle>Nueva Intervención NOM-035</DialogTitle></DialogHeader>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#1E3A5F", display: "block", marginBottom: 4 }}>Empleado *</label>
              <Select value={form.employeeId} onValueChange={v => setForm({...form, employeeId: v})}>
                <SelectTrigger><SelectValue placeholder="Seleccionar empleado" /></SelectTrigger>
                <SelectContent>
                  {(employees || []).map((e: any) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.nombre} {e.apellidoPaterno || e.apellidos || ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#1E3A5F", display: "block", marginBottom: 4 }}>Tipo de intervención *</label>
              <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#1E3A5F", display: "block", marginBottom: 4 }}>Descripción de la intervención *</label>
              <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                placeholder="Describe las acciones a realizar..." rows={3} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#1E3A5F", display: "block", marginBottom: 4 }}>Objetivo</label>
              <Input value={form.objective} onChange={e => setForm({...form, objective: e.target.value})}
                placeholder="¿Qué se espera lograr?" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#1E3A5F", display: "block", marginBottom: 4 }}>Responsable</label>
                <Input value={form.responsiblePerson} onChange={e => setForm({...form, responsiblePerson: e.target.value})}
                  placeholder="Nombre del responsable" />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#1E3A5F", display: "block", marginBottom: 4 }}>Prioridad</label>
                <Select value={form.priority} onValueChange={v => setForm({...form, priority: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="critical">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#1E3A5F", display: "block", marginBottom: 4 }}>Fecha inicio</label>
                <Input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#1E3A5F", display: "block", marginBottom: 4 }}>Fecha estimada fin</label>
                <Input type="date" value={form.expectedEndDate} onChange={e => setForm({...form, expectedEndDate: e.target.value})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={!form.employeeId || !form.description || createMutation.isPending}
              style={{ background: "#1E3A5F", color: "white" }}>
              {createMutation.isPending ? "Creando..." : "Crear Intervención"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Cerrar intervención */}
      <Dialog open={!!showClose} onOpenChange={() => setShowClose(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>🔒 Cerrar Intervención</DialogTitle></DialogHeader>
          <p style={{ color: "#64748B", fontSize: 14 }}>
            Para cerrar la intervención, documenta los resultados obtenidos.
          </p>
          <Textarea value={closeResults} onChange={e => setCloseResults(e.target.value)}
            placeholder="Describe los resultados y conclusiones de la intervención..." rows={4} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClose(null)}>Cancelar</Button>
            <Button onClick={() => updateMutation.mutate({ id: showClose.id, updates: { status: "closed", results: closeResults, actualEndDate: new Date().toISOString() } })}
              disabled={!closeResults.trim() || updateMutation.isPending}
              style={{ background: "#1E3A5F", color: "white" }}>
              {updateMutation.isPending ? "Cerrando..." : "Confirmar cierre"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Notas de seguimiento */}
      <Dialog open={showNotes} onOpenChange={setShowNotes}>
        <DialogContent style={{ maxWidth: 560 }}>
          <DialogHeader><DialogTitle>📝 Notas de Seguimiento</DialogTitle></DialogHeader>
          <div style={{ maxHeight: 300, overflowY: "auto", marginBottom: 12 }}>
            {!notes || notes.length === 0 ? (
              <p style={{ color: "#94A3B8", fontSize: 13, textAlign: "center", padding: "1rem" }}>Sin notas registradas</p>
            ) : (
              notes.map((n: any, i: number) => (
                <div key={i} style={{ background: "#F8FAFC", borderRadius: 8, padding: "10px 12px", marginBottom: 8, borderLeft: "3px solid #84CC16" }}>
                  <p style={{ color: "#1E3A5F", fontSize: 13, margin: "0 0 4px" }}>{n.content}</p>
                  <p style={{ color: "#94A3B8", fontSize: 11, margin: 0 }}>{n.author} — {n.created_at?.toString().split("T")[0]}</p>
                </div>
              ))
            )}
          </div>
          <Textarea value={noteText} onChange={e => setNoteText(e.target.value)}
            placeholder="Agrega una nota de seguimiento..." rows={3} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotes(false)}>Cerrar</Button>
            <Button onClick={() => { if (selectedId && noteText.trim()) noteMutation.mutate({ interventionId: selectedId, content: noteText }); }}
              disabled={!noteText.trim() || noteMutation.isPending}
              style={{ background: "#1E3A5F", color: "white" }}>
              {noteMutation.isPending ? "Guardando..." : "Agregar nota"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
