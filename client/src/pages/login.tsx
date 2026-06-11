import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Building2, Mail, Lock, ArrowRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  correoElectronico: z.string().email("Email inválido"),
  contrasena: z.string().min(1, "Contraseña requerida"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      correoElectronico: "",
      contrasena: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      setIsLoading(true);
      return apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (response) => {
      toast({
        title: "Inicio de sesión exitoso",
        description: "Bienvenido de vuelta al sistema NOM-035-STPS",
      });
      // Redirect to dashboard
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        title: "Error de autenticación",
        description: error.message || "Credenciales incorrectas",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Welcome Section */}
        <div className="flex flex-col justify-center space-y-6 lg:pr-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">NOM-035-STPS</h1>
                <p className="text-gray-600">Sistema de Evaluación Psicosocial</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-gray-900">
                Bienvenido de vuelta
              </h2>
              <p className="text-lg text-gray-600">
                Accede a tu cuenta empresarial para gestionar las evaluaciones de 
                riesgo psicosocial de tu organización.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Funcionalidades principales:</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900">Evaluaciones NOM-035</p>
                  <p className="text-sm text-gray-600">Cuestionarios oficiales para todos los tamaños de empresa</p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900">Expedientes Digitales</p>
                  <p className="text-sm text-gray-600">Historial completo y seguimiento personalizado por empleado</p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900">Alertas Automáticas</p>
                  <p className="text-sm text-gray-600">Notificaciones inmediatas para casos de alto riesgo</p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900">Reportes Ejecutivos</p>
                  <p className="text-sm text-gray-600">Dashboard y análisis para toma de decisiones</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder al sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="correoElectronico"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo Electrónico</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            type="email" 
                            placeholder="admin@empresa.com" 
                            className="pl-10"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="contrasena"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            type="password" 
                            placeholder="Tu contraseña"
                            className="pl-10"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <Link href="/forgot-password">
                      <span className="text-blue-600 hover:text-blue-500 cursor-pointer">
                        ¿Olvidaste tu contraseña?
                      </span>
                    </Link>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    "Iniciando sesión..."
                  ) : (
                    <>
                      Iniciar Sesión
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6">
              <Separator />
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  ¿No tienes una cuenta empresarial?{" "}
                  <Link href="/register">
                    <span className="text-blue-600 hover:text-blue-500 font-medium cursor-pointer">
                      Registrar empresa
                    </span>
                  </Link>
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">🎉 Prueba Gratuita</h4>
              <p className="text-sm text-blue-800">
                Nuevas empresas obtienen 30 días gratis con acceso completo a todas las funciones.
                No se requiere tarjeta de crédito.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}