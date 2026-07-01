import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const employeeFormSchema = z.object({
  nombre:           z.string().min(2, "El nombre es requerido"),
  apellidoPaterno:  z.string().min(2, "El apellido paterno es requerido"),
  apellidoMaterno:  z.string().optional().or(z.literal("")),
  numeroEmpleado:   z.string().optional().or(z.literal("")),
  puesto:           z.string().min(2, "El puesto es requerido"),
  area:             z.string().min(2, "El área es requerida"),
  fechaIngreso:     z.string().min(1, "La fecha de ingreso es requerida"),
  email:            z.string().email("Email inválido").optional().or(z.literal("")),
  genero:           z.string().optional().or(z.literal("")),
  generacion:       z.string().optional().or(z.literal("")),
  rfc:              z.string().regex(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i, "RFC inválido").optional().or(z.literal("")),
  curp:             z.string().regex(/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/i, "CURP inválida").optional().or(z.literal("")),
});

type EmployeeFormData = z.infer<typeof employeeFormSchema>;

interface EmployeeFormProps {
  employee?: any;
  onSuccess?: () => void;
}

export default function EmployeeForm({ employee, onSuccess }: EmployeeFormProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Separar apellidos existentes si vienen en campo unificado
  const apellidoPaterno = employee?.apellidoPaterno || employee?.apellido_paterno
    || (employee?.apellidos ? employee.apellidos.split(" ")[0] : "");
  const apellidoMaterno = employee?.apellidoMaterno || employee?.apellido_materno
    || (employee?.apellidos ? employee.apellidos.split(" ").slice(1).join(" ") : "");

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      nombre:          employee?.nombre          || "",
      apellidoPaterno: apellidoPaterno,
      apellidoMaterno: apellidoMaterno,
      numeroEmpleado:  employee?.numeroEmpleado  || employee?.numero_empleado || "",
      puesto:          employee?.puesto          || "",
      area:            employee?.area            || "",
      fechaIngreso:    employee?.fechaIngreso    || employee?.fecha_ingreso || "",
      email:           employee?.email           || "",
      genero:          employee?.genero          || "",
      generacion:      employee?.generacion      || "",
      rfc:             employee?.rfc             || "",
      curp:            employee?.curp            || "",
    },
  });

  const token = localStorage.getItem("company_token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const saveMutation = useMutation({
    mutationFn: async (data: EmployeeFormData) => {
      const payload = {
        nombre:          data.nombre,
        apellidos:       `${data.apellidoPaterno}${data.apellidoMaterno ? " " + data.apellidoMaterno : ""}`,
        apellidoPaterno: data.apellidoPaterno,
        apellidoMaterno: data.apellidoMaterno || null,
        numeroEmpleado:  data.numeroEmpleado  || null,
        puesto:          data.puesto,
        area:            data.area,
        fechaIngreso:    data.fechaIngreso,
        email:           data.email           || null,
        genero:          data.genero          || null,
        generacion:      data.generacion      || null,
        rfc:             data.rfc             ? data.rfc.toUpperCase() : null,
        curp:            data.curp            ? data.curp.toUpperCase() : null,
      };

      const url    = employee ? `/api/employees/${employee.id}` : "/api/employees";
      const method = employee ? "PUT" : "POST";

      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Error al guardar el empleado");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: employee ? "Empleado actualizado" : "Empleado registrado",
        description: "Los datos se guardaron correctamente.",
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      const isLimit = error.message?.includes("Límite");
      toast({
        title: isLimit ? "Límite de empleados alcanzado" : "Error al guardar",
        description: isLimit
          ? "Actualiza tu plan para agregar más empleados."
          : error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EmployeeFormData) => saveMutation.mutate(data);

  const Field = ({ name, label, placeholder, required, uppercase }: {
    name: keyof EmployeeFormData; label: string; placeholder?: string;
    required?: boolean; uppercase?: boolean;
  }) => (
    <FormField control={form.control} name={name} render={({ field }) => (
      <FormItem>
        <FormLabel>{label}{required && <span className="text-red-500 ml-1">*</span>}
          {!required && <span className="text-slate-400 text-xs ml-1">(opcional)</span>}
        </FormLabel>
        <FormControl>
          <Input
            placeholder={placeholder}
            {...field}
            value={field.value ?? ""}
            onChange={e => field.onChange(uppercase ? e.target.value.toUpperCase() : e.target.value)}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )} />
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

        {/* Nombre y apellidos */}
        <div className="grid grid-cols-1 gap-4">
          <Field name="nombre" label="Nombre(s)" placeholder="Ej: Juan Carlos" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field name="apellidoPaterno" label="Apellido Paterno" placeholder="Ej: García" required />
          <Field name="apellidoMaterno" label="Apellido Materno" placeholder="Ej: López" />
        </div>

        {/* Número de empleado */}
        <Field name="numeroEmpleado" label="Número de Empleado" placeholder="Ej: EMP-001" />

        {/* Puesto y área */}
        <div className="grid grid-cols-2 gap-4">
          <Field name="puesto" label="Puesto / Cargo" placeholder="Ej: Analista" required />
          <Field name="area" label="Área / Departamento" placeholder="Ej: Finanzas" required />
        </div>

        {/* Fecha y email */}
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="fechaIngreso" render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha de Ingreso <span className="text-red-500">*</span></FormLabel>
              <FormControl><Input type="date" {...field} value={field.value ?? ""} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <Field name="email" label="Correo Electrónico" placeholder="empleado@empresa.com" />
        </div>

        {/* Género y Generación */}
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="genero" render={({ field }) => (
            <FormItem>
              <FormLabel>Género <span className="text-slate-400 text-xs">(opcional)</span></FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Femenino">Femenino</SelectItem>
                  <SelectItem value="No binario">No binario</SelectItem>
                  <SelectItem value="Prefiero no decir">Prefiero no decir</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="generacion" render={({ field }) => (
            <FormItem>
              <FormLabel>Generación <span className="text-slate-400 text-xs">(opcional)</span></FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="Baby Boomers">Baby Boomers (1946–1964)</SelectItem>
                  <SelectItem value="Generación X">Generación X (1965–1980)</SelectItem>
                  <SelectItem value="Millennials">Millennials (1981–1996)</SelectItem>
                  <SelectItem value="Generación Z">Generación Z (1997–2012)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* RFC y CURP */}
        <div className="grid grid-cols-2 gap-4">
          <Field name="rfc" label="RFC" placeholder="AAAA000000AAA" uppercase />
          <Field name="curp" label="CURP" placeholder="AAAA000000HAAAAA00" uppercase />
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={saveMutation.isPending} className="flex-1">
            {saveMutation.isPending ? "Guardando..." : employee ? "Actualizar Empleado" : "Registrar Empleado"}
          </Button>
          <Button type="button" variant="outline" onClick={() => onSuccess?.()}>
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  );
}
EOFTS
echo "✅ employee-form.tsx — $(wc -l < /tmp/employee-form-new.tsx) líneas"