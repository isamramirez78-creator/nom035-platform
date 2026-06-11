import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NotificationSettings from "@/components/notifications/notification-settings";
import NotificationHistory from "@/components/notifications/notification-history";

export default function Notifications() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">Sistema de Notificaciones</h1>
        <p className="text-gray-600">Gestión completa de notificaciones automáticas por email para el sistema NOM-035-STPS</p>
      </div>

      <Tabs defaultValue="history" className="space-y-4">
        <TabsList>
          <TabsTrigger value="history">Historial</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <NotificationHistory />
        </TabsContent>

        <TabsContent value="settings">
          <NotificationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}