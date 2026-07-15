import { useQuery, useMutation } from "@tanstack/react-query";
import RiskChart from "@/components/charts/risk-chart";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Employee } from "@shared/schema";

interface DashboardStats {
  totalEmployees: number;
  evaluationsCompleted: number;
  pendingEvaluations: number;
  highRiskCount: number;
  riskDistribution: { [key: string]: number };
  areaStats: { [key: string]: { total: number; completed: number; avgRisk: number } };
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
  });

  const { data: recentEvaluations = [] } = useQuery({
    queryKey: ["/api/evaluations"],
    select: (data: any[]) => data
      .filter(evaluation => evaluation.completed)
      .sort((a, b) => new Date(b.completed_at || b.completedAt || b.created_at).getTime() - new Date(a.completed_at || a.completedAt || a.created_at).getTime())
      .slice(0, 5)
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const generateIndividualReportMutation = useMutation({
    mutationFn: async (evaluationData: any) => {
      const response = await apiRequest("POST", "/api/reports/individual", evaluationData);
      return response.json();
    },
    onSuccess: (data) => {
      generateIndividualPDF(data);
      toast({
        title: "Reporte generado",
        description: "El reporte individual se ha descargado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo generar el reporte individual",
        variant: "destructive",
      });
    },
  });

  const generateIndividualPDF = (reportData: any) => {
    import('jspdf').then((jsPDF) => {
      const doc = new jsPDF.default();
      const { evaluation, employee } = reportData;
      
      // Header
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Reporte Individual NOM-035-STPS', 20, 25);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generado el: ${new Date().toLocaleDateString('es-MX')}`, 20, 35);
      
      doc.setTextColor(0, 0, 0);
      
      let yPos = 60;
      
      // Employee Information Section
      doc.setFillColor(243, 244, 246);
      doc.rect(15, yPos - 5, 180, 15, 'F');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Información del Empleado', 20, yPos + 5);
      yPos += 25;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Nombre: ${employee.nombre} ${employee.apellidos || employee.apellido_paterno || ""}`, 25, yPos);
      yPos += 8;
      doc.text(`Puesto: ${employee.puesto}`, 25, yPos);
      yPos += 8;
      doc.text(`Área: ${employee.area}`, 25, yPos);
      yPos += 8;
      doc.text(`Email: ${employee.email || 'No especificado'}`, 25, yPos);
      yPos += 20;
      
      // Evaluation Results Section
      doc.setFillColor(243, 244, 246);
      doc.rect(15, yPos - 5, 180, 15, 'F');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Resultados de la Evaluación', 20, yPos + 5);
      yPos += 25;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Tipo de Cuestionario: ${getQuestionnaireTypeName(evaluation.questionnaireType || evaluation.questionnaire_type)}`, 25, yPos);
      yPos += 8;
      doc.text(`Fecha de Evaluación: ${new Date((evaluation.completed_at || evaluation.created_at || "").replace(" ", "T")).toLocaleDateString('es-MX')}`, 25, yPos);
      yPos += 8;
      
      // Risk Level with color
      const riskColors = {
        'sin-riesgo': [34, 197, 94],
        'bajo': [101, 163, 13],
        'medio': [234, 179, 8],
        'alto': [249, 115, 22],
        'muy-alto': [239, 68, 68]
      };
      
      const riskColor = riskColors[evaluation.riskLevel || evaluation.risk_level as keyof typeof riskColors] || [0, 0, 0];
      doc.setTextColor(...riskColor);
      doc.setFont('helvetica', 'bold');
      doc.text(`Nivel de Riesgo: ${getRiskLevelText(evaluation.riskLevel || evaluation.risk_level).toUpperCase()}`, 25, yPos);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      yPos += 8;
      
      doc.text(`Puntuación General: ${(evaluation.overall_score > 0 ? evaluation.overall_score : evaluation.questionnaire_type === 'traumatic_events' ? 'N/A (evaluación cualitativa)' : evaluation.overall_score === 0 ? '0' : 'No calculada')}`, 25, yPos);
      yPos += 20;
      
      // Domain Scores Section
      if (evaluation.domainScores && evaluation.domainScores.length > 0) {
        doc.setFillColor(243, 244, 246);
        doc.rect(15, yPos - 5, 180, 15, 'F');
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Puntuaciones por Dominio', 20, yPos + 5);
        yPos += 25;
        
        doc.setFontSize(10);
        evaluation.domainScores.forEach((domain: any) => {
          doc.text(`${domain.domain}: ${domain.score}/${domain.maxScore} (${domain.percentage}%)`, 25, yPos);
          yPos += 6;
        });
        yPos += 15;
      }
      
      // Recommendations Section
      if (evaluation.recommendations && evaluation.recommendations.length > 0) {
        doc.setFillColor(243, 244, 246);
        doc.rect(15, yPos - 5, 180, 15, 'F');
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Recomendaciones', 20, yPos + 5);
        yPos += 25;
        
        doc.setFontSize(10);
        evaluation.recommendations.forEach((rec: string, index: number) => {
          doc.text(`${index + 1}. ${rec}`, 25, yPos);
          yPos += 6;
        });
      } else {
        // Default recommendations based on risk level
        doc.setFillColor(243, 244, 246);
        doc.rect(15, yPos - 5, 180, 15, 'F');
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Recomendaciones', 20, yPos + 5);
        yPos += 25;
        
        doc.setFontSize(10);
        const defaultRecommendations = getDefaultRecommendations(evaluation.riskLevel || evaluation.risk_level);
        defaultRecommendations.forEach((rec: string, index: number) => {
          doc.text(`${index + 1}. ${rec}`, 25, yPos);
          yPos += 6;
        });
      }
      
      // Footer
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text('Este reporte es confidencial y de uso exclusivo para la gestión de riesgos psicosociales', 20, 280);
      doc.text(`Reporte generado automáticamente - ${new Date().toLocaleString('es-MX')}`, 20, 285);
      
      // Download
      const fileName = `reporte-individual-${((employee.nombre || "") + " " + (employee.apellidos || employee.apellido_paterno || "")).replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    }).catch((error) => {
      console.error('Error cargando jsPDF:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el PDF",
        variant: "destructive",
      });
    });
  };

  const handleViewReport = (evaluation: any) => {
    const employee = employees.find((emp: any) => emp.id === evaluation.employeeId || evaluation.employee_id);
    if (!employee) {
      toast({
        title: "Error",
        description: "No se encontró la información del empleado",
        variant: "destructive",
      });
      return;
    }

    generateIndividualReportMutation.mutate({
      evaluation,
      employee
    });
  };

  const getQuestionnaireTypeName = (type: string) => {
    const types = {
      'microempresa': 'Microempresa (22 preguntas)',
      'guia1': 'Guía I (46 preguntas)',
      'guia2': 'Guía II (71 preguntas)',
      'guia3': 'Guía III (96 preguntas)',
      'traumatic': 'Eventos Traumáticos (9 preguntas)', 'traumatic_events': 'Guía I - Eventos Traumáticos Severos'
    };
    return types[type as keyof typeof types] || type;
  };

  const getDefaultRecommendations = (riskLevel: string) => {
    const recommendations = {
      'sin-riesgo': [
        'Mantener las condiciones laborales actuales',
        'Continuar con los programas de bienestar existentes',
        'Realizar evaluaciones periódicas de seguimiento'
      ],
      'bajo': [
        'Monitorear regularmente las condiciones de trabajo',
        'Implementar actividades de prevención',
        'Fomentar la comunicación abierta con supervisores'
      ],
      'medio': [
        'Evaluar específicamente las fuentes de estrés laboral',
        'Implementar medidas preventivas específicas',
        'Considerar ajustes en la carga de trabajo',
        'Programar evaluación de seguimiento en 6 meses'
      ],
      'alto': [
        'Intervención inmediata requerida',
        'Evaluación psicológica especializada',
        'Ajustes urgentes en condiciones laborales',
        'Plan de seguimiento mensual',
        'Capacitación en manejo del estrés'
      ],
      'muy-alto': [
        'Intervención urgente e inmediata',
        'Evaluación médica y psicológica',
        'Modificación inmediata del puesto de trabajo',
        'Seguimiento semanal especializado',
        'Posible reubicación temporal'
      ]
    };
    return recommendations[riskLevel as keyof typeof recommendations] || [];
  };

  const getRiskLevelText = (riskLevel: string) => {
    const riskLevels: { [key: string]: string } = {
      'sin-riesgo': 'Sin Riesgo',
      'bajo': 'Riesgo Bajo',
      'medio': 'Riesgo Medio',
      'alto': 'Riesgo Alto',
      'muy-alto': 'Riesgo Muy Alto'
    };
    return riskLevels[riskLevel] || riskLevel;
  };

  const getRiskLevelClass = (riskLevel: string) => {
    return `risk-badge risk-${riskLevel}`;
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="h-16 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {parseInt(localStorage.getItem("trial_days_left") || "-1") >= 0 && localStorage.getItem("subscription_status") === "trial" && (
        <div style={{background: parseInt(localStorage.getItem("trial_days_left") || "99") <= 3 ? "#FEF2F2" : parseInt(localStorage.getItem("trial_days_left") || "99") <= 7 ? "#FFFBEB" : "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16}}>
          <p style={{fontWeight: 600, fontSize: 14, margin: 0, color: "#1E40AF"}}>Tu prueba gratuita vence en {localStorage.getItem("trial_days_left")} días</p>
          <a href="/plans" style={{background: "#1E3A5F", color: "white", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, textDecoration: "none"}}>Ver planes</a>
        </div>
      )}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Panel Principal</h2>
        <p className="text-slate-600">Gestiona las evaluaciones de riesgos psicosociales conforme a la NOM-035-STPS-2018</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-users text-blue-600"></i>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Total Empleados</p>
              <p className="text-2xl font-bold text-slate-900">{stats?.totalEmployees || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-check-circle text-green-600"></i>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Evaluaciones Completadas</p>
              <p className="text-2xl font-bold text-slate-900">{stats?.evaluationsCompleted || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-clock text-amber-600"></i>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Pendientes</p>
              <p className="text-2xl font-bold text-slate-900">{stats?.pendingEvaluations || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-exclamation-triangle text-red-600"></i>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Riesgo Alto</p>
              <p className="text-2xl font-bold text-slate-900">{stats?.highRiskCount || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions and Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Acciones Rápidas</h3>
          <div className="space-y-3">
            <button 
              onClick={() => setLocation("/employees")}
              className="w-full flex items-center justify-between p-4 text-left bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <div className="flex items-center">
                <i className="fas fa-user-plus text-brand-600 mr-3"></i>
                <span className="font-medium text-slate-900">Registrar Nuevo Empleado</span>
              </div>
              <i className="fas fa-chevron-right text-slate-400"></i>
            </button>
            <button 
              onClick={() => setLocation("/questionnaires")}
              className="w-full flex items-center justify-between p-4 text-left bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <div className="flex items-center">
                <i className="fas fa-clipboard-check text-brand-600 mr-3"></i>
                <span className="font-medium text-slate-900">Iniciar Evaluación</span>
              </div>
              <i className="fas fa-chevron-right text-slate-400"></i>
            </button>
            <button 
              onClick={() => setLocation("/reports")}
              className="w-full flex items-center justify-between p-4 text-left bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <div className="flex items-center">
                <i className="fas fa-download text-brand-600 mr-3"></i>
                <span className="font-medium text-slate-900">Exportar Reportes</span>
              </div>
              <i className="fas fa-chevron-right text-slate-400"></i>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Distribución de Riesgos</h3>
          <div className="h-48">
            {stats?.riskDistribution ? (
              <RiskChart data={stats.riskDistribution} />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                No hay datos disponibles
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Evaluations */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Evaluaciones Recientes</h3>
        </div>
        {recentEvaluations.length === 0 ? (
          <div className="empty-state" style={{ minHeight: 160 }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            <p className="font-medium text-sm">Sin evaluaciones completadas aún</p>
            <p className="text-xs text-slate-400 mb-3">Las evaluaciones aparecerán aquí una vez que los empleados completen sus cuestionarios</p>
            <button onClick={() => setLocation("/invitations")}
              className="btn-lime text-xs px-4 py-2 rounded-lg font-semibold">
              Enviar cuestionarios a empleados
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Empleado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Área</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nivel de Riesgo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {recentEvaluations.map((evaluation: any) => {
                  const employee = employees.find((emp: any) => emp.id === evaluation.employeeId || evaluation.employee_id);
                  return (
                    <tr key={evaluation.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">
                          {employee ? `${employee.nombre} ${employee.apellidos || employee.apellido_paterno || ""}` : 'Empleado no encontrado'}
                        </div>
                        <div className="text-sm text-slate-500">{employee?.puesto}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{employee?.area}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {evaluation.completed_at || evaluation.completedAt || evaluation.created_at ? new Date(evaluation.completed_at || evaluation.completedAt || evaluation.created_at).toLocaleDateString('es-ES') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getRiskLevelClass(evaluation.riskLevel || evaluation.risk_level)}>
                          {getRiskLevelText(evaluation.riskLevel || evaluation.risk_level)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => handleViewReport(evaluation)}
                          disabled={generateIndividualReportMutation.isPending}
                          className="text-brand-600 hover:text-brand-500 mr-3 disabled:opacity-50"
                        >
                          {generateIndividualReportMutation.isPending ? 'Generando...' : 'Ver Reporte'}
                        </button>
                        <button 
                          onClick={() => handleViewReport(evaluation)}
                          disabled={generateIndividualReportMutation.isPending}
                          className="text-slate-400 hover:text-slate-500 disabled:opacity-50"
                        >
                          <i className="fas fa-download"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}// dashboard Fri Jul 10 18:49:09     2026
