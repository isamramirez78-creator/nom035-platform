import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  User, 
  Building2, 
  Mail,
  ExternalLink,
  ShieldCheck
} from "lucide-react";
import StandardQuestionnaireForm from "@/components/questionnaire/standard-questionnaire-form";
import TraumaticEventsForm from "@/components/questionnaire/traumatic-events-form";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const questionnaireTypeNames: { [key: string]: string } = {
  'microenterprise': 'Cuestionario para Microempresas (1-15 trabajadores)',
  'guide_i': 'Guía de Referencia I (16-49 trabajadores)',
  'guide_ii': 'Guía de Referencia II (50+ trabajadores)',
  'guide_iii': 'Guía de Referencia III (50+ trabajadores)',
  'traumatic_events': 'Cuestionario de Acontecimientos Traumáticos Severos'
};

// Monkey-patch fetch para interceptar evaluaciones en modo público
const originalFetch = window.fetch;
(window as any)._nom035_patch = true;

export default function PublicQuestionnaire() {
  // Interceptar fetch para redirigir /api/evaluations → /api/evaluations/public
  if (!(window as any)._nom035_patched) {
    (window as any)._nom035_patched = true;
    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.endsWith('/api/evaluations') && init?.method === 'POST') {
        const body = JSON.parse(init.body as string);
        if (body.invitationToken) {
          return originalFetch('/api/evaluations/public', init);
        }
      }
      return originalFetch(input, init);
    };
  }
  const params = useParams();
  const token = params.token;
  const [hasStarted, setHasStarted] = useState(false);

  const { data: invitation, isLoading, error } = useQuery({
    queryKey: [`/api/questionnaire-invitations/verify/${token}`],
    retry: false,
    enabled: !!token
  });

  // Alias para compatibilidad
  const invitationDetails = invitation as any;

  useEffect(() => {
    if ((invitation as any)?.status === 'completed') {
      // Ya completado — se mostrará la pantalla de éxito
    }
  }, [invitation, token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p>Verificando invitación...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invitationDetails?.status === 'completed') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #F0FDF4 0%, #ECFCCB 100%)" }}>
        <div style={{ background: "white", borderRadius: 20, padding: "2.5rem", maxWidth: 480, width: "100%", textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}>
          <div style={{ width: 72, height: 72, background: "#ECFCCB", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 style={{ color: "#1E3A5F", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>¡Evaluación completada!</h2>
          <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
            Tu cuestionario NOM-035 ha sido enviado correctamente. Gracias por tu participación.
            Los resultados serán revisados por el área de Recursos Humanos.
          </p>
          <div style={{ background: "#F8FAFC", borderRadius: 12, padding: "1rem", border: "0.5px solid #E2E8F0" }}>
            <p style={{ color: "#94A3B8", fontSize: 12, margin: 0 }}>
              Puedes cerrar esta ventana.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-800">Enlace no válido</AlertTitle>
              <AlertDescription className="text-red-700">
                El enlace de invitación no es válido o ha expirado. Por favor, contacta a tu supervisor para obtener un nuevo enlace.
              </AlertDescription>
            </Alert>
            
            <div className="mt-6 text-center">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">¿Necesitas ayuda?</h3>
              <p className="text-sm text-gray-600">
                Si crees que esto es un error, contacta al administrador del sistema.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invitationDetails?.status === 'expired') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <Alert className="border-orange-200 bg-orange-50">
              <Clock className="h-4 w-4 text-orange-600" />
              <AlertTitle className="text-orange-800">Invitación expirada</AlertTitle>
              <AlertDescription className="text-orange-700">
                Esta invitación expiró el {format(new Date(invitationDetails?.expiresAt), "d 'de' MMMM 'de' yyyy", { locale: es })}. 
                Por favor, solicita una nueva invitación a tu supervisor.
              </AlertDescription>
            </Alert>
            
            <div className="mt-6 text-center">
              <Clock className="h-12 w-12 text-orange-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Enlace expirado</h3>
              <p className="text-sm text-gray-600">
                Los enlaces de invitación tienen una duración limitada por seguridad.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if ((invitation as any)?.status === 'completed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Cuestionario completado</AlertTitle>
              <AlertDescription className="text-green-700">
                Ya has completado este cuestionario el {invitationDetails?.completedAt ? format(new Date(invitationDetails.completedAt), "d 'de' MMMM 'de' yyyy", { locale: es }) : 'fecha no disponible'}.
              </AlertDescription>
            </Alert>
            
            <div className="mt-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">¡Gracias por tu participación!</h3>
              <p className="text-sm text-gray-600 mb-4">
                Tu evaluación ha sido registrada exitosamente.
              </p>
              
              <Button variant="outline" className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver resultados
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show questionnaire start page
  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Evaluación NOM-035-STPS</h1>
                <p className="text-sm text-gray-600">Sistema de Evaluación de Riesgos Psicosociales</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto p-4 pt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Bienvenido/a, {invitationDetails.employee?.nombre} {invitationDetails.employee?.apellidos}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Información de la evaluación</h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>Área: {invitationDetails.employee?.area}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Tipo: {questionnaireTypeNames[invitationDetails.questionnaireType]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Válido hasta: {format(new Date(invitationDetails.expiresAt), "d 'de' MMMM 'de' yyyy", { locale: es })}</span>
                  </div>
                </div>
              </div>

              <Alert className="border-green-200 bg-green-50">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Confidencialidad garantizada</AlertTitle>
                <AlertDescription className="text-green-700">
                  Tus respuestas son completamente confidenciales y serán utilizadas únicamente para cumplir con la 
                  normativa NOM-035-STPS-2018 y mejorar las condiciones laborales en tu empresa.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Instrucciones importantes:</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full mt-0.5">1</span>
                    <span>Responde todas las preguntas de manera honesta y reflexiva.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full mt-0.5">2</span>
                    <span>No hay respuestas correctas o incorrectas, solo importa tu experiencia personal.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full mt-0.5">3</span>
                    <span>Puedes completar el cuestionario en una sola sesión o guardar y continuar después.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full mt-0.5">4</span>
                    <span>Al finalizar, recibirás una confirmación de que tu evaluación ha sido registrada.</span>
                  </li>
                </ul>
              </div>

              {invitationDetails.customMessage && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 mb-2">Mensaje de tu supervisor:</h4>
                  <p className="text-sm text-yellow-800">{invitationDetails.customMessage}</p>
                </div>
              )}

              <Button 
                onClick={() => setHasStarted(true)}
                className="w-full"
                size="lg"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Iniciar Cuestionario
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Al hacer clic en "Iniciar Cuestionario" confirmas que has leído y entendido las instrucciones.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show actual questionnaire
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  {questionnaireTypeNames[invitationDetails.questionnaireType]}
                </h1>
                <p className="text-sm text-gray-600">
                  {invitationDetails.employee?.nombre} {invitationDetails.employee?.apellidos} • {invitationDetails.employee?.area}
                </p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800">
              Enlace válido hasta {format(new Date(invitationDetails.expiresAt), "d/MM/yyyy", { locale: es })}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {(invitationDetails.questionnaireType === "traumatic_events" || invitationDetails.questionnaireType === "guia1") ? (
          <TraumaticEventsForm
            employeeId={invitationDetails.employeeId}
            invitationToken={token}
            onComplete={() => {
              window.location.reload();
            }}
          />
        ) : (
          <StandardQuestionnaireForm
            employeeId={invitationDetails.employee?.id || invitationDetails.employeeId}
            questionnaireType={invitationDetails.questionnaireType}
            invitationToken={token}
            onComplete={() => {
              window.location.reload();
            }}
          />
        )}
      </div>
    </div>
  );
}