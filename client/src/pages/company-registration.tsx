import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Building2, FileText, Users, CreditCard, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const companyRegistrationSchema = z.object({
  nombreEmpresa: z.string().min(2, "El nombre de la empresa debe tener al menos 2 caracteres"),
  rfc: z.string().regex(/^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/, "RFC inválido"),
  domicilio: z.string().min(10, "Proporciona una dirección completa"),
  registroPatronal: z.string().optional(),
  representanteLegal: z.string().min(2, "Nombre del representante legal requerido"),
  rfcRepresentante: z.string().regex(/^[A-Z&Ñ]{4}[0-9]{6}[A-Z0-9]{3}$/, "RFC del representante inválido"),
  cantidadEmpleados: z.number().min(1, "Debe tener al menos 1 empleado").max(10000, "Máximo 10,000 empleados"),
  correoElectronico: z.string().email("Email inválido"),
  contrasena: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  confirmarContrasena: z.string(),
}).refine((data) => data.contrasena === data.confirmarContrasena, {
  message: "Las contraseñas no coinciden",
  path: ["confirmarContrasena"],
});

type CompanyRegistrationForm = z.infer<typeof companyRegistrationSchema>;

export default function CompanyRegistration() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isRegistered, setIsRegistered] = useState(false);
  const { toast } = useToast();

  const form = useForm<CompanyRegistrationForm>({
    resolver: zodResolver(companyRegistrationSchema),
    defaultValues: {
      nombreEmpresa: "",
      rfc: "",
      domicilio: "",
      registroPatronal: "",
      representanteLegal: "",
      rfcRepresentante: "",
      cantidadEmpleados: 1,
      correoElectronico: "",
      contrasena: "",
      confirmarContrasena: "",
    },
  });

  const registerCompanyMutation = useMutation({
    mutationFn: async (data: CompanyRegistrationForm) => {
      const { confirmarContrasena, ...companyData } = data;
      return apiRequest("/api/companies/register", {
        method: "POST",
        body: JSON.stringify(companyData),
      });
    },
    onSuccess: (response) => {
      setIsRegistered(true);
      toast({
        title: "Registro exitoso",
        description: "Tu empresa ha sido registrada correctamente. Bienvenido a NOM-035-STPS.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error en el registro",
        description: error.message || "No se pudo completar el registro",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CompanyRegistrationForm) => {
    registerCompanyMutation.mutate(data);
  };

  const getRecommendedPlan = (employees: number) => {
    if (employees <= 15) return "Microempresa (1-15 empleados) - NOM-035";
    if (employees <= 49) return "Pequeña Empresa (16-49 empleados) - NOM-035";
    if (employees <= 249) return "Mediana Empresa (50-249 empleados) - NOM-035";
    return "Gran Empresa (250+ empleados) - NOM-035";
  };

  const steps = [
    { number: 1, title: "Información de la Empresa", icon: Building2 },
    { number: 2, title: "Representante Legal", icon: FileText },
    { number: 3, title: "Configuración de Cuenta", icon: Users },
    { number: 4, title: "Plan de Suscripción", icon: CreditCard },
  ];

  if (isRegistered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">¡Registro Completado!</CardTitle>
            <CardDescription>
              Tu empresa ha sido registrada exitosamente en el sistema NOM-035-STPS
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Próximos pasos:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Recibirás un email de confirmación en tu correo registrado</li>
                <li>• Podrás acceder al sistema con tus credenciales</li>
                <li>• Comienza tu período de prueba gratuito de 30 días</li>
                <li>• Agrega empleados y realiza tus primeras evaluaciones</li>
              </ul>
            </div>
            <div className="flex gap-4">
              <Button 
                className="flex-1" 
                onClick={() => window.location.href = "/login"}
              >
                Iniciar Sesión
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => window.location.href = "/"}
              >
                Ir al Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Registro de Empresa
          </h1>
          <p className="text-gray-600">
            Crea tu perfil empresarial para acceder al sistema NOM-035-STPS
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step) => (
              <div key={step.number} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep >= step.number 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  <step.icon className="w-5 h-5" />
                </div>
                <span className="text-xs mt-2 text-center max-w-20">{step.title}</span>
              </div>
            ))}
          </div>
          <Progress value={(currentStep / steps.length) * 100} className="w-full" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === 1 && "Información de la Empresa"}
              {currentStep === 2 && "Representante Legal"}
              {currentStep === 3 && "Configuración de Cuenta"}
              {currentStep === 4 && "Plan de Suscripción"}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Proporciona los datos fiscales y generales de tu empresa"}
              {currentStep === 2 && "Información del representante legal de la empresa"}
              {currentStep === 3 && "Configura tu cuenta de acceso al sistema"}
              {currentStep === 4 && "Revisa y confirma tu plan de suscripción"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Step 1: Company Information */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="nombreEmpresa"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre de la Empresa *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Empresa Ejemplo S.A. de C.V." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="rfc"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>RFC de la Empresa *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="EJE123456ABC" 
                                {...field} 
                                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="registroPatronal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Registro Patronal</FormLabel>
                            <FormControl>
                              <Input placeholder="A1234567890" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="domicilio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Domicilio Fiscal *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Calle, número, colonia, ciudad, estado, CP"
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cantidadEmpleados"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cantidad de Empleados *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1"
                              max="10000"
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                          <p className="text-sm text-gray-600">
                            Plan recomendado: <strong>{getRecommendedPlan(form.watch("cantidadEmpleados"))}</strong>
                          </p>
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 2: Legal Representative */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="representanteLegal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del Representante Legal *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre completo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="rfcRepresentante"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>RFC del Representante Legal *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="ABCD123456EFG" 
                              {...field} 
                              onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 3: Account Setup */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="correoElectronico"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Correo Electrónico *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="admin@empresa.com" {...field} />
                          </FormControl>
                          <FormMessage />
                          <p className="text-sm text-gray-600">
                            Este será tu usuario para acceder al sistema
                          </p>
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="contrasena"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contraseña *</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Mínimo 8 caracteres" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="confirmarContrasena"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirmar Contraseña *</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Confirma tu contraseña" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Step 4: Subscription Plan */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-medium text-blue-900 mb-2">Plan Recomendado para tu Empresa</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
                          <h4 className="font-medium text-blue-900">Microempresa</h4>
                          <p className="text-xs text-blue-700 mb-2">1-15 empleados (NOM-035)</p>
                          <div className="space-y-1">
                            <p className="text-lg font-bold text-blue-600">$374 MXN/mes</p>
                            <p className="text-sm text-green-600">$2,013/semestre (-10%)</p>
                            <p className="text-sm text-green-600">$3,738/año (-17%)</p>
                          </div>
                          <ul className="text-sm text-gray-600 mt-2 space-y-1">
                            <li>• Cuestionario microempresas</li>
                            <li>• 50 evaluaciones NOM-035/mes</li>
                            <li>• Cumplimiento normativo</li>
                            <li>• Expedientes digitales</li>
                          </ul>
                        </div>
                        
                        <div className="bg-white p-4 rounded-lg border-2 border-green-200">
                          <h4 className="font-medium text-green-900">Pequeña Empresa</h4>
                          <p className="text-xs text-green-700 mb-2">16-49 empleados (NOM-035)</p>
                          <div className="space-y-1">
                            <p className="text-lg font-bold text-green-600">$749 MXN/mes</p>
                            <p className="text-sm text-green-600">$4,043/semestre (-10%)</p>
                            <p className="text-sm text-green-600">$7,488/año (-17%)</p>
                          </div>
                          <ul className="text-sm text-gray-600 mt-2 space-y-1">
                            <li>• Cuestionarios Guía I y II</li>
                            <li>• 150 evaluaciones NOM-035/mes</li>
                            <li>• Factores de riesgo avanzados</li>
                            <li>• Notificaciones automáticas</li>
                          </ul>
                        </div>
                        
                        <div className="bg-white p-4 rounded-lg border-2 border-purple-200">
                          <h4 className="font-medium text-purple-900">Mediana Empresa</h4>
                          <p className="text-xs text-purple-700 mb-2">50-249 empleados (NOM-035)</p>
                          <div className="space-y-1">
                            <p className="text-lg font-bold text-purple-600">$1,249 MXN/mes</p>
                            <p className="text-sm text-green-600">$6,743/semestre (-10%)</p>
                            <p className="text-sm text-green-600">$12,488/año (-17%)</p>
                          </div>
                          <ul className="text-sm text-gray-600 mt-2 space-y-1">
                            <li>• Cuestionarios Guía I, II y III</li>
                            <li>• 500 evaluaciones NOM-035/mes</li>
                            <li>• Análisis psicosocial completo</li>
                            <li>• Programas de intervención</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-medium text-green-900 mb-2">🎉 Período de Prueba Gratuito</h3>
                      <p className="text-sm text-green-800">
                        Al registrarte, tendrás acceso gratuito por 30 días a todas las funciones. 
                        Después puedes elegir el plan que mejor se adapte a tu empresa con descuentos 
                        del 10% semestral o 17% anual.
                      </p>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h3 className="font-medium text-yellow-900 mb-2">💰 Ahorra con Planes Anuales</h3>
                      <ul className="text-sm text-yellow-800 space-y-1">
                        <li>• Plan Semestral: 10% de descuento (equivale a 1 mes gratis)</li>
                        <li>• Plan Anual: 17% de descuento (equivale a 2 meses gratis)</li>
                        <li>• Sin permanencia forzosa, cancela cuando gustes</li>
                        <li>• Facturación automática para mayor comodidad</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                    disabled={currentStep === 1}
                  >
                    Anterior
                  </Button>
                  
                  {currentStep < 4 ? (
                    <Button
                      type="button"
                      onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
                    >
                      Siguiente
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={registerCompanyMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {registerCompanyMutation.isPending ? "Registrando..." : "Completar Registro"}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}