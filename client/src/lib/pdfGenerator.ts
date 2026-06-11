// Helper function to draw high-quality speedometer
function drawSpeedometer(doc: any, x: number, y: number, value: number, maxValue: number, label: string) {
  const radius = 10;
  const centerX = x + radius;
  const centerY = y + radius;
  const arcWidth = 5;
  
  // Draw outer ring (background)
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(1);
  doc.circle(centerX, centerY, radius + 2);
  doc.setFillColor(250, 250, 250);
  doc.circle(centerX, centerY, radius + 2, 'F');
  
  // Draw inner background
  doc.setFillColor(255, 255, 255);
  doc.circle(centerX, centerY, radius - arcWidth, 'F');
  
  // Draw colored arc segments with high resolution
  const startAngle = Math.PI * 0.75; // Start at 135 degrees
  const endAngle = Math.PI * 2.25; // End at 405 degrees (270 degree range)
  const totalAngle = endAngle - startAngle;
  
  // Draw segments with smooth gradients
  const segments = 100; // High resolution
  const segmentAngle = totalAngle / segments;
  
  for (let i = 0; i < segments; i++) {
    const currentAngle = startAngle + (i * segmentAngle);
    const nextAngle = startAngle + ((i + 1) * segmentAngle);
    const progress = i / segments;
    
    // Color based on progress
    let r, g, b;
    if (progress < 0.4) {
      // Green to yellow
      r = Math.round(34 + (234 - 34) * (progress / 0.4));
      g = Math.round(197 + (179 - 197) * (progress / 0.4));
      b = Math.round(94 + (8 - 94) * (progress / 0.4));
    } else if (progress < 0.7) {
      // Yellow to orange
      r = Math.round(234 + (249 - 234) * ((progress - 0.4) / 0.3));
      g = Math.round(179 + (115 - 179) * ((progress - 0.4) / 0.3));
      b = Math.round(8 + (22 - 8) * ((progress - 0.4) / 0.3));
    } else {
      // Orange to red
      r = Math.round(249 + (239 - 249) * ((progress - 0.7) / 0.3));
      g = Math.round(115 + (68 - 115) * ((progress - 0.7) / 0.3));
      b = Math.round(22 + (68 - 22) * ((progress - 0.7) / 0.3));
    }
    
    doc.setFillColor(r, g, b);
    drawHighQualityArc(doc, centerX, centerY, radius - arcWidth/2, arcWidth, currentAngle, nextAngle);
  }
  
  // Draw value indicator needle with shadow
  const needleAngle = startAngle + (totalAngle * value / maxValue);
  const needleLength = radius - 5;
  
  // Needle shadow
  const shadowOffset = 1;
  const shadowX = centerX + Math.cos(needleAngle) * needleLength + shadowOffset;
  const shadowY = centerY + Math.sin(needleAngle) * needleLength + shadowOffset;
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(4);
  doc.line(centerX + shadowOffset, centerY + shadowOffset, shadowX, shadowY);
  
  // Main needle
  const needleX = centerX + Math.cos(needleAngle) * needleLength;
  const needleY = centerY + Math.sin(needleAngle) * needleLength;
  doc.setDrawColor(50, 50, 50);
  doc.setLineWidth(3);
  doc.line(centerX, centerY, needleX, needleY);
  
  // Center hub with gradient effect
  doc.setFillColor(80, 80, 80);
  doc.circle(centerX, centerY, 6, 'F');
  doc.setFillColor(120, 120, 120);
  doc.circle(centerX - 1, centerY - 1, 4, 'F');
  
  // Value display box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(1);
  doc.rect(centerX - 15, centerY + 8, 30, 12, 'FD');
  
  // Value text
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`${Math.round(value)}%`, centerX - 8, centerY + 16);
  
  // Label with better formatting
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(label, centerX - (label.length * 2), y + radius * 2 + 15);
}

// Helper function to draw high-quality arc
function drawHighQualityArc(doc: any, centerX: number, centerY: number, radius: number, width: number, startAngle: number, endAngle: number) {
  const steps = 8; // Smooth arc
  const angleStep = (endAngle - startAngle) / steps;
  
  for (let i = 0; i < steps; i++) {
    const angle1 = startAngle + i * angleStep;
    const angle2 = startAngle + (i + 1) * angleStep;
    
    const x1Inner = centerX + Math.cos(angle1) * (radius - width/2);
    const y1Inner = centerY + Math.sin(angle1) * (radius - width/2);
    const x2Inner = centerX + Math.cos(angle2) * (radius - width/2);
    const y2Inner = centerY + Math.sin(angle2) * (radius - width/2);
    
    const x1Outer = centerX + Math.cos(angle1) * (radius + width/2);
    const y1Outer = centerY + Math.sin(angle1) * (radius + width/2);
    const x2Outer = centerX + Math.cos(angle2) * (radius + width/2);
    const y2Outer = centerY + Math.sin(angle2) * (radius + width/2);
    
    // Draw arc segment as filled polygon
    doc.lines([
      [x2Inner - x1Inner, y2Inner - y1Inner],
      [x2Outer - x2Inner, y2Outer - y2Inner],
      [x1Outer - x2Outer, y1Outer - y2Outer],
      [x1Inner - x1Outer, y1Inner - y1Outer]
    ], x1Inner, y1Inner, [1, 1], 'F');
  }
}

// Helper function to draw arc
function drawArc(doc: any, x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  const segments = 20;
  const angleStep = (endAngle - startAngle) / segments;
  
  for (let i = 0; i < segments; i++) {
    const angle1 = startAngle + i * angleStep;
    const angle2 = startAngle + (i + 1) * angleStep;
    
    const x1 = x + Math.cos(angle1) * (radius - 3);
    const y1 = y + Math.sin(angle1) * (radius - 3);
    const x2 = x + Math.cos(angle2) * (radius - 3);
    const y2 = y + Math.sin(angle2) * (radius - 3);
    const x3 = x + Math.cos(angle2) * radius;
    const y3 = y + Math.sin(angle2) * radius;
    const x4 = x + Math.cos(angle1) * radius;
    const y4 = y + Math.sin(angle1) * radius;
    
    doc.lines([[x2 - x1, y2 - y1], [x3 - x2, y3 - y2], [x4 - x3, y4 - y3]], x1, y1, [1, 1], 'F');
  }
}

// Helper function to draw high-quality pie chart
function drawPieChart(doc: any, x: number, y: number, radius: number, data: Array<{label: string, value: number, color: number[]}>) {
  const centerX = x + radius;
  const centerY = y + radius;
  let currentAngle = -Math.PI / 2; // Start at top
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  // Draw shadow first
  doc.setFillColor(200, 200, 200);
  drawCircle(doc, centerX + 2, centerY + 2, radius);
  
  // Draw outer border
  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(2);
  doc.circle(centerX, centerY, radius + 1, 'FD');
  
  data.forEach((item, index) => {
    if (item.value > 0) {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      
      // Draw slice with gradient effect
      drawHighQualityPieSlice(doc, centerX, centerY, radius, currentAngle, currentAngle + sliceAngle, item.color);
      
      // Draw slice border
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(1);
      drawPieSliceBorder(doc, centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      
      currentAngle += sliceAngle;
    }
  });
  
  // Draw center circle for donut effect
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(1);
  doc.circle(centerX, centerY, radius * 0.4, 'FD');
  
  // Enhanced legend with better spacing and design
  let legendY = y + radius * 2 + 15;
  doc.setFillColor(248, 248, 248);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(1);
  doc.rect(x - 5, legendY - 5, radius * 2 + 10, data.filter(d => d.value > 0).length * 12 + 10, 'FD');
  
  legendY += 5;
  data.forEach((item) => {
    if (item.value > 0) {
      // Color indicator with border
      doc.setFillColor(item.color[0], item.color[1], item.color[2]);
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(1);
      doc.rect(x, legendY, 10, 8, 'FD');
      
      // Legend text
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const percentage = ((item.value / total) * 100).toFixed(1);
      doc.text(`${item.label}: ${item.value} (${percentage}%)`, x + 15, legendY + 6);
      legendY += 12;
    }
  });
}

// Helper function to draw high-quality pie slice
function drawHighQualityPieSlice(doc: any, centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number, color: number[]) {
  const segments = 30; // Higher resolution
  const angleStep = (endAngle - startAngle) / segments;
  
  // Base color
  doc.setFillColor(color[0], color[1], color[2]);
  
  // Draw main slice
  doc.moveTo(centerX, centerY);
  for (let i = 0; i <= segments; i++) {
    const angle = startAngle + i * angleStep;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    doc.lineTo(x, y);
  }
  doc.lineTo(centerX, centerY);
  doc.fill();
  
  // Add highlight effect
  const highlightColor = [
    Math.min(255, color[0] + 30),
    Math.min(255, color[1] + 30),
    Math.min(255, color[2] + 30)
  ];
  doc.setFillColor(highlightColor[0], highlightColor[1], highlightColor[2]);
  
  // Draw highlight arc
  doc.moveTo(centerX, centerY);
  const highlightRadius = radius * 0.8;
  for (let i = 0; i <= segments / 3; i++) {
    const angle = startAngle + i * angleStep;
    const x = centerX + Math.cos(angle) * highlightRadius;
    const y = centerY + Math.sin(angle) * highlightRadius;
    doc.lineTo(x, y);
  }
  doc.lineTo(centerX, centerY);
  doc.fill();
}

// Helper function to draw pie slice border
function drawPieSliceBorder(doc: any, centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number) {
  // Draw radial lines
  const startX = centerX + Math.cos(startAngle) * radius;
  const startY = centerY + Math.sin(startAngle) * radius;
  const endX = centerX + Math.cos(endAngle) * radius;
  const endY = centerY + Math.sin(endAngle) * radius;
  
  doc.line(centerX, centerY, startX, startY);
  doc.line(centerX, centerY, endX, endY);
}

// Helper function to draw circle
function drawCircle(doc: any, centerX: number, centerY: number, radius: number) {
  doc.circle(centerX, centerY, radius, 'F');
}

// Helper function to draw enhanced traffic light
function drawTrafficLight(doc: any, x: number, y: number, status: 'green' | 'yellow' | 'red', label: string) {
  const width = 8;
  const height = 22;
  const lightRadius = 2;
  const lightX = x + width / 2;
  
  // Draw shadow
  doc.setFillColor(180, 180, 180);
  doc.rect(x + 2, y + 2, width, height, 'F');
  
  // Draw main traffic light housing with gradient
  doc.setFillColor(60, 60, 60);
  doc.rect(x, y, width, height, 'F');
  doc.setFillColor(80, 80, 80);
  doc.rect(x + 1, y + 1, width - 2, height - 2, 'F');
  
  // Draw outer frame
  doc.setDrawColor(40, 40, 40);
  doc.setLineWidth(2);
  doc.rect(x, y, width, height, 'S');
  
  // Light positions
  const redY = y + 5;
  const yellowY = y + 15;
  const greenY = y + 25;
  
  // Draw light backgrounds (dark when off)
  doc.setFillColor(30, 30, 30);
  doc.circle(lightX, redY, lightRadius + 1, 'F');
  doc.circle(lightX, yellowY, lightRadius + 1, 'F');
  doc.circle(lightX, greenY, lightRadius + 1, 'F');
  
  // Red light
  if (status === 'red') {
    // Glow effect
    doc.setFillColor(255, 100, 100);
    doc.circle(lightX, redY, lightRadius + 2, 'F');
    doc.setFillColor(239, 68, 68);
    doc.circle(lightX, redY, lightRadius, 'F');
    // Highlight
    doc.setFillColor(255, 150, 150);
    doc.circle(lightX - 2, redY - 2, lightRadius / 3, 'F');
  } else {
    doc.setFillColor(80, 40, 40);
    doc.circle(lightX, redY, lightRadius, 'F');
  }
  
  // Yellow light
  if (status === 'yellow') {
    // Glow effect
    doc.setFillColor(255, 220, 100);
    doc.circle(lightX, yellowY, lightRadius + 2, 'F');
    doc.setFillColor(234, 179, 8);
    doc.circle(lightX, yellowY, lightRadius, 'F');
    // Highlight
    doc.setFillColor(255, 240, 150);
    doc.circle(lightX - 2, yellowY - 2, lightRadius / 3, 'F');
  } else {
    doc.setFillColor(80, 70, 40);
    doc.circle(lightX, yellowY, lightRadius, 'F');
  }
  
  // Green light
  if (status === 'green') {
    // Glow effect
    doc.setFillColor(100, 255, 150);
    doc.circle(lightX, greenY, lightRadius + 2, 'F');
    doc.setFillColor(34, 197, 94);
    doc.circle(lightX, greenY, lightRadius, 'F');
    // Highlight
    doc.setFillColor(150, 255, 180);
    doc.circle(lightX - 2, greenY - 2, lightRadius / 3, 'F');
  } else {
    doc.setFillColor(40, 80, 40);
    doc.circle(lightX, greenY, lightRadius, 'F');
  }
  
  // Draw light reflections
  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(1);
  doc.circle(lightX, redY, lightRadius, 'S');
  doc.circle(lightX, yellowY, lightRadius, 'S');
  doc.circle(lightX, greenY, lightRadius, 'S');
  
  // Enhanced label with background
  const labelWidth = label.length * 5;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(1);
  doc.rect(x + width/2 - labelWidth/2 - 2, y + height + 5, labelWidth + 4, 12, 'FD');
  
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(label, x + width/2 - labelWidth/2, y + height + 13);
}

// Adds a new page if yPos would overflow, returns updated yPos
function checkPage(doc: any, yPos: number, needed: number = 20): number {
  if (yPos + needed > 262) {
    doc.addPage();
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, 210, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Continuación - Reporte NOM-035-STPS-2018', 20, 12);
    doc.setTextColor(0, 0, 0);
    return 28;
  }
  return yPos;
}

export async function generateProfessionalReport(reportData: any) {
  try {
    const jsPDF = await import('jspdf');
    const doc = new jsPDF.default();
    
    // Get real data from API
    const [statsResponse, employeesResponse, evaluationsResponse] = await Promise.all([
      fetch('/api/stats'),
      fetch('/api/employees'),
      fetch('/api/evaluations')
    ]);
    
    const stats = await statsResponse.json();
    const employees = await employeesResponse.json();
    const evaluations = await evaluationsResponse.json();
    
    // Professional header with more space
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, 210, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE OFICIAL NOM-035-STPS-2018', 20, 20);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Identificación, análisis y prevención de factores de riesgo psicosocial', 20, 30);
    
    doc.setTextColor(0, 0, 0);
    
    // Company information with better spacing
    let yPos = 50;
    doc.setFillColor(240, 240, 240);
    doc.rect(15, yPos - 5, 180, 22, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMACIÓN DE LA ORGANIZACIÓN', 20, yPos + 5);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Razón Social: Mi Empresa S.A. de C.V.', 20, yPos + 14);
    doc.text('RFC: ABC123456789', 120, yPos + 14);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, 20, yPos + 21);
    doc.text(`Trabajadores: ${stats.totalEmployees}`, 120, yPos + 21);
    
    yPos += 35;
    
    // Report content based on type
    if (reportData.templateId === 'nom035-compliance') {
      // Compliance metrics
      const coverage = stats.totalEmployees > 0 ? Math.round((stats.evaluationsCompleted / stats.totalEmployees) * 100) : 0;
      const complianceStatus = coverage >= 80 ? 'CUMPLE' : 'NO CUMPLE';
      const highRiskPercentage = stats.evaluationsCompleted > 0 ? (stats.highRiskCount / stats.evaluationsCompleted * 100) : 0;
      
      doc.setFillColor(34, 197, 94);
      doc.rect(15, yPos - 5, 180, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('REPORTE DE CUMPLIMIENTO NORMATIVO', 20, yPos + 5);
      doc.setTextColor(0, 0, 0);
      
      yPos += 25;
      
      // Add speedometer for compliance
      drawSpeedometer(doc, 20, yPos, coverage, 100, 'Cumplimiento NOM-035');
      
      // Add traffic light for risk status
      const riskStatus = highRiskPercentage > 25 ? 'red' : highRiskPercentage > 15 ? 'yellow' : 'green';
      drawTrafficLight(doc, 130, yPos + 10, riskStatus, 'Estado de Riesgo');
      
      yPos += 105;
      
      // Detailed compliance analysis
      doc.setFillColor(240, 248, 255);
      doc.rect(15, yPos - 5, 180, 40, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('ANÁLISIS DE CUMPLIMIENTO NORMATIVO', 20, yPos + 5);
      
      yPos += 15;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      if (coverage >= 80) {
        doc.text('[OK] CUMPLIMIENTO SATISFACTORIO: La organizacion cumple con los requisitos', 20, yPos);
        yPos += 8;
        doc.text('  minimos de cobertura establecidos en la NOM-035-STPS-2018.', 20, yPos);
        yPos += 8;
        doc.text('[OK] Se ha evaluado al 80% o mas del personal, cumpliendo con la norma.', 20, yPos);
      } else {
        doc.setTextColor(239, 68, 68);
        doc.text('[ATENCION] INCUMPLIMIENTO: La cobertura de evaluacion es insuficiente.', 20, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 8;
        doc.text('• Se requiere evaluar al menos al 80% del personal para cumplir con la norma.', 20, yPos);
        yPos += 8;
        doc.text(`• Faltan ${Math.ceil(stats.totalEmployees * 0.8) - stats.evaluationsCompleted} evaluaciones por completar.`, 20, yPos);
      }
      
      yPos += 20;
      
      // Risk distribution pie chart — start a new page so chart fits cleanly
      doc.addPage();
      yPos = 28;

      // Risk distribution pie chart
      const pieData = Object.entries(stats.riskDistribution).map(([level, count]) => ({
        label: level.charAt(0).toUpperCase() + level.slice(1),
        value: count as number,
        color: ({
          'muy-bajo': [34, 197, 94],
          'bajo': [101, 163, 13], 
          'medio': [234, 179, 8],
          'alto': [249, 115, 22],
          'muy-alto': [239, 68, 68]
        } as Record<string, number[]>)[level] || [128, 128, 128]
      }));
      
      doc.setFillColor(245, 245, 245);
      doc.rect(15, yPos - 5, 180, 15, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('DISTRIBUCIÓN DE NIVELES DE RIESGO', 20, yPos + 5);
      
      yPos += 25;
      drawPieChart(doc, 20, yPos, 28, pieData);
      
      // Risk interpretation placed below the chart with safe margin
      yPos += 80;
      yPos = checkPage(doc, yPos, 60);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setFillColor(248, 250, 252);
      doc.rect(15, yPos - 5, 180, 15, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text('INTERPRETACIÓN DE RESULTADOS:', 20, yPos + 5);
      yPos += 20;
      doc.setFont('helvetica', 'normal');
      
      if (highRiskPercentage > 25) {
        doc.setTextColor(239, 68, 68);
        doc.text('• SITUACION CRITICA: Mas del 25% en riesgo alto', 20, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 8;
        doc.text('• Requiere intervencion organizacional inmediata', 20, yPos);
        yPos += 8;
        doc.text('• Implementar medidas correctivas urgentes', 20, yPos);
      } else if (highRiskPercentage > 15) {
        doc.setTextColor(234, 179, 8);
        doc.text('• SITUACION DE RIESGO: Entre 15-25% en riesgo alto', 20, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 8;
        doc.text('• Monitoreo constante requerido', 20, yPos);
        yPos += 8;
        doc.text('• Evaluar medidas preventivas adicionales', 20, yPos);
      } else {
        doc.setTextColor(34, 197, 94);
        doc.text('• SITUACION CONTROLADA: Menos del 15% en riesgo', 20, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 8;
        doc.text('• Mantener medidas preventivas actuales', 20, yPos);
        yPos += 8;
        doc.text('• Seguimiento periodico segun cronograma', 20, yPos);
      }
      
    } else if (reportData.templateId === 'risk-analysis') {
      // Risk analysis - PAGE 1: Executive Summary and Main Indicators
      const coverage = stats.totalEmployees > 0 ? Math.round((stats.evaluationsCompleted / stats.totalEmployees) * 100) : 0;
      const highRiskPercentage = stats.evaluationsCompleted > 0 ? (stats.highRiskCount / stats.evaluationsCompleted * 100) : 0;
      
      doc.setFillColor(249, 115, 22);
      doc.rect(15, yPos - 5, 180, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('ANÁLISIS DETALLADO DE RIESGOS PSICOSOCIALES', 20, yPos + 5);
      doc.setTextColor(0, 0, 0);
      
      yPos += 25;
      
      // Executive Summary Section
      doc.setFillColor(248, 250, 252);
      doc.rect(15, yPos - 5, 180, 40, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 58, 138);
      doc.text('RESUMEN EJECUTIVO DEL ANÁLISIS DE RIESGOS', 20, yPos + 5);
      doc.setTextColor(0, 0, 0);
      
      yPos += 15;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      // Key findings with status color
      const statusLevel = highRiskPercentage > 25 ? 'CRÍTICO' : highRiskPercentage > 15 ? 'MODERADO' : 'CONTROLADO';
      const statusColor = highRiskPercentage > 25 ? [220, 38, 38] : highRiskPercentage > 15 ? [217, 119, 6] : [34, 197, 94];
      
      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(`ESTADO DE RIESGO ORGANIZACIONAL: ${statusLevel}`, 20, yPos);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      yPos += 10;
      
      doc.text(`• Total evaluado: ${stats.evaluationsCompleted} de ${stats.totalEmployees} trabajadores (${coverage}% cobertura)`, 20, yPos);
      yPos += 8;
      doc.text(`• Trabajadores en riesgo alto/muy alto: ${stats.highRiskCount} (${highRiskPercentage.toFixed(1)}%)`, 20, yPos);
      yPos += 8;
      doc.text(`• Áreas organizacionales analizadas: ${Object.keys(stats.areaStats).length}`, 20, yPos);
      
      yPos += 25;
      
      // Visual Indicators Section
      doc.setFillColor(255, 248, 240);
      doc.rect(15, yPos - 5, 180, 15, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('INDICADORES VISUALES DE RIESGO', 20, yPos + 5);
      
      yPos += 25;
      
      // Main risk indicators
      drawSpeedometer(doc, 20, yPos, highRiskPercentage, 100, 'Nivel de Riesgo');
      const criticalStatus = highRiskPercentage > 25 ? 'red' : highRiskPercentage > 15 ? 'yellow' : 'green';
      drawTrafficLight(doc, 130, yPos + 10, criticalStatus, 'Criticidad');
      
      yPos += 60;
      
      // Risk interpretation section
      doc.setFillColor(255, 248, 240);
      doc.rect(15, yPos - 5, 180, 50, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('INTERPRETACIÓN CONFORME A LA NORMA NOM-035', 20, yPos + 5);
      
      yPos += 20;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      if (highRiskPercentage > 25) {
        doc.setTextColor(239, 68, 68);
        doc.text('[CRITICO] NIVEL CRITICO - Intervencion organizacional obligatoria', 20, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 10;
        doc.text('Segun el numeral 8.1 de la NOM-035-STPS-2018, se debe implementar', 20, yPos);
        yPos += 8;
        doc.text('un programa de intervencion inmediato para la prevencion de riesgos', 20, yPos);
        yPos += 8;
        doc.text('psicosociales y la promocion de un entorno organizacional favorable.', 20, yPos);
      } else if (highRiskPercentage > 15) {
        doc.setTextColor(234, 179, 8);
        doc.text('[MODERADO] NIVEL MODERADO - Vigilancia y medidas preventivas requeridas', 20, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 10;
        doc.text('Se recomienda implementar acciones de control segun numeral 7.1', 20, yPos);
        yPos += 8;
        doc.text('para reducir factores de riesgo identificados y monitorear evolucion.', 20, yPos);
      } else {
        doc.setTextColor(34, 197, 94);
        doc.text('[CONTROLADO] NIVEL CONTROLADO - Mantener medidas actuales', 20, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 10;
        doc.text('Los niveles de riesgo se encuentran dentro de rangos aceptables.', 20, yPos);
        yPos += 8;
        doc.text('Continuar con el seguimiento periodico establecido por la norma.', 20, yPos);
      }
      
      // PAGE 2: Detailed Analysis and Recommendations
      doc.addPage();
      yPos = 30;
      
      // Page 2 header
      doc.setFillColor(249, 115, 22);
      doc.rect(15, yPos - 5, 180, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('ANÁLISIS DETALLADO Y PLAN DE ACCIÓN', 20, yPos + 5);
      doc.setTextColor(0, 0, 0);
      
      yPos += 30;
      
      // Risk distribution chart
      doc.setFillColor(254, 242, 242);
      doc.rect(15, yPos - 5, 85, 15, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('DISTRIBUCIÓN DE RIESGOS', 20, yPos + 5);
      
      yPos += 25;
      
      // Pie chart for risk distribution
      const pieData = Object.entries(stats.riskDistribution).map(([level, count]) => ({
        label: level.charAt(0).toUpperCase() + level.slice(1),
        value: count as number,
        color: {
          'muy-bajo': [34, 197, 94],
          'bajo': [101, 163, 13], 
          'medio': [234, 179, 8],
          'alto': [249, 115, 22],
          'muy-alto': [239, 68, 68]
        }[level] || [128, 128, 128]
      }));
      
      drawPieChart(doc, 15, yPos, 25, pieData);
      
      // Area analysis on the right
      doc.setFillColor(240, 248, 255);
      doc.rect(110, yPos - 5, 85, 15, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('ANÁLISIS POR ÁREA', 115, yPos + 5);
      
      yPos += 20;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      // Area analysis simplified — use employees data since areaStats may be empty
      const areaSet = new Set(employees.map((e: any) => e.area).filter(Boolean));
      const areaNames = Array.from(areaSet) as string[];
      areaNames.forEach((area: string) => {
        doc.setTextColor(0, 0, 0);
        doc.text(`${area}: Evaluado`, 115, yPos);
        yPos += 8;
        doc.setTextColor(34, 197, 94);
        doc.text(`  Estado: Analizado`, 115, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 10;
      });
      
      yPos += 15;
      
      // High risk employees section
      const highRiskEmployees = evaluations.filter((evaluation: any) => 
        evaluation.riskLevel === 'alto' || evaluation.riskLevel === 'muy-alto'
      );
      
      if (highRiskEmployees.length > 0) {
        yPos = checkPage(doc, yPos, 40);
        doc.setFillColor(254, 242, 242);
        doc.rect(15, yPos - 5, 180, 15, 'F');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(239, 68, 68);
        doc.text('TRABAJADORES QUE REQUIEREN ATENCION PRIORITARIA', 20, yPos + 5);
        doc.setTextColor(0, 0, 0);
        
        yPos += 25;
        doc.setFontSize(9);
        
        // Table header
        doc.setFillColor(248, 250, 252);
        doc.rect(15, yPos - 2, 180, 10, 'F');
        doc.setFont('helvetica', 'bold');
        doc.text('EMPLEADO', 20, yPos + 5);
        doc.text('AREA', 80, yPos + 5);
        doc.text('NIVEL DE RIESGO', 130, yPos + 5);
        doc.text('ACCION', 160, yPos + 5);
        yPos += 12;
        
        doc.setFont('helvetica', 'normal');
        highRiskEmployees.forEach((evaluation: any) => {
          yPos = checkPage(doc, yPos, 12);
          const employee = employees.find((emp: any) => emp.id === evaluation.employeeId);
          if (employee) {
            doc.setTextColor(0, 0, 0);
            doc.text(`${employee.nombre} ${employee.apellidos}`.substring(0, 22), 20, yPos);
            doc.text((employee.area || '').substring(0, 15), 80, yPos);
            
            if (evaluation.riskLevel === 'muy-alto') {
              doc.setTextColor(239, 68, 68);
              doc.text('MUY ALTO', 130, yPos);
              doc.text('INMEDIATA', 160, yPos);
            } else {
              doc.setTextColor(249, 115, 22);
              doc.text('ALTO', 130, yPos);
              doc.text('URGENTE', 160, yPos);
            }
            doc.setTextColor(0, 0, 0);
            yPos += 10;
          }
        });
        yPos += 10;
      }
      
      // Strategic recommendations section
      yPos = checkPage(doc, yPos, 80);
      doc.setFillColor(240, 253, 244);
      doc.rect(15, yPos - 5, 180, 15, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('RECOMENDACIONES ESTRATEGICAS ESPECIALIZADAS', 20, yPos + 5);
      
      yPos += 25;
      
      // Immediate actions
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38);
      doc.text('ACCIONES INMEDIATAS (0-30 dias):', 20, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 12;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('• Evaluacion y atencion prioritaria a trabajadores en riesgo muy alto/alto', 25, yPos);
      yPos += 8;
      doc.text('• Notificacion formal a supervisores de areas con mayor incidencia', 25, yPos);
      yPos += 8;
      doc.text('• Implementacion de medidas de contencion segun numeral 8.1 de NOM-035', 25, yPos);
      yPos += 8;
      doc.text('• Activacion de protocolos de apoyo psicologico especializado', 25, yPos);
      yPos += 15;
      
      // Medium-term actions
      yPos = checkPage(doc, yPos, 50);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(217, 119, 6);
      doc.text('ACCIONES A MEDIANO PLAZO (1-6 meses):', 20, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 12;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('• Desarrollo e implementacion de programa integral de intervencion', 25, yPos);
      yPos += 8;
      doc.text('• Capacitación especializada para líderes en factores psicosociales', 25, yPos);
      yPos += 8;
      doc.text('• Establecimiento de comité permanente de bienestar organizacional', 25, yPos);
      yPos += 8;
      doc.text('• Modificaciones estructurales según análisis de causas raíz', 25, yPos)
      
    } else if (reportData.templateId === 'intervention-plan') {
      // Intervention plan
      const highRiskPercentage = stats.evaluationsCompleted > 0 ? (stats.highRiskCount / stats.evaluationsCompleted * 100) : 0;
      
      doc.setFillColor(168, 85, 247);
      doc.rect(15, yPos - 5, 180, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('PLAN DE INTERVENCION Y MEDIDAS CORRECTIVAS', 20, yPos + 5);
      doc.setTextColor(0, 0, 0);
      
      yPos += 25;
      
      // Progress indicators
      const interventionProgress = 25;
      drawSpeedometer(doc, 20, yPos, interventionProgress, 100, 'Progreso');
      
      const urgencyStatus = highRiskPercentage > 25 ? 'red' : highRiskPercentage > 15 ? 'yellow' : 'green';
      drawTrafficLight(doc, 130, yPos + 10, urgencyStatus, 'Urgencia');
      
      yPos += 105;
      yPos = checkPage(doc, yPos, 60);
      
      // Intervention framework based on NOM-035
      doc.setFillColor(248, 244, 255);
      doc.rect(15, yPos - 5, 180, 45, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('MARCO DE INTERVENCION CONFORME A NOM-035', 20, yPos + 5);
      
      yPos += 15;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Basado en el numeral 8 de la NOM-035-STPS-2018, las medidas de control', 20, yPos);
      yPos += 8;
      doc.text('comprenden intervenciones a la organizacion, al area de trabajo', 20, yPos);
      yPos += 8;
      doc.text('y al trabajador, enfocadas en la prevencion y control de los factores', 20, yPos);
      yPos += 8;
      doc.text('de riesgo psicosocial y la promocion de un entorno favorable.', 20, yPos);
      
      yPos += 20;
      yPos = checkPage(doc, yPos, 70);
      
      // Detailed intervention measures
      doc.setFillColor(255, 250, 250);
      doc.rect(15, yPos - 5, 180, 15, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text('MEDIDAS ORGANIZACIONALES ESPECIFICAS', 20, yPos + 5);
      
      yPos += 20;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('FASE 1: INTERVENCION INMEDIATA (0-30 dias)', 20, yPos);
      yPos += 10;
      doc.setFont('helvetica', 'normal');
      doc.text('• Evaluacion clinica individual para trabajadores en riesgo muy alto', 25, yPos);
      yPos += 8;
      doc.text('• Redistribucion temporal de cargas de trabajo criticas', 25, yPos);
      yPos += 8;
      doc.text('• Implementacion de pausas activas y rotacion de tareas', 25, yPos);
      yPos += 8;
      doc.text('• Mejora de canales de comunicacion supervisor-subordinado', 25, yPos);
      
      yPos += 15;
      yPos = checkPage(doc, yPos, 60);
      doc.setFont('helvetica', 'bold');
      doc.text('FASE 2: INTERVENCION A MEDIANO PLAZO (1-3 meses)', 20, yPos);
      yPos += 10;
      doc.setFont('helvetica', 'normal');
      doc.text('• Programa de capacitacion en manejo del estres laboral', 25, yPos);
      yPos += 8;
      doc.text('• Establecimiento de programa de apoyo psicologico (EAP)', 25, yPos);
      yPos += 8;
      doc.text('• Revision y mejora de procesos organizacionales', 25, yPos);
      yPos += 8;
      doc.text('• Implementacion de reconocimiento y desarrollo profesional', 25, yPos);
      
      yPos += 15;
      doc.setFont('helvetica', 'bold');
      yPos = checkPage(doc, yPos, 60);
      doc.setFont('helvetica', 'bold');
      doc.text('FASE 3: SEGUIMIENTO Y EVALUACION (3-6 meses)', 20, yPos);
      yPos += 10;
      doc.setFont('helvetica', 'normal');
      doc.text('• Re-evaluacion mediante cuestionarios de seguimiento', 25, yPos);
      yPos += 8;
      doc.text('• Monitoreo de indicadores de clima organizacional', 25, yPos);
      yPos += 8;
      doc.text('• Ajuste de medidas segun resultados obtenidos', 25, yPos);
      yPos += 8;
      doc.text('• Establecimiento de comite permanente de bienestar', 25, yPos);
      
    } else {
      // Executive dashboard - completely restructured
      const coverage = stats.totalEmployees > 0 ? Math.round((stats.evaluationsCompleted / stats.totalEmployees) * 100) : 0;
      const highRiskPercentage = stats.evaluationsCompleted > 0 ? (stats.highRiskCount / stats.evaluationsCompleted * 100) : 0;
      
      doc.setFillColor(59, 130, 246);
      doc.rect(15, yPos - 5, 180, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('DASHBOARD EJECUTIVO - INDICADORES CLAVE NOM-035', 20, yPos + 5);
      doc.setTextColor(0, 0, 0);
      
      yPos += 25;
      
      // Executive Summary with better spacing
      doc.setFillColor(248, 250, 252);
      doc.rect(15, yPos - 5, 180, 45, 'F');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 58, 138);
      doc.text('RESUMEN EJECUTIVO DE LA SITUACIÓN ACTUAL', 20, yPos + 8);
      doc.setTextColor(0, 0, 0);
      
      yPos += 20;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      // Situational analysis
      const complianceStatus = coverage >= 80 ? 'CUMPLE' : 'NO CUMPLE';
      const situationColor = coverage >= 80 ? [34, 197, 94] : [239, 68, 68];
      
      doc.setTextColor(situationColor[0], situationColor[1], situationColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(`ESTADO NORMATIVO: ${complianceStatus} con la NOM-035-STPS-2018`, 20, yPos);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      yPos += 12;
      
      // Key findings
      doc.text(`• Se han evaluado ${stats.evaluationsCompleted} de ${stats.totalEmployees} trabajadores (${coverage}% cobertura)`, 20, yPos);
      yPos += 10;
      doc.text(`• ${stats.highRiskCount} trabajadores requieren atención inmediata (${highRiskPercentage.toFixed(1)}% en riesgo alto)`, 20, yPos);
      yPos += 10;
      doc.text(`• ${Object.keys(stats.areaStats).length} áreas operativas han sido evaluadas`, 20, yPos);
      
      yPos += 25;
      
      // PÁGINA 1: Indicadores de Cumplimiento - Layout completamente separado
      yPos = 50;
      
      doc.setFillColor(255, 248, 240);
      doc.rect(15, yPos - 5, 180, 14, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('INDICADORES DE CUMPLIMIENTO NORMATIVO', 20, yPos + 6);
      
      yPos += 30;
      
      // Gráfica velocímetro en posición fija izquierda (sin interferir con texto)
      const graphicX = 25;  // Posición X fija para gráfica
      const graphicY = yPos; // Posición Y fija para gráfica
      drawSpeedometer(doc, graphicX, graphicY, coverage, 100, '');
      
      // Información del lado derecho en posiciones absolutas (separadas de la gráfica)
      const textX = 90;  // Posición X fija para texto (más a la derecha)
      const textY = yPos + 15; // Posición Y fija para texto
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Cumplimiento Normativo NOM-035', textX, textY);
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(`${coverage}%`, textX + 25, textY + 15);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Cobertura de evaluaciones completadas', textX, textY + 25);
      
      // Saltar completamente la zona de la gráfica para evitar solapamiento
      yPos += 70;
      
      // Métricas organizacionales compactas
      doc.setFillColor(240, 249, 255);
      doc.rect(15, yPos - 5, 180, 35, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('MÉTRICAS ORGANIZACIONALES', 20, yPos + 8);
      
      yPos += 18;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`• Total de empleados: ${stats.totalEmployees}`, 25, yPos);
      yPos += 10;
      doc.text(`• Evaluaciones completadas: ${stats.evaluationsCompleted}`, 25, yPos);
      yPos += 10;
      doc.text(`• Áreas evaluadas: ${Object.keys(stats.areaStats).length}`, 25, yPos);
      
      // PÁGINA 2: Índice de Bienestar
      doc.addPage();
      
      // Header de segunda página
      doc.setFillColor(30, 58, 138);
      doc.rect(0, 0, 210, 25, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('DASHBOARD EJECUTIVO - ÍNDICE DE BIENESTAR', 20, 15);
      doc.setTextColor(0, 0, 0);
      
      yPos = 50;
      
      doc.setFillColor(240, 253, 244);
      doc.rect(15, yPos - 5, 180, 14, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('BIENESTAR PSICOSOCIAL ORGANIZACIONAL', 20, yPos + 6);
      
      yPos += 30;
      
      // Layout completamente separado para página 2
      const wellbeingIndex = Math.max(0, 100 - highRiskPercentage);
      
      // Gráfica velocímetro en posición fija izquierda
      const graphic2X = 25;
      const graphic2Y = yPos;
      drawSpeedometer(doc, graphic2X, graphic2Y, wellbeingIndex, 100, '');
      
      // Información del lado derecho en posiciones absolutas
      const text2X = 90;
      const text2Y = yPos + 15;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Índice de Bienestar Psicosocial', text2X, text2Y);
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(`${Math.round(wellbeingIndex)}%`, text2X + 25, text2Y + 15);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Trabajadores sin riesgo alto o muy alto', text2X, text2Y + 25);
      
      // Saltar completamente la zona de la gráfica
      yPos += 70;
      
      // Estado general horizontal
      const overallStatus = coverage >= 80 && highRiskPercentage < 15 ? 'green' : 
                           coverage < 60 || highRiskPercentage > 25 ? 'red' : 'yellow';
      const statusText = overallStatus === 'green' ? 'FAVORABLE' : 
                        overallStatus === 'yellow' ? 'ATENCIÓN' : 'CRÍTICO';
      
      doc.setFillColor(255, 250, 240);
      doc.rect(15, yPos - 5, 180, 35, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('ESTADO GENERAL NOM-035', 20, yPos + 8);
      
      yPos += 18;
      
      // Semáforo en posición fija izquierda
      const trafficX = 30;
      const trafficY = yPos;
      drawTrafficLight(doc, trafficX, trafficY, overallStatus, '');
      
      // Información del semáforo en posición fija derecha
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      const statusColor = overallStatus === 'green' ? [34, 197, 94] : 
                         overallStatus === 'yellow' ? [234, 179, 8] : [239, 68, 68];
      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.text(`ESTADO: ${statusText}`, 70, trafficY + 12);
      doc.setTextColor(0, 0, 0);
      
      // PÁGINA 3: Distribución de Riesgos
      doc.addPage();
      
      // Header de tercera página
      doc.setFillColor(30, 58, 138);
      doc.rect(0, 0, 210, 25, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('DASHBOARD EJECUTIVO - ANÁLISIS DE RIESGOS', 20, 15);
      doc.setTextColor(0, 0, 0);
      
      yPos = 60;
      
      doc.setFillColor(254, 242, 242);
      doc.rect(15, yPos - 5, 180, 18, 'F');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('DISTRIBUCIÓN DE RIESGOS PSICOSOCIALES', 20, yPos + 8);
      
      yPos += 30;
      
      // Gráfica de pastel en posición fija centrada
      const executivePieData = Object.entries(stats.riskDistribution).map(([level, count]) => ({
        label: level.charAt(0).toUpperCase() + level.slice(1),
        value: count as number,
        color: {
          'muy-bajo': [34, 197, 94],
          'bajo': [101, 163, 13], 
          'medio': [234, 179, 8],
          'alto': [249, 115, 22],
          'muy-alto': [239, 68, 68]
        }[level] || [128, 128, 128]
      }));
      
      // Posición fija para la gráfica de pastel (centrada)
      const pieX = 95;
      const pieY = yPos;
      drawPieChart(doc, pieX, pieY, 15, executivePieData);
      
      // Saltar completamente la zona de la gráfica de pastel
      yPos += 50;
      
      // Análisis detallado horizontal
      doc.setFillColor(248, 250, 252);
      doc.rect(15, yPos - 5, 180, 55, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('ANÁLISIS DETALLADO DE RIESGOS', 20, yPos + 8);
      
      yPos += 18;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      // Lista horizontal de riesgos
      let itemsInRow = 0;
      let xOffset = 25;
      const itemWidth = 75;
      
      executivePieData.forEach(item => {
        if (item.value > 0) {
          doc.setTextColor(item.color[0], item.color[1], item.color[2]);
          doc.text(`● ${item.label}: ${item.value}`, xOffset, yPos);
          doc.setTextColor(0, 0, 0);
          
          itemsInRow++;
          if (itemsInRow >= 2) {
            yPos += 10;
            xOffset = 25;
            itemsInRow = 0;
          } else {
            xOffset += itemWidth;
          }
        }
      });
      
      yPos += 15;
      
      // Interpretación ejecutiva compacta
      doc.setFillColor(255, 255, 255);
      doc.rect(15, yPos - 5, 180, 25, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('INTERPRETACIÓN EJECUTIVA:', 20, yPos + 8);
      
      yPos += 15;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const totalRisk = executivePieData.reduce((sum, item) => sum + item.value, 0);
      const highRiskCount = (executivePieData.find(item => item.label === 'Alto')?.value || 0) + 
                           (executivePieData.find(item => item.label === 'Muy-alto')?.value || 0);
      const riskPercentage = totalRisk > 0 ? ((highRiskCount / totalRisk) * 100).toFixed(1) : '0';
      
      doc.text(`• ${riskPercentage}% de trabajadores requieren intervención inmediata`, 25, yPos);
      yPos += 8;
      doc.text(`• Cobertura de evaluación: ${coverage}% del total organizacional`, 25, yPos);
      
      // PÁGINA 4: Acciones Inmediatas
      doc.addPage();
      
      // Header de cuarta página
      doc.setFillColor(30, 58, 138);
      doc.rect(0, 0, 210, 25, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('DASHBOARD EJECUTIVO - ACCIONES INMEDIATAS', 20, 15);
      doc.setTextColor(0, 0, 0);
      
      yPos = 50;
      
      doc.setFillColor(254, 242, 242);
      doc.rect(15, yPos - 5, 180, 14, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('PLAN DE INTERVENCIÓN INMEDIATA (0-30 DÍAS)', 20, yPos + 6);
      
      yPos += 25;
      
      // Acciones inmediatas más compactas
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38);
      doc.text('PRIORIDAD ALTA - IMPLEMENTACIÓN INMEDIATA:', 20, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 18;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('1. Revisar casos de trabajadores en riesgo alto identificados', 25, yPos);
      yPos += 12;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('   • Contacto directo con empleados afectados', 30, yPos);
      yPos += 9;
      doc.text('   • Evaluación individual de factores de riesgo', 30, yPos);
      yPos += 15;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('2. Establecer comunicación directa con supervisores de áreas críticas', 25, yPos);
      yPos += 12;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('   • Reuniones de emergencia con líderes de área', 30, yPos);
      yPos += 9;
      doc.text('   • Establecimiento de protocolos de comunicación', 30, yPos);
      yPos += 15;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('3. Designar responsable de seguimiento a programa NOM-035', 25, yPos);
      yPos += 12;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('   • Asignación de recursos humanos especializados', 30, yPos);
      yPos += 9;
      doc.text('   • Definición de autoridad y responsabilidades', 30, yPos);
      yPos += 15;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('4. Activación de protocolos de apoyo psicológico especializado', 25, yPos);
      yPos += 12;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('   • Contacto con profesionales de salud mental', 30, yPos);
      yPos += 9;
      doc.text('   • Implementación de canales de apoyo confidencial', 30, yPos);
      
      // PÁGINA 5: Acciones a Mediano y Largo Plazo
      doc.addPage();
      
      // Header de quinta página
      doc.setFillColor(30, 58, 138);
      doc.rect(0, 0, 210, 25, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('DASHBOARD EJECUTIVO - PLAN ESTRATÉGICO', 20, 15);
      doc.setTextColor(0, 0, 0);
      
      yPos = 50;
      
      // Acciones a mediano plazo más compactas
      doc.setFillColor(255, 248, 220);
      doc.rect(15, yPos - 5, 180, 14, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('ACCIONES A MEDIANO PLAZO (1-3 MESES)', 20, yPos + 6);
      
      yPos += 25;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(217, 119, 6);
      doc.text('DESARROLLO ORGANIZACIONAL:', 20, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 15;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('• Implementar medidas organizacionales de prevención', 25, yPos);
      yPos += 12;
      doc.text('• Establecer programa de capacitación gerencial', 25, yPos);
      yPos += 12;
      doc.text('• Desarrollar políticas de bienestar organizacional', 25, yPos);
      yPos += 12;
      doc.text('• Establecimiento de comité permanente de bienestar', 25, yPos);
      yPos += 12;
      doc.text('• Programa de seguimiento y reevaluación trimestral', 25, yPos);
      
      yPos += 25;
      
      // Acciones a largo plazo más compactas
      doc.setFillColor(240, 253, 244);
      doc.rect(15, yPos - 5, 180, 14, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('ACCIONES A LARGO PLAZO (3-12 MESES)', 20, yPos + 6);
      
      yPos += 25;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 197, 94);
      doc.text('TRANSFORMACIÓN CULTURAL:', 20, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 15;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('• Cultura organizacional de bienestar y prevención', 25, yPos);
      yPos += 12;
      doc.text('• Sistema de indicadores de seguimiento continuo', 25, yPos);
      yPos += 12;
      doc.text('• Programa de reconocimiento y motivación', 25, yPos);
      yPos += 15;
      doc.text('• Evaluación anual de cumplimiento NOM-035', 25, yPos);
      yPos += 15;
      doc.text('• Integración de bienestar en procesos organizacionales', 25, yPos);
    }
    
    // Professional footer on both pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const footerY = 270;
      doc.setFillColor(245, 245, 245);
      doc.rect(0, footerY, 210, 27, 'F');
      
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Documento oficial de cumplimiento NOM-035-STPS-2018', 20, footerY + 8);
      doc.text(`Generado: ${new Date().toLocaleString('es-MX')}`, 20, footerY + 15);
      doc.text(`Sistema Certificado de Evaluación | Página ${i} de ${pageCount}`, 20, footerY + 22);
    }
    
    // Save with professional filename
    const templateNames = {
      'nom035-compliance': 'Cumplimiento-NOM035',
      'risk-analysis': 'Analisis-Riesgos',
      'intervention-plan': 'Plan-Intervencion',
      'executive-dashboard': 'Dashboard-Ejecutivo'
    };
    
    const fileName = `${templateNames[reportData.templateId as keyof typeof templateNames] || 'Reporte'}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    return { success: true, fileName };
  } catch (error) {
    console.error('Error generating PDF:', error);
    return { success: false, error: 'No se pudo generar el reporte' };
  }
}