// Página para mostrar el estado de evaluaciones de eventos traumáticos
// Dashboard específico para monitorear trabajadores con exposición traumática

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function TraumaticEventsStatus() {
  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
  });

  const { data: evaluations = [] } = useQuery({
    queryKey: ['/api/evaluations'],
  });

  // Filtrar evaluaciones de eventos traumáticos
  const traumaticEvaluations = evaluations.filter(
    (evaluation: any) => evaluation.questionnaireType === "traumatic_events"
  );

  // Estadísticas
  const totalEmployees = employees.length;
  const evaluatedEmployees = traumaticEvaluations.length;
  const pendingEmployees = totalEmployees - evaluatedEmployees;
  const exposedEmployees = traumaticEvaluations.filter(
    (evaluation: any) => evaluation.hasTraumaticExposure
  ).length;
  const requireAttention = traumaticEvaluations.filter(
    (evaluation: any) => evaluation.requiresMedicalAttention || evaluation.requiresPsychologicalAttention
  ).length;

  const completionPercentage = totalEmployees > 0 ? Math.round((evaluatedEmployees / totalEmployees) * 100) : 0;

  const getEmployeeName = (employeeId: number) => {
    const employee = employees.find((emp: any) => emp.id === employeeId);
    return employee ? `${employee.nombre} ${employee.apellidos}` : 'Empleado no encontrado';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Estado de Evaluaciones de Acontecimientos Traumáticos
        </h2>
        <p className="text-slate-600">
          Monitoreo del cumplimiento del numeral 5.5 de la NOM-035-STPS-2018
        </p>
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-slate-900">{totalEmployees}</div>
            <div className="text-sm text-slate-600">Total Empleados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{evaluatedEmployees}</div>
            <div className="text-sm text-slate-600">Evaluados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{pendingEmployees}</div>
            <div className="text-sm text-slate-600">Pendientes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{exposedEmployees}</div>
            <div className="text-sm text-slate-600">Con Exposición</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{requireAttention}</div>
            <div className="text-sm text-slate-600">Requieren Atención</div>
          </CardContent>
        </Card>
      </div>

      {/* Progreso de evaluaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Progreso de Evaluaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Completado: {evaluatedEmployees} de {totalEmployees} empleados</span>
              <span>{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} />
          </div>
        </CardContent>
      </Card>

      {/* Alertas de atención urgente */}
      {requireAttention > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTitle className="text-red-800">Atención Urgente Requerida</AlertTitle>
          <AlertDescription className="text-red-700">
            {requireAttention} trabajador(es) han reportado exposición a acontecimientos traumáticos 
            y requieren canalización inmediata a servicios médicos y psicológicos especializados.
          </AlertDescription>
        </Alert>
      )}

      {/* Lista de empleados con exposición traumática */}
      {exposedEmployees > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-800">Empleados con Exposición Traumática</CardTitle>
            <p className="text-sm text-red-600">
              Trabajadores que requieren atención inmediata según NOM-035-STPS-2018
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {traumaticEvaluations
                .filter((evaluation: any) => evaluation.hasTraumaticExposure)
                .map((evaluation: any) => (
                  <div key={evaluation.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-red-900">
                          {getEmployeeName(evaluation.employeeId)}
                        </h4>
                        <p className="text-sm text-red-700 mt-1">
                          Evaluado el: {formatDate(evaluation.completedAt)}
                        </p>
                        <div className="flex gap-2 mt-2">
                          {evaluation.requiresMedicalAttention && (
                            <Badge className="bg-red-100 text-red-800">Atención Médica</Badge>
                          )}
                          {evaluation.requiresPsychologicalAttention && (
                            <Badge className="bg-purple-100 text-purple-800">Atención Psicológica</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Ver Detalles
                        </Button>
                        <Button size="sm" className="bg-red-600 hover:bg-red-700">
                          Gestionar Atención
                        </Button>
                      </div>
                    </div>
                    
                    {evaluation.recommendations && evaluation.recommendations.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-red-200">
                        <h5 className="font-medium text-red-900 mb-2">Acciones Requeridas:</h5>
                        <ul className="text-sm text-red-700 space-y-1">
                          {evaluation.recommendations.slice(0, 3).map((rec: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-red-400 mt-1">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de empleados evaluados sin exposición */}
      <Card>
        <CardHeader>
          <CardTitle>Empleados Evaluados - Sin Exposición Traumática</CardTitle>
          <p className="text-sm text-slate-600">
            Trabajadores que han completado la evaluación sin reportar exposición
          </p>
        </CardHeader>
        <CardContent>
          {traumaticEvaluations.filter((evaluation: any) => !evaluation.hasTraumaticExposure).length > 0 ? (
            <div className="space-y-2">
              {traumaticEvaluations
                .filter((evaluation: any) => !evaluation.hasTraumaticExposure)
                .map((evaluation: any) => (
                  <div key={evaluation.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{getEmployeeName(evaluation.employeeId)}</div>
                      <div className="text-sm text-slate-600">
                        Evaluado el: {formatDate(evaluation.completedAt)}
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Sin Exposición</Badge>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">
              No hay empleados evaluados sin exposición traumática
            </p>
          )}
        </CardContent>
      </Card>

      {/* Empleados pendientes de evaluación */}
      {pendingEmployees > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Empleados Pendientes de Evaluación</CardTitle>
            <p className="text-sm text-slate-600">
              Trabajadores que aún no han completado el cuestionario de eventos traumáticos
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {employees
                .filter((employee: any) => 
                  !traumaticEvaluations.some((evaluation: any) => evaluation.employeeId === employee.id)
                )
                .map((employee: any) => (
                  <div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{employee.nombre} {employee.apellidos}</div>
                      <div className="text-sm text-slate-600">{employee.puesto} - {employee.area}</div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">Pendiente</Badge>
                      <Button size="sm" variant="outline">
                        Enviar Invitación
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información legal */}
      <Alert>
        <AlertTitle>Marco Legal - NOM-035-STPS-2018</AlertTitle>
        <AlertDescription>
          <div className="space-y-2 mt-2">
            <div><strong>Numeral 5.5:</strong> Identificar a los trabajadores que fueron sujetos a acontecimientos traumáticos severos durante o con motivo del trabajo</div>
            <div><strong>Obligación:</strong> Canalizar para su atención a la institución de seguridad social o privada, o al médico del centro de trabajo</div>
            <div><strong>Periodicidad:</strong> Se debe aplicar de manera continua y cada vez que se identifique un evento traumático</div>
            <div><strong>Confidencialidad:</strong> Los resultados deben manejarse con estricta confidencialidad</div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}