export function exportToCSV(evaluations: any[], employees: any[]) {
  // Prepare data for CSV export
  const csvData = evaluations.map(evaluation => {
    const employee = employees.find(emp => emp.id === evaluation.employeeId);
    
    return {
      'Nombre': employee ? `${employee.nombre} ${employee.apellidos}` : 'No encontrado',
      'Puesto': employee?.puesto || '',
      'Área': employee?.area || '',
      'Fecha de Evaluación': evaluation.completedAt ? new Date(evaluation.completedAt).toLocaleDateString('es-ES') : '',
      'Tipo de Cuestionario': evaluation.questionnaireType,
      'Nivel de Riesgo': getRiskLevelText(evaluation.riskLevel),
      'Puntuación Total': evaluation.overallScore,
      'Estado': evaluation.completed ? 'Completado' : 'Pendiente'
    };
  });
  
  // Convert to CSV format
  const headers = Object.keys(csvData[0] || {});
  const csvContent = [
    headers.join(','),
    ...csvData.map(row => 
      headers.map(header => `"${(row as any)[header] || ''}"`).join(',')
    )
  ].join('\n');
  
  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `evaluaciones-nom035-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

function getRiskLevelText(riskLevel: string): string {
  const riskLevels: { [key: string]: string } = {
    'sin-riesgo': 'Sin Riesgo',
    'bajo': 'Riesgo Bajo',
    'medio': 'Riesgo Medio',
    'alto': 'Riesgo Alto',
    'muy-alto': 'Riesgo Muy Alto'
  };
  return riskLevels[riskLevel] || riskLevel;
}
