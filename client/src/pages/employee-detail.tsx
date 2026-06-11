import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, FileText, AlertTriangle, CheckCircle2, Clock, User, Mail, Send } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import RiskKPI from "@/components/charts/risk-kpi";

const interventionSchema = z.object({
  interventionType: z.string().min(1, "Tipo de intervención requerido"),
  title: z.string().min(1, "Título requerido"),
  description: z.string().min(1, "Descripción requerida"),
  objective: z.string().optional(),
  timeline: z.string().optional(),
  responsiblePerson: z.string().min(1, "Responsable requerido"),
  priority: z.string().default("medium"),
  startDate: z.date().optional(),
  expectedEndDate: z.date().optional(),
  actions: z.array(z.string()).default([]),
});

const fileSchema = z.object({
  fileType: z.string().min(1, "Tipo de archivo requerido"),
  title: z.string().min(1, "Título requerido"),
  description: z.string().optional(),
  priority: z.string().default("normal"),
  dueDate: z.date().optional(),
  assignedTo: z.string().optional(),
});

export default function EmployeeDetail() {
  const [, params] = useRoute("/employees/:id");
  const employeeId = parseInt(params?.id || "0");
  const [isInterventionDialogOpen, setIsInterventionDialogOpen] = useState(false);
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);
  const [actionInput, setActionInput] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: employee, isLoading: employeeLoading } = useQuery({
    queryKey: ['/api/employees', employeeId],
  });

  const { data: evaluations = [], isLoading: evaluationsLoading } = useQuery({
    queryKey: ['/api/evaluations'],
    select: (data: any[]) => data?.filter((evaluation: any) => evaluation.employeeId === parseInt(employeeId!)) || [],
  });

  const { data: interventions = [], isLoading: interventionsLoading } = useQuery({
    queryKey: ['/api/interventions'],
    select: (data: any[]) => data?.filter((intervention: any) => intervention.employeeId === parseInt(employeeId!)) || [],
  });

  const { data: files = [], isLoading: filesLoading } = useQuery({
    queryKey: ['/api/employee-files'],
    select: (data: any[]) => data?.filter((file: any) => file.employeeId === parseInt(employeeId!)) || [],
  });

  const { data: emailNotifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ['/api/email-notifications'],
    select: (data: any[]) => data?.filter((notification: any) => notification.employeeId === employeeId) || [],
  });

  const interventionForm = useForm<z.infer<typeof interventionSchema>>({
    resolver: zodResolver(interventionSchema),
    defaultValues: {
      priority: "medium",
      actions: [],
    },
  });

  const fileForm = useForm<z.infer<typeof fileSchema>>({
    resolver: zodResolver(fileSchema),
    defaultValues: {
      priority: "normal",
    },
  });

  const createInterventionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof interventionSchema>) => {
      return apiRequest(`/api/interventions`, {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          employeeId,
          createdBy: 'System', // TODO: Replace with actual user
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/interventions'] });
      setIsInterventionDialogOpen(false);
      interventionForm.reset();
      toast({
        title: "Intervención creada",
        description: "La intervención ha sido registrada exitosamente.",
      });
    },
  });

  const createFileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof fileSchema>) => {
      return apiRequest(`/api/employee-files`, {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          employeeId,
          createdBy: 'System', // TODO: Replace with actual user
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employee-files'] });
      setIsFileDialogOpen(false);
      fileForm.reset();
      toast({
        title: "Archivo creado",
        description: "El archivo ha sido agregado al expediente.",
      });
    },
  });

  const sendNotificationMutation = useMutation({
    mutationFn: async ({ type, recipients }: { type: string; recipients: string[] }) => {
      return apiRequest(`/api/send-notification`, {
        method: 'POST',
        body: JSON.stringify({
          employeeId,
          type,
          recipients,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-notifications'] });
      toast({
        title: "Notificación enviada",
        description: "La notificación ha sido enviada exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo enviar la notificación.",
        variant: "destructive",
      });
    },
  });

  const addAction = () => {
    if (actionInput.trim()) {
      const currentActions = interventionForm.getValues('actions');
      interventionForm.setValue('actions', [...currentActions, actionInput.trim()]);
      setActionInput("");
    }
  };

  const removeAction = (index: number) => {
    const currentActions = interventionForm.getValues('actions');
    interventionForm.setValue('actions', currentActions.filter((_, i) => i !== index));
  };

  if (employeeLoading) {
    return <div className="container mx-auto py-8">Cargando...</div>;
  }

  if (!employee) {
    return <div className="container mx-auto py-8">Empleado no encontrado</div>;
  }

  const latestEvaluation = evaluations?.[0];
  const riskEvaluations = evaluations?.map((evaluation: any) => ({
    id: evaluation.id,
    employeeName: `${(employee as any)?.nombre} ${(employee as any)?.apellidos}`,
    riskLevel: evaluation.riskLevel,
    overallScore: evaluation.overallScore,
    maxScore: 100,
  })) || [];

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Employee Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{(employee as any)?.nombre} {(employee as any)?.apellidos}</h1>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>{(employee as any)?.puesto}</span>
            <span>•</span>
            <span>{(employee as any)?.area}</span>
            <span>•</span>
            <span>Ingreso: {new Date((employee as any)?.fechaIngreso).toLocaleDateString('es-ES')}</span>
            {(employee as any)?.lastEvaluationDate && (
              <>
                <span>•</span>
                <span>Última evaluación: {new Date((employee as any)?.lastEvaluationDate).toLocaleDateString('es-ES')}</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Badge variant={
            (employee as any)?.riskStatus === 'sin-riesgo' || (employee as any)?.riskStatus === 'sin-evaluar' ? 'default' :
            (employee as any)?.riskStatus === 'bajo' ? 'secondary' :
            (employee as any)?.riskStatus === 'medio' ? 'outline' :
            'destructive'
          }>
            {(employee as any)?.riskStatus === 'sin-evaluar' ? 'SIN EVALUAR' : 
             (employee as any)?.riskStatus?.replace('-', ' ').toUpperCase() || 'SIN EVALUAR'}
          </Badge>
          {latestEvaluation && (
            <span className="text-sm text-gray-500">
              Puntuación: {latestEvaluation.overallScore}/100
            </span>
          )}
        </div>
      </div>

      {/* Risk KPI for latest evaluation */}
      {riskEvaluations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <RiskKPI
            riskLevel={riskEvaluations[0].riskLevel}
            employeeName="Evaluación Actual"
            score={riskEvaluations[0].overallScore}
            maxScore={riskEvaluations[0].maxScore}
            size="large"
          />
        </div>
      )}

      <Tabs defaultValue="evaluations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="evaluations">Evaluaciones</TabsTrigger>
          <TabsTrigger value="interventions">Intervenciones</TabsTrigger>
          <TabsTrigger value="files">Expediente</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="evaluations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Historial de Evaluaciones</CardTitle>
                  <CardDescription>
                    Todas las evaluaciones NOM-035 realizadas
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {evaluationsLoading ? (
                <div>Cargando evaluaciones...</div>
              ) : evaluations?.length ? (
                <div className="space-y-4">
                  {evaluations.map((evaluation) => (
                    <div key={evaluation.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">
                          {evaluation.questionnaireType.charAt(0).toUpperCase() + evaluation.questionnaireType.slice(1)}
                        </h3>
                        <Badge variant={
                          evaluation.riskLevel === 'sin-riesgo' ? 'default' :
                          evaluation.riskLevel === 'bajo' ? 'secondary' :
                          evaluation.riskLevel === 'medio' ? 'outline' :
                          'destructive'
                        }>
                          {evaluation.riskLevel.replace('-', ' ')}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>Puntuación: {evaluation.overallScore}/100</p>
                        <p>Completado: {evaluation.completedAt ? 
                          new Date(evaluation.completedAt).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 
                          'Sin completar'
                        }</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No hay evaluaciones registradas</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interventions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Plan de Intervenciones</CardTitle>
                  <CardDescription>
                    Seguimiento de acciones correctivas y preventivas
                  </CardDescription>
                </div>
                <Dialog open={isInterventionDialogOpen} onOpenChange={setIsInterventionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nueva Intervención
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Crear Intervención</DialogTitle>
                      <DialogDescription>
                        Define un plan de intervención para atender los riesgos identificados
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...interventionForm}>
                      <form onSubmit={interventionForm.handleSubmit((data) => createInterventionMutation.mutate(data))} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={interventionForm.control}
                            name="interventionType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tipo de Intervención</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccionar tipo" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="counseling">Asesoría Psicológica</SelectItem>
                                    <SelectItem value="training">Capacitación</SelectItem>
                                    <SelectItem value="medical">Atención Médica</SelectItem>
                                    <SelectItem value="organizational">Cambio Organizacional</SelectItem>
                                    <SelectItem value="environmental">Mejora del Ambiente</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={interventionForm.control}
                            name="priority"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Prioridad</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="low">Baja</SelectItem>
                                    <SelectItem value="medium">Media</SelectItem>
                                    <SelectItem value="high">Alta</SelectItem>
                                    <SelectItem value="critical">Crítica</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={interventionForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Título</FormLabel>
                              <FormControl>
                                <Input placeholder="Nombre de la intervención" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={interventionForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descripción</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Describe la situación que requiere intervención"
                                  className="min-h-[80px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={interventionForm.control}
                          name="objective"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Objetivo</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="¿Qué se espera lograr con esta intervención?"
                                  className="min-h-[60px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={interventionForm.control}
                            name="responsiblePerson"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Responsable</FormLabel>
                                <FormControl>
                                  <Input placeholder="Nombre del responsable" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={interventionForm.control}
                            name="timeline"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Duración Estimada</FormLabel>
                                <FormControl>
                                  <Input placeholder="ej. 2 semanas, 1 mes" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="space-y-2">
                          <FormLabel>Acciones Específicas</FormLabel>
                          <div className="flex space-x-2">
                            <Input
                              placeholder="Agregar acción específica"
                              value={actionInput}
                              onChange={(e) => setActionInput(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAction())}
                            />
                            <Button type="button" onClick={addAction}>Agregar</Button>
                          </div>
                          <div className="space-y-1">
                            {interventionForm.watch('actions').map((action, index) => (
                              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                <span className="text-sm">{action}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeAction(index)}
                                >
                                  ✕
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setIsInterventionDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button type="submit" disabled={createInterventionMutation.isPending}>
                            {createInterventionMutation.isPending ? "Creando..." : "Crear Intervención"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {interventionsLoading ? (
                <div>Cargando intervenciones...</div>
              ) : interventions?.length ? (
                <div className="space-y-4">
                  {interventions.map((intervention) => (
                    <div key={intervention.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium">{intervention.title}</h3>
                          <p className="text-sm text-gray-600">{intervention.description}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={
                            intervention.priority === 'critical' ? 'destructive' :
                            intervention.priority === 'high' ? 'destructive' :
                            intervention.priority === 'medium' ? 'outline' :
                            'secondary'
                          }>
                            {intervention.priority}
                          </Badge>
                          <Badge variant={
                            intervention.status === 'completed' ? 'default' :
                            intervention.status === 'in_progress' ? 'outline' :
                            'secondary'
                          }>
                            {intervention.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>Responsable: {intervention.responsiblePerson}</p>
                        <p>Tipo: {intervention.interventionType}</p>
                        {intervention.timeline && <p>Duración: {intervention.timeline}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No hay intervenciones registradas</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Expediente del Empleado</CardTitle>
                  <CardDescription>
                    Documentos, notas y seguimiento completo
                  </CardDescription>
                </div>
                <Dialog open={isFileDialogOpen} onOpenChange={setIsFileDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Archivo
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Agregar al Expediente</DialogTitle>
                      <DialogDescription>
                        Crea una nueva entrada en el expediente del empleado
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...fileForm}>
                      <form onSubmit={fileForm.handleSubmit((data) => createFileMutation.mutate(data))} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={fileForm.control}
                            name="fileType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tipo de Archivo</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccionar tipo" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="evaluation">Evaluación</SelectItem>
                                    <SelectItem value="intervention">Intervención</SelectItem>
                                    <SelectItem value="follow_up">Seguimiento</SelectItem>
                                    <SelectItem value="medical">Médico</SelectItem>
                                    <SelectItem value="note">Nota</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={fileForm.control}
                            name="priority"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Prioridad</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="low">Baja</SelectItem>
                                    <SelectItem value="normal">Normal</SelectItem>
                                    <SelectItem value="high">Alta</SelectItem>
                                    <SelectItem value="urgent">Urgente</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={fileForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Título</FormLabel>
                              <FormControl>
                                <Input placeholder="Título del documento o nota" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={fileForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descripción</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Contenido o descripción detallada"
                                  className="min-h-[100px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={fileForm.control}
                          name="assignedTo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Asignado a (opcional)</FormLabel>
                              <FormControl>
                                <Input placeholder="Responsable del seguimiento" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setIsFileDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button type="submit" disabled={createFileMutation.isPending}>
                            {createFileMutation.isPending ? "Guardando..." : "Guardar"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {filesLoading ? (
                <div>Cargando expediente...</div>
              ) : files?.length ? (
                <div className="space-y-4">
                  {files.map((file) => (
                    <div key={file.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start space-x-3">
                          <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div>
                            <h3 className="font-medium">{file.title}</h3>
                            {file.description && <p className="text-sm text-gray-600">{file.description}</p>}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={
                            file.priority === 'urgent' ? 'destructive' :
                            file.priority === 'high' ? 'destructive' :
                            file.priority === 'normal' ? 'outline' :
                            'secondary'
                          }>
                            {file.priority}
                          </Badge>
                          <Badge variant="outline">
                            {file.fileType}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        <p>Creado: {new Date(file.createdAt).toLocaleDateString('es-ES')}</p>
                        {file.assignedTo && <p>Asignado a: {file.assignedTo}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No hay archivos en el expediente</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Notificaciones por Email</CardTitle>
                  <CardDescription>
                    Historial y gestión de notificaciones automáticas
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => sendNotificationMutation.mutate({
                      type: 'intervention_reminder',
                      recipients: ['supervisor@empresa.com'] // This should come from settings
                    })}
                    disabled={sendNotificationMutation.isPending}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Recordatorio
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {notificationsLoading ? (
                <div>Cargando notificaciones...</div>
              ) : emailNotifications?.length ? (
                <div className="space-y-4">
                  {emailNotifications.map((notification: any) => (
                    <div key={notification.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {notification.subject}
                          </h3>
                          <p className="text-sm text-gray-600">{notification.notificationType}</p>
                        </div>
                        <Badge variant={
                          notification.status === 'sent' ? 'default' :
                          notification.status === 'failed' ? 'destructive' :
                          'secondary'
                        }>
                          {notification.status === 'sent' ? 'Enviado' :
                           notification.status === 'failed' ? 'Fallido' : 'Pendiente'}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>Destinatarios: {notification.recipients.join(', ')}</p>
                        <p>Fecha: {new Date(notification.createdAt).toLocaleDateString('es-ES')}</p>
                        {notification.sentAt && (
                          <p>Enviado: {new Date(notification.sentAt).toLocaleDateString('es-ES')}</p>
                        )}
                        {notification.errorMessage && (
                          <p className="text-red-600">Error: {notification.errorMessage}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No hay notificaciones registradas para este empleado</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}