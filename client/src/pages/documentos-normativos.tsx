import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const token = () => localStorage.getItem("company_token");
const authHeaders = () => ({
  ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
});

// ─── Documentos obligatorios NOM-035 ─────────────────────────────────────────
const DOCS_NORMATIVOS = [
  {
    id: "politica_prevencion",
    titulo: "Política de Prevención de Factores de Riesgo Psicosocial",
    numeral: "Numeral 8.1",
    descripcion: "Documento que establece el compromiso de la empresa para identificar, analizar, prevenir y controlar los factores de riesgo psicosocial.",
    obligatorio: true,
    plantilla: "politica-prevencion",
    color: "#1E3A5F",
  },
  {
    id: "programa_intervencion",
    titulo: "Programa de Intervención",
    numeral: "Numeral 8.2",
    descripcion: "Plan de acción con medidas y acciones para prevenir y controlar los factores de riesgo psicosocial detectados en la evaluación.",
    obligatorio: true,
    plantilla: "programa-intervencion",
    color: "#7C3AED",
  },
  {
    id: "acta_difusion",
    titulo: "Acta de Difusión de la Política",
    numeral: "Numeral 8.1.3",
    descripcion: "Evidencia de que la política fue comunicada a todos los trabajadores. Incluye firmas de los participantes.",
    obligatorio: true,
    plantilla: "acta-difusion",
    color: "#0891B2",
  },
  {
    id: "constancia_capacitacion",
    titulo: "Constancia de Capacitación",
    numeral: "Numeral 8.4",
    descripcion: "Evidencia de que los trabajadores y mandos recibieron capacitación sobre la NOM-035 y los factores de riesgo psicosocial.",
    obligatorio: true,
    plantilla: "constancia-capacitacion",
    color: "#059669",
  },
  {
    id: "acta_comision",
    titulo: "Acta de Integración de Comisión",
    numeral: "Numeral 8.3",
    descripcion: "Documento que acredita la integración de la comisión de seguridad e higiene o de bienestar organizacional.",
    obligatorio: false,
    plantilla: "acta-comision",
    color: "#D97706",
  },
  {
    id: "resultado_evaluacion",
    titulo: "Resultado de Evaluación (Guía III)",
    numeral: "Numeral 7.3",
    descripcion: "Reporte oficial de los resultados de la aplicación de los cuestionarios NOM-035. Generado automáticamente por la plataforma.",
    obligatorio: true,
    plantilla: null, // se genera desde la plataforma
    color: "#DC2626",
  },
  {
    id: "medidas_control",
    titulo: "Medidas de Control",
    numeral: "Numeral 8.2.2",
    descripcion: "Registro de las acciones implementadas para controlar los factores de riesgo identificados en trabajadores con nivel alto o muy alto.",
    obligatorio: false,
    plantilla: "medidas-control",
    color: "#0EA5E9",
  },
];

interface DocNormativo {
  id: number;
  tipo: string;
  nombre: string;
  url: string;
  fechaSubida: string;
  subidoPor: string;
  version: number;
}

export default function DocumentosNormativos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState<string | null>(null);

  // ── Obtener documentos subidos ───────────────────────────────────────────────
  const { data: documentos = [] } = useQuery<DocNormativo[]>({
    queryKey: ["/api/documentos-normativos"],
    queryFn: async () => {
      const res = await fetch("/api/documentos-normativos", { headers: authHeaders() });
      if (!res.ok) return [];
      return res.json();
    },
  });

  // ── Subir documento ──────────────────────────────────────────────────────────
  const subirMutation = useMutation({
    mutationFn: async ({ file, tipo }: { file: File; tipo: string }) => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("tipo", tipo);
      const res = await fetch("/api/documentos-normativos", {
        method: "POST",
        headers: authHeaders(),
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Error al subir");
      return json;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/documentos-normativos"] });
      setUploading(null);
      toast({ title: "Documento subido correctamente" });
    },
    onError: (e: Error) => {
      setUploading(null);
      toast({ title: "Error al subir", description: e.message, variant: "destructive" });
    },
  });

  // ── Descargar plantilla ──────────────────────────────────────────────────────
  const descargarPlantilla = async (plantillaId: string) => {
    try {
      const res = await fetch(`/api/plantillas-nom035/${plantillaId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("No disponible");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${plantillaId}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({
        title: "Plantilla no disponible aún",
        description: "Próximamente disponible. Por ahora puedes subir tu propio documento.",
        variant: "destructive",
      });
    }
  };

  // ── Helper: doc subido para un tipo ─────────────────────────────────────────
  const docSubido = (tipo: string) => documentos.find((d: any) => d.tipo === tipo);
  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="space-y-5">
      {/* Banner informativo */}
      <div className="p-4 rounded-xl" style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
        <div className="flex items-start gap-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E40AF" strokeWidth="2" className="flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#1E40AF" }}>Documentos obligatorios NOM-035-STPS-2018</p>
            <p className="text-xs mt-0.5" style={{ color: "#3B82F6" }}>
              La norma exige que estos documentos estén vigentes, actualizados y disponibles para inspección. 
              Sube la versión firmada de cada documento y descarga las plantillas base para elaborarlos.
            </p>
          </div>
        </div>
      </div>

      {/* Grid de documentos */}
      <div className="grid grid-cols-1 gap-4">
        {DOCS_NORMATIVOS.map((doc) => {
          const subido = docSubido(doc.id);
          return (
            <div key={doc.id} className="section-card">
              <div className="p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">

                  {/* Info del documento */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${doc.color}15` }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={doc.color} strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm" style={{ color: "#1E3A5F" }}>{doc.titulo}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: `${doc.color}15`, color: doc.color }}>
                          {doc.numeral}
                        </span>
                        {doc.obligatorio
                          ? <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ background: "#FEE2E2", color: "#DC2626" }}>Obligatorio</span>
                          : <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ background: "#F1F5F9", color: "#64748B" }}>Recomendado</span>
                        }
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{doc.descripcion}</p>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {doc.plantilla && (
                      <button
                        onClick={() => descargarPlantilla(doc.plantilla!)}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors"
                        style={{ background: "#F1F5F9", color: "#475569" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#E2E8F0")}
                        onMouseLeave={e => (e.currentTarget.style.background = "#F1F5F9")}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Plantilla
                      </button>
                    )}

                    <label className="cursor-pointer">
                      <span
                        className="text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors"
                        style={{
                          background: subido ? "#DCFCE7" : doc.color,
                          color: subido ? "#15803D" : "white",
                        }}
                      >
                        {uploading === doc.id
                          ? "Subiendo..."
                          : subido
                          ? <>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                              Actualizar
                            </>
                          : <>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                              </svg>
                              Subir documento
                            </>
                        }
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        disabled={uploading === doc.id}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploading(doc.id);
                          subirMutation.mutate({ file, tipo: doc.id });
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* Documento subido */}
                {subido && (
                  <div className="mt-3 p-3 rounded-lg flex items-center justify-between"
                    style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                    <div className="flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                      <span className="text-xs font-medium" style={{ color: "#15803D" }}>{subido.nombre}</span>
                      <span className="text-xs text-slate-500">· {fmtDate(subido.fechaSubida || (subido as any).created_at)}</span>
                    </div>
                    <a
                      href={subido.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs px-2 py-1 rounded-md font-medium"
                      style={{ background: "#DCFCE7", color: "#15803D" }}
                    >
                      Ver
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
