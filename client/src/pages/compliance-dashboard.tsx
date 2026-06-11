import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  FileText, 
  Calendar,
  Download,
  Eye,
  Shield,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react";
import ComplianceMetrics from "@/components/compliance/compliance-metrics";
import RealTimeDashboard from "@/components/compliance/real-time-dashboard";
import ComplianceAlerts from "@/components/compliance/compliance-alerts";
import ComplianceProgressTracker from "@/components/compliance/compliance-progress-tracker";

interface ComplianceMetrics {
  totalEmployees: number;
  evaluatedEmployees: number;
  pendingEvaluations: number;
  complianceRate: number;
  highRiskEmployees: number;
  lastEvaluationDate: string;
  nextDeadline: string;
  riskDistribution: {
    sinRiesgo: number;
    bajo: number;
    medio: number;
    alto: number;
    muyAlto: number;
  };
  areaCompliance: Array<{
    area: string;
    total: number;
    evaluated: number;
    compliance: number;
    avgRisk: string;
  }>;
  monthlyTrends: Array<{
    month: string;
    evaluations: number;
    compliance: number;
    incidents: number;
  }>;
}

export default function ComplianceDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("current");
  const [selectedArea, setSelectedArea] = useState("all");

  const { data: metrics, isLoading } = useQuery<ComplianceMetrics>({
    queryKey: ['/api/compliance/metrics', selectedPeriod, selectedArea],
  });

  const { data: company } = useQuery({
    queryKey: ['/api/companies/profile'],
  });

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'sin-riesgo': return 'text-green-600 bg-green-50';
      case 'bajo': return 'text-blue-600 bg-blue-50';
      case 'medio': return 'text-yellow-600 bg-yellow-50';
      case 'alto': return 'text-orange-600 bg-orange-50';
      case 'muy-alto': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getComplianceStatus = (rate: number) => {
    if (rate >= 95) return { status: 'Excelente', color: 'text-green-600', icon: CheckCircle };
    if (rate >= 80) return { status: 'Satisfactorio', color: 'text-blue-600', icon: CheckCircle };
    if (rate >= 60) return { status: 'En Progreso', color: 'text-yellow-600', icon: AlertTriangle };
    return { status: 'Crítico', color: 'text-red-600', icon: AlertTriangle };
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const complianceStatus = getComplianceStatus(metrics.complianceRate);
  const StatusIcon = complianceStatus.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard de Cumplimiento NOM-035</h1>
          <p className="text-gray-600 mt-1">
            Reporte ejecutivo de cumplimiento normativo - {company?.nombreEmpresa}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Período Actual</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="semester">Semestre</SelectItem>
              <SelectItem value="year">Año Completo</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar Reporte
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Estado de Cumplimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <StatusIcon className={`w-5 h-5 ${complianceStatus.color}`} />
              <span className={`text-2xl font-bold ${complianceStatus.color}`}>
                {metrics.complianceRate}%
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{complianceStatus.status}</p>
            <Progress value={metrics.complianceRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Empleados Evaluados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">
                {metrics.evaluatedEmployees}
              </span>
              <span className="text-gray-500">/ {metrics.totalEmployees}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {Math.round((metrics.evaluatedEmployees / metrics.totalEmployees) * 100)}% completado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Empleados de Alto Riesgo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-2xl font-bold text-red-600">
                {metrics.highRiskEmployees}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Requieren intervención inmediata
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Evaluaciones Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              <span className="text-2xl font-bold text-orange-600">
                {metrics.pendingEvaluations}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Próximo vencimiento: {new Date(metrics.nextDeadline).toLocaleDateString('es-MX')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="realtime">Tiempo Real</TabsTrigger>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
          <TabsTrigger value="progress">Progreso</TabsTrigger>
          <TabsTrigger value="risk-analysis">Análisis</TabsTrigger>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="realtime" className="space-y-6">
          <RealTimeDashboard />
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <ComplianceMetrics companySize={metrics?.totalEmployees ?? 0} />
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <ComplianceProgressTracker />
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          {/* Alertas de cumplimiento */}
          <ComplianceAlerts />
          
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Empleados Totales</CardTitle>
                <i className="fas fa-users text-slate-600"></i>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalEmployees}</div>
                <p className="text-xs text-slate-600">
                  Trabajadores registrados
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Evaluaciones Completadas</CardTitle>
                <i className="fas fa-clipboard-check text-slate-600"></i>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.evaluatedEmployees}</div>
                <p className="text-xs text-slate-600">
                  {metrics.complianceRate}% de cobertura
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Casos Alto Riesgo</CardTitle>
                <i className="fas fa-exclamation-triangle text-red-500"></i>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {metrics.highRiskEmployees}
                </div>
                <p className="text-xs text-slate-600">
                  Requieren atención
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cumplimiento General</CardTitle>
                <i className="fas fa-shield-alt text-green-500"></i>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {metrics.complianceRate}%
                </div>
                <p className="text-xs text-slate-600">
                  NOM-035-STPS-2018
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="w-5 h-5 mr-2" />
                  Distribución de Niveles de Riesgo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(metrics.riskDistribution).map(([level, count]) => {
                    const percentage = (count / metrics.totalEmployees) * 100;
                    return (
                      <div key={level} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge className={getRiskColor(level)}>
                            {level.replace('-', ' ').toUpperCase()}
                          </Badge>
                          <span className="text-sm">{count} empleados</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                level === 'sin-riesgo' ? 'bg-green-500' :
                                level === 'bajo' ? 'bg-blue-500' :
                                level === 'medio' ? 'bg-yellow-500' :
                                level === 'alto' ? 'bg-orange-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Compliance Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Estado de Cumplimiento Normativo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Evaluaciones Realizadas</span>
                    </div>
                    <span className="text-green-600 font-bold">{metrics.evaluatedEmployees}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">Tasa de Cumplimiento</span>
                    </div>
                    <span className="text-blue-600 font-bold">{metrics.complianceRate}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-yellow-600" />
                      <span className="font-medium">Última Evaluación</span>
                    </div>
                    <span className="text-yellow-600 font-bold">{metrics.lastEvaluationDate}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <span className="font-medium">Casos de Alto Riesgo</span>
                    </div>
                    <span className="text-red-600 font-bold">{metrics.highRiskEmployees}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Risk Analysis Tab */}
        <TabsContent value="risk-analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análisis Detallado de Factores de Riesgo Psicosocial</CardTitle>
              <CardDescription>
                Evaluación según los dominios establecidos por la NOM-035-STPS
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { domain: 'Ambiente de Trabajo', score: 85, risk: 'bajo' },
                  { domain: 'Factores Propios de la Actividad', score: 72, risk: 'medio' },
                  { domain: 'Organización del Tiempo', score: 91, risk: 'sin-riesgo' },
                  { domain: 'Liderazgo y Relaciones', score: 68, risk: 'medio' },
                  { domain: 'Entorno Organizacional', score: 45, risk: 'alto' },
                  { domain: 'Reconocimiento del Desempeño', score: 78, risk: 'bajo' },
                ].map((factor) => (
                  <Card key={factor.domain} className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{factor.domain}</h4>
                        <Badge className={getRiskColor(factor.risk)}>
                          {factor.risk.replace('-', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <Progress value={factor.score} className="h-2" />
                      <p className="text-sm text-gray-600">Puntuación: {factor.score}/100</p>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Areas Tab */}
        <TabsContent value="areas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cumplimiento por Área Organizacional</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.areaCompliance.map((area) => (
                  <div key={area.area} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{area.area}</h4>
                      <Badge className={getRiskColor(area.avgRisk)}>
                        Riesgo {area.avgRisk.replace('-', ' ')}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Total Empleados</p>
                        <p className="font-bold text-lg">{area.total}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Evaluados</p>
                        <p className="font-bold text-lg">{area.evaluated}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">% Cumplimiento</p>
                        <p className="font-bold text-lg">{area.compliance}%</p>
                      </div>
                    </div>
                    <Progress value={area.compliance} className="mt-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Tendencias de Cumplimiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {metrics.monthlyTrends.map((trend, index) => (
                  <div key={trend.month} className="border-b pb-4 last:border-b-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{trend.month}</h4>
                      <div className="flex items-center space-x-4">
                        {trend.compliance > (metrics.monthlyTrends[index - 1]?.compliance || 0) ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                        <span className="font-bold">{trend.compliance}%</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Evaluaciones</p>
                        <p className="font-bold">{trend.evaluations}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Cumplimiento</p>
                        <p className="font-bold">{trend.compliance}%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Incidentes</p>
                        <p className="font-bold">{trend.incidents}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Reportes Ejecutivos</CardTitle>
                <CardDescription>
                  Documentos oficiales para autoridades y dirección
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Reporte de Cumplimiento STPS
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Diagnóstico de Seguridad y Salud
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Análisis de Factores de Riesgo
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Activity className="w-4 h-4 mr-2" />
                  Plan de Acción y Mejora
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Exportación de Datos</CardTitle>
                <CardDescription>
                  Formatos para análisis y archivo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Exportar a PDF
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar a Excel
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Datos para Power BI
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Eye className="w-4 h-4 mr-2" />
                  Vista de Auditoría
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}