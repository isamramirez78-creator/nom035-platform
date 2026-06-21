import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { insertEmployeeSchema, type InsertEmployee, type Employee } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface EmployeeFormProps {
  employee?: Employee | null;
  onSuccess?: () => void;
}

export default function EmployeeForm({ employee, onSuccess }: EmployeeFormProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const form = useForm<InsertEmployee>({
    resolver: zodResolver(insertEmployeeSchema),
    defaultValues: {
      nombre: employee?.nombre || "",
      apellidos: employee?.apellidos || "",
      puesto: employee?.puesto || "",
      area: employee?.area || "",
      fechaIngreso: employee?.fechaIngreso || "",
      email: employee?.email || "",
      genero: (employee as any)?.genero || "",
      generacion: (employee as any)?.generacion || "",
      rfc: (employee as any)?.rfc || "",
      curp: (employee as any)?.curp || "",
    },
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: InsertEmployee) => {
      const response = await apiRequest("POST", "/api/employees", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      form.reset();
      toast({
        title: "Éxito",
        description: "Empleado registrado correctamente",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      const isLimitError = error?.message?.includes('Límite de empleados') || error?.limit;
      if (isLimitError) {
        toast({
          title: "Límite de empleados alcanzado",
          description: "Tu plan actual no permite más empleados. Actualiza tu plan para continuar.",
          variant: "destructive",
          action: (
            <button
              onClick={() => setLocation("/subscription-plans")}
              style={{
                background: "#1E3A5F", color: "white", padding: "6px 12px",
                borderRadius: "6px", fontSize: "12px", fontWeight: 600,
                border: "none", cursor: "pointer", whiteSpace: "nowrap"
              }}
            >
              Ver planes
            </button>
          ),
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "No se pudo registrar el empleado",
          variant: "destructive",
        });
      }
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async (data: InsertEmployee) => {
      const response = await apiRequest("PUT", `/api/employees/${employee!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Éxito",
        description: "Empleado actualizado correctamente",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el empleado",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertEmployee) => {
    if (employee) {
      updateEmployeeMutation.mutate(data);
    } else {
      createEmployeeMutation.mutate(data);
    }
  };

  const handleClearForm = () => {
    form.reset();
    onSuccess?.();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre(s) *</FormLabel>
              <FormControl>
                <Input placeholder="Ej. Juan Carlos" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="apellidos"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Apellidos *</FormLabel>
              <FormControl>
                <Input placeholder="Ej. García López" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="puesto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Puesto *</FormLabel>
              <FormControl>
                <Input placeholder="Ej. Analista de Recursos Humanos" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="area"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Área/Departamento *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar área" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Recursos Humanos">Recursos Humanos</SelectItem>
                  <SelectItem value="Tecnología">Tecnología</SelectItem>
                  <SelectItem value="Comercial">Comercial</SelectItem>
                  <SelectItem value="Operaciones">Operaciones</SelectItem>
                  <SelectItem value="Finanzas">Finanzas</SelectItem>
                  <SelectItem value="Administración">Administración</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="fechaIngreso"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha de Ingreso *</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo Electrónico</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Ej. juan.garcia@empresa.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name={"genero" as any}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Género <span className="text-slate-400 font-normal text-xs">(opcional)</span></FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Femenino">Femenino</SelectItem>
                    <SelectItem value="No binario">No binario</SelectItem>
                    <SelectItem value="Prefiero no decir">Prefiero no decir</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={"generacion" as any}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Generación <span className="text-slate-400 font-normal text-xs">(opcional)</span></FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Baby Boomers">Baby Boomers (1946–1964)</SelectItem>
                    <SelectItem value="Generación X">Generación X (1965–1980)</SelectItem>
                    <SelectItem value="Millennials">Millennials (1981–1996)</SelectItem>
                    <SelectItem value="Generación Z">Generación Z (1997–2012)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name={"rfc" as any}
            render={({ field }) => (
              <FormItem>
                <FormLabel>RFC <span className="text-slate-400 font-normal text-xs">(opcional)</span></FormLabel>
                <FormControl>
                  <Input
                    placeholder="AAAA000000AAA"
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
            name={"curp" as any}
            render={({ field }) => (
              <FormItem>
                <FormLabel>CURP <span className="text-slate-400 font-normal text-xs">(opcional)</span></FormLabel>
                <FormControl>
                  <Input
                    placeholder="AAAA000000HAAAAA00"
                    maxLength={18}
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex space-x-3 mt-6">
          <Button 
            type="submit" 
            className="flex-1 bg-brand-600 hover:bg-brand-700"
            disabled={createEmployeeMutation.isPending || updateEmployeeMutation.isPending}
          >
            {(createEmployeeMutation.isPending || updateEmployeeMutation.isPending) ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Guardando...
              </>
            ) : (
              <>
                <i className="fas fa-save mr-2"></i>
                {employee ? "Actualizar" : "Guardar"}
              </>
            )}
          </Button>
          <Button type="button" variant="outline" onClick={handleClearForm}>
            {employee ? "Cancelar" : "Limpiar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
