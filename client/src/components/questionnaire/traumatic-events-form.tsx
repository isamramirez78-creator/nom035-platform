// Formulario específico para el cuestionario de eventos traumáticos NOM-035-STPS-2018
// Guía de Referencia I - Obligatorio para todas las empresas

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getTraumaticEventsQuestionnaire } from "@/data/nom035-official-questions";
import { evaluateTraumaticEvents } from "@/utils/nom035-official-calculator";

interface TraumaticEventsFormProps {
  employeeId: number;
  invitationToken?: string;
  onComplete: () => void;
}

export default function TraumaticEventsForm({ employeeId, invitationToken, onComplete }: TraumaticEventsFormProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: boolean }>({});
  const [currentAnswer, setCurrentAnswer] = useState<boolean | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const { toast } = useToast();

  const questions = getTraumaticEventsQuestionnaire();
  const totalQuestions = questions.length;
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;
  const currentQuestionData = questions[currentQuestion];

  const saveEvaluationMutation = useMutation({
    mutationFn: async (evaluationData: any) => {
      const url = "/api/evaluations";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const tk = localStorage.getItem("company_token");
      if (tk) headers["Authorization"] = `Bearer ${tk}`;
      const response = await fetch(url, {
        method: "POST", headers, body: JSON.stringify(evaluationData)
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(JSON.stringify(err));
      }
      return response;
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/evaluations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setIsCompleted(true);
      toast({
        title: "Evaluación de eventos traumáticos completada",
        description: "La evaluación se ha guardado correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la evaluación",
        variant: "destructive",
      });
    },
  });

  const handleNext = () => {
    if (currentAnswer !== null) {
      const newAnswers = { ...answers, [currentQuestionData.id]: currentAnswer };
      setAnswers(newAnswers);

      if (currentQuestion < totalQuestions - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setCurrentAnswer(null);
      } else {
        // Completar evaluación
        completeEvaluation(newAnswers);
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      const previousQuestionId = questions[currentQuestion - 1].id;
      setCurrentAnswer(answers[previousQuestionId] ?? null);
    }
  };

  const completeEvaluation = (finalAnswers: { [key: number]: boolean }) => {
    // Convertir respuestas al formato esperado
    const traumaticAnswers = Object.entries(finalAnswers).map(([questionId, value]) => ({
      questionId: parseInt(questionId),
      value: value
    }));

    // Evaluar eventos traumáticos
    const traumaticResult = evaluateTraumaticEvents(traumaticAnswers);

    // Preparar datos para guardar - convertir respuestas boolean a número
    const numericAnswers = traumaticAnswers.map(answer => ({
      questionId: answer.questionId,
      value: typeof answer.value === 'boolean' ? (answer.value ? 1 : 0) : Number(answer.value)
    }));
    
    const evaluationData = {
      employeeId,
      questionnaireType: "traumatic_events",
      answers: numericAnswers,
      domainScores: [{
        domain: "traumatic_events",
        score: traumaticResult.hasTraumaticExposure ? 1 : 0,
        maxScore: 1,
        percentage: traumaticResult.hasTraumaticExposure ? 100 : 0
      }],
      overallScore: traumaticResult.hasTraumaticExposure ? 1 : 0,
      riskLevel: traumaticResult.requiresAttention ? "muy-alto" : "sin-riesgo",
      recommendations: traumaticResult.recommendations,
      completed: true,
      completedAt: new Date().toISOString(),
      // Campos específicos NOM-035
      finalScore: traumaticResult.hasTraumaticExposure ? 1 : 0,
      maxPossibleScore: 1,
      riskCategory: traumaticResult.requiresAttention ? "Requiere atención inmediata" : "Sin exposición traumática",
      evaluationMethod: "cuestionario",
      evaluatorName: "Sistema automatizado",
      evaluatorRole: "Evaluación NOM-035",
      nextEvaluationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año
      requiresMedicalAttention: traumaticResult.requiresAttention,
      requiresPsychologicalAttention: traumaticResult.requiresAttention,
      traumaticEvents: traumaticResult,
      hasTraumaticExposure: traumaticResult.hasTraumaticExposure,
      invitationToken: invitationToken || null
    };

    saveEvaluationMutation.mutate(evaluationData);
  };

  // Mostrar resultados si está completado
  if (isCompleted) {
    const traumaticAnswers = Object.entries(answers).map(([questionId, value]) => ({
      questionId: parseInt(questionId),
      value: value
    }));
    const result = evaluateTraumaticEvents(traumaticAnswers);

    return (
      <Card>
        <CardHeader>
          <CardTitle>Evaluación de Eventos Traumáticos Completada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className={result.requiresAttention ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
            <AlertTitle className={result.requiresAttention ? "text-red-800" : "text-green-800"}>
              {result.hasTraumaticExposure ? "Exposición a Eventos Traumáticos Detectada" : "Sin Exposición a Eventos Traumáticos"}
            </AlertTitle>
            <AlertDescription className={result.requiresAttention ? "text-red-700" : "text-green-700"}>
              {result.requiresAttention 
                ? "El trabajador ha estado expuesto a acontecimientos traumáticos severos. Se requiere atención inmediata."
                : "El trabajador no reporta exposición a acontecimientos traumáticos severos."
              }
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-slate-900">
                {Object.values(answers).filter(Boolean).length}
              </div>
              <div className="text-sm text-slate-600">Respuestas Positivas</div>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <Badge className={result.requiresAttention ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                {result.requiresAttention ? "Requiere Atención" : "Sin Riesgo"}
              </Badge>
              <div className="text-sm text-slate-600 mt-2">Estado</div>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-lg font-semibold text-slate-900">{result.recommendations.length}</div>
              <div className="text-sm text-slate-600">Recomendaciones</div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Acciones Requeridas</h4>
            <ul className="space-y-2 text-sm">
              {result.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-slate-400 mt-1">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {result.requiresAttention && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTitle className="text-red-800">Atención Urgente Requerida</AlertTitle>
              <AlertDescription className="text-red-700">
                Según la NOM-035-STPS-2018, cualquier exposición a acontecimientos traumáticos severos 
                requiere canalización inmediata a servicios médicos y psicológicos especializados.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button onClick={onComplete} className="flex-1">
              <i className="fas fa-check mr-2"></i>
              Finalizar Evaluación
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <i className="fas fa-print mr-2"></i>
              Imprimir Resultados
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cuestionario de Acontecimientos Traumáticos Severos</CardTitle>
        <p className="text-sm text-slate-600">
          Guía de Referencia I - NOM-035-STPS-2018 (Obligatorio para todas las empresas)
        </p>
        <Progress value={progress} className="mt-2" />
        <div className="text-xs text-slate-600">
          Pregunta {currentQuestion + 1} de {totalQuestions}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertTitle>Instrucciones</AlertTitle>
          <AlertDescription>
            Las siguientes preguntas se refieren a acontecimientos que puede haber presenciado o sufrido 
            durante o con motivo de su trabajo. Responda con sinceridad.
          </AlertDescription>
        </Alert>

        <div>
          <h4 className="font-medium text-lg mb-4">
            {currentQuestionData.question}
          </h4>
          
          <RadioGroup
            value={currentAnswer?.toString() || ""}
            onValueChange={(value) => setCurrentAnswer(value === "true")}
          >
            <div className="space-y-3">
              <div className="flex items-center space-x-2 p-3 border rounded hover:bg-slate-50">
                <RadioGroupItem value="true" id="yes" />
                <Label htmlFor="yes" className="flex-1 cursor-pointer">
                  <span className="font-medium">Sí</span>
                  <span className="text-sm text-slate-600 block">
                    He presenciado o sufrido este tipo de acontecimiento
                  </span>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded hover:bg-slate-50">
                <RadioGroupItem value="false" id="no" />
                <Label htmlFor="no" className="flex-1 cursor-pointer">
                  <span className="font-medium">No</span>
                  <span className="text-sm text-slate-600 block">
                    No he presenciado ni sufrido este tipo de acontecimiento
                  </span>
                </Label>
              </div>
            </div>
          </RadioGroup>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h5 className="font-medium text-blue-900 mb-2">Información importante</h5>
          <p className="text-sm text-blue-800">
            Esta evaluación es confidencial y tiene como objetivo identificar si ha estado expuesto 
            a situaciones que puedan afectar su bienestar psicológico. Sus respuestas nos ayudarán 
            a brindarle el apoyo necesario si lo requiere.
          </p>
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Anterior
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={currentAnswer === null || saveEvaluationMutation.isPending}
            className="bg-brand-600 hover:bg-brand-700"
          >
            {currentQuestion < totalQuestions - 1 ? (
              <>
                Siguiente
                <i className="fas fa-arrow-right ml-2"></i>
              </>
            ) : (
              <>
                {saveEvaluationMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Guardando...
                  </>
                ) : (
                  <>
                    Completar Evaluación
                    <i className="fas fa-check ml-2"></i>
                  </>
                )}
              </>
            )}
          </Button>
        </div>

        <div className="text-xs text-slate-500 text-center">
          Pregunta {currentQuestion + 1} de {totalQuestions} - 
          {Math.round(((currentQuestion + 1) / totalQuestions) * 100)}% completado
        </div>
      </CardContent>
    </Card>
  );
}