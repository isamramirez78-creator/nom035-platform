import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DocumentosNormativos from "./documentos-normativos";

const token = () => localStorage.getItem("company_token");
const authHeaders = () => ({
  "Content-Type": "application/json",
  ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
});

const RISK_COLORS: Record<string, string> = {
  medio: "#EAB308", alto: "#F97316", "muy-alto": "#EF4444"
};
const RISK_LABELS: Record<string, string> = {
  medio: "Medio", alto: "Alto", "muy-alto": "Muy Alto"
};
const ESTADO_LABELS: Record<string, string> = {
  abierto: "Abierto", en_seguimiento: "En seguimiento",
  canalizacion: "Canalización", cerrado: "Cerrado"
};
const ESTADO_COLORS: Record<string, string> = {
  abierto: "#EF4444", en_seguimiento: "#F97316",
  canalizacion: "#EAB308", cerrado: "#22C55E"
};

// ─── Schema nueva cita ────────────────────────────────────────────────────────
const citaSchema = z.object({
  tipo:         z.string().min(1),
  fechaCita:    z.string().min(1, "La fecha es requerida"),
  responsable:  z.string().min(2, "El responsable es requerido"),
  notas:        z.string().optional(),
  resultado:    z.string().optional(),
  proximaCita:  z.string().optional(),
});

// ─── Schema nuevo expediente ──────────────────────────────────────────────────
const expedienteSchema = z.object({
  employeeId:    z.number().min(1),
  nivelRiesgo:   z.string().min(1),
  motivoApertura: z.string().min(10, "Describe el motivo (mín. 10 caracteres)"),
  resumen:       z.string().optional(),
});

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Expedientes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedExp, setSelectedExp] = useState<any>(null);
  const [showNuevoExp, setShowNuevoExp] = useState(false);
  const [showNuevaCita, setShowNuevaCita] = useState(false);
  const [filterEstado, setFilterEstado] = useState("todos");
  const [activeTab, setActiveTab] = useState<"expedientes" | "documentos">("expedientes");

  // ── Queries ─────────────────────────────────────────────────────────────────
  const { data: expedientes = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/expedientes"],
    queryFn: async () => {
      const res = await fetch("/api/expedientes", { headers: authHeaders() });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ["/api/employees"],
    queryFn: async () => {
      const res = await fetch("/api/employees", { headers: authHeaders() });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: citas = [] } = useQuery<any[]>({
    queryKey: ["/api/expedientes", selectedExp?.id, "citas"],
    enabled: !!selectedExp,
    queryFn: async () => {
      const res = await fetch(`/api/expedientes/${selectedExp.id}/citas`, { headers: authHeaders() });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: documentos = [] } = useQuery<any[]>({
    queryKey: ["/api/expedientes", selectedExp?.id, "documentos"],
    enabled: !!selectedExp,
    queryFn: async () => {
      const res = await fetch(`/api/expedientes/${selectedExp.id}/documentos`, { headers: authHeaders() });
      if (!res.ok) return [];
      return res.json();
    },
  });

  // ── Mutations ────────────────────────────────────────────────────────────────
  const crearExpMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/expedientes", {
        method: "POST", headers: authHeaders(), body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expedientes"] });
      setShowNuevoExp(false);
      toast({ title: "Expediente creado correctamente" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const crearCitaMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/expedientes/${selectedExp.id}/citas`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expedientes", selectedExp?.id, "citas"] });
      setShowNuevaCita(false);
      toast({ title: "Cita/seguimiento registrado" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const cambiarEstadoMutation = useMutation({
    mutationFn: async ({ id, estado }: { id: number; estado: string }) => {
      const res = await fetch(`/api/expedientes/${id}`, {
        method: "PATCH", headers: authHeaders(), body: JSON.stringify({ estado }),
      });
      if (!res.ok) throw new Error("Error al actualizar");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expedientes"] });
      toast({ title: "Estado actualizado" });
    },
  });

  const subirDocMutation = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("expedienteId", selectedExp.id);
      const res = await fetch("/api/expedientes/documentos", {
        method: "POST",
        headers: token() ? { Authorization: `Bearer ${token()}` } : {},
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expedientes", selectedExp?.id, "documentos"] });
      toast({ title: "Documento subido correctamente" });
    },
    onError: (e: Error) => toast({ title: "Error al subir documento", description: e.message, variant: "destructive" }),
  });

  // ── Forms ────────────────────────────────────────────────────────────────────
  const expForm = useForm({ resolver: zodResolver(expedienteSchema) });
  const citaForm = useForm({ resolver: zodResolver(citaSchema) });

  // ── Filtros ──────────────────────────────────────────────────────────────────
  const expFiltrados = filterEstado === "todos"
    ? expedientes
    : expedientes.filter((e: any) => e.estado === filterEstado);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const empName = (id: number) => {
    const e = employees.find((e: any) => e.id === id);
    if (!e) return "—";
    return `${e.nombre} ${e.apellidoPaterno || e.apellido_paterno || e.apellidos || ""}`.trim();
  };

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  // ── UI ───────────────────────────────────────────────────────────────────────
  return (
    <div className="page-container space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div style={{ width: 3, height: "2.5rem", background: "#84CC16", borderRadius: 2 }} />
          <div>
            <h1 className="page-title">Expedientes de Trabajadores</h1>
            <p className="page-subtitle">Seguimiento de casos de riesgo psicosocial detectados</p>
          </div>
        </div>
        <Button onClick={() => setShowNuevoExp(true)} className="btn-primary gap-2">
          + Nuevo Expediente
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "#F1F5F9" }}>
        {[
          { id: "expedientes", label: "Expedientes de Trabajadores", icon: "fas fa-folder-open" },
          { id: "documentos",  label: "Documentos Normativos NOM-035", icon: "fas fa-file-contract" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activeTab === tab.id ? "#1E3A5F" : "transparent",
              color: activeTab === tab.id ? "white" : "#64748B",
            }}
          >
            <i className={`${tab.icon} text-xs`}></i>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Documentos Normativos */}
      {activeTab === "documentos" && <DocumentosNormativos />}

      {/* Tab: Expedientes */}
      {activeTab === "expedientes" && <>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {["todos", "abierto", "en_seguimiento", "canalizacion", "cerrado"].map(e => (
          <button
            key={e}
            onClick={() => setFilterEstado(e)}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background: filterEstado === e ? "#1E3A5F" : "#F1F5F9",
              color: filterEstado === e ? "white" : "#64748B",
            }}
          >
            {e === "todos" ? "Todos" : ESTADO_LABELS[e]}
          </button>
        ))}
      </div>

      {/* Lista de expedientes + detalle */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Lista */}
        <div className="section-card lg:col-span-1">
          <div className="section-header"><div className="lime-dot" /><h3>Expedientes ({expFiltrados.length})</h3></div>
          {isLoading
            ? <div className="p-5 text-slate-500 text-sm">Cargando...</div>
            : expFiltrados.length === 0
              ? <div className="empty-state">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <p className="text-sm">No hay expedientes {filterEstado !== "todos" ? `en estado "${ESTADO_LABELS[filterEstado]}"` : ""}</p>
                </div>
              : expFiltrados.map((exp: any) => (
                <div
                  key={exp.id}
                  onClick={() => setSelectedExp(exp)}
                  className="p-4 border-b cursor-pointer transition-colors"
                  style={{
                    borderBottomColor: "#F1F5F9",
                    background: selectedExp?.id === exp.id ? "#EFF6FF" : "white",
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "#1E3A5F" }}>
                        {empName(exp.employeeId || exp.employee_id)}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{fmtDate(exp.fechaApertura || exp.fecha_apertura)}</p>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: `${RISK_COLORS[exp.nivelRiesgo || exp.nivel_riesgo] || "#EAB308"}20`,
                          color: RISK_COLORS[exp.nivelRiesgo || exp.nivel_riesgo] || "#EAB308" }}>
                        {RISK_LABELS[exp.nivelRiesgo || exp.nivel_riesgo] || "—"}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: `${ESTADO_COLORS[exp.estado] || "#64748B"}20`,
                          color: ESTADO_COLORS[exp.estado] || "#64748B" }}>
                        {ESTADO_LABELS[exp.estado] || exp.estado}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 line-clamp-2">
                    {exp.motivoApertura || exp.motivo_apertura}
                  </p>
                </div>
              ))
          }
        </div>

        {/* Detalle */}
        <div className="lg:col-span-2 space-y-5">
          {!selectedExp
            ? <div className="section-card">
                <div className="empty-state" style={{ minHeight: 300 }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5">
                    <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                  <p className="font-medium text-sm">Selecciona un expediente para ver el detalle</p>
                </div>
              </div>
            : <>
                {/* Info del expediente */}
                <div className="section-card">
                  <div className="section-header justify-between">
                    <div className="flex items-center gap-2"><div className="lime-dot" /><h3>{empName(selectedExp.employeeId || selectedExp.employee_id)}</h3></div>
                    <Select value={selectedExp.estado} onValueChange={(v) => cambiarEstadoMutation.mutate({ id: selectedExp.id, estado: v })}>
                      <SelectTrigger className="w-40 h-7 text-xs bg-white border-white/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ESTADO_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="p-5 grid grid-cols-2 gap-4">
                    {[
                      { label: "Nivel de riesgo", value: RISK_LABELS[selectedExp.nivelRiesgo || selectedExp.nivel_riesgo] || "—", color: RISK_COLORS[selectedExp.nivelRiesgo || selectedExp.nivel_riesgo] },
                      { label: "Estado", value: ESTADO_LABELS[selectedExp.estado] || selectedExp.estado, color: ESTADO_COLORS[selectedExp.estado] },
                      { label: "Fecha apertura", value: fmtDate(selectedExp.fechaApertura || selectedExp.fecha_apertura) },
                      { label: "Fecha cierre", value: fmtDate(selectedExp.fechaCierre || selectedExp.fecha_cierre) },
                    ].map(item => (
                      <div key={item.label} className="p-3 rounded-lg" style={{ background: "#F8FAFC", border: "0.5px solid #E2E8F0" }}>
                        <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                        <p className="text-sm font-semibold" style={{ color: item.color || "#1E3A5F" }}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="px-5 pb-5">
                    <p className="text-xs text-slate-500 mb-1">Motivo de apertura</p>
                    <p className="text-sm text-slate-700">{selectedExp.motivoApertura || selectedExp.motivo_apertura}</p>
                    {(selectedExp.resumen) && <>
                      <p className="text-xs text-slate-500 mb-1 mt-3">Resumen</p>
                      <p className="text-sm text-slate-700">{selectedExp.resumen}</p>
                    </>}
                  </div>
                </div>

                {/* Citas y seguimientos */}
                <div className="section-card">
                  <div className="section-header justify-between">
                    <div className="flex items-center gap-2"><div className="lime-dot" /><h3>Historial de citas ({citas.length})</h3></div>
                    <Button onClick={() => setShowNuevaCita(true)} size="sm"
                      className="text-white text-xs h-7 px-3" style={{ background: "#84CC16", color: "#1E3A5F" }}>
                      + Agregar
                    </Button>
                  </div>
                  {citas.length === 0
                    ? <div className="empty-state" style={{ minHeight: 100 }}>
                        <p className="text-sm">Sin citas registradas aún</p>
                      </div>
                    : citas.map((cita: any) => (
                      <div key={cita.id} className="p-4 border-b" style={{ borderBottomColor: "#F1F5F9" }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: "#EFF6FF", color: "#1E3A5F" }}>
                            {cita.tipo}
                          </span>
                          <span className="text-xs text-slate-500">{fmtDate(cita.fechaCita || cita.fecha_cita)}</span>
                        </div>
                        <p className="text-xs text-slate-500">Responsable: <strong>{cita.responsable}</strong></p>
                        {cita.notas && <p className="text-sm text-slate-700 mt-1">{cita.notas}</p>}
                        {cita.resultado && <p className="text-xs text-slate-500 mt-1">Resultado: {cita.resultado}</p>}
                        {(cita.proximaCita || cita.proxima_cita) && (
                          <p className="text-xs mt-1" style={{ color: "#F97316" }}>
                            Próxima cita: {fmtDate(cita.proximaCita || cita.proxima_cita)}
                          </p>
                        )}
                      </div>
                    ))
                  }
                </div>

                {/* Documentos */}
                <div className="section-card">
                  <div className="section-header justify-between">
                    <div className="flex items-center gap-2"><div className="lime-dot" /><h3>Documentos y evidencias ({documentos.length})</h3></div>
                    <label className="cursor-pointer">
                      <span className="text-white text-xs h-7 px-3 py-1.5 rounded-md font-medium"
                        style={{ background: "#1E3A5F" }}>
                        + Subir archivo
                      </span>
                      <input type="file" className="hidden"
                        onChange={e => e.target.files?.[0] && subirDocMutation.mutate(e.target.files[0])} />
                    </label>
                  </div>
                  {documentos.length === 0
                    ? <div className="empty-state" style={{ minHeight: 80 }}>
                        <p className="text-sm">Sin documentos adjuntos</p>
                      </div>
                    : documentos.map((doc: any) => (
                      <div key={doc.id} className="p-4 border-b flex items-center justify-between" style={{ borderBottomColor: "#F1F5F9" }}>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: "#EFF6FF" }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                              <polyline points="14 2 14 8 20 8"/>
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: "#1E3A5F" }}>{doc.nombre}</p>
                            <p className="text-xs text-slate-500">{doc.tipo} · {fmtDate(doc.createdAt || doc.created_at)}</p>
                          </div>
                        </div>
                        <a href={doc.url} target="_blank" rel="noreferrer"
                          className="text-xs px-3 py-1.5 rounded-md" style={{ background: "#EFF6FF", color: "#1E3A5F" }}>
                          Ver
                        </a>
                      </div>
                    ))
                  }
                </div>
              </>
          }
        </div>
      </div>

      </>}

      {/* Modal — Nuevo expediente */}
      <Dialog open={showNuevoExp} onOpenChange={setShowNuevoExp}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nuevo Expediente</DialogTitle></DialogHeader>
          <Form {...expForm}>
            <form onSubmit={expForm.handleSubmit((d) => crearExpMutation.mutate(d))} className="space-y-4">
              <FormField control={expForm.control} name="employeeId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Trabajador *</FormLabel>
                  <Select onValueChange={v => field.onChange(parseInt(v))} value={field.value?.toString() || ""}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar trabajador" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {employees.map((e: any) => (
                        <SelectItem key={e.id} value={e.id.toString()}>
                          {e.nombre} {e.apellidoPaterno || e.apellido_paterno || e.apellidos || ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={expForm.control} name="nivelRiesgo" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nivel de riesgo detectado *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar nivel" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="medio">Medio</SelectItem>
                      <SelectItem value="alto">Alto</SelectItem>
                      <SelectItem value="muy-alto">Muy Alto</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={expForm.control} name="motivoApertura" render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo de apertura *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe el motivo por el que se abre este expediente..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={expForm.control} name="resumen" render={({ field }) => (
                <FormItem>
                  <FormLabel>Resumen inicial <span className="text-slate-400 text-xs">(opcional)</span></FormLabel>
                  <FormControl>
                    <Textarea placeholder="Contexto adicional, antecedentes relevantes..." rows={2} {...field} />
                  </FormControl>
                </FormItem>
              )} />
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={crearExpMutation.isPending} className="flex-1 btn-primary">
                  {crearExpMutation.isPending ? "Creando..." : "Crear Expediente"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowNuevoExp(false)}>Cancelar</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal — Nueva cita */}
      <Dialog open={showNuevaCita} onOpenChange={setShowNuevaCita}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Registrar Cita / Seguimiento</DialogTitle></DialogHeader>
          <Form {...citaForm}>
            <form onSubmit={citaForm.handleSubmit((d) => crearCitaMutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={citaForm.control} name="tipo" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="seguimiento">Seguimiento</SelectItem>
                        <SelectItem value="canalizacion">Canalización</SelectItem>
                        <SelectItem value="evaluacion_medica">Evaluación médica</SelectItem>
                        <SelectItem value="intervencion">Intervención</SelectItem>
                        <SelectItem value="cierre">Cierre de caso</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={citaForm.control} name="fechaCita" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha *</FormLabel>
                    <FormControl><Input type="datetime-local" {...field} value={field.value || ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={citaForm.control} name="responsable" render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsable *</FormLabel>
                  <FormControl><Input placeholder="Nombre del responsable de la cita" {...field} value={field.value || ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={citaForm.control} name="notas" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas <span className="text-slate-400 text-xs">(opcional)</span></FormLabel>
                  <FormControl><Textarea placeholder="Observaciones, acuerdos, compromisos..." rows={3} {...field} value={field.value || ""} /></FormControl>
                </FormItem>
              )} />
              <FormField control={citaForm.control} name="resultado" render={({ field }) => (
                <FormItem>
                  <FormLabel>Resultado <span className="text-slate-400 text-xs">(opcional)</span></FormLabel>
                  <FormControl><Input placeholder="Resultado o conclusión de la cita" {...field} value={field.value || ""} /></FormControl>
                </FormItem>
              )} />
              <FormField control={citaForm.control} name="proximaCita" render={({ field }) => (
                <FormItem>
                  <FormLabel>Próxima cita <span className="text-slate-400 text-xs">(opcional)</span></FormLabel>
                  <FormControl><Input type="datetime-local" {...field} value={field.value || ""} /></FormControl>
                </FormItem>
              )} />
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={crearCitaMutation.isPending} className="flex-1 btn-primary">
                  {crearCitaMutation.isPending ? "Guardando..." : "Guardar"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowNuevaCita(false)}>Cancelar</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
