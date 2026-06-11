// Componente demo para mostrar el proceso de evaluación en tiempo real
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getOfficialQuestionnaire } from "@/data/nom035-official-questions";
import { calculateOfficialNOM035Evaluation } from "@/utils/nom035-official-calculator";

interface MethodologyDemoProps {
  companySize: number;
}

export default function MethodologyDemo({ companySize }: MethodologyDemoProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  
  const questionnaire = getOfficialQuestionnaire(companySize);
  const currentQuestion = questionnaire[currentStep];
  
  const handleAnswer = (value: number) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);
    
    if (currentStep < questionnaire.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const calculateResults = () => {
    const evaluationAnswers = Object.entries(answers).map(([questionId, value]) => {
      const question = questionnaire.find(q => q.id === parseInt(questionId));
      return {
        questionId: parseInt(questionId),
        value,
        domain: question?.domain || '',
        reverseScored: question?.reverseScored
      };
    });

    return calculateOfficialNOM035Evaluation(1, evaluationAnswers, companySize);
  };

  const progress = (Object.keys(answers).length / questionnaire.length) * 100;
  const isComplete = Object.keys(answers).length === questionnaire.length;
  const results = isComplete ? calculateResults() : null;

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'sin-riesgo': return 'bg-green-100 text-green-800';
      case 'bajo': return 'bg-blue-100 text-blue-800';
      case 'medio': return 'bg-yellow-100 text-yellow-800';
      case 'alto': return 'bg-orange-100 text-orange-800';
      case 'muy-alto': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const reset = () => {
    setCurrentStep(0);
    setAnswers({});
  };

  if (isComplete && results) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resultados de la Evaluación Demo</CardTitle>
          <p className="text-sm text-slate-600">
            Resultados simulados usando la metodología oficial NOM-035-STPS-2018
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-slate-900">{results.finalScore}</div>
              <div className="text-sm text-slate-600">Puntuación Final</div>
              <div className="text-xs text-slate-500">de {results.maxPossibleScore} máximo</div>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <Badge className={getRiskColor(results.riskLevel)}>
                {results.riskCategory}
              </Badge>
              <div className="text-sm text-slate-600 mt-2">Nivel de Riesgo</div>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-lg font-semibold text-slate-900">{results.domainScores.length}</div>
              <div className="text-sm text-slate-600">Dominios Evaluados</div>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-lg font-semibold text-slate-900">{results.recommendations.length}</div>
              <div className="text-sm text-slate-600">Recomendaciones</div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Puntuaciones por Dominio</h4>
            <div className="space-y-2">
              {results.domainScores.map((domain) => (
                <div key={domain.domain} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{domain.domainName}</div>
                    <div className="text-xs text-slate-600">
                      {domain.score} de {domain.maxScore} puntos ({domain.percentage}%)
                    </div>
                  </div>
                  <Badge className={getRiskColor(domain.riskLevel)} variant="secondary">
                    {domain.riskLevel}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Principales Recomendaciones</h4>
            <ul className="space-y-1 text-sm">
              {results.recommendations.slice(0, 5).map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-slate-400 mt-1">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-2">
            <Button onClick={reset} variant="outline">
              <i className="fas fa-redo mr-2"></i>
              Reiniciar Demo
            </Button>
            <Button variant="outline">
              <i className="fas fa-download mr-2"></i>
              Descargar Resultados
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Demo Interactiva de Evaluación</CardTitle>
        <p className="text-sm text-slate-600">
          Responde algunas preguntas para ver cómo funciona el proceso de evaluación
        </p>
        <Progress value={progress} className="mt-2" />
        <div className="text-xs text-slate-600">
          {Object.keys(answers).length} de {questionnaire.length} preguntas respondidas
        </div>
      </CardHeader>
      <CardContent>
        {currentQuestion && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">
                Pregunta {currentStep + 1} de {questionnaire.length}
              </h4>
              <p className="text-slate-700 mb-4">{currentQuestion.question}</p>
              
              <div className="space-y-2">
                {currentQuestion.options.map((option, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    className="w-full justify-start text-left"
                    onClick={() => handleAnswer(idx)}
                  >
                    <span className="mr-2 font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                      {idx}
                    </span>
                    {option}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t">
              <div>
                <strong>Dominio:</strong> {currentQuestion.domain}
                {currentQuestion.reverseScored && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    Puntuación Inversa
                  </Badge>
                )}
              </div>
              <div>
                {currentStep > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setCurrentStep(currentStep - 1)}
                  >
                    ← Anterior
                  </Button>
                )}
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded text-xs">
              <strong>Explicación:</strong> Esta pregunta evalúa el dominio "{currentQuestion.domain}". 
              {currentQuestion.reverseScored ? 
                " Usa puntuación inversa porque describe una situación negativa - responder 'Siempre' indica mayor riesgo." :
                " Usa puntuación normal - responder 'Siempre' indica menor riesgo."
              }
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}