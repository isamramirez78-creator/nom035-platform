// Página explicativa de la metodología de evaluación NOM-035-STPS-2018
// Muestra paso a paso cómo se realizan las evaluaciones según la norma oficial

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { 
  getOfficialQuestionnaire, 
  getTraumaticEventsQuestionnaire,
  officialRiskThresholds,
  officialDomains 
} from "@/data/nom035-official-questions";
import { 
  calculateOfficialNOM035Evaluation,
  evaluateTraumaticEvents,
  getEvaluationPeriodicity 
} from "@/utils/nom035-official-calculator";
import MethodologyDemo from "@/components/evaluation/methodology-demo";

export default function EvaluationMethodology() {
  const [selectedCompanySize, setSelectedCompanySize] = useState(25); // Default: empresa mediana
  const [selectedTab, setSelectedTab] = useState("overview");

  // Ejemplo de evaluación con datos simulados
  const simulateEvaluation = () => {
    const questionnaire = getOfficialQuestionnaire(selectedCompanySize);
    
    // Generar respuestas de ejemplo (simulación)
    const sampleAnswers = questionnaire.map(q => ({
      questionId: q.id,
      value: Math.floor(Math.random() * 5), // 0-4 (Siempre a Nunca)
      domain: q.domain,
      reverseScored: q.reverseScored
    }));

    const result = calculateOfficialNOM035Evaluation(
      1, // employeeId
      sampleAnswers,
      selectedCompanySize
    );

    return result;
  };

  const sampleEvaluation = simulateEvaluation();

  const getQuestionnaireTypeDescription = (companySize: number) => {
    if (companySize <= 15) {
      return {
        name: "Cuestionario para Microempresas",
        guide: "Guía de Referencia II (simplificado)",
        questions: 22,
        description: "Versión simplificada para centros de trabajo con 1-15 empleados"
      };
    } else if (companySize <= 50) {
      return {
        name: "Cuestionario Guía II",
        guide: "Guía de Referencia II",
        questions: 46,
        description: "Para centros de trabajo con 16-50 empleados"
      };
    } else {
      return {
        name: "Cuestionario Guía III",
        guide: "Guía de Referencia III",
        questions: 72,
        description: "Para centros de trabajo con más de 50 empleados (incluye evaluación del entorno organizacional)"
      };
    }
  };

  const questionnaireInfo = getQuestionnaireTypeDescription(selectedCompanySize);

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Metodología de Evaluación NOM-035-STPS-2018</h2>
        <p className="text-slate-600">
          Explicación detallada del proceso oficial de evaluación de factores de riesgo psicosocial
        </p>
      </div>

      {/* Selector de tamaño de empresa */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Evaluación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Número de empleados en la empresa:</label>
              <div className="flex gap-2 mt-2">
                <Button 
                  variant={selectedCompanySize <= 15 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCompanySize(10)}
                >
                  1-15 empleados
                </Button>
                <Button 
                  variant={selectedCompanySize > 15 && selectedCompanySize <= 50 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCompanySize(25)}
                >
                  16-50 empleados
                </Button>
                <Button 
                  variant={selectedCompanySize > 50 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCompanySize(100)}
                >
                  50+ empleados
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
              <div>
                <div className="text-sm text-slate-600">Cuestionario Aplicable</div>
                <div className="font-semibold">{questionnaireInfo.name}</div>
              </div>
              <div>
                <div className="text-sm text-slate-600">Número de Preguntas</div>
                <div className="font-semibold">{questionnaireInfo.questions} preguntas</div>
              </div>
              <div>
                <div className="text-sm text-slate-600">Guía de Referencia</div>
                <div className="font-semibold">{questionnaireInfo.guide}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="scoring">Puntuación</TabsTrigger>
          <TabsTrigger value="domains">Dominios</TabsTrigger>
          <TabsTrigger value="thresholds">Umbrales</TabsTrigger>
          <TabsTrigger value="example">Ejemplo</TabsTrigger>
          <TabsTrigger value="trauma">Eventos Traumáticos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Proceso de Evaluación Paso a Paso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <h4 className="font-semibold">Selección del Cuestionario</h4>
                    <p className="text-sm text-slate-600">Según el tamaño de la empresa se aplica el cuestionario correspondiente:</p>
                    <ul className="text-sm text-slate-600 mt-1 ml-4">
                      <li>• 1-15 empleados: Cuestionario simplificado (22 preguntas)</li>
                      <li>• 16-50 empleados: Guía de Referencia II (46 preguntas)</li>
                      <li>• 50+ empleados: Guía de Referencia III (72 preguntas + entorno organizacional)</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <h4 className="font-semibold">Aplicación del Cuestionario</h4>
                    <p className="text-sm text-slate-600">Cada pregunta se responde en escala de 5 opciones:</p>
                    <ul className="text-sm text-slate-600 mt-1 ml-4">
                      <li>• Siempre (0 puntos)</li>
                      <li>• Casi siempre (1 punto)</li>
                      <li>• Algunas veces (2 puntos)</li>
                      <li>• Casi nunca (3 puntos)</li>
                      <li>• Nunca (4 puntos)</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <h4 className="font-semibold">Puntuación Inversa</h4>
                    <p className="text-sm text-slate-600">Algunas preguntas tienen puntuación inversa (se invierten los valores) para preguntas formuladas en sentido negativo.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">4</div>
                  <div>
                    <h4 className="font-semibold">Cálculo por Dominios</h4>
                    <p className="text-sm text-slate-600">Se suman las puntuaciones por cada dominio evaluado y se comparan con umbrales específicos.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">5</div>
                  <div>
                    <h4 className="font-semibold">Puntuación Final</h4>
                    <p className="text-sm text-slate-600">Se obtiene la suma total de todas las respuestas y se clasifica según los umbrales oficiales de riesgo.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">6</div>
                  <div>
                    <h4 className="font-semibold">Recomendaciones</h4>
                    <p className="text-sm text-slate-600">Según el nivel de riesgo obtenido, se generan recomendaciones específicas y se determina la periodicidad de la próxima evaluación.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sistema de Puntuación Oficial</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertTitle>Escala de Respuestas</AlertTitle>
                  <AlertDescription>
                    Cada pregunta se responde según la frecuencia con que ocurre la situación descrita.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Puntuación Normal</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between p-2 bg-green-50 rounded">
                        <span>Siempre</span>
                        <Badge variant="outline">0 puntos</Badge>
                      </div>
                      <div className="flex justify-between p-2 bg-green-50 rounded">
                        <span>Casi siempre</span>
                        <Badge variant="outline">1 punto</Badge>
                      </div>
                      <div className="flex justify-between p-2 bg-yellow-50 rounded">
                        <span>Algunas veces</span>
                        <Badge variant="outline">2 puntos</Badge>
                      </div>
                      <div className="flex justify-between p-2 bg-red-50 rounded">
                        <span>Casi nunca</span>
                        <Badge variant="outline">3 puntos</Badge>
                      </div>
                      <div className="flex justify-between p-2 bg-red-50 rounded">
                        <span>Nunca</span>
                        <Badge variant="outline">4 puntos</Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Puntuación Inversa</h4>
                    <p className="text-sm text-slate-600 mb-3">Para preguntas formuladas negativamente</p>
                    <div className="space-y-2">
                      <div className="flex justify-between p-2 bg-red-50 rounded">
                        <span>Siempre</span>
                        <Badge variant="outline">4 puntos</Badge>
                      </div>
                      <div className="flex justify-between p-2 bg-red-50 rounded">
                        <span>Casi siempre</span>
                        <Badge variant="outline">3 puntos</Badge>
                      </div>
                      <div className="flex justify-between p-2 bg-yellow-50 rounded">
                        <span>Algunas veces</span>
                        <Badge variant="outline">2 puntos</Badge>
                      </div>
                      <div className="flex justify-between p-2 bg-green-50 rounded">
                        <span>Casi nunca</span>
                        <Badge variant="outline">1 punto</Badge>
                      </div>
                      <div className="flex justify-between p-2 bg-green-50 rounded">
                        <span>Nunca</span>
                        <Badge variant="outline">0 puntos</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <Alert>
                  <AlertTitle>Importante</AlertTitle>
                  <AlertDescription>
                    La puntuación inversa se aplica a preguntas que describen situaciones negativas o problemáticas. 
                    Por ejemplo: "Recibo burlas o humillaciones" - Si la respuesta es "Siempre", esto indica alto riesgo, por lo que se asignan 4 puntos.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domains" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dominios de Evaluación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(officialDomains).map(([key, name]) => (
                  <div key={key} className="border rounded-lg p-4">
                    <h4 className="font-semibold text-slate-900">{name}</h4>
                    <p className="text-sm text-slate-600 mt-1">
                      {key === 'ambiente_trabajo' && 'Evalúa las condiciones físicas y de seguridad del lugar de trabajo'}
                      {key === 'carga_trabajo' && 'Evalúa la cantidad y complejidad del trabajo asignado'}
                      {key === 'control_trabajo' && 'Evalúa el grado de autonomía y participación en las decisiones'}
                      {key === 'liderazgo' && 'Evalúa la calidad del liderazgo y la comunicación con supervisores'}
                      {key === 'relaciones_trabajo' && 'Evalúa las relaciones interpersonales en el trabajo'}
                      {key === 'violencia' && 'Evalúa la presencia de actos de violencia laboral'}
                      {key === 'entorno_organizacional' && 'Evalúa el ambiente organizacional favorable (solo para empresas 50+)'}
                    </p>
                    <Badge className="mt-2" variant="outline">
                      {key === 'entorno_organizacional' ? 'Solo empresas 50+' : 'Todas las empresas'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="thresholds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Umbrales de Riesgo Oficiales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Para empresas de 16-50 empleados (Guía II)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                    {Object.entries(officialRiskThresholds.guideII).map(([level, range]) => (
                      <div key={level} className="text-center p-3 border rounded">
                        <div className="text-sm font-medium capitalize">{level.replace('_', ' ')}</div>
                        <div className="text-xs text-slate-600">{range.min}-{range.max}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Para empresas de 50+ empleados (Guía III)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                    {Object.entries(officialRiskThresholds.guideIII).map(([level, range]) => (
                      <div key={level} className="text-center p-3 border rounded">
                        <div className="text-sm font-medium capitalize">{level.replace('_', ' ')}</div>
                        <div className="text-xs text-slate-600">{range.min}-{range.max}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <Alert>
                  <AlertTitle>Interpretación de Niveles</AlertTitle>
                  <AlertDescription>
                    <div className="space-y-1 mt-2">
                      <div>• <strong>Nulo/Despreciable:</strong> No requiere medidas adicionales</div>
                      <div>• <strong>Bajo:</strong> Acciones de prevención primaria</div>
                      <div>• <strong>Medio:</strong> Programa de prevención específico</div>
                      <div>• <strong>Alto:</strong> Medidas de control inmediatas</div>
                      <div>• <strong>Muy Alto:</strong> Medidas urgentes e inmediatas</div>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="example" className="space-y-4">
          <MethodologyDemo companySize={selectedCompanySize} />
        </TabsContent>

        <TabsContent value="trauma" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evaluación de Acontecimientos Traumáticos Severos</CardTitle>
              <p className="text-sm text-slate-600">Guía de Referencia I - Obligatorio para todas las empresas</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertTitle>Propósito</AlertTitle>
                  <AlertDescription>
                    Identificar trabajadores que han estado expuestos a acontecimientos traumáticos severos durante o con motivo del trabajo, 
                    que puedan generar trastorno de estrés postraumático.
                  </AlertDescription>
                </Alert>

                <div>
                  <h4 className="font-semibold mb-3">Tipos de Acontecimientos Evaluados</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 border rounded">
                      <div className="font-medium text-sm">Accidentes graves</div>
                      <div className="text-xs text-slate-600">Que tengan como consecuencia muerte o lesiones graves</div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="font-medium text-sm">Asaltos</div>
                      <div className="text-xs text-slate-600">Actos violentos durante el trabajo</div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="font-medium text-sm">Actos violentos</div>
                      <div className="text-xs text-slate-600">Que derivaron en lesiones graves</div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="font-medium text-sm">Secuestro</div>
                      <div className="text-xs text-slate-600">Durante o relacionado con el trabajo</div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="font-medium text-sm">Amenazas</div>
                      <div className="text-xs text-slate-600">Que pongan en riesgo la integridad</div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="font-medium text-sm">Otros eventos</div>
                      <div className="text-xs text-slate-600">Que hayan puesto en riesgo la vida o salud</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Criterios de Evaluación</h4>
                  <div className="space-y-2">
                    <div className="p-3 bg-red-50 border border-red-200 rounded">
                      <div className="font-medium text-sm text-red-800">Requiere Atención Inmediata</div>
                      <div className="text-xs text-red-600 mt-1">
                        Cualquier respuesta positiva a los acontecimientos traumáticos requiere canalización inmediata 
                        a servicios médicos y psicológicos especializados.
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Acciones Requeridas</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-slate-400">1.</span>
                      <span>Canalizar al trabajador para atención médica y psicológica</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-400">2.</span>
                      <span>Realizar evaluación específica del evento traumático</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-400">3.</span>
                      <span>Implementar medidas de apoyo inmediato</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-400">4.</span>
                      <span>Considerar modificaciones en las condiciones de trabajo</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-400">5.</span>
                      <span>Mantener seguimiento médico y psicológico continuo</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}