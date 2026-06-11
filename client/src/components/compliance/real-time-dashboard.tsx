// Dashboard en tiempo real para monitoreo continuo del cumplimiento NOM-035
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface RealTimeMetric {
  id: string;
  label: string;
  value: number;
  target: number;
  status: 'ok' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  lastUpdate: Date;
}

export default function RealTimeDashboard() {
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: employees = [], refetch: refetchEmployees } = useQuery({ 
    queryKey: ['/api/employees'],
    refetchInterval: autoRefresh ? 30000 : false // Refresh every 30 seconds
  });
  
  const { data: evaluations = [], refetch: refetchEvaluations } = useQuery({ 
    queryKey: ['/api/evaluations'],
    refetchInterval: autoRefresh ? 30000 : false
  });
  
  const { data: notifications = [], refetch: refetchNotifications } = useQuery({ 
    queryKey: ['/api/email-notifications'],
    refetchInterval: autoRefresh ? 30000 : false
  });

  // Calcular métricas en tiempo real
  const totalEmployees = employees.length;
  const evaluatedEmployees = evaluations.length;
  const traumaticEvaluations = evaluations.filter((evaluation: any) => evaluation.questionnaireType === "traumatic_events").length;
  const highRiskEmployees = evaluations.filter((evaluation: any) => ['alto', 'muy-alto'].includes(evaluation.riskLevel)).length;
  const exposedEmployees = evaluations.filter((evaluation: any) => evaluation.hasTraumaticExposure).length;
  const pendingNotifications = notifications.filter((notif: any) => notif.status === 'pending').length;
  const recentEvaluations = evaluations.filter((evaluation: any) => 
    new Date(evaluation.completedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  ).length;

  const metrics: RealTimeMetric[] = [
    {
      id: 'coverage',
      label: 'Cobertura de Evaluación',
      value: totalEmployees > 0 ? Math.round((evaluatedEmployees / totalEmployees) * 100) : 0,
      target: 100,
      status: evaluatedEmployees >= totalEmployees * 0.8 ? 'ok' : 
              evaluatedEmployees >= totalEmployees * 0.5 ? 'warning' : 'critical',
      trend: 'up',
      lastUpdate: new Date()
    },
    {
      id: 'traumatic_coverage',
      label: 'Evaluaciones Traumáticas',
      value: totalEmployees > 0 ? Math.round((traumaticEvaluations / totalEmployees) * 100) : 0,
      target: 100,
      status: traumaticEvaluations >= totalEmployees * 0.9 ? 'ok' : 
              traumaticEvaluations >= totalEmployees * 0.5 ? 'warning' : 'critical',
      trend: 'up',
      lastUpdate: new Date()
    },
    {
      id: 'high_risk',
      label: 'Empleados Alto Riesgo',
      value: highRiskEmployees,
      target: 0,
      status: highRiskEmployees === 0 ? 'ok' : 
              highRiskEmployees <= 2 ? 'warning' : 'critical',
      trend: 'down',
      lastUpdate: new Date()
    },
    {
      id: 'traumatic_exposure',
      label: 'Exposición Traumática',
      value: exposedEmployees,
      target: 0,
      status: exposedEmployees === 0 ? 'ok' : 'critical',
      trend: 'stable',
      lastUpdate: new Date()
    },
    {
      id: 'pending_actions',
      label: 'Notificaciones Pendientes',
      value: pendingNotifications,
      target: 0,
      status: pendingNotifications === 0 ? 'ok' : 
              pendingNotifications <= 3 ? 'warning' : 'critical',
      trend: 'down',
      lastUpdate: new Date()
    },
    {
      id: 'daily_progress',
      label: 'Evaluaciones Hoy',
      value: recentEvaluations,
      target: 5,
      status: recentEvaluations >= 5 ? 'ok' : 
              recentEvaluations >= 2 ? 'warning' : 'critical',
      trend: 'up',
      lastUpdate: new Date()
    }
  ];

  const manualRefresh = async () => {
    await Promise.all([
      refetchEmployees(),
      refetchEvaluations(),
      refetchNotifications()
    ]);
    setLastRefresh(new Date());
  };

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        setLastRefresh(new Date());
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      case 'stable': return '→';
      default: return '—';
    }
  };

  const criticalMetrics = metrics.filter(m => m.status === 'critical');
  const warningMetrics = metrics.filter(m => m.status === 'warning');

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Dashboard en Tiempo Real</h3>
          <p className="text-sm text-slate-600">
            Última actualización: {lastRefresh.toLocaleTimeString('es-MX')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoRefresh"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="autoRefresh" className="text-sm text-slate-600">
              Actualización automática
            </label>
          </div>
          <Button size="sm" variant="outline" onClick={manualRefresh}>
            <i className="fas fa-sync-alt mr-2"></i>
            Actualizar
          </Button>
        </div>
      </div>

      {/* Alertas críticas */}
      {criticalMetrics.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTitle className="text-red-800">Estado Crítico Detectado</AlertTitle>
          <AlertDescription className="text-red-700">
            {criticalMetrics.length} métrica(s) en estado crítico requieren atención inmediata:
            <ul className="mt-2 list-disc list-inside">
              {criticalMetrics.map(metric => (
                <li key={metric.id}>{metric.label}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Métricas en tiempo real */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.id} className={`border ${getStatusColor(metric.status).split(' ')[2]}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getTrendIcon(metric.trend)}</span>
                  <Badge className={getStatusColor(metric.status)}>
                    {metric.status === 'ok' ? 'OK' : 
                     metric.status === 'warning' ? 'Atención' : 'Crítico'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-end gap-2">
                  <div className="text-2xl font-bold text-slate-900">
                    {metric.id === 'coverage' || metric.id === 'traumatic_coverage' 
                      ? `${metric.value}%` 
                      : metric.value
                    }
                  </div>
                  {metric.target > 0 && (
                    <div className="text-sm text-slate-600">
                      / {metric.id === 'coverage' || metric.id === 'traumatic_coverage' 
                          ? `${metric.target}%` 
                          : metric.target
                      }
                    </div>
                  )}
                </div>

                {(metric.id === 'coverage' || metric.id === 'traumatic_coverage') && (
                  <Progress 
                    value={metric.value} 
                    className={`h-2 ${
                      metric.status === 'ok' ? 'text-green-600' :
                      metric.status === 'warning' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}
                  />
                )}

                <div className="text-xs text-slate-500">
                  Actualizado: {metric.lastUpdate.toLocaleTimeString('es-MX')}
                </div>

                {/* Información contextual específica */}
                {metric.id === 'high_risk' && metric.value > 0 && (
                  <div className="text-xs text-orange-600">
                    Requiere plan de intervención
                  </div>
                )}
                
                {metric.id === 'traumatic_exposure' && metric.value > 0 && (
                  <div className="text-xs text-red-600">
                    Canalización médica urgente
                  </div>
                )}

                {metric.id === 'pending_actions' && metric.value > 0 && (
                  <div className="text-xs text-yellow-600">
                    Revisar notificaciones pendientes
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resumen de actividad reciente */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente (Últimas 24 horas)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-xl font-bold text-slate-900">{recentEvaluations}</div>
              <div className="text-sm text-slate-600">Evaluaciones Completadas</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-xl font-bold text-slate-900">
                {notifications.filter((n: any) => 
                  new Date(n.scheduledFor) > new Date(Date.now() - 24 * 60 * 60 * 1000)
                ).length}
              </div>
              <div className="text-sm text-slate-600">Notificaciones Enviadas</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-xl font-bold text-slate-900">
                {evaluations.filter((evaluation: any) => 
                  evaluation.riskLevel === 'alto' || evaluation.riskLevel === 'muy-alto'
                ).length}
              </div>
              <div className="text-sm text-slate-600">Casos de Alto Riesgo</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-xl font-bold text-slate-900">
                {Math.round(
                  totalEmployees > 0 ? (evaluatedEmployees / totalEmployees) * 100 : 0
                )}%
              </div>
              <div className="text-sm text-slate-600">Cobertura Total</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Indicadores de estado del sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Estado del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <div className="font-medium text-green-900">Base de Datos</div>
                <div className="text-sm text-green-700">Funcionando correctamente</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <div className="font-medium text-green-900">Evaluaciones</div>
                <div className="text-sm text-green-700">Sistema operativo</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
              <div>
                <div className="font-medium text-yellow-900">Notificaciones</div>
                <div className="text-sm text-yellow-700">
                  {pendingNotifications > 0 ? `${pendingNotifications} pendientes` : 'Al día'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}