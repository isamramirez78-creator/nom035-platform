import { useLocation } from "wouter";

export default function PagoFallido() {
  const [, setLocation] = useLocation();
  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#FFF5F5,#FEE2E2)", fontFamily:"Inter,sans-serif" }}>
      <div style={{ background:"white", borderRadius:20, padding:"2.5rem", maxWidth:500, width:"100%", textAlign:"center", boxShadow:"0 8px 32px rgba(0,0,0,0.08)" }}>
        <div style={{ width:80, height:80, background:"#FEE2E2", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1.5rem" }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </div>
        <h1 style={{ color:"#1E3A5F", fontSize:26, fontWeight:700, marginBottom:8 }}>Pago no completado</h1>
        <p style={{ color:"#64748B", fontSize:15, lineHeight:1.6, marginBottom:24 }}>
          Hubo un problema al procesar tu pago. No se realizó ningún cargo. Puedes intentarlo de nuevo.
        </p>
        <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
          <button onClick={() => setLocation("/plans")}
            style={{ background:"#1E3A5F", color:"white", border:"none", borderRadius:10, padding:"12px 24px", fontSize:14, fontWeight:600, cursor:"pointer" }}>
            Intentar de nuevo
          </button>
          <button onClick={() => setLocation("/")}
            style={{ background:"white", color:"#1E3A5F", border:"1px solid #E2E8F0", borderRadius:10, padding:"12px 24px", fontSize:14, cursor:"pointer" }}>
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
