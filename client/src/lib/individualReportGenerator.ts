/**
 * Generador de Reporte Individual NOM-035-STPS-2018
 * Diseño profesional Navy + Verde Lima
 * Incluye: datos del empleado, nivel de riesgo, dominios, categorías, recomendaciones
 */

const RISK_COLORS: Record<string, [number, number, number]> = {
  "nulo":     [6,  182, 212],
  "sin-riesgo": [34, 197, 94],
  "muy-bajo": [34, 197, 94],
  "bajo":     [132, 204, 22],
  "medio":    [234, 179, 8],
  "alto":     [249, 115, 22],
  "muy-alto": [239, 68, 68],
};

const RISK_LABELS: Record<string, string> = {
  "nulo":       "Nulo",
  "sin-riesgo": "Sin Riesgo",
  "muy-bajo":   "Muy Bajo",
  "bajo":       "Bajo",
  "medio":      "Medio",
  "alto":       "Alto",
  "muy-alto":   "Muy Alto",
};

const DOMAIN_LABELS: Record<string, string> = {
  ambiente_trabajo:       "Condiciones del ambiente de trabajo",
  carga_trabajo:          "Carga de trabajo",
  control_trabajo:        "Falta de control sobre el trabajo",
  liderazgo:              "Liderazgo",
  relaciones_trabajo:     "Relaciones en el trabajo",
  violencia:              "Violencia laboral",
  entorno_organizacional: "Entorno organizacional",
};

const RECOMENDACIONES: Record<string, string[]> = {
  "nulo": [
    "Mantener las condiciones actuales de trabajo.",
    "Continuar promoviendo el entorno organizacional favorable.",
    "Realizar evaluación periódica cada 2 años según NOM-035.",
  ],
  "muy-bajo": [
    "Mantener las condiciones actuales de trabajo.",
    "Continuar promoviendo el entorno organizacional favorable.",
    "Realizar evaluación periódica cada 2 años según NOM-035.",
  ],
  "bajo": [
    "Monitorear los factores identificados de manera periódica.",
    "Implementar acciones preventivas en las áreas con puntuaciones más altas.",
    "Promover la comunicación abierta entre colaboradores y líderes.",
  ],
  "medio": [
    "Implementar un Programa de Intervención conforme al Numeral 8.2 NOM-035.",
    "Capacitar a mandos medios en gestión del estrés y comunicación efectiva.",
    "Revisar la distribución de cargas de trabajo y jornadas laborales.",
    "Establecer canales formales de comunicación y retroalimentación.",
    "Programar evaluación de seguimiento en los próximos 6 meses.",
  ],
  "alto": [
    "Atención prioritaria: iniciar intervención organizacional inmediata.",
    "Canalizar al trabajador con el médico o psicólogo de la empresa.",
    "Revisar urgentemente condiciones específicas de su puesto de trabajo.",
    "Aplicar medidas de control para los dominios con mayor puntuación.",
    "Abrir expediente de seguimiento y programar citas periódicas.",
    "Notificar al área de Recursos Humanos y al responsable de la comisión.",
  ],
  "muy-alto": [
    "ATENCIÓN URGENTE: El trabajador requiere intervención inmediata.",
    "Canalizar de forma prioritaria a servicios médicos especializados.",
    "Evaluar la posibilidad de cambio temporal de funciones o área.",
    "Notificar formalmente a la dirección de la empresa.",
    "Abrir expediente de seguimiento con citas semanales mínimo.",
    "Documentar todas las acciones tomadas para cumplimiento normativo.",
    "Considerar evaluación psicológica especializada (Numeral 5.6 NOM-035).",
  ],
};

export async function generateEmployeeReport(employee: any, evaluation: any, company: any): Promise<void> {
  const jsPDFModule = await import('jspdf');
  const doc = new jsPDFModule.default({ unit: 'mm', format: 'a4' });

  const riskLevel = evaluation?.riskLevel || evaluation?.risk_level || "medio";
  const riskColor = RISK_COLORS[riskLevel] || [234, 179, 8];
  const riskLabel = RISK_LABELS[riskLevel] || "Medio";
  const overallScore = evaluation?.overallScore || evaluation?.overall_score || 0;
  const companyName = company?.razonSocial || company?.razon_social || company?.nombre_empresa || "Empresa";
  const nombre = employee?.nombre || "";
  const apellidos = employee?.apellidoPaterno
    ? `${employee.apellidoPaterno}${employee.apellidoMaterno ? " " + employee.apellidoMaterno : ""}`
    : (employee?.apellidos || "");
  const nombreCompleto = `${nombre} ${apellidos}`.trim();

  // ─── PÁGINA 1 ──────────────────────────────────────────────────────────────
  // Header navy
  doc.setFillColor(30, 58, 95);
  doc.rect(0, 0, 210, 35, 'F');
  doc.setDrawColor(132, 204, 22);
  doc.setLineWidth(1.5);
  doc.line(0, 35, 210, 35);

  // Título
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE INDIVIDUAL NOM-035-STPS-2018', 15, 14);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Factores de Riesgo Psicosocial en el Trabajo', 15, 21);
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`${companyName}  ·  Generado: ${new Date().toLocaleDateString('es-MX', { day:'2-digit', month:'long', year:'numeric' })}`, 15, 29);

  let y = 48;

  // ─── Sección: Datos del trabajador ─────────────────────────────────────────
  doc.setFillColor(30, 58, 95);
  doc.rect(12, y, 186, 9, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL TRABAJADOR', 16, y + 6);
  y += 13;

  const datosEmp = [
    ['Nombre completo', nombreCompleto],
    ['No. Empleado', employee?.numeroEmpleado || employee?.numero_empleado || '—'],
    ['Puesto / Cargo', employee?.puesto || '—'],
    ['Área / Departamento', employee?.area || '—'],
    ['Fecha de ingreso', employee?.fechaIngreso || employee?.fecha_ingreso || '—'],
    ['RFC', employee?.rfc || '—'],
    ['CURP', employee?.curp || '—'],
    ['Correo electrónico', employee?.email || '—'],
  ];

  doc.setFontSize(8.5);
  datosEmp.forEach(([label, value], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = col === 0 ? 15 : 110;
    const rowY = y + row * 9;

    if (i % 2 === 0 && row % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(12, rowY - 3, 186, 9, 'F');
    }
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, x, rowY + 3);
    doc.setTextColor(30, 58, 95);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value).substring(0, 35), x + 35, rowY + 3);
  });

  y += Math.ceil(datosEmp.length / 2) * 9 + 8;

  // ─── Sección: Resultado global ─────────────────────────────────────────────
  doc.setFillColor(30, 58, 95);
  doc.rect(12, y, 186, 9, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('RESULTADO DE LA EVALUACIÓN', 16, y + 6);
  y += 13;

  // Tarjeta de nivel de riesgo
  doc.setFillColor(248, 250, 252);
  doc.rect(12, y, 186, 30, 'F');
  doc.setFillColor(...riskColor);
  doc.rect(12, y, 4, 30, 'F');

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...riskColor);
  doc.text(riskLabel.toUpperCase(), 22, y + 13);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Nivel de riesgo psicosocial', 22, y + 21);

  // Puntaje
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...riskColor);
  doc.text(String(overallScore), 150, y + 15);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('/ 288 puntos', 150, y + 22);

  y += 38;

  // Info de la evaluación
  const evalInfo = [
    ['Tipo de cuestionario', evaluation?.questionnaireType === 'guia3' ? 'Guía III (≥ 50 trabajadores)' : 'Guía II (16-50 trabajadores)'],
    ['Fecha de evaluación', evaluation?.completedAt || evaluation?.completed_at
      ? new Date(evaluation.completedAt || evaluation.completed_at).toLocaleDateString('es-MX')
      : new Date().toLocaleDateString('es-MX')],
  ];
  doc.setFontSize(8.5);
  evalInfo.forEach(([label, value], i) => {
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, 15 + i * 95, y);
    doc.setTextColor(30, 58, 95);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value), 15 + i * 95 + 38, y);
  });
  y += 10;

  // ─── Sección: Puntajes por dominio ─────────────────────────────────────────
  const domainScores: any[] = evaluation?.domainScores || evaluation?.domain_scores || [];

  if (domainScores.length > 0) {
    doc.setFillColor(30, 58, 95);
    doc.rect(12, y, 186, 9, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('PUNTAJES POR DOMINIO', 16, y + 6);
    y += 13;

    // Cabecera de tabla
    doc.setFillColor(21, 40, 68);
    doc.rect(12, y, 186, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Dominio', 15, y + 5);
    doc.text('Puntaje', 128, y + 5);
    doc.text('Máximo', 148, y + 5);
    doc.text('%', 168, y + 5);
    doc.text('Nivel', 175, y + 5);
    y += 8;

    domainScores.forEach((d: any, i: number) => {
      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(12, y - 1, 186, 7, 'F');
      }
      const dColor = RISK_COLORS[d.riskLevel || d.risk_level] || [100, 116, 139];
      const dLabel = RISK_LABELS[d.riskLevel || d.risk_level] || "—";
      const domainName = DOMAIN_LABELS[d.domain] || d.domain || d.domainName || "—";

      doc.setTextColor(30, 58, 95);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(domainName.substring(0, 45), 15, y + 4);
      doc.text(String(d.score ?? "—"), 133, y + 4);
      doc.text(String(d.maxScore ?? "—"), 153, y + 4);
      doc.text(`${d.percentage ?? Math.round((d.score / d.maxScore) * 100) ?? "—"}%`, 169, y + 4);
      doc.setTextColor(...dColor);
      doc.setFont('helvetica', 'bold');
      doc.text(dLabel, 176, y + 4);
      y += 7;
    });
    y += 5;
  }

  // ─── Sección: Recomendaciones ───────────────────────────────────────────────
  if (y > 240) { doc.addPage(); y = 20; }

  doc.setFillColor(30, 58, 95);
  doc.rect(12, y, 186, 9, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('RECOMENDACIONES', 16, y + 6);
  y += 13;

  const recs = RECOMENDACIONES[riskLevel] || RECOMENDACIONES["medio"];
  doc.setFontSize(8.5);
  recs.forEach((rec, i) => {
    doc.setFillColor(...riskColor, 15 as any);
    doc.setFillColor(248, 250, 252);
    doc.rect(12, y - 2, 186, 8, 'F');
    doc.setFillColor(...riskColor);
    doc.rect(12, y - 2, 2, 8, 'F');
    doc.setTextColor(30, 58, 95);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(`${i + 1}. ${rec}`, 170);
    doc.text(lines, 17, y + 3);
    y += lines.length * 6 + 3;
  });

  // ─── Pie de página ──────────────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFillColor(245, 245, 250);
    doc.rect(0, 277, 210, 20, 'F');
    doc.setDrawColor(30, 58, 95);
    doc.setLineWidth(0.5);
    doc.line(0, 277, 210, 277);
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`NOM-035-STPS-2018 | ${companyName}`, 15, 284);
    doc.text(`Reporte individual: ${nombreCompleto}`, 15, 289);
    doc.text(`Página ${p} de ${totalPages}`, 195, 284, { align: 'right' });
    doc.text(`Documento confidencial — Solo para uso interno`, 195, 289, { align: 'right' });
  }

  // Guardar
  const fecha = new Date().toISOString().split('T')[0];
  const safeName = nombreCompleto.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
  doc.save(`Reporte-Individual-${safeName}-${fecha}.pdf`);
}
