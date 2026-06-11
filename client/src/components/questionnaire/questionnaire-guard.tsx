// Component to check if employee can start a questionnaire and prevent duplicates
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, User, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface QuestionnaireGuardProps {
  employeeId: number;
  questionnaireType: string;
  onCanStart: () => void;
  onCannotStart?: () => void;
  children?: React.ReactNode;
}

const questionnaireTypeNames: { [key: string]: string } = {
  'microenterprise': 'Microempresa (1-15 empleados)',
  'guide_i': 'Guía I - Identificación y análisis',
  'guide_ii': 'Guía II - Identificación y análisis (16-49 empleados)',
  'guide_iii': 'Guía III - Evaluación específica (50+ empleados)',
  'traumatic_events': 'Eventos Traumáticos'
};

const riskLevelColors: { [key: string]: string } = {
  'sin-riesgo': 'bg-green-100 text-green-800',
  'bajo': 'bg-blue-100 text-blue-800',
  'medio': 'bg-yellow-100 text-yellow-800',
  'alto': 'bg-orange-100 text-orange-800',
  'muy-alto': 'bg-red-100 text-red-800'
};

export default function QuestionnaireGuard({ 
  employeeId, 
  questionnaireType, 
  onCanStart, 
  onCannotStart,
  children 
}: QuestionnaireGuardProps) {
  const { data: checkResult, isLoading, error } = useQuery({
    queryKey: [`/api/evaluations/check/${employeeId}/${questionnaireType}`],
    retry: false
  });

  const { data: completedQuestionnaires } = useQuery({
    queryKey: [`/api/evaluations/completed/${employeeId}`],
    retry: false
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
            <span>Verificando estado del cuestionario...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertTitle className="text-red-800">Error de verificación</AlertTitle>
        <AlertDescription className="text-red-700">
          No se pudo verificar el estado del cuestionario. Por favor, intenta de nuevo.
        </AlertDescription>
      </Alert>
    );
  }

  if (!checkResult) {
    return null;
  }

  // If employee can start the questionnaire, render children
  if (checkResult.canStart) {
    return (
      <div className="space-y-6">
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Cuestionario disponible</AlertTitle>
          <AlertDescription className="text-green-700">
            {checkResult.message}
          </AlertDescription>
        </Alert>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {checkResult.employee.nombre} {checkResult.employee.apellidos}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Área: {checkResult.employee.area} • Cuestionario: {questionnaireTypeNames[questionnaireType]}
            </p>
          </CardHeader>
          <CardContent>
            <Button onClick={onCanStart} className="w-full">
              Iniciar Cuestionario
            </Button>
          </CardContent>
        </Card>
        
        {children}
      </div>
    );
  }

  // If employee has already completed this questionnaire
  return (
    <div className="space-y-6">
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertTitle className="text-orange-800">Cuestionario ya completado</AlertTitle>
        <AlertDescription className="text-orange-700">
          {checkResult.message}
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {checkResult.employee.nombre} {checkResult.employee.apellidos}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Área: {checkResult.employee.area}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Cuestionario: {questionnaireTypeNames[questionnaireType]}
            </h4>
            <Badge className="bg-red-100 text-red-800">
              Ya completado
            </Badge>
          </div>

          {completedQuestionnaires && completedQuestionnaires.completedQuestionnaires.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Cuestionarios completados:</h4>
              <div className="space-y-2">
                {completedQuestionnaires.completedQuestionnaires.map((questionnaire: any) => (
                  <div key={questionnaire.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">
                        {questionnaireTypeNames[questionnaire.questionnaireType] || questionnaire.questionnaireType}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(questionnaire.completedAt || questionnaire.createdAt), "d 'de' MMMM, yyyy", { locale: es })}
                      </p>
                    </div>
                    <Badge className={riskLevelColors[questionnaire.riskLevel] || 'bg-gray-100 text-gray-800'}>
                      {questionnaire.riskLevel}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {completedQuestionnaires && completedQuestionnaires.availableTypes.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Cuestionarios disponibles:</h4>
              <div className="space-y-2">
                {completedQuestionnaires.availableTypes.map((type: string) => (
                  <div key={type} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-900">
                      {questionnaireTypeNames[type] || type}
                    </p>
                    <Badge className="bg-blue-100 text-blue-800 mt-1">
                      Disponible
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {onCannotStart && (
            <Button 
              variant="outline" 
              onClick={onCannotStart}
              className="w-full"
            >
              Volver
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}