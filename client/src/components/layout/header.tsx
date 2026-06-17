import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

export default function Header() {
  const { data: company } = useQuery<{ razonSocial?: string; nombreEmpresa?: string }>({
    queryKey: ["/api/company-info"],
  });
  const [, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("company_token");
    queryClient.clear();
    setLocation("/login");
    setMenuOpen(false);
  };

  const companyName = company?.razonSocial || company?.nombreEmpresa || "Empresa";

  return (
    <header className="app-header">
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "60px" }}>

          {/* Logo */}
          <div
            style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
            onClick={() => setLocation("/dashboard")}
          >
            <div style={{
              width: "36px", height: "36px", background: "#84CC16",
              borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
            </div>
            <div>
              <div style={{ color: "#fff", fontSize: "14px", fontWeight: 600, lineHeight: 1.2 }}>NOM-035 STPS</div>
              <div style={{ color: "#94A3B8", fontSize: "11px" }}>Plataforma de Evaluación Psicosocial</div>
            </div>
          </div>

          {/* Right side */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>

            {/* Company chip */}
            <div style={{
              background: "rgba(255,255,255,0.1)", borderRadius: "6px",
              padding: "5px 10px", color: "#CBD5E1", fontSize: "12px",
              display: "flex", alignItems: "center", gap: "6px"
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M9 9h6M9 12h6M9 15h4"/>
              </svg>
              <span style={{ maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {companyName}
              </span>
            </div>

            {/* User menu */}
            <div ref={menuRef} style={{ position: "relative" }}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                style={{
                  background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "6px",
                  padding: "5px 10px", display: "flex", alignItems: "center", gap: "7px",
                  cursor: "pointer", transition: "background 0.15s"
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
              >
                <div style={{
                  width: "26px", height: "26px", borderRadius: "50%",
                  background: "#84CC16", color: "#1E3A5F",
                  fontSize: "11px", fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {companyName.charAt(0).toUpperCase()}
                </div>
                <span style={{ color: "#CBD5E1", fontSize: "12px" }}>Admin</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                  <polyline points={menuOpen ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}/>
                </svg>
              </button>

              {/* Dropdown menu */}
              {menuOpen && (
                <div style={{
                  position: "absolute", right: 0, top: "calc(100% + 6px)",
                  background: "white", borderRadius: "10px", minWidth: "180px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.15)", border: "0.5px solid #E2E8F0",
                  overflow: "hidden", zIndex: 1000,
                }}>
                  <div style={{ padding: "10px 14px", borderBottom: "0.5px solid #E2E8F0" }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#1E3A5F" }}>{companyName}</div>
                    <div style={{ fontSize: "11px", color: "#64748B" }}>Administrador</div>
                  </div>
                  <button
                    onClick={() => { setLocation("/company-profile"); setMenuOpen(false); }}
                    style={{
                      width: "100%", padding: "9px 14px", background: "none", border: "none",
                      textAlign: "left", fontSize: "13px", color: "#1E3A5F", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: "8px"
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#F8FAFC")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    Mi perfil
                  </button>
                  <button
                    onClick={() => { setLocation("/subscription-plans"); setMenuOpen(false); }}
                    style={{
                      width: "100%", padding: "9px 14px", background: "none", border: "none",
                      textAlign: "left", fontSize: "13px", color: "#1E3A5F", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: "8px"
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#F8FAFC")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                      <line x1="1" y1="10" x2="23" y2="10"/>
                    </svg>
                    Mi suscripción
                  </button>
                  <div style={{ borderTop: "0.5px solid #E2E8F0", margin: "4px 0" }}></div>
                  <button
                    onClick={handleLogout}
                    style={{
                      width: "100%", padding: "9px 14px", background: "none", border: "none",
                      textAlign: "left", fontSize: "13px", color: "#DC2626", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: "8px"
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#FEF2F2")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
