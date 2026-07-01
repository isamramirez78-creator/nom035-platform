import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const token = () => localStorage.getItem("company_token");
const h = () => ({ "Content-Type": "application/json", ...(token() ? { Authorization: `Bearer ${token()}` } : {}) });

const TIPO_LABELS: Record<string, string> = {
  evaluacion_bianual: "Evaluación NOM-035 (cada 2 años)",
  renovacion_politica: "Renovación de Política de Prevención",
  capacitacion: "Capacitación a trabajadores",
  difusion: "Difusión de política",
  revision_programa: "Revisión del Programa de Intervención",
  examen_medico: "Exámenes médicos a trabajadores en riesgo",
};

export default function CalendarioNOM035() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: eventos = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/calendario-nom035"],
    queryFn: async () => {
      const res = await fetch("/api/calendario-nom035", { headers: h() });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const inicializarMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/calendario-nom035/inicializar", { method: "POST", headers: h() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendario-nom035"] });
      toast({ title: "Calendario inicializado correctamente" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const marcarAlDiaMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/calendario-nom035/${id}/al-dia`, { method: "PATCH", headers: h() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendario-nom035"] });
      toast({ title: "Actividad marcada como al día" });
    },
  });

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const getDiasRestantes = (fecha: string) => {
    const diff = new Date(fecha).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getEstadoConfig = (evento: any) => {
    const dias = getDiasRestantes(evento.fecha_vencimiento);
    if (evento.estado === "al_dia") return { color: "#22C55E", bg: "#DCFCE7", label: "Al día", icon: "✓" };
    if (dias < 0) return { color: "#EF4444", bg: "#FEE2E2", label: "VENCIDO", icon: "⚠" };
    if (dias <= 30) return { color: "#F97316", bg: "#FFEDD5", label: `${dias} días`, icon: "⏰" };
    if (dias <= 90) return { color: "#EAB308", bg: "#FEF9C3", label: `${dias} días`, icon: "📅" };
    return { color: "#64748B", bg: "#F1F5F9", label: `${dias} días`, icon: "📋" };
  };

  const vencidos = eventos.filter(e => e.estado !== "al_dia" && getDiasRestantes(e.fecha_vencimiento) < 0).length;
  const proximos = eventos.filter(e => e.estado !== "al_dia" && getDiasRestantes(e.fecha_vencimiento) >= 0 && getDiasRestantes(e.fecha_vencimiento) <= 90).length;

  return (
    <div className="space-y-5">
      {/* Alertas */}
      {(vencidos > 0 || proximos > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vencidos > 0 && (
            <div className="p-4 rounded-xl flex items-center gap-3" style={{ background: "#FEE2E2", border: "1px solid #FECACA" }}>
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-semibold text-sm" style={{ color: "#DC2626" }}>{vencidos} actividad{vencidos > 1 ? "es" : ""} VENCIDA{vencidos > 1 ? "S" : ""}</p>
                <p className="text-xs" style={{ color: "#EF4444" }}>Riesgo de incumplimiento ante inspección STPS</p>
              </div>
            </div>
          )}
          {proximos > 0 && (
            <div className="p-4 rounded-xl flex items-center gap-3" style={{ background: "#FFEDD5", border: "1px solid #FED7AA" }}>
              <span className="text-2xl">⏰</span>
              <div>
                <p className="font-semibold text-sm" style={{ color: "#EA580C" }}>{proximos} actividad{proximos > 1 ? "es" : ""} próxima{proximos > 1 ? "s" : ""} a vencer</p>
                <p className="text-xs" style={{ color: "#F97316" }}>En los próximos 90 días</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lista de eventos */}
      <div className="section-card">
        <div className="section-header justify-between">
          <div className="flex items-center gap-2"><div className="lime-dot" /><h3>Calendario de Cumplimiento</h3></div>
          {eventos.length === 0 && (
            <Button onClick={() => inicializarMutation.mutate()} disabled={inicializarMutation.isPending}
              className="text-xs h-7 px-3" style={{ background: "#84CC16", color: "#1E3A5F" }}>
              {inicializarMutation.isPending ? "Inicializando..." : "Inicializar calendario"}
            </Button>
          )}
        </div>

        {isLoading ? <div className="p-5 text-slate-500 text-sm">Cargando...</div>
          : eventos.length === 0
            ? <div className="empty-state" style={{ minHeight: 160 }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <p className="font-medium text-sm">Sin calendario configurado</p>
                <p className="text-xs text-slate-400">Haz clic en "Inicializar calendario" para crear el plan de cumplimiento</p>
              </div>
            : eventos.sort((a: any, b: any) => new Date(a.fecha_vencimiento).getTime() - new Date(b.fecha_vencimiento).getTime())
                .map((ev: any) => {
                  const cfg = getEstadoConfig(ev);
                  return (
                    <div key={ev.id} className="p-4 border-b flex items-center justify-between gap-3" style={{ borderBottomColor: "#F1F5F9" }}>
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                          style={{ background: cfg.bg }}>
                          {cfg.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate" style={{ color: "#1E3A5F" }}>
                            {TIPO_LABELS[ev.tipo] || ev.tipo}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">{ev.descripcion}</p>
                          {ev.fecha_ultima && (
                            <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
                              Última realización: {fmtDate(ev.fecha_ultima)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <span className="text-xs font-semibold px-2 py-1 rounded-full"
                            style={{ background: cfg.bg, color: cfg.color }}>
                            {cfg.label}
                          </span>
                          <p className="text-xs text-slate-400 mt-1">Vence: {fmtDate(ev.fecha_vencimiento)}</p>
                        </div>
                        {ev.estado !== "al_dia" && (
                          <Button
                            onClick={() => marcarAlDiaMutation.mutate(ev.id)}
                            disabled={marcarAlDiaMutation.isPending}
                            size="sm"
                            className="text-xs h-7 px-2"
                            style={{ background: "#1E3A5F", color: "white" }}
                          >
                            Marcar al día
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
        }
      </div>

      {/* Leyenda */}
      <div className="flex gap-4 flex-wrap text-xs text-slate-500">
        {[
          { color: "#22C55E", label: "Al día" },
          { color: "#64748B", label: "Sin urgencia (>90 días)" },
          { color: "#EAB308", label: "Próximo (31-90 días)" },
          { color: "#F97316", label: "Urgente (<30 días)" },
          { color: "#EF4444", label: "Vencido" },
        ].map(i => (
          <div key={i.label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: i.color }}></div>
            {i.label}
          </div>
        ))}
      </div>
    </div>
  );
}
