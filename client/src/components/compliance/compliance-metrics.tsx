// Componente para mostrar métricas de cumplimiento NOM-035 en tiempo real
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ComplianceMetric {
  id: string;
  title: string;
  description: string;
  status: 'compliant' | 'partial' | 'non-compliant' | 'pending';
  progress: number;
  required: boolean;
  deadline?: string;
  actions: string[];
}

export default function ComplianceMetrics({ companySize }: { companySize: number }) {
  const { data: employees = [] } = useQuery({ queryKey: ['/api/employees'] });
  const { data: evaluations = [] } = useQuery({ queryKey: ['/api/evaluations'] });
  const { data: stats } = useQuery({ queryKey: ['/api/stats'] });

  // Calcular métricas de cumplimiento
  const totalEmployees = employees.length;
  const evaluatedEmployees = evaluations.length;
  const traumaticEvaluations = evaluations.filter((evaluation: any) => evaluation.questionnaireType === "traumatic_events").length;
  const highRiskEmployees = evaluations.filter((evaluation: any) => ['alto', 'muy-alto'].includes(evaluation.riskLevel)).length;
  const exposedEmployees = evaluations.filter((evaluation: any) => evaluation.hasTraumaticExposure).length;

  // Definir métricas según tamaño de empresa
  const getComplianceMetrics = (): ComplianceMetric[] => {
    const baseMetrics: ComplianceMetric[] = [
      {
        id: '5.1',
        title: 'Política de prevención de riesgos psicosociales',
        description: 'Establecer política por escrito para la prevención de factores de riesgo psicosocial',
        status: 'compliant', // Asumiendo que se tiene
        progress: 100,
        required: true,
        actions: ['Revisar política anualmente', 'Comunicar a trabajadores']
      },
      {
        id: '5.2',
        title: 'Medidas de prevención',
        description: 'Adoptar medidas para prevenir y controlar factores de riesgo psicosocial',
        status: highRiskEmployees > 0 ? 'partial' : 'compliant',
        progress: highRiskEmployees > 0 ? 75 : 100,
        required: true,
        actions: ['Implementar controles', 'Monitorear efectividad']
      },
      {
        id: '5.3',
        title: 'Identificación y análisis',
        description: 'Identificar y analizar factores de riesgo psicosocial',
        status: evaluatedEmployees >= totalEmployees * 0.8 ? 'compliant' : 
               evaluatedEmployees > 0 ? 'partial' : 'non-compliant',
        progress: totalEmployees > 0 ? Math.round((evaluatedEmployees / totalEmployees) * 100) : 0,
        required: true,
        actions: ['Completar evaluaciones pendientes', 'Analizar resultados']
      },
      {
        id: '5.4',
        title: 'Evaluación del entorno organizacional',
        description: 'Evaluar entorno organizacional favorable',
        status: companySize >= 50 ? 
               (evaluatedEmployees >= totalEmployees * 0.8 ? 'compliant' : 'partial') : 
               'compliant',
        progress: companySize >= 50 ? 
                 (totalEmployees > 0 ? Math.round((evaluatedEmployees / totalEmployees) * 100) : 0) : 
                 100,
        required: companySize >= 50,
        actions: companySize >= 50 ? ['Aplicar Guía III', 'Evaluar clima laboral'] : []
      },
      {
        id: '5.5',
        title: 'Acontecimientos traumáticos severos',
        description: 'Identificar trabajadores expuestos a acontecimientos traumáticos',
        status: traumaticEvaluations >= totalEmployees * 0.9 ? 'compliant' : 
               traumaticEvaluations > 0 ? 'partial' : 'non-compliant',
        progress: totalEmployees > 0 ? Math.round((traumaticEvaluations / totalEmployees) * 100) : 0,
        required: true,
        actions: ['Aplicar cuestionario eventos traumáticos', 'Canalizar casos positivos']
      }
    ];

    // Métricas adicionales para empresas medianas y grandes
    if (companySize >= 16) {
      baseMetrics.push({
        id: '7.1',
        title: 'Exámenes médicos y evaluaciones psicológicas',
        description: 'Practicar exámenes o evaluaciones clínicas específicas',
        status: exposedEmployees === 0 ? 'compliant' : 'pending',
        progress: exposedEmployees === 0 ? 100 : 50,
        required: true,
        actions: ['Canalizar trabajadores expuestos', 'Seguimiento médico']
      });
    }

    if (companySize >= 50) {
      baseMetrics.push(
        {
          id: '7.2',
          title: 'Difusión de información',
          description: 'Difundir información sobre factores de riesgo psicosocial',
          status: 'compliant',
          progress: 100,
          required: true,
          actions: ['Capacitación continua', 'Material informativo']
        },
        {
          id: '8.1',
          title: 'Registros de resultados',
          description: 'Llevar registros de resultados de identificación y análisis',
          status: evaluatedEmployees > 0 ? 'compliant' : 'non-compliant',
          progress: evaluatedEmployees > 0 ? 100 : 0,
          required: true,
          actions: ['Mantener registros actualizados', 'Documentar hallazgos']
        }
      );
    }

    return baseMetrics;
  };

  const metrics = getComplianceMetrics();
  const compliantCount = metrics.filter(m => m.status === 'compliant').length;
  const overallCompliance = Math.round((compliantCount / metrics.length) * 100);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'non-compliant': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'compliant': return 'Cumple';
      case 'partial': return 'Parcial';
      case 'non-compliant': return 'No Cumple';
      case 'pending': return 'Pendiente';
      default: return 'Desconocido';
    }
  };

  const criticalIssues = metrics.filter(m => m.status === 'non-compliant' && m.required);
  const partialCompliance = metrics.filter(m => m.status === 'partial');

  return (
    <div className="space-y-6">
      {/* Resumen general */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-slate-900">{overallCompliance}%</div>
            <div className="text-sm text-slate-600">Cumplimiento General</div>
            <Progress value={overallCompliance} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{compliantCount}</div>
            <div className="text-sm text-slate-600">Numerales Cumplidos</div>
            <div className="text-xs text-slate-500">de {metrics.length} total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{criticalIssues.length}</div>
            <div className="text-sm text-slate-600">Incumplimientos</div>
            <div className="text-xs text-slate-500">Requieren atención</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{partialCompliance.length}</div>
            <div className="text-sm text-slate-600">Cumplimiento Parcial</div>
            <div className="text-xs text-slate-500">En progreso</div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas críticas */}
      {criticalIssues.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTitle className="text-red-800">Atención Requerida</AlertTitle>
          <AlertDescription className="text-red-700">
            {criticalIssues.length} numeral(es) de la NOM-035-STPS-2018 no están siendo cumplidos.
            Es necesario tomar acciones correctivas inmediatas.
          </AlertDescription>
        </Alert>
      )}

      {/* Métricas detalladas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.id} className={metric.status === 'non-compliant' ? 'border-red-200' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-sm font-semibold">
                    Numeral {metric.id}: {metric.title}
                  </CardTitle>
                  <p className="text-xs text-slate-600 mt-1">{metric.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {metric.required && (
                    <Badge variant="outline" className="text-xs">Obligatorio</Badge>
                  )}
                  <Badge className={getStatusColor(metric.status)}>
                    {getStatusText(metric.status)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progreso</span>
                    <span>{metric.progress}%</span>
                  </div>
                  <Progress 
                    value={metric.progress} 
                    className={`h-2 ${
                      metric.progress >= 80 ? 'text-green-600' :
                      metric.progress >= 50 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}
                  />
                </div>
                
                {metric.actions.length > 0 && (
                  <div>
                    <h5 className="text-xs font-medium text-slate-700 mb-1">Acciones requeridas:</h5>
                    <ul className="text-xs text-slate-600 space-y-1">
                      {metric.actions.map((action, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-slate-400 mt-0.5">•</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {metric.deadline && (
                  <div className="text-xs text-slate-500">
                    <strong>Fecha límite:</strong> {metric.deadline}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Información contextual */}
      <Card>
        <CardHeader>
          <CardTitle>Aplicabilidad según Tamaño de Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className={`p-3 rounded-lg ${companySize <= 15 ? 'bg-blue-50 border-blue-200' : 'bg-slate-50'}`}>
              <h4 className="font-semibold">Microempresas (1-15 trabajadores)</h4>
              <p className="text-slate-600 mt-1">Numerales: 5.1, 5.2, 5.3, 5.5</p>
              <p className="text-xs text-slate-500 mt-1">Evaluación simplificada con cuestionario básico</p>
            </div>
            <div className={`p-3 rounded-lg ${companySize >= 16 && companySize <= 50 ? 'bg-blue-50 border-blue-200' : 'bg-slate-50'}`}>
              <h4 className="font-semibold">Empresas medianas (16-50 trabajadores)</h4>
              <p className="text-slate-600 mt-1">Numerales: 5.1, 5.2, 5.3, 5.5, 7.1</p>
              <p className="text-xs text-slate-500 mt-1">Guía de Referencia II obligatoria</p>
            </div>
            <div className={`p-3 rounded-lg ${companySize > 50 ? 'bg-blue-50 border-blue-200' : 'bg-slate-50'}`}>
              <h4 className="font-semibold">Empresas grandes (50+ trabajadores)</h4>
              <p className="text-slate-600 mt-1">Todos los numerales (5.1-5.8, 7.1-7.9, 8.1-8.5)</p>
              <p className="text-xs text-slate-500 mt-1">Guía de Referencia III y entorno organizacional</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}