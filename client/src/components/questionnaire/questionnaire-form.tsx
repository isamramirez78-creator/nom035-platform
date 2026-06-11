import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { nom035Questions } from "@/data/nom035-questions";
import { calculateNOM035Risk } from "@/utils/nom035-calculator";
import type { QuestionnaireAnswer } from "@shared/schema";

interface QuestionnaireFormProps {
  employeeId: number;
  questionnaireType: string;
  onComplete: () => void;
}

export default function QuestionnaireForm({ 
  employeeId, 
  questionnaireType, 
  onComplete 
}: QuestionnaireFormProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<QuestionnaireAnswer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState<string>("");
  const { toast } = useToast();

  const questions = nom035Questions[questionnaireType as keyof typeof nom035Questions] || [];
  const totalQuestions = questions.length;
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  const saveEvaluationMutation = useMutation({
    mutationFn: async (evaluationData: any) => {
      const response = await apiRequest("POST", "/api/evaluations", evaluationData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/evaluations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Evaluación completada",
        description: "La evaluación se ha guardado correctamente",
      });
      onComplete();
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
    if (!currentAnswer) {
      toast({
        title: "Respuesta requerida",
        description: "Por favor selecciona una respuesta antes de continuar",
        variant: "destructive",
      });
      return;
    }

    const newAnswer: QuestionnaireAnswer = {
      questionId: currentQuestion,
      value: parseInt(currentAnswer)
    };

    const updatedAnswers = [...answers];
    const existingIndex = updatedAnswers.findIndex(a => a.questionId === currentQuestion);
    
    if (existingIndex >= 0) {
      updatedAnswers[existingIndex] = newAnswer;
    } else {
      updatedAnswers.push(newAnswer);
    }
    
    setAnswers(updatedAnswers);

    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setCurrentAnswer("");
    } else {
      // Complete the questionnaire
      completeQuestionnaire(updatedAnswers);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      const previousAnswer = answers.find(a => a.questionId === currentQuestion - 1);
      setCurrentAnswer(previousAnswer?.value.toString() || "");
    }
  };

  const completeQuestionnaire = (finalAnswers: QuestionnaireAnswer[]) => {
    const result = calculateNOM035Risk(finalAnswers, questionnaireType);
    
    const evaluationData = {
      employeeId,
      questionnaireType,
      answers: finalAnswers,
      domainScores: result.domainScores || [],
      recommendations: result.recommendations || [],
      riskLevel: result.riskLevel || 'sin-riesgo',
      overallScore: result.overallScore || 0,
      completed: true
    };

    if (onComplete) {
      onComplete(evaluationData);
    } else {
      saveEvaluationMutation.mutate(evaluationData);
    }
  };

  // Load existing answer for current question
  useEffect(() => {
    const existingAnswer = answers.find(a => a.questionId === currentQuestion);
    setCurrentAnswer(existingAnswer?.value.toString() || "");
  }, [currentQuestion, answers]);

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-slate-500">
            <i className="fas fa-exclamation-triangle text-4xl mb-4"></i>
            <p>No se encontraron preguntas para este tipo de cuestionario</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentQuestionData = questions[currentQuestion];

  return (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-slate-900">Evaluación en Progreso</h3>
            <span className="text-sm text-slate-500">
              Pregunta {currentQuestion + 1} de {totalQuestions}
            </span>
          </div>
          <Progress value={progress} className="w-full" />
        </CardHeader>
        
        <CardContent>
          <div className="mb-6">
            <h4 className="text-base font-medium text-slate-900 mb-2">
              Pregunta {currentQuestion + 1}: {currentQuestionData.question}
            </h4>
            <p className="text-sm text-slate-600">Selecciona la opción que mejor describa tu situación actual:</p>
          </div>

          <RadioGroup value={currentAnswer} onValueChange={setCurrentAnswer}>
            <div className="space-y-3">
              {currentQuestionData.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>

          <div className="flex justify-between mt-8">
            <Button 
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              variant="outline"
            >
              <i className="fas fa-chevron-left mr-2"></i>Anterior
            </Button>
            <Button 
              onClick={handleNext}
              className="bg-brand-600 hover:bg-brand-700"
              disabled={saveEvaluationMutation.isPending}
            >
              {saveEvaluationMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>Guardando...
                </>
              ) : currentQuestion === totalQuestions - 1 ? (
                <>Finalizar Evaluación<i className="fas fa-check ml-2"></i></>
              ) : (
                <>Siguiente<i className="fas fa-chevron-right ml-2"></i></>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Dominios de la NOM-035-STPS</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-blue-800">
          <div>• Ambiente de trabajo</div>
          <div>• Factores propios de la actividad</div>
          <div>• Organización del tiempo</div>
          <div>• Liderazgo y relaciones</div>
        </div>
      </div>
    </div>
  );
}
