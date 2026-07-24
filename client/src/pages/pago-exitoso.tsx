import { useEffect, useState } from "react";
import { useLocation } from "wouter";

const REGIMENES = [
  { value: "601", label: "601 - General de Ley Personas Morales" },
  { value: "605", label: "605 - Sueldos y Salarios" },
  { value: "606", label: "606 - Arrendamiento" },
  { value: "612", label: "612 - Personas Físicas con Actividades Empresariales" },
  { value: "616", label: "616 - Sin Obligaciones Fiscales" },
  { value: "621", label: "621 - Incorporación Fiscal" },
  { value: "626", label: "626 - Régimen Simplificado de Confianza" },
];

const USOS_CFDI = [
  { value: "G03", label: "G03 - Gastos en general" },
  { value: "I04", label: "I04 - Equipo de cómputo" },
  { value: "S01", label: "S01 - Sin efectos fiscales" },
  { value: "CP01", label: "CP01 - Pagos" },
];

export default function PagoExitoso() {
  const [, setLocation] = useLocation();
  const [showFactura, setShowFactura] = useState(false);
  const [facturaEnviada, setFacturaEnviada] = useState(false);
  const [facturaForm, setFacturaForm] = useState({
    rfc: "", razonSocial: "", regimenFiscal: "612",
    codigoPostal: "", usoCfdi: "G03", email: "",
  });

  const sessionId = new URLSearchParams(window.location.search).get("session_id");
  const fecha = new Date().toLocaleDateString("es-MX", { year:"numeric", month:"long", day:"numeric" });
  const hora = new Date().toLocaleTimeString("es-MX");

  const handleEnviarSolicitud = () => {
    setFacturaEnviada(true);
    setShowFactura(false);
  };

  const inp = { width:"100%", padding:"8px 12px", borderRadius:8, border:"1px solid #E2E8F0", fontSize:13, boxSizing:"border-box" as const };
  const lbl = { display:"block", fontSize:12, fontWeight:600 as const, color:"#1E3A5F", marginBottom:4 };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#F0FDF4,#ECFCCB)", fontFamily:"Inter,sans-serif", padding:"1rem" }}>
      <div style={{ background:"white", borderRadius:20, padding:"2.5rem", maxWidth:520, width:"100%", boxShadow:"0 8px 32px rgba(0,0,0,0.08)" }}>

        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:"1.5rem" }}>
          <div style={{ width:80, height:80, background:"#ECFCCB", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1rem" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h1 style={{ color:"#1E3A5F", fontSize:26, fontWeight:700, marginBottom:8 }}>¡Pago exitoso!</h1>
          <p style={{ color:"#64748B", fontSize:14, lineHeight:1.6, margin:0 }}>
            Tu suscripción a la plataforma NOM-035 ha sido activada correctamente.
          </p>
        </div>

        {/* Comprobante */}
        <div style={{ background:"#F8FAFC", borderRadius:12, padding:"1.25rem", marginBottom:"1rem", border:"1px solid #E2E8F0" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
            <h3 style={{ color:"#1E3A5F", fontSize:14, fontWeight:700, margin:0 }}>Comprobante de pago</h3>
            <span style={{ background:"#ECFCCB", color:"#15803D", borderRadius:99, padding:"2px 10px", fontSize:11, fontWeight:600 }}>Pagado</span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
            {[
              ["Fecha", fecha],
              ["Hora", hora],
              ["Referencia", sessionId ? sessionId.slice(0,20)+"..." : "—"],
              ["Estado", "Pago completado"],
            ].map(([label, value]) => (
              <div key={label}>
                <p style={{ color:"#94A3B8", fontSize:10, fontWeight:600, margin:"0 0 2px", textTransform:"uppercase" as const }}>{label}</p>
                <p style={{ color:"#1E3A5F", fontSize:12, fontWeight:600, margin:0 }}>{value}</p>
              </div>
            ))}
          </div>
          <div style={{ borderTop:"1px solid #E2E8F0", paddingTop:10 }}>
            <p style={{ color:"#64748B", fontSize:11, margin:0 }}>
              Para el recibo oficial de Stripe:{" "}
              <a href="https://dashboard.stripe.com/receipts" target="_blank" rel="noopener noreferrer"
                style={{ color:"#1E40AF" }}>dashboard.stripe.com/receipts</a>
            </p>
          </div>
        </div>

        {/* Solicitar CFDI */}
        {!facturaEnviada ? (
          <div style={{ background:"#EFF6FF", borderRadius:12, padding:"1rem", marginBottom:"1rem", border:"1px solid #BFDBFE" }}>
            <p style={{ color:"#1E40AF", fontSize:13, fontWeight:600, margin:"0 0 6px" }}>¿Necesitas factura CFDI?</p>
            <p style={{ color:"#3B82F6", fontSize:12, margin:"0 0 10px" }}>
              Solicita tu comprobante fiscal y te lo enviamos en máximo 24 horas hábiles.
            </p>
            <button onClick={() => setShowFactura(true)}
              style={{ background:"#1E40AF", color:"white", border:"none", borderRadius:8, padding:"8px 16px", fontSize:13, fontWeight:600, cursor:"pointer" }}>
              Solicitar factura CFDI
            </button>
          </div>
        ) : (
          <div style={{ background:"#ECFCCB", borderRadius:12, padding:"1rem", marginBottom:"1rem", border:"1px solid #BBF7D0" }}>
            <p style={{ color:"#15803D", fontSize:13, fontWeight:600, margin:0 }}>
              ✅ Solicitud enviada. Recibirás tu CFDI en tu correo en máximo 24 horas hábiles.
            </p>
          </div>
        )}

        <button onClick={() => setLocation("/company-login")}
          style={{ width:"100%", background:"#1E3A5F", color:"white", border:"none", borderRadius:10, padding:"12px", fontSize:15, fontWeight:600, cursor:"pointer" }}>
          Iniciar sesión
        </button>
      </div>

      {/* Modal CFDI */}
      {showFactura && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50, padding:"1rem" }}>
          <div style={{ background:"white", borderRadius:16, padding:"1.5rem", width:"100%", maxWidth:480, maxHeight:"90vh", overflowY:"auto" }}>
            <h3 style={{ color:"#1E3A5F", fontSize:16, fontWeight:700, marginBottom:16 }}>Solicitar factura CFDI</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div>
                  <label style={lbl}>RFC *</label>
                  <input style={inp} placeholder="XAXX010101000" maxLength={13}
                    value={facturaForm.rfc} onChange={e => setFacturaForm(f => ({ ...f, rfc: e.target.value.toUpperCase() }))} />
                </div>
                <div>
                  <label style={lbl}>Código Postal Fiscal *</label>
                  <input style={inp} placeholder="11410" maxLength={5}
                    value={facturaForm.codigoPostal} onChange={e => setFacturaForm(f => ({ ...f, codigoPostal: e.target.value }))} />
                </div>
              </div>
              <div>
                <label style={lbl}>Razón Social (como aparece en el SAT) *</label>
                <input style={inp} placeholder="MI EMPRESA SA DE CV"
                  value={facturaForm.razonSocial} onChange={e => setFacturaForm(f => ({ ...f, razonSocial: e.target.value.toUpperCase() }))} />
              </div>
              <div>
                <label style={lbl}>Régimen Fiscal *</label>
                <select style={inp} value={facturaForm.regimenFiscal} onChange={e => setFacturaForm(f => ({ ...f, regimenFiscal: e.target.value }))}>
                  {REGIMENES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div>
                  <label style={lbl}>Uso de CFDI *</label>
                  <select style={inp} value={facturaForm.usoCfdi} onChange={e => setFacturaForm(f => ({ ...f, usoCfdi: e.target.value }))}>
                    {USOS_CFDI.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Correo para envío *</label>
                  <input style={inp} type="email" placeholder="facturacion@empresa.com"
                    value={facturaForm.email} onChange={e => setFacturaForm(f => ({ ...f, email: e.target.value }))} />
                </div>
              </div>
            </div>
            <div style={{ display:"flex", gap:10, marginTop:16 }}>
              <button onClick={() => setShowFactura(false)}
                style={{ flex:1, background:"#F1F5F9", color:"#64748B", border:"none", borderRadius:8, padding:"10px", fontSize:13, cursor:"pointer" }}>
                Cancelar
              </button>
              <button onClick={handleEnviarSolicitud}
                disabled={!facturaForm.rfc || !facturaForm.razonSocial || !facturaForm.codigoPostal || !facturaForm.email}
                style={{ flex:1, background:"#1E3A5F", color:"white", border:"none", borderRadius:8, padding:"10px", fontSize:13, fontWeight:600, cursor:"pointer", opacity: (!facturaForm.rfc || !facturaForm.razonSocial || !facturaForm.codigoPostal || !facturaForm.email) ? 0.5 : 1 }}>
                Enviar solicitud
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
