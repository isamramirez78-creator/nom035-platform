import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import QuestionnaireForm from "@/components/questionnaire/questionnaire-form";
import TraumaticEventsForm from "@/components/questionnaire/traumatic-events-form";
import QuestionnaireGuard from "@/components/questionnaire/questionnaire-guard";
import type { Employee } from "@shared/schema";

export default function Questionnaires() {
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [questionnaireType, setQuestionnaireType] = useState<string>("");
  const [isQuestionnaireActive, setIsQuestionnaireActive] = useState(false);

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const handleStartQuestionnaire = () => {
    if (selectedEmployee && questionnaireType) {
      setIsQuestionnaireActive(true);
    }
  };

  const handleQuestionnaireComplete = () => {
    setIsQuestionnaireActive(false);
    setSelectedEmployee(null);
    setQuestionnaireType("");
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Cuestionarios NOM-035</h2>
        <p className="text-slate-600">Aplicación de evaluaciones de riesgos psicosociales según la normativa oficial</p>
      </div>

      {!isQuestionnaireActive ? (
        <>
          {/* Alert sobre cuestionario de eventos traumáticos */}
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertTitle className="text-orange-800">Cuestionario de Acontecimientos Traumáticos Severos - Guía de Referencia I</AlertTitle>
            <AlertDescription className="text-orange-700">
              Según la NOM-035-STPS-2018, el cuestionario de eventos traumáticos es <strong>obligatorio para todas las empresas</strong> 
              sin importar el número de trabajadores. Se debe aplicar periódicamente para identificar trabajadores 
              que requieren atención médica y psicológica especializada inmediata.
            </AlertDescription>
          </Alert>
          {/* Employee Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Seleccionar Empleado para Evaluación</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Empleado</label>
                <Select value={selectedEmployee?.toString() || ""} onValueChange={(value) => setSelectedEmployee(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar empleado" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(employee => (
                      <SelectItem key={employee.id} value={employee.id.toString()}>
                        {employee.nombre} {employee.apellidos} - {employee.puesto}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Cuestionario</label>
                <Select value={questionnaireType} onValueChange={setQuestionnaireType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="microempresa">Cuestionario para Microempresas (1-15 trabajadores) - 22 preguntas</SelectItem>
                    <SelectItem value="guia1">Guía de Referencia I (16-49 trabajadores) - 46 preguntas</SelectItem>
                    <SelectItem value="guia2">Guía de Referencia II (50+ trabajadores) - 71 preguntas</SelectItem>
                    <SelectItem value="guia3">Guía de Referencia III (50+ trabajadores) - 96 preguntas</SelectItem>
                    <SelectItem value="traumatic_events">
                      <div className="flex items-center gap-2">
                        <span>Acontecimientos Traumáticos Severos</span>
                        <Badge variant="outline">7 preguntas</Badge>
                        <Badge className="bg-red-100 text-red-800">Obligatorio</Badge>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleStartQuestionnaire}
                  disabled={!selectedEmployee || !questionnaireType}
                  className="w-full bg-brand-600 hover:bg-brand-700"
                >
                  <i className="fas fa-play mr-2"></i>Iniciar Evaluación
                </Button>
              </div>
            </div>
          </div>

          {/* Information about NOM-035 domains */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Dominios de la NOM-035-STPS</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-blue-800">
              <div>• Ambiente de trabajo</div>
              <div>• Factores propios de la actividad</div>
              <div>• Organización del tiempo</div>
              <div>• Liderazgo y relaciones</div>
            </div>
          </div>
        </>
      ) : (
        <>
          {questionnaireType === "traumatic_events" ? (
            <QuestionnaireGuard
              employeeId={selectedEmployee!}
              questionnaireType={questionnaireType}
              onCanStart={() => {
                // Continue with questionnaire
              }}
              onCannotStart={() => {
                setIsQuestionnaireActive(false);
                setSelectedEmployee(null);
                setQuestionnaireType("");
              }}
            >
              <TraumaticEventsForm
                employeeId={selectedEmployee!}
                onComplete={handleQuestionnaireComplete}
              />
            </QuestionnaireGuard>
          ) : (
            <QuestionnaireGuard
              employeeId={selectedEmployee!}
              questionnaireType={questionnaireType}
              onCanStart={() => {
                // Continue with questionnaire
              }}
              onCannotStart={() => {
                setIsQuestionnaireActive(false);
                setSelectedEmployee(null);
                setQuestionnaireType("");
              }}
            >
              <QuestionnaireForm
                employeeId={selectedEmployee!}
                questionnaireType={questionnaireType}
                onComplete={handleQuestionnaireComplete}
              />
            </QuestionnaireGuard>
          )}
        </>
      )}
    </div>
  );
}
