import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const token = () => localStorage.getItem("company_token");
const h = () => ({ "Content-Type": "application/json", ...(token() ? { Authorization: `Bearer ${token()}` } : {}) });

const centroSchema = z.object({
  nombre: z.string().min(2, "Nombre requerido"),
  direccion: z.string().optional(),
  municipio: z.string().optional(),
  estadoRepublica: z.string().optional(),
  numeroTrabajadores: z.number().min(0).optional(),
  responsable: z.string().optional(),
  registroPatronalImss: z.string().optional(),
});

export default function CentrosTrabajo() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data: centros = [] } = useQuery<any[]>({
    queryKey: ["/api/centros-trabajo"],
    queryFn: async () => {
      const res = await fetch("/api/centros-trabajo", { headers: h() });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editing ? `/api/centros-trabajo/${editing.id}` : "/api/centros-trabajo";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: h(), body: JSON.stringify(data) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/centros-trabajo"] });
      setShowForm(false);
      setEditing(null);
      form.reset();
      toast({ title: editing ? "Centro actualizado" : "Centro de trabajo registrado" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const form = useForm({ resolver: zodResolver(centroSchema) });

  const openEdit = (centro: any) => {
    setEditing(centro);
    form.reset({
      nombre: centro.nombre,
      direccion: centro.direccion || "",
      municipio: centro.municipio || "",
      estadoRepublica: centro.estado_republica || "",
      numeroTrabajadores: centro.numero_trabajadores || 0,
      responsable: centro.responsable || "",
      registroPatronalImss: centro.registro_patronal_imss || "",
    });
    setShowForm(true);
  };

  const totalTrabajadores = centros.reduce((s: number, c: any) => s + (c.numero_trabajadores || 0), 0);

  return (
    <div className="space-y-5">
      <div className="p-4 rounded-xl" style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
        <p className="text-sm font-semibold" style={{ color: "#1E40AF" }}>
          Centros de trabajo — Numeral 7.5 NOM-035
        </p>
        <p className="text-xs mt-0.5" style={{ color: "#3B82F6" }}>
          La NOM-035 aplica por cada centro de trabajo de forma independiente. 
          Si tienes múltiples sucursales, cada una debe cumplir por separado.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Centros registrados", value: centros.length, color: "#1E3A5F" },
          { label: "Total trabajadores", value: totalTrabajadores, color: "#84CC16" },
          { label: "Activos", value: centros.filter((c: any) => c.activo).length, color: "#22C55E" },
        ].map(s => (
          <div key={s.label} className="kpi-card p-4">
            <div className="kpi-card-accent" style={{ background: s.color }}></div>
            <p className="text-xs text-slate-500 mt-1 mb-1">{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="section-card">
        <div className="section-header justify-between">
          <div className="flex items-center gap-2"><div className="lime-dot" /><h3>Centros de trabajo ({centros.length})</h3></div>
          <Button onClick={() => { setEditing(null); form.reset(); setShowForm(true); }}
            size="sm" className="text-xs h-7 px-3" style={{ background: "#84CC16", color: "#1E3A5F" }}>
            + Agregar centro
          </Button>
        </div>

        {centros.length === 0
          ? <div className="empty-state" style={{ minHeight: 120 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <p className="text-sm">Sin centros de trabajo registrados</p>
            </div>
          : centros.map((c: any) => (
              <div key={c.id} className="p-4 border-b" style={{ borderBottomColor: "#F1F5F9" }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm" style={{ color: "#1E3A5F" }}>{c.nombre}</p>
                      {!c.activo && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#FEE2E2", color: "#DC2626" }}>Inactivo</span>}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {[c.municipio, c.estado_republica].filter(Boolean).join(", ") || "Sin dirección registrada"}
                    </p>
                    <div className="flex gap-4 mt-1.5 text-xs text-slate-500">
                      {c.numero_trabajadores > 0 && <span>👥 {c.numero_trabajadores} trabajadores</span>}
                      {c.responsable && <span>👤 {c.responsable}</span>}
                      {c.registro_patronal_imss && <span>🏢 IMSS: {c.registro_patronal_imss}</span>}
                    </div>
                  </div>
                  <Button onClick={() => openEdit(c)} size="sm" variant="outline" className="text-xs h-7">
                    Editar
                  </Button>
                </div>
              </div>
            ))
        }
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar centro de trabajo" : "Nuevo centro de trabajo"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
              <FormField control={form.control} name="nombre" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del centro *</FormLabel>
                  <FormControl><Input placeholder="Ej: Planta Norte, Sucursal Centro..." {...field} value={field.value || ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="municipio" render={({ field }) => (
                  <FormItem><FormLabel>Municipio</FormLabel>
                    <FormControl><Input placeholder="Ej: Monterrey" {...field} value={field.value || ""} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="estadoRepublica" render={({ field }) => (
                  <FormItem><FormLabel>Estado</FormLabel>
                    <FormControl><Input placeholder="Ej: Nuevo León" {...field} value={field.value || ""} /></FormControl>
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="direccion" render={({ field }) => (
                <FormItem><FormLabel>Dirección</FormLabel>
                  <FormControl><Input placeholder="Calle, número, colonia..." {...field} value={field.value || ""} /></FormControl>
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="numeroTrabajadores" render={({ field }) => (
                  <FormItem><FormLabel>No. de trabajadores</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field}
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                        value={field.value ?? 0} />
                    </FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="registroPatronalImss" render={({ field }) => (
                  <FormItem><FormLabel>Registro Patronal IMSS</FormLabel>
                    <FormControl><Input placeholder="Ej: Y12345678901" {...field} value={field.value || ""} /></FormControl>
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="responsable" render={({ field }) => (
                <FormItem><FormLabel>Responsable del centro</FormLabel>
                  <FormControl><Input placeholder="Nombre del responsable NOM-035" {...field} value={field.value || ""} /></FormControl>
                </FormItem>
              )} />
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={saveMutation.isPending} className="flex-1 btn-primary">
                  {saveMutation.isPending ? "Guardando..." : editing ? "Actualizar" : "Registrar centro"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
