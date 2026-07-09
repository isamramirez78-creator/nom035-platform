import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminLogin() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Credenciales incorrectas");
      localStorage.setItem("admin_token", data.token);
      window.location.replace("/admin/dashboard");
    } catch (e: Error | any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0F172A", fontFamily: "Inter,sans-serif" }}>
      <div style={{ background: "#1E293B", borderRadius: 20, padding: "2.5rem", width: "100%", maxWidth: 420, boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, background: "#84CC16", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h1 style={{ color: "white", fontSize: 22, fontWeight: 700, margin: 0 }}>Panel Administrativo</h1>
          <p style={{ color: "#64748B", fontSize: 13, margin: "6px 0 0" }}>NOM-035 Platform — Acceso restringido</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ color: "#94A3B8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>CORREO ELECTRÓNICO</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@tudominio.com"
              style={{ background: "#0F172A", border: "1px solid #334155", color: "white" }}
              onKeyDown={e => e.key === "Enter" && handleLogin()} />
          </div>
          <div>
            <label style={{ color: "#94A3B8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>CONTRASEÑA</label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ background: "#0F172A", border: "1px solid #334155", color: "white" }}
              onKeyDown={e => e.key === "Enter" && handleLogin()} />
          </div>
          <Button onClick={handleLogin} disabled={loading || !email || !password}
            style={{ background: "#84CC16", color: "#1E3A5F", fontWeight: 700, height: 44, marginTop: 8 }}>
            {loading ? "Verificando..." : "Acceder al panel"}
          </Button>
        </div>
      </div>
    </div>
  );
}
