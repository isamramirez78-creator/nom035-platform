/**
 * Hook para generar reporte individual desde cualquier página
 * Obtiene datos del empleado y su evaluación más reciente desde la API
 */
import { useToast } from "@/hooks/use-toast";

const token = () => localStorage.getItem("company_token");
const h = () => ({
  "Content-Type": "application/json",
  ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
});

export function useIndividualReport() {
  const { toast } = useToast();

  const generateReport = async (employeeId: number, evaluationId?: number) => {
    try {
      toast({ title: "Generando reporte...", description: "Por favor espera." });

      // Obtener datos del empleado
      const empRes = await fetch(`/api/employees/${employeeId}`, { headers: h() });
      if (!empRes.ok) throw new Error("No se encontró el empleado");
      const employee = await empRes.json();

      // Obtener evaluaciones del empleado
      const evalRes = await fetch(`/api/evaluations?employeeId=${employeeId}`, { headers: h() });
      const evaluations = evalRes.ok ? await evalRes.json() : [];

      // Usar la evaluación especificada o la más reciente completada
      const evaluation = evaluationId
        ? evaluations.find((e: any) => e.id === evaluationId)
        : evaluations.filter((e: any) => e.completed).sort((a: any, b: any) =>
            new Date(b.completedAt || b.created_at).getTime() - new Date(a.completedAt || a.created_at).getTime()
          )[0];

      if (!evaluation) {
        throw new Error("Este empleado no tiene evaluaciones completadas");
      }

      // Obtener datos de la empresa
      const compRes = await fetch("/api/company-info", { headers: h() });
      const company = compRes.ok ? await compRes.json() : {};

      // Generar PDF
      const { generateEmployeeReport } = await import("@/lib/individualReportGenerator");
      await generateEmployeeReport(employee, evaluation, company);

      toast({ title: "Reporte generado", description: `Reporte de ${employee.nombre} descargado correctamente.` });
    } catch (err: any) {
      toast({
        title: "Error al generar reporte",
        description: err?.message || "Verifica que el empleado tenga evaluaciones completadas.",
        variant: "destructive",
      });
    }
  };

  return { generateReport };
}
