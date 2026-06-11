// Página de cumplimiento NOM-035-STPS-2018
// Implementa todos los lineamientos específicos de la norma oficial

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import NOM035Policy from "@/components/compliance/nom035-policy";

interface ComplianceRequirement {
  id: string;
  numeral: string;
  title: string;
  description: string;
  status: 'compliant' | 'partial' | 'non_compliant' | 'not_applicable';
  evidence?: string[];
  dueDate?: string;
  priority: 'high' | 'medium' | 'low';
  companySize: string; // "1-15", "16-50", "50+"
}

export default function NOM035Compliance() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("requirements");

  const { data: companyInfo } = useQuery({
    queryKey: ['/api/company-info'],
  });

  const { data: complianceStatus } = useQuery({
    queryKey: ['/api/compliance/nom035-status'],
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
  });

  const updateComplianceMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/compliance/update", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/compliance/nom035-status'] });
      toast({
        title: "Estado actualizado",
        description: "El estado de cumplimiento ha sido actualizado",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el estado",
        variant: "destructive",
      });
    },
  });

  // Requerimientos oficiales NOM-035-STPS-2018 según tamaño de empresa
  const getComplianceRequirements = (employeeCount: number): ComplianceRequirement[] => {
    const baseRequirements: ComplianceRequirement[] = [
      {
        id: "5.1",
        numeral: "5.1",
        title: "Política de prevención de riesgos psicosociales",
        description: "Establecer por escrito, implantar, mantener y difundir en el centro de trabajo una política de prevención de riesgos psicosociales",
        status: companyInfo?.politicaPrevencionRiesgos ? 'compliant' : 'non_compliant',
        priority: 'high',
        companySize: "1-15"
      },
      {
        id: "5.4",
        numeral: "5.4",
        title: "Medidas de prevención y control",
        description: "Adoptar las medidas para prevenir y controlar los factores de riesgo psicosocial, promover el entorno organizacional favorable",
        status: 'partial',
        priority: 'high',
        companySize: "1-15"
      },
      {
        id: "5.5",
        numeral: "5.5",
        title: "Identificación de acontecimientos traumáticos severos",
        description: "Identificar a los trabajadores que fueron sujetos a acontecimientos traumáticos severos durante o con motivo del trabajo",
        status: 'partial',
        priority: 'high',
        companySize: "1-15"
      },
      {
        id: "5.7",
        numeral: "5.7",
        title: "Difusión de información",
        description: "Difundir y proporcionar información a los trabajadores sobre la política, medidas, mecanismos y resultados",
        status: 'partial',
        priority: 'medium',
        companySize: "1-15"
      },
      {
        id: "8.1",
        numeral: "8.1",
        title: "Acciones de prevención",
        description: "Implementar acciones para la prevención de los factores de riesgo psicosocial y la violencia laboral",
        status: 'partial',
        priority: 'high',
        companySize: "1-15"
      },
      {
        id: "8.2",
        numeral: "8.2",
        title: "Programas de prevención",
        description: "Implementar acciones y programas para la prevención de los factores de riesgo psicosocial",
        status: 'partial',
        priority: 'high',
        companySize: "1-15"
      }
    ];

    if (employeeCount >= 16) {
      baseRequirements.push(
        {
          id: "5.2",
          numeral: "5.2",
          title: "Identificación y análisis de factores de riesgo (16-50 trabajadores)",
          description: "Identificar y analizar los factores de riesgo psicosocial según Guía de Referencia II",
          status: 'partial',
          priority: 'high',
          companySize: "16-50"
        },
        {
          id: "7.1a",
          numeral: "7.1 a)",
          title: "Metodología de identificación (16-50 trabajadores)",
          description: "Aplicar metodología específica para centros de trabajo de 16 a 50 trabajadores",
          status: 'partial',
          priority: 'high',
          companySize: "16-50"
        },
        {
          id: "7.2",
          numeral: "7.2",
          title: "Proceso de identificación y análisis",
          description: "Realizar el proceso de identificación y análisis conforme a los lineamientos específicos",
          status: 'partial',
          priority: 'high',
          companySize: "16-50"
        }
      );
    }

    if (employeeCount > 50) {
      baseRequirements.push(
        {
          id: "5.3",
          numeral: "5.3",
          title: "Identificación y análisis completo (50+ trabajadores)",
          description: "Identificar y analizar los factores de riesgo psicosocial y evaluar el entorno organizacional según Guía de Referencia III",
          status: 'partial',
          priority: 'high',
          companySize: "50+"
        },
        {
          id: "7.1b",
          numeral: "7.1 b)",
          title: "Metodología completa (50+ trabajadores)",
          description: "Aplicar metodología completa para centros de trabajo de más de 50 trabajadores",
          status: 'partial',
          priority: 'high',
          companySize: "50+"
        },
        {
          id: "7.3",
          numeral: "7.3",
          title: "Evaluación del entorno organizacional",
          description: "Realizar evaluación del entorno organizacional favorable",
          status: 'partial',
          priority: 'high',
          companySize: "50+"
        },
        {
          id: "5.6",
          numeral: "5.6",
          title: "Exámenes médicos y evaluaciones psicológicas",
          description: "Practicar exámenes médicos y evaluaciones psicológicas cuando se identifiquen factores de riesgo",
          status: 'partial',
          priority: 'high',
          companySize: "50+"
        },
        {
          id: "5.8",
          numeral: "5.8",
          title: "Registros y documentación",
          description: "Llevar registros sobre resultados de identificación, análisis, medidas de control y exámenes",
          status: 'partial',
          priority: 'medium',
          companySize: "50+"
        }
      );
    }

    return baseRequirements;
  };

  const requirements = getComplianceRequirements(employees.length);
  const compliancePercentage = Math.round(
    (requirements.filter(req => req.status === 'compliant').length / requirements.length) * 100
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'non_compliant': return 'bg-red-100 text-red-800';
      case 'not_applicable': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'compliant': return 'Cumple';
      case 'partial': return 'Parcial';
      case 'non_compliant': return 'No cumple';
      case 'not_applicable': return 'No aplica';
      default: return 'Sin evaluar';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Cumplimiento NOM-035-STPS-2018</h2>
        <p className="text-slate-600">
          Gestión del cumplimiento de la Norma Oficial Mexicana NOM-035-STPS-2018, 
          Factores de riesgo psicosocial en el trabajo-Identificación, análisis y prevención
        </p>
      </div>

      {/* Resumen de cumplimiento */}
      <Card>
        <CardHeader>
          <CardTitle>Estado General de Cumplimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 mb-1">{compliancePercentage}%</div>
              <div className="text-sm text-slate-600">Cumplimiento General</div>
              <Progress value={compliancePercentage} className="mt-2" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {requirements.filter(req => req.status === 'compliant').length}
              </div>
              <div className="text-sm text-slate-600">Requerimientos Cumplidos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-1">
                {requirements.filter(req => req.status === 'partial').length}
              </div>
              <div className="text-sm text-slate-600">Cumplimiento Parcial</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-1">
                {requirements.filter(req => req.status === 'non_compliant').length}
              </div>
              <div className="text-sm text-slate-600">No Cumplidos</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información de la empresa */}
      <Card>
        <CardHeader>
          <CardTitle>Aplicabilidad de la Norma</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-slate-600">Número de Trabajadores</div>
              <div className="text-2xl font-bold text-slate-900">{employees.length}</div>
            </div>
            <div>
              <div className="text-sm text-slate-600">Categoría de Empresa</div>
              <div className="text-lg font-semibold text-slate-900">
                {employees.length <= 15 ? 'Microempresa (1-15)' :
                 employees.length <= 50 ? 'Pequeña empresa (16-50)' :
                 'Mediana/Grande (50+)'}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-600">Requerimientos Aplicables</div>
              <div className="text-lg font-semibold text-slate-900">
                {employees.length <= 15 ? 'Numerales 5.1, 5.4, 5.5, 5.7, 8.1, 8.2' :
                 employees.length <= 50 ? 'Numerales 5.1, 5.2, 5.4-5.8, 7.1a, 7.2, 7.4-7.9, Cap. 8' :
                 'Numerales 5.1, 5.3-5.8, 7.1b, 7.2-7.9, Cap. 8'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="requirements">Requerimientos</TabsTrigger>
          <TabsTrigger value="policy">Política</TabsTrigger>
          <TabsTrigger value="evaluations">Evaluaciones</TabsTrigger>
          <TabsTrigger value="documentation">Documentación</TabsTrigger>
          <TabsTrigger value="timeline">Cronograma</TabsTrigger>
        </TabsList>

        <TabsContent value="requirements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Requerimientos por Numeral</CardTitle>
              <p className="text-sm text-slate-600">
                Requerimientos específicos según el tamaño de empresa ({employees.length} trabajadores)
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {requirements.map((req) => (
                  <div key={req.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {req.numeral}
                          </Badge>
                          <Badge 
                            className={`text-xs ${getStatusColor(req.status)}`}
                            variant="secondary"
                          >
                            {getStatusText(req.status)}
                          </Badge>
                          <span className={`text-xs font-medium ${getPriorityColor(req.priority)}`}>
                            Prioridad: {req.priority.toUpperCase()}
                          </span>
                        </div>
                        <h4 className="font-semibold text-slate-900">{req.title}</h4>
                        <p className="text-sm text-slate-600 mt-1">{req.description}</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          // Implementar acción específica para cada requerimiento
                          toast({
                            title: "Acción requerida",
                            description: `Implementar ${req.title}`,
                          });
                        }}
                      >
                        <i className="fas fa-arrow-right mr-1"></i>
                        Implementar
                      </Button>
                    </div>
                    {req.evidence && req.evidence.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-slate-600 mb-1">Evidencias:</div>
                        <div className="flex flex-wrap gap-1">
                          {req.evidence.map((evidence, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {evidence}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policy" className="space-y-4">
          <NOM035Policy 
            companyInfo={companyInfo}
            editable={true}
            onSave={(policy) => {
              updateComplianceMutation.mutate({
                type: 'policy',
                data: { politicaPrevencionRiesgos: policy }
              });
            }}
          />
        </TabsContent>

        <TabsContent value="evaluations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estado de Evaluaciones NOM-035</CardTitle>
              <p className="text-sm text-slate-600">
                Progreso de evaluaciones de factores de riesgo psicosocial
              </p>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTitle>Próximas acciones requeridas</AlertTitle>
                <AlertDescription>
                  {employees.length <= 15 ? 
                    "Para microempresas: Implementar identificación de acontecimientos traumáticos severos (Guía I)" :
                    employees.length <= 50 ?
                    "Para empresas medianas: Realizar identificación y análisis de factores de riesgo (Guía II)" :
                    "Para empresas grandes: Realizar evaluación completa incluyendo entorno organizacional (Guía III)"
                  }
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documentación Requerida</CardTitle>
              <p className="text-sm text-slate-600">
                Documentos y registros obligatorios según NOM-035-STPS-2018
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">Política de Prevención de Riesgos Psicosociales</div>
                    <div className="text-sm text-slate-600">Numeral 5.1 - Obligatorio para todas las empresas</div>
                  </div>
                  <Badge className={getStatusColor(companyInfo?.politicaPrevencionRiesgos ? 'compliant' : 'non_compliant')}>
                    {companyInfo?.politicaPrevencionRiesgos ? 'Completo' : 'Pendiente'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">Resultados de Identificación y Análisis</div>
                    <div className="text-sm text-slate-600">Numerales 5.2/5.3 - Según tamaño de empresa</div>
                  </div>
                  <Badge className={getStatusColor('partial')}>
                    En Proceso
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">Registros de Medidas de Control</div>
                    <div className="text-sm text-slate-600">Numeral 5.8 - Para empresas de 50+ trabajadores</div>
                  </div>
                  <Badge className={getStatusColor(employees.length > 50 ? 'partial' : 'not_applicable')}>
                    {employees.length > 50 ? 'Pendiente' : 'No Aplica'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cronograma de Implementación</CardTitle>
              <p className="text-sm text-slate-600">
                Plazos y fechas límite según la normativa vigente
              </p>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTitle>Fechas importantes</AlertTitle>
                <AlertDescription>
                  <div className="space-y-2 mt-2">
                    <div>• <strong>23 de octubre de 2019:</strong> Entrada en vigor de numerales 5.1, 5.4, 5.5, 5.7, 8.1, 8.2</div>
                    <div>• <strong>23 de octubre de 2020:</strong> Entrada en vigor del resto de numerales (5.2, 5.3, 5.6, 5.8, 8.3, 8.4, 8.5, Capítulo 7)</div>
                    <div>• <strong>Evaluaciones periódicas:</strong> Cada 2 años mínimo, cada 6 meses si hay riesgo alto</div>
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}