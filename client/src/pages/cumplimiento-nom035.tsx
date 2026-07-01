import { useState } from "react";
import CalendarioNOM035 from "./calendario-nom035";
import CanalDenuncias from "./canal-denuncias";
import CentrosTrabajo from "./centros-trabajo";

const TABS = [
  { id: "calendario",  label: "Calendario",        icon: "fas fa-calendar-check",  desc: "Vencimientos NOM-035" },
  { id: "denuncias",   label: "Canal de Denuncias", icon: "fas fa-shield-alt",      desc: "Numeral 8.2" },
  { id: "centros",     label: "Centros de Trabajo", icon: "fas fa-building",        desc: "Multi-sucursal" },
];

export default function CumplimientoNOM035() {
  const [tab, setTab] = useState("calendario");

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center gap-3">
        <div style={{ width: 3, height: "2.5rem", background: "#84CC16", borderRadius: 2 }} />
        <div>
          <h1 className="page-title">Panel de Cumplimiento NOM-035</h1>
          <p className="page-subtitle">Control normativo completo — Numerales 5.1 al 8.4</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-2">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="p-3 rounded-xl text-left transition-all"
            style={{
              background: tab === t.id ? "#1E3A5F" : "white",
              border: `1px solid ${tab === t.id ? "#1E3A5F" : "#E2E8F0"}`,
              boxShadow: tab === t.id ? "0 4px 12px rgba(30,58,138,0.2)" : "0 1px 3px rgba(0,0,0,0.05)",
            }}>
            <i className={`${t.icon} text-sm mb-1`}
              style={{ color: tab === t.id ? "#84CC16" : "#64748B", display: "block" }}></i>
            <p className="font-semibold text-sm" style={{ color: tab === t.id ? "white" : "#1E3A5F" }}>
              {t.label}
            </p>
            <p className="text-xs mt-0.5" style={{ color: tab === t.id ? "#94A3B8" : "#64748B" }}>
              {t.desc}
            </p>
          </button>
        ))}
      </div>

      {/* Contenido */}
      {tab === "calendario" && <CalendarioNOM035 />}
      {tab === "denuncias"  && <CanalDenuncias />}
      {tab === "centros"    && <CentrosTrabajo />}
    </div>
  );
}
