import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertCompanySchema, type InsertCompany } from "@shared/schema";
import { Eye, EyeOff, Building2, UserCheck, Shield } from "lucide-react";

export default function CompanyRegister() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();

  const form = useForm<InsertCompany>({
    resolver: zodResolver(insertCompanySchema),
    defaultValues: {
      nombreEmpresa: "",
      razonSocial: "",
      rfc: "",
      domicilio: "",
      telefono: "",
      correoElectronico: "",
      sitioWeb: "",
      registroPatronal: "",
      actividadEconomica: "",
      giroEmpresarial: "",
      cantidadEmpleados: 1,
      centrosTrabajo: 1,
      representanteLegal: "",
      cargoRepresentante: "",
      rfcRepresentante: "",
      nombreAdministrador: "",
      apellidosAdministrador: "",
      cargoAdministrador: "",
      telefonoAdministrador: "",
      correoAdministrador: "",
      contrasena: "",
      responsableNom035: "",
      cargoResponsableNom035: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: InsertCompany) => {
      return await apiRequest("POST", "/api/companies/register", data);
    },
    onSuccess: (response) => {
      toast({
        title: "Registro exitoso",
        description: "Su empresa ha sido registrada correctamente. Puede proceder a iniciar sesión.",
      });
      setLocation("/company-login");
    },
    onError: (error: Error) => {
      toast({
        title: "Error en el registro",
        description: error.message || "Ocurrió un error durante el registro",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertCompany) => {
    registerMutation.mutate(data);
  };

  const nextStep = () => {
    const fieldsToValidate = currentStep === 1 
      ? ['nombreEmpresa', 'razonSocial', 'rfc', 'domicilio', 'correoElectronico', 'actividadEconomica', 'giroEmpresarial', 'cantidadEmpleados'] 
      : ['representanteLegal', 'cargoRepresentante', 'rfcRepresentante'];
    
    form.trigger(fieldsToValidate as any).then((isValid) => {
      if (isValid) {
        setCurrentStep(currentStep + 1);
      }
    });
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Building2 className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            Registro de Empresa
          </CardTitle>
          <CardDescription className="text-lg text-gray-600">
            Sistema de Evaluación NOM-035-STPS
          </CardDescription>
          
          {/* Progress indicator */}
          <div className="flex items-center justify-center mt-6">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                1
              </div>
              <div className={`w-16 h-1 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                2
              </div>
              <div className={`w-16 h-1 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} />
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                3
              </div>
            </div>
          </div>
          
          <div className="text-sm text-gray-500 mt-2">
            {currentStep === 1 && "Datos de la Empresa"}
            {currentStep === 2 && "Representante Legal"}
            {currentStep === 3 && "Administrador del Sistema"}
          </div>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Step 1: Company Data */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold">Información de la Empresa</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nombreEmpresa"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre de la Empresa *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Tecnología Innovadora SA" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="razonSocial"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Razón Social *</FormLabel>
                          <FormControl>
                            <Input placeholder="Razón social completa" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="rfc"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>RFC *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="ABC123456789" 
                              maxLength={13}
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
                      name="correoElectronico"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Correo Electrónico *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="empresa@ejemplo.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="telefono"
                      render={({ field }) => (
                          <FormLabel>Teléfono <span style={{color:"#EF4444"}}>*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="555-123-4567" {...field} />
                          </FormControl>
                          <FormDescription style={{color:"#F59E0B",fontSize:12}}>IMPORTANTE: se solicitará para recuperar tu contraseña junto con tu RFC.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sitioWeb"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sitio Web</FormLabel>
                          <FormControl>
                            <Input placeholder="https://www.empresa.com" {...field} />
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
                            placeholder="Calle, número, colonia, municipio, estado, código postal"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="actividadEconomica"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Actividad Económica *</FormLabel>
                          <FormControl>
                            <Input placeholder="Descripción de la actividad principal" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="giroEmpresarial"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Giro Empresarial *</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione el giro" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="comercial">Comercial</SelectItem>
                                <SelectItem value="industrial">Industrial</SelectItem>
                                <SelectItem value="servicios">Servicios</SelectItem>
                                <SelectItem value="tecnologia">Tecnología</SelectItem>
                                <SelectItem value="construccion">Construcción</SelectItem>
                                <SelectItem value="salud">Salud</SelectItem>
                                <SelectItem value="educacion">Educación</SelectItem>
                                <SelectItem value="otro">Otro</SelectItem>
                              </SelectContent>
                            </Select>
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
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
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
                          <FormLabel>Registro Patronal IMSS</FormLabel>
                          <FormControl>
                            <Input placeholder="A1234567890" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Legal Representative */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <UserCheck className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold">Representante Legal</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="representanteLegal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre Completo *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre y apellidos del representante" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cargoRepresentante"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cargo *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Director General, Presidente" {...field} />
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
                          <FormLabel>RFC del Representante *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="ABC123456X12" 
                              maxLength={13}
                              {...field}
                              onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="responsableNom035"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Responsable NOM-035</FormLabel>
                          <FormControl>
                            <Input placeholder="Persona responsable del cumplimiento" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cargoResponsableNom035"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cargo del Responsable</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Gerente de Recursos Humanos" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Administrator */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold">Administrador del Sistema</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nombreAdministrador"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre del administrador" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="apellidosAdministrador"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Apellidos *</FormLabel>
                          <FormControl>
                            <Input placeholder="Apellidos del administrador" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cargoAdministrador"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cargo *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Gerente de TI, Director de RRHH" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="telefonoAdministrador"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono <span style={{color:"#EF4444"}}>*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="555-123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="correoAdministrador"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Correo Electrónico *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="admin@empresa.com" {...field} />
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
                          <FormLabel>Contraseña *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Mínimo 8 caracteres"
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex justify-between pt-6">
                {currentStep > 1 && (
                  <Button type="button" variant="outline" onClick={prevStep}>
                    Anterior
                  </Button>
                )}
                
                {currentStep < 3 && (
                  <Button type="button" onClick={nextStep} className="ml-auto">
                    Siguiente
                  </Button>
                )}
                
                {currentStep === 3 && (
                  <Button 
                    type="submit" 
                    className="ml-auto"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? "Registrando..." : "Registrar Empresa"}
                  </Button>
                )}
              </div>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tiene una cuenta?{" "}
              <Link href="/company-login" className="text-blue-600 hover:underline">
                Iniciar sesión
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
