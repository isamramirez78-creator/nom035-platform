import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Plus, 
  Calendar as CalendarIcon, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  User,
  FileText,
  Target,
  Clipboard,
  TrendingUp,
  MessageSquare
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Intervention {
  id: number;
  employeeId: number;
  employee?: {
    nombre: string;
    apellidos: string;
    puesto: string;
    area: string;
  };
  type: string;
  description: string;
  objective: string;
  startDate: string;
  endDate?: string;
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  responsiblePerson: string;
  notes?: string;
  createdAt: string;
}

interface InterventionNote {
  id: number;
  interventionId: number;
  content: string;
  author: string;
  createdAt: string;
}

export default function Interventions() {
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  const [newIntervention, setNewIntervention] = useState({
    employeeId: "",
    type: "",
    description: "",
    objective: "",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    responsiblePerson: "",
  });

  const [newNote, setNewNote] = useState({
    content: "",
    author: ""
  });

  const { toast } = useToast();

  const { data: interventions, isLoading } = useQuery<Intervention[]>({
    queryKey: ['/api/interventions', selectedEmployee, filterStatus],
  });

  const { data: employees } = useQuery({
    queryKey: ['/api/employees'],
  });

  const { data: interventionNotes } = useQuery<InterventionNote[]>({
    queryKey: ['/api/intervention-notes', selectedIntervention?.id],
    enabled: !!selectedIntervention,
  });

  const createInterventionMutation = useMutation({
    mutationFn: async (data: any) => {
      // Mapear campos del formulario al schema del servidor
      const payload = {
        employeeId: parseInt(data.employeeId),
        interventionType: data.type || "counseling",
        title: data.description?.substring(0, 100) || "Intervención NOM-035",
        description: data.description,
        objective: data.objective || null,
        actions: [],
        responsiblePerson: data.responsiblePerson || "RRHH",
        status: "planned",
        priority: "medium",
        startDate: data.startDate || null,
        expectedEndDate: data.endDate || null,
      };
      const tk = localStorage.getItem("company_token");
      const res = await fetch("/api/interventions", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(tk ? { Authorization: `Bearer ${tk}` } : {}) },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Error al crear");
      return json;
    },
    onSuccess: () => {
      toast({
        title: "Intervención creada",
        description: "La intervención se ha programado correctamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/interventions'] });
      setIsCreateDialogOpen(false);
      resetNewIntervention();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la intervención",
        variant: "destructive",
      });
    },
  });

  const updateInterventionMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      return apiRequest("PATCH", `/api/interventions/${id}`, updates);
    },
    onSuccess: () => {
      toast({
        title: "Intervención actualizada",
        description: "Los cambios se han guardado correctamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/interventions'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la intervención",
        variant: "destructive",
      });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/intervention-notes", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          interventionId: selectedIntervention?.id,
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Nota agregada",
        description: "La nota se ha guardado correctamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/intervention-notes'] });
      setNewNote({ content: "", author: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo agregar la nota",
        variant: "destructive",
      });
    },
  });

  const resetNewIntervention = () => {
    setNewIntervention({
      employeeId: "",
      type: "",
      description: "",
      objective: "",
      startDate: undefined,
      endDate: undefined,
      responsiblePerson: "",
    });
  };

  const handleCreateIntervention = () => {
    if (!newIntervention.employeeId || !newIntervention.type || !newIntervention.description) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    createInterventionMutation.mutate(newIntervention);
  };

  const handleUpdateStatus = (intervention: Intervention, newStatus: string) => {
    updateInterventionMutation.mutate({
      id: intervention.id,
      updates: { status: newStatus }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planned':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Planificada</Badge>;
      case 'in-progress':
        return <Badge variant="default"><TrendingUp className="w-3 h-3 mr-1" />En Progreso</Badge>;
      case 'completed':
        return <Badge variant="outline" className="border-green-500 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />Completada</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'psychological-support': return <User className="w-4 h-4" />;
      case 'training': return <FileText className="w-4 h-4" />;
      case 'workplace-adjustment': return <Target className="w-4 h-4" />;
      case 'monitoring': return <Clipboard className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'psychological-support': return 'Apoyo Psicológico';
      case 'training': return 'Capacitación';
      case 'workplace-adjustment': return 'Ajuste Laboral';
      case 'monitoring': return 'Seguimiento';
      default: return type;
    }
  };

  const filteredInterventions = interventions?.filter(intervention => {
    if (filterStatus === "all") return true;
    return intervention.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Intervenciones</h1>
          <p className="text-gray-600 mt-1">
            Programa y da seguimiento a intervenciones para empleados de alto riesgo
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Intervención
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nueva Intervención</DialogTitle>
              <DialogDescription>
                Programa una intervención para un empleado de alto riesgo
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employee">Empleado *</Label>
                  <Select 
                    value={newIntervention.employeeId} 
                    onValueChange={(value) => setNewIntervention({...newIntervention, employeeId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar empleado" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees?.map((employee: any) => (
                        <SelectItem key={employee.id} value={employee.id.toString()}>
                          {employee.nombre} {employee.apellidos} - {employee.puesto}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de Intervención *</Label>
                  <Select 
                    value={newIntervention.type} 
                    onValueChange={(value) => setNewIntervention({...newIntervention, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="psychological-support">Apoyo Psicológico</SelectItem>
                      <SelectItem value="training">Capacitación</SelectItem>
                      <SelectItem value="workplace-adjustment">Ajuste Laboral</SelectItem>
                      <SelectItem value="monitoring">Seguimiento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción *</Label>
                <Textarea
                  id="description"
                  value={newIntervention.description}
                  onChange={(e) => setNewIntervention({...newIntervention, description: e.target.value})}
                  placeholder="Describe la intervención a realizar..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="objective">Objetivo</Label>
                <Textarea
                  id="objective"
                  value={newIntervention.objective}
                  onChange={(e) => setNewIntervention({...newIntervention, objective: e.target.value})}
                  placeholder="Objetivo específico de la intervención..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha de Inicio</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newIntervention.startDate ? format(newIntervention.startDate, "dd/MM/yyyy", { locale: es }) : "Seleccionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newIntervention.startDate}
                        onSelect={(date) => setNewIntervention({...newIntervention, startDate: date})}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Fecha de Finalización</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newIntervention.endDate ? format(newIntervention.endDate, "dd/MM/yyyy", { locale: es }) : "Seleccionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newIntervention.endDate}
                        onSelect={(date) => setNewIntervention({...newIntervention, endDate: date})}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsible">Responsable</Label>
                <Input
                  id="responsible"
                  value={newIntervention.responsiblePerson}
                  onChange={(e) => setNewIntervention({...newIntervention, responsiblePerson: e.target.value})}
                  placeholder="Nombre del responsable de la intervención"
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateIntervention}
                  disabled={createInterventionMutation.isPending}
                >
                  {createInterventionMutation.isPending ? "Creando..." : "Crear Intervención"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employeeFilter">Empleado</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los empleados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los empleados</SelectItem>
                  {employees?.map((employee: any) => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      {employee.nombre} {employee.apellidos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="statusFilter">Estado</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="planned">Planificadas</SelectItem>
                  <SelectItem value="in-progress">En Progreso</SelectItem>
                  <SelectItem value="completed">Completadas</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={() => {
                setSelectedEmployee("");
                setFilterStatus("all");
              }}>
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interventions List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredInterventions && filteredInterventions.length > 0 ? (
          filteredInterventions.map((intervention) => (
            <Card key={intervention.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(intervention.type)}
                    <div>
                      <CardTitle className="text-lg">
                        {getTypeLabel(intervention.type)}
                      </CardTitle>
                      <CardDescription>
                        {intervention.employee?.nombre} {intervention.employee?.apellidos}
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(intervention.status)}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-700">{intervention.description}</p>
                  {intervention.objective && (
                    <p className="text-sm text-gray-600 mt-2">
                      <strong>Objetivo:</strong> {intervention.objective}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Inicio:</span>
                    <span>{format(new Date(intervention.startDate), "dd/MM/yyyy", { locale: es })}</span>
                  </div>
                  
                  {intervention.endDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Fin:</span>
                      <span>{format(new Date(intervention.endDate), "dd/MM/yyyy", { locale: es })}</span>
                    </div>
                  )}

                  {intervention.responsiblePerson && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Responsable:</span>
                      <span>{intervention.responsiblePerson}</span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  {intervention.status === 'planned' && (
                    <Button 
                      size="sm" 
                      onClick={() => handleUpdateStatus(intervention, 'in-progress')}
                      className="flex-1"
                    >
                      Iniciar
                    </Button>
                  )}
                  
                  {intervention.status === 'in-progress' && (
                    <Button 
                      size="sm" 
                      onClick={() => handleUpdateStatus(intervention, 'completed')}
                      className="flex-1"
                    >
                      Completar
                    </Button>
                  )}

                  <Dialog open={isNotesDialogOpen && selectedIntervention?.id === intervention.id} 
                          onOpenChange={(open) => {
                            setIsNotesDialogOpen(open);
                            if (open) setSelectedIntervention(intervention);
                          }}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Notas de Seguimiento</DialogTitle>
                        <DialogDescription>
                          {intervention.employee?.nombre} {intervention.employee?.apellidos} - {getTypeLabel(intervention.type)}
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        {/* Existing Notes */}
                        <div className="max-h-60 overflow-y-auto space-y-3">
                          {interventionNotes && interventionNotes.length > 0 ? (
                            interventionNotes.map((note) => (
                              <div key={note.id} className="border-l-4 border-blue-500 bg-blue-50 p-3">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="font-medium text-blue-900">{note.author}</span>
                                  <span className="text-sm text-blue-600">
                                    {format(new Date(note.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
                                  </span>
                                </div>
                                <p className="text-blue-800">{note.content}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-500 text-center py-4">
                              No hay notas de seguimiento aún
                            </p>
                          )}
                        </div>

                        {/* Add New Note */}
                        <div className="border-t pt-4 space-y-4">
                          <h4 className="font-medium">Agregar Nota</h4>
                          <div className="space-y-2">
                            <Label htmlFor="noteAuthor">Autor</Label>
                            <Input
                              id="noteAuthor"
                              value={newNote.author}
                              onChange={(e) => setNewNote({...newNote, author: e.target.value})}
                              placeholder="Tu nombre"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="noteContent">Contenido</Label>
                            <Textarea
                              id="noteContent"
                              value={newNote.content}
                              onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                              placeholder="Escribe tu nota de seguimiento..."
                              rows={3}
                            />
                          </div>
                          <Button 
                            onClick={() => addNoteMutation.mutate(newNote)}
                            disabled={!newNote.content || !newNote.author || addNoteMutation.isPending}
                            className="w-full"
                          >
                            {addNoteMutation.isPending ? "Guardando..." : "Agregar Nota"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <CardContent className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay intervenciones
              </h3>
              <p className="text-gray-600 mb-4">
                No se encontraron intervenciones con los filtros seleccionados
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primera Intervención
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}