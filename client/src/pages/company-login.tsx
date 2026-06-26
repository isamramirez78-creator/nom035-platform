import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { loginCompanySchema, type LoginCompany } from "@shared/schema";
import { Eye, EyeOff, Building2, Shield, CheckCircle } from "lucide-react";

export default function CompanyLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const form = useForm<LoginCompany>({
    resolver: zodResolver(loginCompanySchema),
    defaultValues: {
      correoElectronico: "",
      contrasena: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginCompany) => {
      const res = await fetch("/api/companies/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Credenciales incorrectas");
      return json;
    },
    onSuccess: (data) => {
      if (data.token) {
        localStorage.setItem("company_token", data.token);
      }
      toast({
        title: "Inicio de sesión exitoso",
        description: "Bienvenido al sistema de gestión NOM-035",
      });
      // Recarga completa para que ProtectedRoute detecte el token
      window.location.href = "/dashboard";
    },
    onError: (error: Error) => {
      toast({
        title: "Error de autenticación",
        description: error.message || "Credenciales incorrectas",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginCompany) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        
        {/* Left side - Features */}
        <div className="space-y-8 text-center lg:text-left">
          <div className="space-y-4">
            <div className="flex items-center justify-center lg:justify-start">
              <Building2 className="h-16 w-16 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              Sistema NOM-035-STPS
            </h1>
            <p className="text-xl text-gray-600">
              Plataforma integral para el cumplimiento de la normativa de factores de riesgo psicosocial en el trabajo
            </p>
          </div>

          <div className="space-y-6">
            {[
              { title: "Cumplimiento Total", desc: "Implementación completa de todos los requerimientos de la NOM-035-STPS-2018" },
              { title: "Evaluaciones Oficiales", desc: "Cuestionarios oficiales de las Guías de Referencia con cálculo automático de riesgos" },
              { title: "Reportes y Seguimiento", desc: "Generación de reportes oficiales y seguimiento de intervenciones requeridas" },
              { title: "Gestión Multi-tenant", desc: "Datos seguros y aislados por empresa con control de acceso completo" },
            ].map((item) => (
              <div key={item.title} className="flex items-start space-x-4">
                <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right side - Login Form */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Shield className="h-10 w-10 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Iniciar Sesión
            </CardTitle>
            <CardDescription className="text-gray-600">
              Acceda a su cuenta empresarial
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="correoElectronico"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo Electrónico</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="empresa@ejemplo.com" {...field} />
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
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Ingrese su contraseña"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>
              </form>
            </Form>

            <div className="mt-6 space-y-4">
              <div className="text-center">
                <span className="text-sm text-gray-400">¿Olvidó su contraseña?</span>
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">O</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  ¿No tiene una cuenta?{" "}
                  <Link href="/company-register" className="text-blue-600 hover:underline font-semibold">
                    Registrar empresa
                  </Link>
                </p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-500">Sistema certificado para cumplimiento de</p>
              <p className="text-xs font-semibold text-gray-700 mt-1">NOM-035-STPS-2018</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
