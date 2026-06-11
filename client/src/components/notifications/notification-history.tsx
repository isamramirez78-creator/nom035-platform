import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, AlertTriangle, Clock, CheckCircle, XCircle, Filter } from "lucide-react";
import { useState } from "react";

interface EmailNotification {
  id: number;
  employeeId: number;
  evaluationId?: number;
  interventionId?: number;
  notificationType: string;
  recipients: string[];
  subject: string;
  status: string;
  sentAt?: string;
  errorMessage?: string;
  createdAt: string;
}

export default function NotificationHistory() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: notifications, isLoading } = useQuery<EmailNotification[]>({
    queryKey: ['/api/email-notifications'],
  });

  const { data: employees } = useQuery({
    queryKey: ['/api/employees'],
  });

  const filteredNotifications = notifications?.filter(notification => {
    const statusMatch = statusFilter === "all" || notification.status === statusFilter;
    const typeMatch = typeFilter === "all" || notification.notificationType === typeFilter;
    return statusMatch && typeMatch;
  }) || [];

  const getNotificationTypeText = (type: string): string => {
    switch (type) {
      case 'high_risk_alert': return 'Alerta de Alto Riesgo';
      case 'intervention_reminder': return 'Recordatorio de Intervención';
      case 'follow_up_reminder': return 'Recordatorio de Seguimiento';
      default: return type;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'sent': return 'default';
      case 'failed': return 'destructive';
      case 'pending': return 'secondary';
      default: return 'outline';
    }
  };

  const getEmployeeName = (employeeId: number): string => {
    const employee = employees?.find((emp: any) => emp.id === employeeId);
    return employee ? `${employee.nombre} ${employee.apellidos}` : 'Empleado no encontrado';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Historial de Notificaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Historial de Notificaciones por Email
        </CardTitle>
        <CardDescription>
          Registro completo de todas las notificaciones enviadas por el sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filtros:</span>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="sent">Enviado</SelectItem>
              <SelectItem value="failed">Fallido</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Tipo de notificación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="high_risk_alert">Alerta de Alto Riesgo</SelectItem>
              <SelectItem value="intervention_reminder">Recordatorio de Intervención</SelectItem>
              <SelectItem value="follow_up_reminder">Recordatorio de Seguimiento</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {notifications?.length || 0}
            </div>
            <div className="text-sm text-blue-800">Total Notificaciones</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {notifications?.filter(n => n.status === 'sent').length || 0}
            </div>
            <div className="text-sm text-green-800">Enviadas</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {notifications?.filter(n => n.status === 'failed').length || 0}
            </div>
            <div className="text-sm text-red-800">Fallidas</div>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {notifications?.filter(n => n.status === 'pending').length || 0}
            </div>
            <div className="text-sm text-yellow-800">Pendientes</div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No se encontraron notificaciones con los filtros aplicados</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div key={notification.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(notification.status)}
                      <h3 className="font-medium">{notification.subject}</h3>
                      <Badge variant={getStatusVariant(notification.status)}>
                        {notification.status === 'sent' ? 'Enviado' :
                         notification.status === 'failed' ? 'Fallido' : 'Pendiente'}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <strong>Empleado:</strong> {getEmployeeName(notification.employeeId)}
                      </p>
                      <p>
                        <strong>Tipo:</strong> {getNotificationTypeText(notification.notificationType)}
                      </p>
                      <p>
                        <strong>Destinatarios:</strong> {notification.recipients.join(', ')}
                      </p>
                      {notification.sentAt && (
                        <p>
                          <strong>Enviado:</strong> {new Date(notification.sentAt).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                      {notification.errorMessage && (
                        <p className="text-red-600">
                          <strong>Error:</strong> {notification.errorMessage}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(notification.createdAt).toLocaleDateString('es-ES')}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}