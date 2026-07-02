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
  rfc:              z.string().optional().or(z.literal("")),
  curp:             z.string().optional().or(z.literal("")),
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

  const apellidoPaterno = employee?.apellidoPaterno || employee?.apellido_paterno
    || (employee?.apellidos ? employee.apellidos.split(" ")[0] : "");
  const apellidoMaterno = employee?.apellidoMaterno || employee?.apellido_materno
    || (employee?.apellidos ? employee.apellidos.split(" ").slice(1).join(" ") : "");

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      nombre:          employee?.nombre          || "",
      apellidoPaterno: apellidoPaterno           || "",
      apellidoMaterno: apellidoMaterno           || "",
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
        rfc:             data.rfc             ? data.rfc.toUpperCase()  : null,
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
        description: isLimit ? "Actualiza tu plan para agregar más empleados." : error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EmployeeFormData) => saveMutation.mutate(data);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

        {/* Nombre */}
        <FormField control={form.control} name="nombre" render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre(s) <span className="text-red-500">*</span></FormLabel>
            <FormControl><Input placeholder="Ej: Juan Carlos" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* Apellidos separados */}
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="apellidoPaterno" render={({ field }) => (
            <FormItem>
              <FormLabel>Apellido Paterno <span className="text-red-500">*</span></FormLabel>
              <FormControl><Input placeholder="Ej: García" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="apellidoMaterno" render={({ field }) => (
            <FormItem>
              <FormLabel>Apellido Materno <span className="text-slate-400 text-xs">(opcional)</span></FormLabel>
              <FormControl><Input placeholder="Ej: López" {...field} value={field.value ?? ""} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* No. Empleado */}
        <FormField control={form.control} name="numeroEmpleado" render={({ field }) => (
          <FormItem>
            <FormLabel>Número de Empleado <span className="text-slate-400 text-xs">(opcional)</span></FormLabel>
            <FormControl><Input placeholder="Ej: EMP-001" {...field} value={field.value ?? ""} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* Puesto y Área */}
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="puesto" render={({ field }) => (
            <FormItem>
              <FormLabel>Puesto / Cargo <span className="text-red-500">*</span></FormLabel>
              <FormControl><Input placeholder="Ej: Analista" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="area" render={({ field }) => (
            <FormItem>
              <FormLabel>Área / Departamento <span className="text-red-500">*</span></FormLabel>
              <FormControl><Input placeholder="Ej: Finanzas" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* Fecha e Email */}
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="fechaIngreso" render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha de Ingreso <span className="text-red-500">*</span></FormLabel>
              <FormControl><Input type="date" {...field} value={field.value ?? ""} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>Correo Electrónico <span className="text-slate-400 text-xs">(opcional)</span></FormLabel>
              <FormControl><Input type="email" placeholder="empleado@empresa.com" {...field} value={field.value ?? ""} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
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
          <FormField control={form.control} name="rfc" render={({ field }) => (
            <FormItem>
              <FormLabel>RFC <span className="text-slate-400 text-xs">(opcional)</span></FormLabel>
              <FormControl>
                <Input placeholder="AAAA000000AAA" maxLength={13}
                  {...field} value={field.value ?? ""}
                  onChange={e => field.onChange(e.target.value.toUpperCase())} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="curp" render={({ field }) => (
            <FormItem>
              <FormLabel>CURP <span className="text-slate-400 text-xs">(opcional)</span></FormLabel>
              <FormControl>
                <Input placeholder="AAAA000000HAAAAA00" maxLength={18}
                  {...field} value={field.value ?? ""}
                  onChange={e => field.onChange(e.target.value.toUpperCase())} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
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
