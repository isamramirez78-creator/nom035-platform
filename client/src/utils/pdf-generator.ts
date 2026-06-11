export async function generatePDFReport(evaluations: any[], employees: any[]) {
  // Dynamic import to avoid issues with SSR
  const jsPDF = (await import('jspdf')).default;
  
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text('Reporte de Evaluación NOM-035-STPS', 20, 30);
  
  // Add date
  doc.setFontSize(12);
  doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, 20, 50);
  
  let yPosition = 70;
  
  evaluations.forEach((evaluation, index) => {
    const employee = employees.find(emp => emp.id === evaluation.employeeId);
    
    if (!employee) return;
    
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 30;
    }
    
    // Employee info
    doc.setFontSize(14);
    doc.text(`${employee.nombre} ${employee.apellidos}`, 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.text(`Puesto: ${employee.puesto}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Área: ${employee.area}`, 20, yPosition);
    yPosition += 7;
    
    // Risk level
    const riskLevelText = getRiskLevelText(evaluation.riskLevel);
    doc.text(`Nivel de Riesgo: ${riskLevelText}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Puntuación: ${evaluation.overallScore}`, 20, yPosition);
    yPosition += 15;
    
    // Domain scores if available
    if (evaluation.scores && Array.isArray(evaluation.scores)) {
      doc.text('Puntuaciones por Dominio:', 20, yPosition);
      yPosition += 10;
      
      evaluation.scores.forEach((domain: any) => {
        doc.text(`${domain.domain}: ${domain.score}/${domain.maxScore} (${domain.percentage.toFixed(1)}%)`, 30, yPosition);
        yPosition += 7;
      });
    }
    
    yPosition += 15;
  });
  
  // Save the PDF
  doc.save('reporte-nom035.pdf');
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
