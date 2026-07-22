import { useState } from "react";
import { useLocation } from "wouter";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"form" | "success">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [form, setForm] = useState({ correoElectronico: "", rfc: "", telefono: "" });

  const handleSubmit = async () => {
    setError("");
    if (!form.correoElectronico || !form.rfc || !form.telefono) {
      setError("Todos los campos son obligatorios");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/companies/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || "Error al verificar datos");
      setTempPassword(data.tempPassword);
      setStep("success");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #E2E8F0",
    fontSize: 14, outline: "none", boxSizing: "border-box" as const,
  };

  const labelStyle = { display: "block", fontSize: 13, fontWeight: 600, color: "#1E3A5F", marginBottom: 6 };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter,sans-serif" }}>
      <div style={{ background: "white", borderRadius: 20, padding: "2.5rem", width: "100%", maxWidth: 440, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "0.5px solid #E2E8F0" }}>
        
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, background: "#EFF6FF", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1E40AF" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1E3A5F", margin: "0 0 8px" }}>Recuperar contraseña</h1>
          <p style={{ color: "#64748B", fontSize: 14, margin: 0 }}>
            Verifica tu identidad con los datos registrados en tu cuenta
          </p>
        </div>

        {step === "form" ? (
          <div>
            <div style={{ background: "#FEF3C7", borderRadius: 10, padding: "10px 14px", marginBottom: 24, border: "1px solid #FDE68A" }}>
              <p style={{ color: "#92400E", fontSize: 12, margin: 0 }}>
                ⚠️ Debes ingresar exactamente los mismos datos que registraste al crear tu cuenta.
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Correo electrónico</label>
              <input style={inputStyle} type="email" placeholder="correo@empresa.com"
                value={form.correoElectronico} onChange={e => setForm({...form, correoElectronico: e.target.value})} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>RFC de la empresa</label>
              <input style={inputStyle} type="text" placeholder="ABC123456789"
                value={form.rfc} onChange={e => setForm({...form, rfc: e.target.value.toUpperCase()})}
                maxLength={13} />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Teléfono registrado</label>
              <input style={inputStyle} type="tel" placeholder="555-123-4567"
                value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} />
            </div>

            {error && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
                <p style={{ color: "#DC2626", fontSize: 13, margin: 0 }}>❌ {error}</p>
              </div>
            )}

            <button onClick={handleSubmit} disabled={loading}
              style={{ width: "100%", background: "#1E3A5F", color: "white", border: "none", borderRadius: 10, padding: "12px", fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Verificando..." : "Verificar identidad"}
            </button>

            <div style={{ textAlign: "center", marginTop: 20 }}>
              <button onClick={() => setLocation("/company-login")}
                style={{ background: "none", border: "none", color: "#64748B", fontSize: 13, cursor: "pointer" }}>
                ← Volver al inicio de sesión
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 56, height: 56, background: "#ECFCCB", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1E3A5F", marginBottom: 8 }}>¡Identidad verificada!</h2>
            <p style={{ color: "#64748B", fontSize: 14, marginBottom: 20 }}>Tu contraseña temporal es:</p>
            <div style={{ background: "#F8FAFC", border: "2px dashed #84CC16", borderRadius: 12, padding: "16px 24px", marginBottom: 20 }}>
              <p style={{ fontSize: 28, fontWeight: 700, color: "#1E3A5F", margin: 0, letterSpacing: 4, fontFamily: "monospace" }}>{tempPassword}</p>
            </div>
            <div style={{ background: "#FEF3C7", borderRadius: 10, padding: "10px 14px", marginBottom: 24, textAlign: "left" }}>
              <p style={{ color: "#92400E", fontSize: 12, margin: 0 }}>
                ⚠️ Guarda esta contraseña. Por seguridad, te recomendamos cambiarla desde tu perfil al iniciar sesión.
              </p>
            </div>
            <button onClick={() => setLocation("/company-login")}
              style={{ width: "100%", background: "#84CC16", color: "#1E3A5F", border: "none", borderRadius: 10, padding: "12px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
              Ir al inicio de sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
