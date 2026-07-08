import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { queryClient } from "@/lib/queryClient";
import EmployeeForm from "@/components/forms/employee-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Eye, Download, Upload, FileText, HelpCircle } from "lucide-react";
import type { Employee } from "@shared/schema";

export default function Employees() {
  const [searchTerm, setSearchTerm] = useState("");
  const [areaFilter, setAreaFilter] = useState("all");
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const { toast } = useToast();

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/employees/${id}`, {
        method: "DELETE",
        headers: localStorage.getItem("company_token") ? { Authorization: `Bearer ${localStorage.getItem("company_token")}` } : {},
      });
      if (!response.ok) {
        throw new Error("Error al eliminar empleado");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Éxito",
        description: "Empleado eliminado correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el empleado",
        variant: "destructive",
      });
    },
  });


  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = !searchTerm || 
      employee.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.puesto.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesArea = !areaFilter || areaFilter === "all" || employee.area === areaFilter;
    
    return matchesSearch && matchesArea;
  });

  const areas = [...new Set(employees.map(emp => emp.area))];

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="h-64 bg-slate-200 rounded"></div>
          </div>
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="h-96 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Gestión de Empleados</h2>
        <p className="text-slate-600">Registra y administra la información del personal para las evaluaciones NOM-035</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Employee Registration Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {editingEmployee ? "Editar Empleado" : "Registrar Empleado"}
            </h3>
            <EmployeeForm 
              employee={editingEmployee} 
              onSuccess={() => setEditingEmployee(null)}
            />

          </div>
        </div>

        {/* Employee List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-900">Lista de Empleados</h3>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Input
                    placeholder="Buscar empleado..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-64"
                  />
                  <i className="fas fa-search absolute left-2.5 top-2.5 text-slate-400 text-sm"></i>
                </div>
                <Select value={areaFilter} onValueChange={setAreaFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Todas las áreas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las áreas</SelectItem>
                    {areas.map(area => (
                      <SelectItem key={area} value={area}>{area}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {filteredEmployees.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                <i className="fas fa-users text-4xl mb-4"></i>
                <p>No se encontraron empleados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Empleado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Área</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha Ingreso</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {filteredEmployees.map((employee) => (
                      <tr key={employee.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 bg-slate-200 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-slate-600">
                                {employee.nombre.charAt(0)}{employee.apellidos.charAt(0)}
                              </span>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-slate-900">
                                {employee.nombre} {employee.apellidos}
                              </div>
                              <div className="text-sm text-slate-500">{employee.puesto}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{employee.area}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {new Date(employee.fechaIngreso).toLocaleDateString('es-ES')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(() => {
                            const s = employee.riskStatus;
                            const map: Record<string, { label: string; cls: string }> = {
                              "sin-riesgo": { label: "Sin Riesgo", cls: "bg-green-100 text-green-800" },
                              "bajo":       { label: "Bajo",       cls: "bg-blue-100 text-blue-800" },
                              "medio":      { label: "Medio",      cls: "bg-yellow-100 text-yellow-800" },
                              "alto":       { label: "Alto",       cls: "bg-orange-100 text-orange-800" },
                              "muy-alto":   { label: "Muy Alto",   cls: "bg-red-100 text-red-800" },
                            };
                            const info = map[s ?? ""] ?? { label: "Pendiente", cls: "bg-amber-100 text-amber-800" };
                            return (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${info.cls}`}>
                                {info.label}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link href={`/employees/${employee.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-500 mr-3"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver Expediente
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingEmployee(employee)}
                            className="text-brand-600 hover:text-brand-500 mr-3"
                          >
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.location.href = '/questionnaires'}
                            className="text-amber-600 hover:text-amber-500 mr-3"
                          >
                            Evaluar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteEmployeeMutation.mutate(employee.id)}
                            className="text-red-600 hover:text-red-500"
                          >
                            Eliminar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
