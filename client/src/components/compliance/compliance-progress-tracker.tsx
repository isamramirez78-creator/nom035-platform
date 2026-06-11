// Componente para rastrear progreso de cumplimiento por área y departamento
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface AreaProgress {
  area: string;
  totalEmployees: number;
  evaluatedEmployees: number;
  traumaticEvaluations: number;
  highRiskCount: number;
  avgRiskScore: number;
  completionRate: number;
}

export default function ComplianceProgressTracker() {
  const { data: employees = [] } = useQuery({ queryKey: ['/api/employees'] });
  const { data: evaluations = [] } = useQuery({ queryKey: ['/api/evaluations'] });

  // Agrupar por área
  const getAreaProgress = (): AreaProgress[] => {
    const areas = [...new Set(employees.map((emp: any) => emp.area))];
    
    return areas.map(area => {
      const areaEmployees = employees.filter((emp: any) => emp.area === area);
      const areaEvaluations = evaluations.filter((evaluation: any) => 
        areaEmployees.some((emp: any) => emp.id === evaluation.employeeId)
      );
      const traumaticEvals = areaEvaluations.filter((evaluation: any) => 
        evaluation.questionnaireType === "traumatic_events"
      );
      const highRisk = areaEvaluations.filter((evaluation: any) => 
        ['alto', 'muy-alto'].includes(evaluation.riskLevel)
      );

      const avgRisk = areaEvaluations.length > 0 
        ? areaEvaluations.reduce((sum: number, evaluation: any) => sum + (evaluation.finalScore || 0), 0) / areaEvaluations.length
        : 0;

      return {
        area,
        totalEmployees: areaEmployees.length,
        evaluatedEmployees: areaEvaluations.length,
        traumaticEvaluations: traumaticEvals.length,
        highRiskCount: highRisk.length,
        avgRiskScore: Math.round(avgRisk),
        completionRate: areaEmployees.length > 0 
          ? Math.round((areaEvaluations.length / areaEmployees.length) * 100)
          : 0
      };
    }).sort((a, b) => b.completionRate - a.completionRate);
  };

  const areaProgress = getAreaProgress();

  const getCompletionColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskBadgeColor = (count: number) => {
    if (count === 0) return 'bg-green-100 text-green-800';
    if (count <= 2) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-slate-900">{areaProgress.length}</div>
            <div className="text-sm text-slate-600">Áreas/Departamentos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {areaProgress.filter(area => area.completionRate >= 90).length}
            </div>
            <div className="text-sm text-slate-600">Cumplimiento Completo</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {areaProgress.reduce((sum, area) => sum + area.highRiskCount, 0)}
            </div>
            <div className="text-sm text-slate-600">Casos Alto Riesgo Total</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progreso por Área/Departamento</CardTitle>
          <p className="text-sm text-slate-600">
            Estado de cumplimiento NOM-035 segmentado por área organizacional
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {areaProgress.map((area) => (
              <div key={area.area} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-slate-900 capitalize">{area.area}</h4>
                    <p className="text-sm text-slate-600">
                      {area.totalEmployees} empleados • {area.evaluatedEmployees} evaluados
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getRiskBadgeColor(area.highRiskCount)}>
                      {area.highRiskCount} Alto Riesgo
                    </Badge>
                    <div className={`text-2xl font-bold ${getCompletionColor(area.completionRate)}`}>
                      {area.completionRate}%
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Evaluaciones Generales</span>
                      <span>{area.evaluatedEmployees}/{area.totalEmployees}</span>
                    </div>
                    <Progress value={area.completionRate} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Eventos Traumáticos</span>
                      <span>{area.traumaticEvaluations}/{area.totalEmployees}</span>
                    </div>
                    <Progress 
                      value={area.totalEmployees > 0 ? (area.traumaticEvaluations / area.totalEmployees) * 100 : 0} 
                      className="h-2"
                    />
                  </div>

                  <div className="text-center">
                    <div className="text-sm text-slate-600">Puntuación Promedio</div>
                    <div className="text-lg font-semibold text-slate-900">{area.avgRiskScore}</div>
                    <div className="text-xs text-slate-500">
                      {area.avgRiskScore < 20 ? 'Bajo Riesgo' :
                       area.avgRiskScore < 45 ? 'Riesgo Medio' : 'Alto Riesgo'}
                    </div>
                  </div>
                </div>

                {area.completionRate < 100 && (
                  <div className="mt-3 p-2 bg-yellow-50 rounded text-sm">
                    <strong>Acción requerida:</strong> Completar evaluaciones para{' '}
                    {area.totalEmployees - area.evaluatedEmployees} empleado(s) restante(s)
                  </div>
                )}

                {area.highRiskCount > 0 && (
                  <div className="mt-3 p-2 bg-red-50 rounded text-sm">
                    <strong>Atención urgente:</strong> {area.highRiskCount} empleado(s) en alto riesgo 
                    requieren plan de intervención inmediato
                  </div>
                )}
              </div>
            ))}
          </div>

          {areaProgress.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <i className="fas fa-building text-4xl mb-4"></i>
              <p>No hay datos de áreas disponibles</p>
              <p className="text-sm">Los empleados deben tener área asignada para mostrar el progreso por departamento</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}