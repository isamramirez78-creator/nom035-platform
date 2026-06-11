import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Settings, Mail } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface NotificationSetting {
  id: number;
  settingKey: string;
  settingValue: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function NotificationSettings() {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [emailInputs, setEmailInputs] = useState<{ [key: string]: string }>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<NotificationSetting[]>({
    queryKey: ['/api/notification-settings'],
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string[] }) => {
      return apiRequest('/api/notification-settings', {
        method: 'POST',
        body: JSON.stringify({
          settingKey: key,
          settingValue: value,
          isActive: true,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notification-settings'] });
      setEditingKey(null);
      setEmailInputs({});
      toast({
        title: "Configuración actualizada",
        description: "Las direcciones de email han sido actualizadas correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración.",
        variant: "destructive",
      });
    },
  });

  const getSettingTitle = (key: string): string => {
    switch (key) {
      case 'supervisor_emails': return 'Supervisores';
      case 'hr_emails': return 'Recursos Humanos';
      case 'admin_emails': return 'Administradores';
      default: return key;
    }
  };

  const getSettingDescription = (key: string): string => {
    switch (key) {
      case 'supervisor_emails': return 'Reciben alertas de empleados de alto riesgo';
      case 'hr_emails': return 'Reciben todas las notificaciones de RH';
      case 'admin_emails': return 'Reciben notificaciones del sistema';
      default: return 'Configuración de notificaciones';
    }
  };

  const handleEdit = (key: string, currentEmails: string[]) => {
    setEditingKey(key);
    setEmailInputs({ [key]: currentEmails.join(', ') });
  };

  const handleSave = (key: string) => {
    const emailString = emailInputs[key] || '';
    const emails = emailString
      .split(',')
      .map(email => email.trim())
      .filter(email => email && email.includes('@'));

    if (emails.length === 0) {
      toast({
        title: "Error",
        description: "Debe agregar al menos un email válido.",
        variant: "destructive",
      });
      return;
    }

    updateSettingMutation.mutate({ key, value: emails });
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEmailInputs({});
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración de Notificaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
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
          <Settings className="h-5 w-5" />
          Configuración de Notificaciones por Email
        </CardTitle>
        <CardDescription>
          Configure las direcciones de email que recibirán notificaciones automáticas del sistema NOM-035
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {settings?.map((setting) => (
          <div key={setting.id} className="border rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {getSettingTitle(setting.settingKey)}
                </h3>
                <p className="text-sm text-gray-600">
                  {getSettingDescription(setting.settingKey)}
                </p>
              </div>
              <Badge variant={setting.isActive ? "default" : "secondary"}>
                {setting.isActive ? "Activo" : "Inactivo"}
              </Badge>
            </div>

            {editingKey === setting.settingKey ? (
              <div className="space-y-3">
                <Label>Direcciones de Email (separadas por comas)</Label>
                <Textarea
                  placeholder="email1@empresa.com, email2@empresa.com"
                  value={emailInputs[setting.settingKey] || ''}
                  onChange={(e) => setEmailInputs({
                    ...emailInputs,
                    [setting.settingKey]: e.target.value
                  })}
                  className="min-h-[100px]"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSave(setting.settingKey)}
                    disabled={updateSettingMutation.isPending}
                    size="sm"
                  >
                    {updateSettingMutation.isPending ? "Guardando..." : "Guardar"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    size="sm"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {(setting.settingValue as string[])?.map((email, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {email}
                    </Badge>
                  ))}
                  {(!setting.settingValue || (setting.settingValue as string[]).length === 0) && (
                    <span className="text-sm text-gray-500 italic">
                      No hay emails configurados
                    </span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(setting.settingKey, setting.settingValue as string[])}
                >
                  Editar
                </Button>
              </div>
            )}
          </div>
        ))}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">ℹ️ Información sobre Notificaciones</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Las notificaciones se envían automáticamente cuando se detectan empleados de alto riesgo</li>
            <li>• Los supervisores reciben alertas inmediatas para riesgo alto y muy alto</li>
            <li>• Se pueden enviar recordatorios manuales de intervenciones</li>
            <li>• Todas las notificaciones quedan registradas en el sistema</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}