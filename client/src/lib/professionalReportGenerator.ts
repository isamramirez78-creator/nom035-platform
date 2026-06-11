import { jsPDF } from "jspdf";

// Reemplazar autotable con dibujo manual simple si no se puede instalar fácilmente
interface ReportData {
  companyName: string;
  date: string;
  totalEmployees: number;
  evaluatedEmployees: number;
  globalScore: number;
  riskLevel: string;
  categoryScores: Record<string, { score: number; level: string }>;
  domainScores: Record<string, { score: number; level: string }>;
  canalizationCount: number;
}

export async function generateProfessionalReport(data: ReportData) {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Función auxiliar para tablas manuales
  const drawManualTable = (startY: number, headers: string[], rows: any[][]) => {
    let currentY = startY;
    const colWidth = (pageWidth - 40) / headers.length;
    
    doc.setFillColor(24, 45, 85);
    doc.setTextColor(255, 255, 255);
    headers.forEach((h, i) => {
      doc.rect(20 + (i * colWidth), currentY, colWidth, 10, 'F');
      doc.text(h, 25 + (i * colWidth), currentY + 7);
    });
    
    currentY += 10;
    doc.setTextColor(0, 0, 0);
    rows.forEach(row => {
      row.forEach((cell, i) => {
        doc.rect(20 + (i * colWidth), currentY, colWidth, 10);
        doc.text(String(cell), 25 + (i * colWidth), currentY + 7);
      });
      currentY += 10;
    });
    return currentY;
  };

  // --- SLIDE 1: PORTADA ---
  doc.setFillColor(24, 45, 85);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(40);
  doc.text("NOM-035-STPS-2018", pageWidth / 2, pageHeight / 2 - 20, { align: "center" });
  doc.setFontSize(24);
  doc.text("Resultados 2025", pageWidth / 2, pageHeight / 2 + 10, { align: "center" });
  doc.setFontSize(16);
  doc.text(data.companyName, pageWidth / 2, pageHeight / 2 + 30, { align: "center" });

  // --- SLIDE 2: CONTENIDO ---
  doc.addPage();
  doc.setTextColor(24, 45, 85);
  doc.setFontSize(24);
  doc.text("Contenido", 20, 30);
  const contentItems = [
    "1. Introducción a la NOM-035",
    "2. Metodología | NOM-035",
    "3. Escala de medición de Resultados",
    "4. Resultados | Guía III",
    "5. Casos de canalización",
    "6. Hallazgos generales"
  ];
  doc.setFontSize(14);
  contentItems.forEach((item, index) => {
    doc.text(item, 30, 50 + (index * 15));
  });

  // --- SLIDE 3: INTRODUCCIÓN ---
  doc.addPage();
  doc.setFontSize(20);
  doc.text("1. Introducción a la NOM-035", 20, 25);
  doc.setFontSize(12);
  doc.text([
    "La NOM-035-STPS-2018 tiene como objetivo identificar, analizar y prevenir los factores de riesgo psicosocial.",
    "Campo de aplicación: Obligatoria para todos los centros de trabajo del territorio mexicano."
  ], 20, 45);

  // --- SLIDE 4: METODOLOGÍA ---
  doc.addPage();
  doc.setFontSize(20);
  doc.text("2. Metodología de NOM-035", 20, 25);
  drawManualTable(40, ['Guía', 'Descripción'], [
    ['GUÍA I', 'Acontecimientos traumáticos severos.'],
    ['GUÍA III', 'Riesgo psicosocial (+50 empleados).']
  ]);

  // --- SLIDE 5: ESCALAS ---
  doc.addPage();
  doc.setFontSize(20);
  doc.text("3. Escala de medición", 20, 25);
  drawManualTable(40, ['Nivel', 'Rango Global'], [
    ['NULO', '0-49'], ['BAJO', '50-74'], ['MEDIO', '75-98'], ['ALTO', '99-139'], ['MUY ALTO', '140+']
  ]);

  // --- SLIDE 6: CATEGORÍAS ---
  doc.addPage();
  doc.setFontSize(20);
  doc.text("4. Resultados por Categoría", 20, 25);
  drawManualTable(40, ['Categoría', 'Puntaje', 'Riesgo'], 
    Object.entries(data.categoryScores).map(([k, v]) => [k, v.score, v.level])
  );

  // --- SLIDE 7: CANALIZACIÓN ---
  doc.addPage();
  doc.setFontSize(20);
  doc.text("5. Casos de canalización", 20, 25);
  const percentage = ((data.canalizationCount / data.evaluatedEmployees) * 100).toFixed(1);
  doc.setFontSize(30);
  doc.setTextColor(200, 0, 0);
  doc.text(`${percentage}%`, pageWidth / 2, 85, { align: "center" });
  doc.setFontSize(16);
  doc.text("requieren canalización clínica", pageWidth / 2, 100, { align: "center" });

  // --- SLIDE 8: HALLAZGOS ---
  doc.addPage();
  doc.setTextColor(24, 45, 85);
  doc.setFontSize(20);
  doc.text("6. Hallazgos generales", 20, 25);
  doc.setFontSize(12);
  doc.text([
    `El nivel general de riesgo es ${data.riskLevel} con ${data.globalScore} puntos.`,
    "Se recomienda monitoreo continuo y acciones preventivas."
  ], 20, 45);

  doc.save(`Reporte_NOM035_${data.companyName.replace(/\s+/g, '_')}.pdf`);
}
