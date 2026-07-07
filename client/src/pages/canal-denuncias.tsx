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

const token = () => localStorage.getItem("company_token");
const h = () => ({ "Content-Type": "application/json", ...(token() ? { Authorization: `Bearer ${token()}` } : {}) });

const TIPO_LABELS: Record<string, string> = {
  violencia_laboral: "Violencia laboral",
  acoso: "Acoso (moral/sexual)",
  discriminacion: "Discriminación",
  factor_riesgo: "Factor de riesgo psicosocial",
  otro: "Otro",
};
const ESTADO_COLORS: Record<string, string> = {
  recibida: "#64748B", en_investigacion: "#F97316",
  resuelta: "#22C55E", cerrada: "#1E3A5F",
};

const denunciaSchema = z.object({
  tipo: z.string().min(1, "Selecciona el tipo"),
  descripcion: z.string().min(20, "Describe la situación (mín. 20 caracteres)"),
  area_involucrada: z.string().optional(),
  fecha_ocurrencia: z.string().optional(),
  anonima: z.boolean().default(true),
  nombre_denunciante: z.string().optional(),
  email_denunciante: z.string().email("Email inválido").optional().or(z.literal("")),
});

export default function CanalDenuncias() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedDenuncia, setSelectedDenuncia] = useState<any>(null);
  const [esAnonima, setEsAnonima] = useState(true);

  const { data: denuncias = [] } = useQuery<any[]>({
    queryKey: ["/api/denuncias"],
    queryFn: async () => {
      const res = await fetch("/api/denuncias", { headers: h() });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const crearMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/denuncias", { method: "POST", headers: h(), body: JSON.stringify(data) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/denuncias"] });
      setShowForm(false);
      form.reset();
      toast({
        title: "Denuncia registrada",
        description: `Folio: ${data.folio} — Guarda este folio para dar seguimiento.`,
      });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const actualizarMutation = useMutation({
    mutationFn: async ({ id, estado, resolucion }: { id: number; estado: string; resolucion?: string }) => {
      const res = await fetch(`/api/denuncias/${id}`, {
        method: "PATCH", headers: h(), body: JSON.stringify({ estado, resolucion }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/denuncias"] });
      setSelectedDenuncia(null);
      toast({ title: "Denuncia actualizada" });
    },
  });

  const form = useForm({ resolver: zodResolver(denunciaSchema), defaultValues: { anonima: true } });
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  return (
    <div className="space-y-5">

      {/* Links de acceso para empleados */}
      <div className="section-card">
        <div className="section-header"><div className="lime-dot" /><h3>Acceso para empleados</h3></div>
        <div className="p-5 space-y-4">
          <div className="p-4 rounded-xl" style={{ background:"#EFF6FF", border:"1px solid #BFDBFE" }}>
            <p className="text-sm font-semibold mb-1" style={{ color:"#1E40AF" }}>🔗 Link directo para empleados</p>
            <p className="text-xs mb-3" style={{ color:"#3B82F6" }}>
              Comparte este link con tus empleados para que puedan registrar denuncias de forma anónima desde cualquier dispositivo.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs p-2 rounded-lg truncate" style={{ background:"#F8FAFC", border:"0.5px solid #E2E8F0", color:"#1E3A5F" }}>
                {`${window.location.origin}/denuncia/${window.location.hostname.split('.')[0]}`}
              </code>
              <button
                onClick={() => {
                  const link = `${window.location.origin}/denuncia/empresa`;
                  navigator.clipboard.writeText(link);
                  toast({ title: "Link copiado al portapapeles" });
                }}
                className="px-3 py-2 rounded-lg text-xs font-medium flex-shrink-0"
                style={{ background:"#1E3A5F", color:"white" }}>
                Copiar link
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl" style={{ background:"#F0FDF4", border:"1px solid #BBF7D0" }}>
            <p className="text-sm font-semibold mb-1" style={{ color:"#15803D" }}>📱 Código QR para cartelera</p>
            <p className="text-xs mb-3" style={{ color:"#16A34A" }}>
              Imprime y coloca este QR en áreas visibles de tu empresa. Los empleados lo escanean con su celular para acceder al canal de denuncias.
            </p>
            <button
              onClick={() => {
                const link = `${window.location.origin}/denuncia/empresa`;
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(link)}`;
                const win = window.open('', '_blank');
                if (win) {
                  win.document.write(`
                    <html><body style="text-align:center;font-family:Inter,sans-serif;padding:2rem">
                      <h2 style="color:#1E3A5F">Canal de Denuncias NOM-035</h2>
                      <p style="color:#64748B">Escanea para registrar una denuncia de forma confidencial</p>
                      <img src="${qrUrl}" style="margin:1rem auto;display:block;border:8px solid #1E3A5F;border-radius:12px"/>
                      <p style="color:#94A3B8;font-size:12px">${link}</p>
                      <button onclick="window.print()" style="background:#1E3A5F;color:white;border:none;padding:12px 24px;border-radius:8px;cursor:pointer;font-size:14px;margin-top:1rem">🖨️ Imprimir QR</button>
                    </html></body>
                  `);
                }
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background:"#15803D", color:"white" }}>
              📱 Generar e imprimir QR
            </button>
          </div>
        </div>
      </div>

      {/* Banner informativo */}
      <div className="p-4 rounded-xl" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
        <div className="flex items-start gap-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" className="flex-shrink-0 mt-0.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>
          </svg>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#15803D" }}>Canal oficial de denuncia — Numeral 8.2 NOM-035</p>
            <p className="text-xs mt-0.5" style={{ color: "#16A34A" }}>
              Las denuncias pueden ser anónimas. La empresa está obligada a investigar y resolver cada caso.
              Guarda el folio de tu denuncia para dar seguimiento.
            </p>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", value: denuncias.length, color: "#1E3A5F" },
          { label: "Recibidas", value: denuncias.filter((d: any) => d.estado === "recibida").length, color: "#64748B" },
          { label: "En investigación", value: denuncias.filter((d: any) => d.estado === "en_investigacion").length, color: "#F97316" },
          { label: "Resueltas", value: denuncias.filter((d: any) => d.estado === "resuelta").length, color: "#22C55E" },
        ].map(s => (
          <div key={s.label} className="kpi-card p-4">
            <div className="kpi-card-accent" style={{ background: s.color }}></div>
            <p className="text-xs text-slate-500 mb-1 mt-1">{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Lista + botón nueva */}
      <div className="section-card">
        <div className="section-header justify-between">
          <div className="flex items-center gap-2"><div className="lime-dot" /><h3>Denuncias registradas</h3></div>
          <Button onClick={() => setShowForm(true)} size="sm"
            className="text-xs h-7 px-3" style={{ background: "#84CC16", color: "#1E3A5F" }}>
            + Nueva denuncia
          </Button>
        </div>

        {denuncias.length === 0
          ? <div className="empty-state" style={{ minHeight: 120 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <p className="text-sm">Sin denuncias registradas</p>
            </div>
          : denuncias.map((d: any) => (
              <div key={d.id} className="p-4 border-b cursor-pointer hover:bg-slate-50 transition-colors"
                style={{ borderBottomColor: "#F1F5F9" }}
                onClick={() => setSelectedDenuncia(d)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs px-2 py-0.5 rounded"
                        style={{ background: "#F1F5F9", color: "#475569" }}>{d.folio}</span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ background: `${ESTADO_COLORS[d.estado]}20`, color: ESTADO_COLORS[d.estado] }}>
                        {d.estado?.replace("_", " ")}
                      </span>
                      {d.anonima && <span className="text-xs text-slate-400">🔒 Anónima</span>}
                    </div>
                    <p className="text-sm font-semibold mt-1" style={{ color: "#1E3A5F" }}>
                      {TIPO_LABELS[d.tipo] || d.tipo}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{d.descripcion}</p>
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0">{fmtDate(d.created_at)}</span>
                </div>
              </div>
            ))
        }
      </div>

      {/* Modal nueva denuncia */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-screen overflow-y-auto">
          <DialogHeader><DialogTitle>Registrar denuncia</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => crearMutation.mutate({ ...d, anonima: esAnonima }))} className="space-y-4">

              <FormField control={form.control} name="tipo" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de denuncia *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {Object.entries(TIPO_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="descripcion" render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción de la situación *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe detalladamente lo ocurrido..." rows={4} {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="area_involucrada" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área involucrada <span className="text-slate-400 text-xs">(opcional)</span></FormLabel>
                    <FormControl><Input placeholder="Ej: Recursos Humanos" {...field} value={field.value || ""} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="fecha_ocurrencia" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha del hecho <span className="text-slate-400 text-xs">(opcional)</span></FormLabel>
                    <FormControl><Input type="date" {...field} value={field.value || ""} /></FormControl>
                  </FormItem>
                )} />
              </div>

              {/* Toggle anónima */}
              <div className="p-3 rounded-lg" style={{ background: "#F8FAFC", border: "0.5px solid #E2E8F0" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#1E3A5F" }}>Denuncia anónima</p>
                    <p className="text-xs text-slate-500">No se revelará tu identidad al investigar</p>
                  </div>
                  <button type="button" onClick={() => setEsAnonima(!esAnonima)}
                    className="relative w-12 h-6 rounded-full transition-colors"
                    style={{ background: esAnonima ? "#84CC16" : "#E2E8F0" }}>
                    <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow"
                      style={{ left: esAnonima ? "calc(100% - 20px)" : "4px" }}></div>
                  </button>
                </div>
                {!esAnonima && (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <FormField control={form.control} name="nombre_denunciante" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tu nombre</FormLabel>
                        <FormControl><Input placeholder="Nombre completo" {...field} value={field.value || ""} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="email_denunciante" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tu correo</FormLabel>
                        <FormControl><Input type="email" placeholder="Para seguimiento" {...field} value={field.value || ""} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={crearMutation.isPending} className="flex-1 btn-primary">
                  {crearMutation.isPending ? "Enviando..." : "Enviar denuncia"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal detalle denuncia */}
      <Dialog open={!!selectedDenuncia} onOpenChange={() => setSelectedDenuncia(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Denuncia {selectedDenuncia?.folio}</DialogTitle>
          </DialogHeader>
          {selectedDenuncia && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Tipo", value: TIPO_LABELS[selectedDenuncia.tipo] || selectedDenuncia.tipo },
                  { label: "Estado", value: selectedDenuncia.estado?.replace("_", " ") },
                  { label: "Área", value: selectedDenuncia.area_involucrada || "—" },
                  { label: "Fecha hecho", value: fmtDate(selectedDenuncia.fecha_ocurrencia) },
                  { label: "Fecha registro", value: fmtDate(selectedDenuncia.created_at) },
                  { label: "Anónima", value: selectedDenuncia.anonima ? "Sí" : "No" },
                ].map(i => (
                  <div key={i.label} className="p-2.5 rounded-lg" style={{ background: "#F8FAFC" }}>
                    <p className="text-xs text-slate-400">{i.label}</p>
                    <p className="text-sm font-medium" style={{ color: "#1E3A5F" }}>{i.value}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Descripción</p>
                <p className="text-sm text-slate-700">{selectedDenuncia.descripcion}</p>
              </div>
              {selectedDenuncia.resolucion && (
                <div className="p-3 rounded-lg" style={{ background: "#F0FDF4" }}>
                  <p className="text-xs font-semibold text-green-700 mb-1">Resolución</p>
                  <p className="text-sm text-slate-700">{selectedDenuncia.resolucion}</p>
                </div>
              )}
              {/* Cambiar estado */}
              <div className="flex gap-2 flex-wrap pt-2">
                {["en_investigacion", "resuelta", "cerrada"]
                  .filter(e => e !== selectedDenuncia.estado)
                  .map(estado => (
                    <Button key={estado} size="sm"
                      onClick={() => actualizarMutation.mutate({ id: selectedDenuncia.id, estado })}
                      className="text-xs"
                      style={{ background: ESTADO_COLORS[estado], color: "white" }}>
                      Marcar como {estado.replace("_", " ")}
                    </Button>
                  ))
                }
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
