import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const TIPO_LABELS: Record<string,string> = {
  violencia_laboral: "Violencia laboral",
  acoso: "Acoso (moral/sexual)",
  discriminacion: "Discriminación",
  factor_riesgo: "Factor de riesgo psicosocial",
  otro: "Otro",
};

const schema = z.object({
  tipo: z.string().min(1,"Selecciona el tipo"),
  descripcion: z.string().min(20,"Describe la situación (mín. 20 caracteres)"),
  area_involucrada: z.string().optional(),
  fecha_ocurrencia: z.string().optional(),
  anonima: z.boolean().default(true),
  nombre_denunciante: z.string().optional(),
  email_denunciante: z.string().email("Email inválido").optional().or(z.literal("")),
});

export default function DenunciaPublica() {
  const params = useParams();
  const empresaToken = params.token;
  const [folio, setFolio] = useState<string|null>(null);
  const [esAnonima, setEsAnonima] = useState(true);

  const form = useForm({ resolver: zodResolver(schema), defaultValues: { anonima: true } });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/denuncias/publica/${empresaToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, anonima: esAnonima }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Error al enviar");
      return json;
    },
    onSuccess: (data) => setFolio(data.folio),
  });

  if (folio) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem", background:"linear-gradient(135deg,#F0FDF4,#ECFCCB)" }}>
      <div style={{ background:"white", borderRadius:20, padding:"2.5rem", maxWidth:480, width:"100%", textAlign:"center", boxShadow:"0 8px 32px rgba(0,0,0,0.08)" }}>
        <div style={{ width:72, height:72, background:"#ECFCCB", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1.5rem" }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 style={{ color:"#1E3A5F", fontSize:22, fontWeight:700, marginBottom:8 }}>¡Denuncia recibida!</h2>
        <p style={{ color:"#64748B", fontSize:14, lineHeight:1.6, marginBottom:20 }}>
          Tu denuncia fue registrada correctamente de forma confidencial.
        </p>
        <div style={{ background:"#1E3A5F", borderRadius:12, padding:"1rem", marginBottom:16 }}>
          <p style={{ color:"#84CC16", fontSize:12, margin:"0 0 4px", fontWeight:600 }}>FOLIO DE SEGUIMIENTO</p>
          <p style={{ color:"white", fontSize:20, fontWeight:700, fontFamily:"monospace", margin:0 }}>{folio}</p>
        </div>
        <p style={{ color:"#94A3B8", fontSize:12 }}>
          Guarda este folio. La empresa investigará tu caso y tomará las medidas necesarias. Tu identidad está protegida.
        </p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#F8FAFC", fontFamily:"Inter,sans-serif" }}>
      {/* Header */}
      <header style={{ background:"#1E3A5F", borderBottom:"3px solid #84CC16", padding:"0 1.5rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, height:60, maxWidth:800, margin:"0 auto" }}>
          <div style={{ width:36, height:36, background:"#84CC16", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>
            </svg>
          </div>
          <div>
            <div style={{ color:"white", fontWeight:700, fontSize:14 }}>Canal de Denuncias</div>
            <div style={{ color:"#94A3B8", fontSize:11 }}>NOM-035-STPS-2018 — Numeral 8.2</div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth:680, margin:"0 auto", padding:"2rem 1rem" }}>
        {/* Banner */}
        <div style={{ background:"white", borderRadius:16, padding:"1.25rem", marginBottom:24, border:"0.5px solid #E2E8F0", borderLeft:"4px solid #84CC16", boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
          <p style={{ color:"#1E3A5F", fontWeight:600, fontSize:14, margin:"0 0 4px" }}>🔒 Canal confidencial y seguro</p>
          <p style={{ color:"#64748B", fontSize:13, margin:0, lineHeight:1.6 }}>
            Puedes reportar de forma anónima cualquier situación de violencia laboral, acoso, discriminación o factor de riesgo psicosocial. La empresa está obligada a investigar y resolver tu caso. Se te asignará un folio para dar seguimiento.
          </p>
        </div>

        {/* Formulario */}
        <div style={{ background:"white", borderRadius:16, padding:"1.5rem", border:"0.5px solid #E2E8F0", boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
          <h2 style={{ color:"#1E3A5F", fontSize:18, fontWeight:700, marginBottom:20 }}>Registrar denuncia o queja</h2>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} style={{ display:"flex", flexDirection:"column", gap:16 }}>

              <FormField control={form.control} name="tipo" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de situación *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value||""}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {Object.entries(TIPO_LABELS).map(([v,l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="descripcion" render={({ field }) => (
                <FormItem>
                  <FormLabel>Describe la situación *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe detalladamente lo ocurrido, cuándo, dónde y quiénes estuvieron involucrados..." rows={5} {...field} value={field.value||""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <FormField control={form.control} name="area_involucrada" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área involucrada <span style={{ color:"#94A3B8", fontSize:11 }}>(opcional)</span></FormLabel>
                    <FormControl><Input placeholder="Ej: Recursos Humanos" {...field} value={field.value||""} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="fecha_ocurrencia" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha del hecho <span style={{ color:"#94A3B8", fontSize:11 }}>(opcional)</span></FormLabel>
                    <FormControl><Input type="date" {...field} value={field.value||""} /></FormControl>
                  </FormItem>
                )} />
              </div>

              {/* Toggle anónima */}
              <div style={{ background:"#F8FAFC", borderRadius:12, padding:"1rem", border:"0.5px solid #E2E8F0" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: esAnonima ? 0 : 12 }}>
                  <div>
                    <p style={{ color:"#1E3A5F", fontWeight:600, fontSize:14, margin:0 }}>Denuncia anónima</p>
                    <p style={{ color:"#64748B", fontSize:12, margin:0 }}>No se revelará tu identidad</p>
                  </div>
                  <button type="button" onClick={() => setEsAnonima(!esAnonima)}
                    style={{ width:48, height:24, borderRadius:99, border:"none", cursor:"pointer", transition:"background 0.2s", background: esAnonima?"#84CC16":"#E2E8F0", position:"relative" }}>
                    <div style={{ position:"absolute", top:3, width:18, height:18, borderRadius:"50%", background:"white", transition:"left 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.2)", left: esAnonima?"calc(100% - 21px)":"3px" }}></div>
                  </button>
                </div>
                {!esAnonima && (
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginTop:12 }}>
                    <FormField control={form.control} name="nombre_denunciante" render={({ field }) => (
                      <FormItem><FormLabel>Tu nombre</FormLabel>
                        <FormControl><Input placeholder="Nombre completo" {...field} value={field.value||""} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="email_denunciante" render={({ field }) => (
                      <FormItem><FormLabel>Tu correo <span style={{ color:"#94A3B8", fontSize:11 }}>(para seguimiento)</span></FormLabel>
                        <FormControl><Input type="email" placeholder="correo@empresa.com" {...field} value={field.value||""} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                )}
              </div>

              {mutation.error && (
                <div style={{ background:"#FEE2E2", borderRadius:8, padding:"0.75rem", color:"#991B1B", fontSize:13 }}>
                  {(mutation.error as Error).message}
                </div>
              )}

              <Button type="submit" disabled={mutation.isPending}
                style={{ background:"#1E3A5F", color:"white", height:44, fontSize:15, fontWeight:600, borderRadius:10 }}>
                {mutation.isPending ? "Enviando..." : "Enviar denuncia de forma confidencial"}
              </Button>
            </form>
          </Form>
        </div>

        <p style={{ textAlign:"center", color:"#94A3B8", fontSize:12, marginTop:16 }}>
          Canal oficial conforme a NOM-035-STPS-2018 Numeral 8.2 · Tu privacidad está garantizada
        </p>
      </div>
    </div>
  );
}
