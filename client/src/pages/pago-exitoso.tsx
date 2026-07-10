import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function PagoExitoso() {
  const [, setLocation] = useLocation();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(timer); setLocation("/login"); }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#F0FDF4,#ECFCCB)", fontFamily:"Inter,sans-serif" }}>
      <div style={{ background:"white", borderRadius:20, padding:"2.5rem", maxWidth:500, width:"100%", textAlign:"center", boxShadow:"0 8px 32px rgba(0,0,0,0.08)" }}>
        <div style={{ width:80, height:80, background:"#ECFCCB", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1.5rem" }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h1 style={{ color:"#1E3A5F", fontSize:26, fontWeight:700, marginBottom:8 }}>¡Pago exitoso!</h1>
        <p style={{ color:"#64748B", fontSize:15, lineHeight:1.6, marginBottom:20 }}>
          Tu suscripción a la plataforma NOM-035 ha sido activada correctamente.
          Revisa tu correo electrónico para confirmar los detalles de tu cuenta.
        </p>
        <div style={{ background:"#F8FAFC", borderRadius:12, padding:"1rem", marginBottom:20, border:"0.5px solid #E2E8F0" }}>
          <p style={{ color:"#64748B", fontSize:13, margin:0 }}>
            Redirigiendo al inicio de sesión en <strong style={{ color:"#1E3A5F" }}>{countdown}</strong> segundos...
          </p>
        </div>
        <button onClick={() => setLocation("/login")}
          style={{ background:"#1E3A5F", color:"white", border:"none", borderRadius:10, padding:"12px 32px", fontSize:15, fontWeight:600, cursor:"pointer" }}>
          Iniciar sesión ahora
        </button>
      </div>
    </div>
  );
}
