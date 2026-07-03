import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  microenterpriseQuestionnaire,
  guideIIQuestionnaire,
  guideIIIQuestionnaire,
  getOfficialQuestionnaire,
  officialDomains,
} from "@/data/nom035-official-questions";
import { calculateOfficialNOM035Evaluation } from "@/utils/nom035-official-calculator";
import { CheckCircle, AlertCircle } from "lucide-react";

interface StandardQuestionnaireFormProps {
  employeeId: number;
  questionnaireType: string;
  invitationToken: string;
  onComplete?: () => void;
}

export default function StandardQuestionnaireForm({
  employeeId,
  questionnaireType,
  invitationToken,
  onComplete
}: StandardQuestionnaireFormProps) {
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get the appropriate questionnaire based on type
  const getQuestionnaire = () => {
    switch (questionnaireType) {
      // Tipos NOM-035 (nuevos)
      case "guia1":
      case "traumatic_events":
      case "microenterprise":
        return microenterpriseQuestionnaire;
      case "guia2":
      case "guide_ii":
        return guideIIQuestionnaire;
      case "guia3":
      case "guide_iii":
        return guideIIIQuestionnaire;
      default:
        return guideIIIQuestionnaire; // Default Guía III (más completa)
    }
  };

  const questionnaire = getQuestionnaire();
  const totalQuestions = questionnaire.length;
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  const submitEvaluationMutation = useMutation({
    mutationFn: async (evaluationData: any) => {
      // Siempre usar endpoint público cuando hay invitationToken
      const url = "/api/evaluations/public";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(evaluationData),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Error al guardar");
      return json;
    },
    onSuccess: () => {
      toast({
        title: "Evaluación completada",
        description: "Tu evaluación ha sido enviada exitosamente.",
      });
      if (onComplete) onComplete();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al enviar la evaluación",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const handleAnswerChange = (questionId: string, value: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Calculate results using official algorithm
      const answersList = Object.entries(answers).map(([questionId, value]) => ({
        questionId: parseInt(questionId),
        value,
        domain: questionnaire.find((q: any) => q.id === parseInt(questionId))?.domain || "",
        reverseScored: questionnaire.find((q: any) => q.id === parseInt(questionId))?.reverseScored
      }));

      const evaluation = calculateOfficialNOM035Evaluation(
        employeeId,
        answersList,
        50 // Default company size
      );

      const evaluationData = {
        employeeId,
        questionnaireType,
        answers: answersList,  // array format for public endpoint
        results: evaluation,
        invitationToken
      };

      await submitEvaluationMutation.mutateAsync(evaluationData);
    } catch (error) {
      console.error("Error submitting evaluation:", error);
      setIsSubmitting(false);
    }
  };

  const currentQ = questionnaire[currentQuestion];
  const currentAnswer = answers[currentQ.id.toString()];
  const canProceed = currentAnswer !== undefined;
  const allAnswered = questionnaire.every((q: any) => answers[q.id.toString()] !== undefined);

  if (!currentQ) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Error al cargar el cuestionario
            </h2>
            <p className="text-gray-600">
              No se pudo cargar el cuestionario. Por favor, contacta al administrador.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Pregunta {currentQuestion + 1} de {totalQuestions}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(progress)}% completado
          </span>
        </div>
        <Progress value={progress} className="w-full" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {currentQ.question}
          </CardTitle>
          {currentQ.category && (
            <p className="text-sm text-gray-600">
              Categoría: {currentQ.category}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={currentAnswer?.toString() || ""}
            onValueChange={(value) => handleAnswerChange(currentQ.id.toString(), parseInt(value))}
          >
            {currentQ.options.map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="flex justify-between mt-6">
            <Button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              variant="outline"
            >
              Anterior
            </Button>
            
            {currentQuestion === totalQuestions - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={!allAnswered || isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  "Enviando..."
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Completar Evaluación
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceed}
              >
                Siguiente
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}