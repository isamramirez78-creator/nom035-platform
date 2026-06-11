import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mail, 
  Send, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  User, 
  Calendar,
  Copy,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Employee } from "@shared/schema";

const questionnaireTypeNames: { [key: string]: string } = {
  'microenterprise': 'Microempresa (1-15 empleados)',
  'guide_i': 'Guía I - Identificación y análisis',
  'guide_ii': 'Guía II - Identificación y análisis (16-49 empleados)',
  'guide_iii': 'Guía III - Evaluación específica (50+ empleados)',
  'traumatic_events': 'Eventos Traumáticos'
};

const statusColors: { [key: string]: string } = {
  'pending': 'bg-yellow-100 text-yellow-800',
  'completed': 'bg-green-100 text-green-800',
  'expired': 'bg-red-100 text-red-800'
};

export default function EmployeeInvitations() {
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [questionnaireType, setQuestionnaireType] = useState<string>("");
  const [customMessage, setCustomMessage] = useState<string>("");
  const [expirationDays, setExpirationDays] = useState<number>(10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: invitations = [], isLoading: invitationsLoading } = useQuery({
    queryKey: ["/api/questionnaire-invitations"],
  });

  const sendInvitationsMutation = useMutation({
    mutationFn: async (invitationData: any) => {
      return await apiRequest("POST", "/api/questionnaire-invitations/send", invitationData);
    },
    onSuccess: () => {
      toast({
        title: "Invitaciones enviadas",
        description: "Las invitaciones han sido enviadas exitosamente a los empleados seleccionados.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/questionnaire-invitations"] });
      setSelectedEmployees([]);
      setQuestionnaireType("");
      setCustomMessage("");
    },
    onError: (error: any) => {
      toast({
        title: "Error al enviar invitaciones",
        description: error.message || "Hubo un problema al enviar las invitaciones.",
        variant: "destructive",
      });
    },
  });

  const sendReminderMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      return await apiRequest("POST", `/api/questionnaire-invitations/${invitationId}/reminder`, {});
    },
    onSuccess: () => {
      toast({
        title: "Recordatorio enviado",
        description: "El recordatorio ha sido enviado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/questionnaire-invitations"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al enviar recordatorio",
        description: error.message || "Hubo un problema al enviar el recordatorio.",
        variant: "destructive",
      });
    },
  });

  const handleEmployeeToggle = (employeeId: number) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees.map(emp => emp.id));
    }
  };

  const handleSendInvitations = () => {
    if (selectedEmployees.length === 0 || !questionnaireType) {
      toast({
        title: "Información faltante",
        description: "Selecciona al menos un empleado y un tipo de cuestionario.",
        variant: "destructive",
      });
      return;
    }

    sendInvitationsMutation.mutate({
      employeeIds: selectedEmployees,
      questionnaireType,
      customMessage,
      expirationDays
    });
  };

  const copyInvitationLink = (token: string) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/cuestionario/${token}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Enlace copiado",
      description: "El enlace de invitación ha sido copiado al portapapeles.",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusText = {
      'pending': 'Pendiente',
      'completed': 'Completado',
      'expired': 'Expirado'
    };
    return (
      <Badge className={statusColors[status] || 'bg-gray-100 text-gray-800'}>
        {statusText[status as keyof typeof statusText] || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Invitaciones de Cuestionarios</h2>
        <p className="text-slate-600">
          Envía invitaciones seguras por correo electrónico para que los empleados accedan a sus cuestionarios NOM-035
        </p>
      </div>

      <Alert className="border-blue-200 bg-blue-50">
        <Mail className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">Sistema de Invitaciones Seguras</AlertTitle>
        <AlertDescription className="text-blue-700">
          Los empleados recibirán un enlace único y temporal por correo electrónico para acceder a su cuestionario. 
          Los enlaces expiran automáticamente después del tiempo especificado para mantener la seguridad.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="send" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="send">Enviar Invitaciones</TabsTrigger>
          <TabsTrigger value="manage">Gestionar Invitaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Nueva Invitación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Questionnaire Type Selection */}
              <div className="space-y-2">
                <Label htmlFor="questionnaire-type">Tipo de Cuestionario</Label>
                <Select value={questionnaireType} onValueChange={setQuestionnaireType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo de cuestionario" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="microenterprise">
                      {questionnaireTypeNames.microenterprise}
                    </SelectItem>
                    <SelectItem value="guide_i">
                      {questionnaireTypeNames.guide_i}
                    </SelectItem>
                    <SelectItem value="guide_ii">
                      {questionnaireTypeNames.guide_ii}
                    </SelectItem>
                    <SelectItem value="guide_iii">
                      {questionnaireTypeNames.guide_iii}
                    </SelectItem>
                    <SelectItem value="traumatic_events">
                      <div className="flex items-center gap-2">
                        <span>{questionnaireTypeNames.traumatic_events}</span>
                        <Badge className="bg-red-100 text-red-800">Obligatorio</Badge>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Expiration Settings */}
              <div className="space-y-2">
                <Label htmlFor="expiration">Días hasta expiración</Label>
                <Input
                  id="expiration"
                  type="number"
                  min="1"
                  max="30"
                  value={expirationDays}
                  onChange={(e) => setExpirationDays(parseInt(e.target.value) || 10)}
                  className="w-32"
                />
                <p className="text-sm text-gray-600">
                  Los enlaces expirarán después de {expirationDays} días
                </p>
              </div>

              {/* Custom Message */}
              <div className="space-y-2">
                <Label htmlFor="message">Mensaje personalizado (opcional)</Label>
                <Textarea
                  id="message"
                  placeholder="Agregue un mensaje personalizado para incluir en la invitación..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Employee Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Empleados a invitar</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedEmployees.length === employees.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto border rounded-lg p-4">
                  {employees.map((employee) => (
                    <div
                      key={employee.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedEmployees.includes(employee.id)
                          ? 'bg-blue-50 border-blue-300'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => handleEmployeeToggle(employee.id)}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedEmployees.includes(employee.id)}
                          onChange={() => handleEmployeeToggle(employee.id)}
                          className="rounded border-gray-300"
                        />
                        <div>
                          <p className="text-sm font-medium">
                            {employee.nombre} {employee.apellidos}
                          </p>
                          <p className="text-xs text-gray-600">{employee.area}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-sm text-gray-600">
                  {selectedEmployees.length} empleado(s) seleccionado(s)
                </div>
              </div>

              <Button
                onClick={handleSendInvitations}
                disabled={selectedEmployees.length === 0 || !questionnaireType || sendInvitationsMutation.isPending}
                className="w-full"
              >
                {sendInvitationsMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Enviando invitaciones...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Invitaciones ({selectedEmployees.length})
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Invitaciones Activas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invitationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2">Cargando invitaciones...</span>
                </div>
              ) : invitationsData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No hay invitaciones enviadas</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invitationsData.map((invitation: any) => (
                    <div key={invitation.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-600" />
                            <span className="font-medium">
                              {invitation.employee?.nombre} {invitation.employee?.apellidos}
                            </span>
                            {getStatusBadge(invitation.status)}
                          </div>
                          <p className="text-sm text-gray-600">
                            {questionnaireTypeNames[invitation.questionnaireType]} • {invitation.employee?.area}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Enviado: {format(new Date(invitation.sentAt || invitation.createdAt), "d 'de' MMMM, yyyy", { locale: es })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Expira: {format(new Date(invitation.expiresAt), "d 'de' MMMM, yyyy", { locale: es })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {invitation.status === 'pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyInvitationLink(invitation.accessToken)}
                              >
                                <Copy className="h-4 w-4 mr-1" />
                                Copiar enlace
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => sendReminderMutation.mutate(invitation.id)}
                                disabled={sendReminderMutation.isPending}
                              >
                                <Mail className="h-4 w-4 mr-1" />
                                Recordatorio
                              </Button>
                            </>
                          )}
                          {invitation.status === 'completed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`/reports/${invitation.employee?.id}`, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Ver reporte
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {invitation.reminderCount > 0 && (
                        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                          {invitation.reminderCount} recordatorio(s) enviado(s) • 
                          Último: {format(new Date(invitation.lastReminderAt), "d 'de' MMMM", { locale: es })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}