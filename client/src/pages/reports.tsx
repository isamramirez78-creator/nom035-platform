import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  FileText, 
  Download, 
  Calendar as CalendarIcon, 
  BarChart3, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Filter,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { generateReport } from "@/lib/masterReportGenerator";

interface GeneratedReport {
  id: string;
  name: string;
  type: string;
  format: string;
  createdAt: string;
  status: 'generating' | 'completed' | 'error';
  downloadUrl?: string;
  size?: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'compliance' | 'risk-analysis' | 'interventions' | 'executive';
  format: 'pdf' | 'excel' | 'csv';
  icon: string;
  color: string;
  features: string[];
}

interface GeneratedReport {
  id: string;
  name: string;
  type: string;
  format: string;
  createdAt: string;
  status: 'generating' | 'completed' | 'error';
  downloadUrl?: string;
  size?: string;
}

const reportTemplates = [
  {
    id: 'executive-report',
    name: 'Reporte Ejecutivo NOM-035',
    description: 'Presentación ejecutiva completa con resultados, hallazgos y recomendaciones. Formato profesional para dirección y alta gerencia.',
    type: 'executive',
    format: 'pdf',
    icon: '📊',
    color: 'bg-purple-50 border-purple-200',
    features: ['Resumen ejecutivo', 'Análisis de riesgos', 'Casos de canalización', 'Recomendaciones estratégicas', 'Gráficos y tablas oficiales']
  },
  {
    id: 'nom035-compliance',
    name: 'Cumplimiento NOM-035-STPS',
    description: 'Reporte oficial de cumplimiento con la normativa mexicana. Incluye estado de evaluaciones, cobertura y nivel de cumplimiento regulatorio.',
    type: 'compliance',
    format: 'pdf',
    icon: '📋',
    color: 'bg-blue-50 border-blue-200',
    features: ['Estado de cumplimiento', 'Cobertura de evaluaciones', 'Métricas oficiales', 'Distribución de riesgos']
  },
  {
    id: 'risk-analysis',
    name: 'Análisis de Riesgos',
    description: 'Análisis detallado de los factores de riesgo psicosocial por nivel y área organizacional.',
    type: 'risk-analysis',
    format: 'pdf',
    icon: '⚠️',
    color: 'bg-amber-50 border-amber-200',
    features: ['Distribución por niveles', 'Análisis por área', 'Porcentajes de riesgo', 'Recomendaciones específicas']
  },
  {
    id: 'intervention-plan',
    name: 'Plan de Intervención',
    description: 'Identificación de empleados en riesgo alto y plan de acción detallado para intervención.',
    type: 'interventions',
    format: 'pdf',
    icon: '🎯',
    color: 'bg-green-50 border-green-200',
    features: ['Empleados en riesgo alto', 'Plan de acción', 'Cronograma de seguimiento', 'Medidas específicas']
  },
  {
    id: 'executive-dashboard',
    name: 'Dashboard Ejecutivo',
    description: 'Resumen ejecutivo con métricas clave, KPIs y estado general para la alta dirección.',
    type: 'executive',
    format: 'pdf',
    icon: '📊',
    color: 'bg-purple-50 border-purple-200',
    features: ['KPIs principales', 'Estado general', 'Índices de cumplimiento', 'Próximas acciones']
  }
];

export default function Reports() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [reportFilters, setReportFilters] = useState({
    dateFrom: undefined as Date | undefined,
    dateTo: undefined as Date | undefined,
    area: "",
    riskLevel: "",
    includePersonalData: true
  });
  const [customReportConfig, setCustomReportConfig] = useState({
    title: "",
    description: "",
    sections: [] as string[]
  });

  const { toast } = useToast();

  const { data: reports, isLoading: reportsLoading } = useQuery<GeneratedReport[]>({
    queryKey: ['/api/reports'],
  });

  const { data: employees } = useQuery({
    queryKey: ['/api/employees'],
  });

  const { data: stats } = useQuery<any>({
    queryKey: ['/api/stats'],
  });

  const generateReportMutation = useMutation({
    mutationFn: async (config: any) => {
      const response = await apiRequest("POST", "/api/reports/generate", config);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Reporte generado exitosamente",
        description: `Reporte de ${reportTemplates.find(t => t.id === data.templateId)?.name} completado`,
      });
      
      // Generate and download PDF
      generatePDFReport(data);
      
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo generar el reporte",
        variant: "destructive",
      });
    },
  });

  const downloadReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const response = await fetch(`/api/reports/download/${reportId}`);
      if (!response.ok) throw new Error('Error downloading report');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Descarga iniciada",
        description: "El reporte se está descargando.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "No se pudo descargar el reporte",
        variant: "destructive",
      });
    },
  });

  const generateExecutiveReport = async () => {
    try {
      // Mock data for demonstration - would come from actual API
      const reportData = {
        companyName: "Constructora del Valle SA de CV",
        date: new Date().toLocaleDateString('es-MX'),
        totalEmployees: stats?.totalEmployees || 75,
        evaluatedEmployees: stats?.evaluationsCompleted || 68,
        globalScore: stats?.globalScore || 79,
        riskLevel: stats?.globalRiskLevel?.toUpperCase() || "MEDIO",
        categoryScores: {
          "Ambiente de trabajo": { score: 8, level: "BAJO" },
          "Factores propios de la actividad": { score: 35, level: "MEDIO" },
          "Organización del tiempo de trabajo": { score: 12, level: "MEDIO" },
          "Liderazgo y relaciones de trabajo": { score: 15, level: "BAJO" },
          "Entorno organizacional": { score: 9, level: "NULO" }
        },
        domainScores: {
          "Carga de trabajo": { score: 18, level: "MEDIO" },
          "Jornada de trabajo": { score: 11, level: "ALTO" },
          "Liderazgo": { score: 5, level: "NULO" },
          "Relaciones en el trabajo": { score: 4, level: "NULO" },
          "Violencia laboral": { score: 2, level: "NULO" }
        },
        canalizationCount: stats?.canalizationCount || 3
      };
      
      await generatePDFReport(reportData);
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "No se pudo generar el reporte",
        variant: "destructive",
      });
    }
  };

  const generatePDFReport = async (reportData: any) => {
    // Mapear templateId al tipo correcto del masterReportGenerator
    const typeMap: Record<string, string> = {
      'executive-report':    'executive-report',
      'executive-dashboard': 'executive-dashboard',
      'nom035-compliance':   'nom035-compliance',
      'risk-analysis':       'risk-analysis',
      'intervention-plan':   'intervention-plan',
      'area-report':         'area-report',
    };
    const reportType = typeMap[reportData.templateId] || 'executive-dashboard';
    const params = reportData.filters?.area ? { area: reportData.filters.area } : undefined;
    const result = await generateReport(reportType, params);

    if (result.success) {
      toast({
        title: "Reporte generado",
        description: `Reporte descargado correctamente`,
      });
    } else {
      toast({
        title: "Error",
        description: result.error || "No se pudo generar el reporte",
        variant: "destructive",
      });
    }
  };

  const handleGenerateReport = () => {
    if (!selectedTemplate) {
      toast({
        title: "Error",
        description: "Selecciona un tipo de reporte",
        variant: "destructive",
      });
      return;
    }

    const template = reportTemplates.find(t => t.id === selectedTemplate);
    const config = {
      templateId: selectedTemplate,
      filters: reportFilters,
      customConfig: customReportConfig,
      template
    };

    generateReportMutation.mutate(config);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'generating':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Generando</Badge>;
      case 'completed':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Completado</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'compliance': return <FileText className="w-4 h-4" />;
      case 'risk-analysis': return <BarChart3 className="w-4 h-4" />;
      case 'interventions': return <Users className="w-4 h-4" />;
      case 'executive': return <Eye className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Generación de Reportes</h1>
          <p className="text-gray-600 mt-1">
            Crea reportes oficiales de cumplimiento NOM-035-STPS
          </p>
        </div>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/reports'] })}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
      </div>

      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList>
          <TabsTrigger value="generate">Generar Reporte</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
          <TabsTrigger value="templates">Plantillas</TabsTrigger>
        </TabsList>

        {/* Generate Report Tab */}
        <TabsContent value="generate" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Report Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Configuración del Reporte</CardTitle>
                <CardDescription>
                  Selecciona el tipo de reporte y configura los parámetros
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="template">Tipo de Reporte</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tipo de reporte" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center space-x-2">
                            <span>{template.icon}</span>
                            <span>{template.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTemplate && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">
                      {reportTemplates.find(t => t.id === selectedTemplate)?.name}
                    </h4>
                    <p className="text-sm text-blue-800">
                      {reportTemplates.find(t => t.id === selectedTemplate)?.description}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {reportTemplates.find(t => t.id === selectedTemplate)?.features?.map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs border-blue-300 text-blue-700">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha Desde</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {reportFilters.dateFrom ? format(reportFilters.dateFrom, "dd/MM/yyyy", { locale: es }) : "Seleccionar"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={reportFilters.dateFrom}
                          onSelect={(date) => setReportFilters({...reportFilters, dateFrom: date})}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Fecha Hasta</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {reportFilters.dateTo ? format(reportFilters.dateTo, "dd/MM/yyyy", { locale: es }) : "Seleccionar"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={reportFilters.dateTo}
                          onSelect={(date) => setReportFilters({...reportFilters, dateTo: date})}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="area">Área (Opcional)</Label>
                    <Select value={reportFilters.area} onValueChange={(value) => setReportFilters({...reportFilters, area: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas las áreas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las áreas</SelectItem>
                        <SelectItem value="administracion">Administración</SelectItem>
                        <SelectItem value="operaciones">Operaciones</SelectItem>
                        <SelectItem value="ventas">Ventas</SelectItem>
                        <SelectItem value="recursos-humanos">Recursos Humanos</SelectItem>
                        <SelectItem value="finanzas">Finanzas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="riskLevel">Nivel de Riesgo</Label>
                    <Select value={reportFilters.riskLevel} onValueChange={(value) => setReportFilters({...reportFilters, riskLevel: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los niveles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los niveles</SelectItem>
                        <SelectItem value="sin-riesgo">Sin Riesgo</SelectItem>
                        <SelectItem value="bajo">Bajo</SelectItem>
                        <SelectItem value="medio">Medio</SelectItem>
                        <SelectItem value="alto">Alto</SelectItem>
                        <SelectItem value="muy-alto">Muy Alto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedTemplate && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <FileText className="w-5 h-5 text-blue-600 mr-2" />
                        <h4 className="font-semibold text-blue-900">
                          Reporte Seleccionado
                        </h4>
                      </div>
                      <p className="text-sm text-blue-700">
                        {reportTemplates.find(t => t.id === selectedTemplate)?.name}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {reportTemplates.find(t => t.id === selectedTemplate)?.features?.map((feature, index) => (
                          <Badge key={index} variant="outline" className="text-xs border-blue-300 text-blue-700">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <Button
                    onClick={handleGenerateReport}
                    disabled={generateReportMutation.isPending || !selectedTemplate}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3"
                    size="lg"
                  >
                    {generateReportMutation.isPending ? (
                      <>
                        <Clock className="w-5 h-5 mr-2 animate-spin" />
                        Generando Reporte...
                      </>
                    ) : (
                      <>
                        <FileText className="w-5 h-5 mr-2" />
                        Generar y Descargar PDF
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Preview/Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Resumen de Datos</CardTitle>
                <CardDescription>
                  Vista previa de los datos que se incluirán en el reporte
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {(employees as any)?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Total Empleados</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {(stats as any)?.evaluationsCompleted || 0}
                    </div>
                    <div className="text-sm text-gray-600">Evaluaciones</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {(stats as any)?.highRiskCount || 0}
                    </div>
                    <div className="text-sm text-gray-600">Alto Riesgo</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {new Set(((employees as any[]) || []).map((e: any) => e.area).filter(Boolean)).size}
                    </div>
                    <div className="text-sm text-gray-600">Áreas</div>
                  </div>
                </div>

                {selectedTemplate && (
                  <div className="mt-6 p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Secciones del Reporte:</h4>
                    <ul className="text-sm space-y-1">
                      {selectedTemplate === 'nom035-compliance' && (
                        <>
                          <li>• Datos generales de la empresa</li>
                          <li>• Resumen ejecutivo de cumplimiento</li>
                          <li>• Resultados de evaluaciones por área</li>
                          <li>• Identificación de factores de riesgo</li>
                          <li>• Plan de acciones correctivas</li>
                          <li>• Conclusiones y recomendaciones</li>
                        </>
                      )}
                      {selectedTemplate === 'risk-analysis' && (
                        <>
                          <li>• Análisis por dominios NOM-035</li>
                          <li>• Distribución de riesgos por área</li>
                          <li>• Factores de riesgo identificados</li>
                          <li>• Correlaciones y tendencias</li>
                          <li>• Recomendaciones específicas</li>
                        </>
                      )}
                      {selectedTemplate === 'intervention-plan' && (
                        <>
                          <li>• Empleados de alto riesgo</li>
                          <li>• Intervenciones programadas</li>
                          <li>• Seguimiento y evaluación</li>
                          <li>• Cronograma de actividades</li>
                          <li>• Responsables asignados</li>
                        </>
                      )}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Report History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Reportes</CardTitle>
              <CardDescription>
                Reportes generados anteriormente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : reports && reports.length > 0 ? (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        {getReportTypeIcon(report.type)}
                        <div>
                          <h4 className="font-medium">{report.name}</h4>
                          <p className="text-sm text-gray-600">
                            {format(new Date(report.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        {getStatusBadge(report.status)}
                        {report.size && (
                          <span className="text-sm text-gray-500">{report.size}</span>
                        )}
                        {report.status === 'completed' && (
                          <Button
                            size="sm"
                            onClick={() => generatePDFReport(report)}
                            disabled={downloadReportMutation.isPending}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Descargar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay reportes generados
                  </h3>
                  <p className="text-gray-600">
                    Genera tu primer reporte usando la pestaña "Generar Reporte"
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportTemplates.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {getReportTypeIcon(template.type)}
                    <span className="text-lg">{template.name}</span>
                  </CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Formato:</span>
                      <Badge variant="outline">{template.format?.toUpperCase() || 'PDF'}</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tipo:</span>
                      <Badge variant="secondary">{template.type || 'Reporte'}</Badge>
                    </div>
                  </div>
                  <Button 
                    className="w-full mt-4"
                    onClick={() => {
                      setSelectedTemplate(template.id);
                      // Switch to generate tab
                      const generateTab = document.querySelector('[value="generate"]') as HTMLElement;
                      generateTab?.click();
                    }}
                  >
                    Usar Plantilla
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}