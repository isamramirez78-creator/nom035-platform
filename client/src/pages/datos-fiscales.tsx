import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const tk = () => localStorage.getItem("company_token");
const h = () => ({ "Content-Type": "application/json", ...(tk() ? { Authorization: `Bearer ${tk()}` } : {}) });

const REGIMENES = [
  { value: "601", label: "601 - General de Ley Personas Morales" },
  { value: "603", label: "603 - Personas Morales con Fines no Lucrativos" },
  { value: "605", label: "605 - Sueldos y Salarios" },
  { value: "606", label: "606 - Arrendamiento" },
  { value: "607", label: "607 - Régimen de Enajenación o Adquisición de Bienes" },
  { value: "608", label: "608 - Demás Ingresos" },
  { value: "610", label: "610 - Residentes en el Extranjero sin EP en México" },
  { value: "611", label: "611 - Ingresos por Dividendos" },
  { value: "612", label: "612 - Personas Físicas con Actividades Empresariales y Profesionales" },
  { value: "614", label: "614 - Ingresos por Intereses" },
  { value: "615", label: "615 - Régimen de los Ingresos por Obtención de Premios" },
  { value: "616", label: "616 - Sin Obligaciones Fiscales" },
  { value: "620", label: "620 - Sociedades Cooperativas de Producción" },
  { value: "621", label: "621 - Incorporación Fiscal" },
  { value: "622", label: "622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras" },
  { value: "623", label: "623 - Opcional para Grupos de Sociedades" },
  { value: "624", label: "624 - Coordinados" },
  { value: "625", label: "625 - Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas" },
  { value: "626", label: "626 - Régimen Simplificado de Confianza" },
];

const USOS_CFDI = [
  { value: "G01", label: "G01 - Adquisición de mercancias" },
  { value: "G02", label: "G02 - Devoluciones, descuentos o bonificaciones" },
  { value: "G03", label: "G03 - Gastos en general" },
  { value: "I01", label: "I01 - Construcciones" },
  { value: "I04", label: "I04 - Equipo de computo y accesorios" },
  { value: "I06", label: "I06 - Comunicaciones telefónicas" },
  { value: "I08", label: "I08 - Otra maquinaria y equipo" },
  { value: "D01", label: "D01 - Honorarios médicos, dentales y gastos hospitalarios" },
  { value: "D10", label: "D10 - Pagos por servicios educativos (colegiaturas)" },
  { value: "S01", label: "S01 - Sin efectos fiscales" },
  { value: "CP01", label: "CP01 - Pagos" },
  { value: "CN01", label: "CN01 - Nómina" },
];

export default function DatosFiscales() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["/api/companies/profile"],
    queryFn: async () => {
      const r = await fetch("/api/companies/profile", { headers: h() });
      return r.ok ? r.json() : null;
    },
  });

  const [form, setForm] = useState({
    razonSocialFiscal: "",
    rfc: "",
    regimenFiscal: "612",
    usoCfdi: "G03",
    codigoPostalFiscal: "",
    domicilioFiscal: "",
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const r = await fetch("/api/companies/datos-fiscales", {
        method: "PATCH",
        headers: h(),
        body: JSON.stringify(data),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/companies/profile"] });
      toast({ title: "✅ Datos fiscales guardados correctamente" });
      setEditing(false);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const datosFiscalesCompletos = profile?.datos_fiscales_completos || profile?.datosFiscalesCompletos;

  return (
    <div style={{ background: "white", borderRadius: 16, padding: "1.5rem", border: "0.5px solid #E2E8F0", fontFamily: "Inter,sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h3 style={{ color: "#1E3A5F", fontSize: 16, fontWeight: 700, margin: 0 }}>Datos Fiscales para Facturación</h3>
          <p style={{ color: "#64748B", fontSize: 13, margin: "4px 0 0" }}>Necesarios para emitir tu CFDI de suscripción</p>
        </div>
        {datosFiscalesCompletos ? (
          <span style={{ background: "#ECFCCB", color: "#15803D", borderRadius: 99, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>✅ Completos</span>
        ) : (
          <span style={{ background: "#FEF3C7", color: "#92400E", borderRadius: 99, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>⚠️ Pendiente</span>
        )}
      </div>

      {!editing && datosFiscalesCompletos ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { label: "RFC", value: profile?.rfc },
            { label: "Razón Social Fiscal", value: profile?.razon_social_fiscal || profile?.razonSocialFiscal },
            { label: "Régimen Fiscal", value: REGIMENES.find(r => r.value === (profile?.regimen_fiscal || profile?.regimenFiscal))?.label },
            { label: "Uso CFDI", value: USOS_CFDI.find(u => u.value === (profile?.uso_cfdi || profile?.usoCfdi))?.label },
            { label: "Código Postal", value: profile?.codigo_postal_fiscal || profile?.codigoPostalFiscal },
            { label: "Domicilio Fiscal", value: profile?.domicilio_fiscal || profile?.domicilioFiscal },
          ].map(item => (
            <div key={item.label} style={{ background: "#F8FAFC", borderRadius: 8, padding: "10px 12px" }}>
              <p style={{ color: "#94A3B8", fontSize: 11, fontWeight: 600, margin: "0 0 2px", textTransform: "uppercase" }}>{item.label}</p>
              <p style={{ color: "#1E3A5F", fontSize: 13, margin: 0 }}>{item.value || "—"}</p>
            </div>
          ))}
          <div style={{ gridColumn: "1/-1" }}>
            <Button onClick={() => { setEditing(true); setForm({ razonSocialFiscal: profile?.razon_social_fiscal || "", rfc: profile?.rfc || "", regimenFiscal: profile?.regimen_fiscal || "612", usoCfdi: profile?.uso_cfdi || "G03", codigoPostalFiscal: profile?.codigo_postal_fiscal || "", domicilioFiscal: profile?.domicilio_fiscal || "" }); }}
              variant="outline" size="sm">Editar datos fiscales</Button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {!datosFiscalesCompletos && (
            <div style={{ background: "#FEF3C7", borderRadius: 10, padding: "10px 14px", border: "1px solid #FDE68A" }}>
              <p style={{ color: "#92400E", fontSize: 13, margin: 0 }}>
                ⚠️ Completa tus datos fiscales para que podamos emitirte el CFDI de tu suscripción.
              </p>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ color: "#1E3A5F", fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>RFC *</label>
              <Input value={form.rfc} onChange={e => setForm({...form, rfc: e.target.value.toUpperCase()})}
                placeholder="XAXX010101000" maxLength={13} />
            </div>
            <div>
              <label style={{ color: "#1E3A5F", fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>Código Postal Fiscal *</label>
              <Input value={form.codigoPostalFiscal} onChange={e => setForm({...form, codigoPostalFiscal: e.target.value})}
                placeholder="11410" maxLength={5} />
            </div>
          </div>
          <div>
            <label style={{ color: "#1E3A5F", fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>Razón Social (como aparece en el SAT) *</label>
            <Input value={form.razonSocialFiscal} onChange={e => setForm({...form, razonSocialFiscal: e.target.value.toUpperCase()})}
              placeholder="MI EMPRESA SA DE CV" />
          </div>
          <div>
            <label style={{ color: "#1E3A5F", fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>Domicilio Fiscal</label>
            <Input value={form.domicilioFiscal} onChange={e => setForm({...form, domicilioFiscal: e.target.value})}
              placeholder="Calle, Número, Colonia, Municipio, Estado" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ color: "#1E3A5F", fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>Régimen Fiscal *</label>
              <Select value={form.regimenFiscal} onValueChange={v => setForm({...form, regimenFiscal: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{REGIMENES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label style={{ color: "#1E3A5F", fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>Uso CFDI *</label>
              <Select value={form.usoCfdi} onValueChange={v => setForm({...form, usoCfdi: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{USOS_CFDI.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {editing && <Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>}
            <Button onClick={() => mutation.mutate(form)} disabled={!form.rfc || !form.razonSocialFiscal || !form.codigoPostalFiscal || mutation.isPending}
              style={{ background: "#1E3A5F", color: "white" }}>
              {mutation.isPending ? "Guardando..." : "Guardar datos fiscales"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
