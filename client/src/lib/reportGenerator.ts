/**
 * reportGenerator.ts
 * Generador único de reportes PDF para NOM-035-STPS-2018
 * Usa jsPDF con layout por bloques para evitar solapamientos
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────
export type ReportType =
  | 'executive-dashboard'
  | 'nom035-compliance'
  | 'risk-analysis'
  | 'intervention-plan'
  | 'employee-report'
  | 'area-report';

export interface ReportConfig {
  type: ReportType;
  companyId?: number;
  employeeId?: number;
  area?: string;
}

interface RiskDistribution { [level: string]: number }
interface AreaStat { total: number; completed: number; avgRisk: number }

interface ReportStats {
  companyName: string;
  rfc: string;
  totalEmployees: number;
  evaluationsCompleted: number;
  pendingEvaluations: number;
  highRiskCount: number;
  riskDistribution: RiskDistribution;
  areaStats: { [area: string]: AreaStat };
}

// ─── Colores ──────────────────────────────────────────────────────────────────
const C = {
  navy:    [30, 58, 138]  as [number,number,number],
  blue:    [59, 130, 246] as [number,number,number],
  green:   [34, 197, 94]  as [number,number,number],
  yellow:  [234, 179, 8]  as [number,number,number],
  orange:  [249, 115, 22] as [number,number,number],
  red:     [239, 68, 68]  as [number,number,number],
  purple:  [168, 85, 247] as [number,number,number],
  gray:    [100, 116, 139] as [number,number,number],
  lightGray:[240, 240, 245] as [number,number,number],
  white:   [255, 255, 255] as [number,number,number],
  black:   [15, 23, 42]   as [number,number,number],
};

// ─── Mapas de riesgo ──────────────────────────────────────────────────────────
const RISK_LABEL: Record<string, string> = {
  'sin-riesgo': 'Sin Riesgo', 'muy-bajo': 'Muy Bajo',
  'bajo': 'Bajo', 'medio': 'Medio', 'alto': 'Alto', 'muy-alto': 'Muy Alto',
};
const RISK_COLOR: Record<string, [number,number,number]> = {
  'sin-riesgo': C.green, 'muy-bajo': C.green, 'bajo': [101, 163, 13],
  'medio': C.yellow, 'alto': C.orange, 'muy-alto': C.red,
};

// ─── Clase Layout (maneja posición Y y saltos de página) ─────────────────────
class Page {
  private doc: any;
  y: number = 28;
  private readonly margin = 15;
  private readonly pageH = 287;
  private readonly contentW = 180;

  constructor(doc: any) { this.doc = doc; }

  get x() { return this.margin; }
  get w() { return this.contentW; }

  /** Avanza Y; agrega página nueva si no cabe */
  advance(height: number) {
    if (this.y + height > this.pageH - 20) this.newPage();
    else this.y += height;
  }

  newPage() {
    this.doc.addPage();
    this.y = 28;
  }

  ensure(needed: number) {
    if (this.y + needed > this.pageH - 20) this.newPage();
  }

  // ── Primitivas de dibujo ──────────────────────────────────────────────────
  fillRect(x: number, y: number, w: number, h: number, color: [number,number,number]) {
    this.doc.setFillColor(...color);
    this.doc.rect(x, y, w, h, 'F');
  }

  strokeRect(x: number, y: number, w: number, h: number, color: [number,number,number], lw = 0.3) {
    this.doc.setDrawColor(...color);
    this.doc.setLineWidth(lw);
    this.doc.rect(x, y, w, h, 'S');
  }

  text(str: string, x: number, y: number, color: [number,number,number], size: number, bold = false) {
    this.doc.setTextColor(...color);
    this.doc.setFontSize(size);
    this.doc.setFont('helvetica', bold ? 'bold' : 'normal');
    this.doc.text(str, x, y);
  }

  textCenter(str: string, y: number, color: [number,number,number], size: number, bold = false) {
    this.doc.setTextColor(...color);
    this.doc.setFontSize(size);
    this.doc.setFont('helvetica', bold ? 'bold' : 'normal');
    this.doc.text(str, 105, y, { align: 'center' });
  }

  // ── Bloques reutilizables ─────────────────────────────────────────────────

  /** Encabezado de sección con banda de color */
  sectionHeader(title: string, color: [number,number,number] = C.navy) {
    this.ensure(12);
    this.fillRect(this.x, this.y, this.w, 10, color);
    this.text(title, this.x + 4, this.y + 7, C.white, 10, true);
    this.y += 14;
  }

  /** Fila de dato clave-valor */
  kv(label: string, value: string, valueColor: [number,number,number] = C.black) {
    this.ensure(8);
    this.text(label + ':', this.x + 3, this.y, C.gray, 9, true);
    this.text(value, this.x + 55, this.y, valueColor, 9);
    this.y += 7;
  }

  /** Línea de texto simple */
  line(str: string, indent = 0, color: [number,number,number] = C.black, size = 9) {
    this.ensure(7);
    this.text(str, this.x + 3 + indent, this.y, color, size);
    this.y += 6;
  }

  /** Bullet point */
  bullet(str: string, indent = 0, color: [number,number,number] = C.black) {
    this.line('• ' + str, indent, color);
  }

  /** Separador horizontal */
  separator() {
    this.ensure(5);
    this.doc.setDrawColor(220, 220, 230);
    this.doc.setLineWidth(0.3);
    this.doc.line(this.x, this.y, this.x + this.w, this.y);
    this.y += 4;
  }

  gap(h = 4) { this.y += h; }

  /** Tarjeta de métrica grande */
  metricCard(x: number, y: number, w: number, h: number, value: string, label: string, color: [number,number,number]) {
    this.fillRect(x, y, w, h, C.lightGray);
    this.strokeRect(x, y, w, h, [210, 210, 220]);
    // Barra superior de color
    this.fillRect(x, y, w, 2, color);
    this.doc.setTextColor(...color);
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(value, x + w / 2, y + h / 2 + 2, { align: 'center' });
    this.doc.setTextColor(...C.gray);
    this.doc.setFontSize(7.5);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(label, x + w / 2, y + h - 5, { align: 'center' });
  }

  /** Barra de progreso horizontal */
  progressBar(x: number, y: number, w: number, pct: number, color: [number,number,number]) {
    this.fillRect(x, y, w, 5, [225, 225, 235]);
    this.fillRect(x, y, Math.round(w * pct / 100), 5, color);
    this.strokeRect(x, y, w, 5, [200, 200, 210]);
  }

  /** Fila de tabla con fondo alternado */
  tableRow(cols: string[], widths: number[], startX: number, even: boolean, colors?: ([number,number,number] | null)[]) {
    this.ensure(8);
    let cx = startX;
    if (even) this.fillRect(startX, this.y - 1, widths.reduce((a, b) => a + b, 0), 7, [248, 248, 252]);
    cols.forEach((col, i) => {
      const color = colors?.[i] ?? C.black;
      this.doc.setTextColor(...(color ?? C.black));
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(col.substring(0, Math.floor(widths[i] / 2.2)), cx + 2, this.y + 4);
      cx += widths[i];
    });
    this.y += 7;
  }

  tableHeader(cols: string[], widths: number[], startX: number) {
    this.ensure(8);
    this.fillRect(startX, this.y - 1, widths.reduce((a, b) => a + b, 0), 8, C.navy);
    let cx = startX;
    cols.forEach((col, i) => {
      this.doc.setTextColor(...C.white);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(col, cx + 2, this.y + 4);
      cx += widths[i];
    });
    this.y += 9;
  }
}

// ─── Obtener datos de la API ──────────────────────────────────────────────────
async function fetchReportData(): Promise<{ stats: ReportStats; employees: any[]; evaluations: any[] }> {
  const [sRes, eRes, evRes] = await Promise.all([
    fetch('/api/stats'),
    fetch('/api/employees'),
    fetch('/api/evaluations'),
  ]);

  if (!sRes.ok || !eRes.ok || !evRes.ok) {
    throw new Error('No se pudo obtener los datos de la API. Verifica tu conexión.');
  }

  const [statsRaw, employees, evaluations] = await Promise.all([
    sRes.json(), eRes.json(), evRes.json(),
  ]);

  // Normalizar — la API puede devolver nombre como "razonSocial" o "nombre"
  const stats: ReportStats = {
    companyName:          statsRaw.companyName  || statsRaw.razonSocial || 'Empresa',
    rfc:                  statsRaw.rfc          || '—',
    totalEmployees:       statsRaw.totalEmployees       ?? 0,
    evaluationsCompleted: statsRaw.evaluationsCompleted ?? 0,
    pendingEvaluations:   statsRaw.pendingEvaluations   ?? 0,
    highRiskCount:        statsRaw.highRiskCount         ?? 0,
    riskDistribution:     statsRaw.riskDistribution      || {},
    areaStats:            statsRaw.areaStats              || {},
  };

  return { stats, employees, evaluations };
}

// ─── Encabezado global de página ─────────────────────────────────────────────
function drawPageHeader(doc: any, title: string, subtitle: string) {
  doc.setFillColor(...C.navy);
  doc.rect(0, 0, 210, 22, 'F');
  doc.setTextColor(...C.white);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 15, 10);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle, 15, 17);
  // Línea dorada decorativa
  doc.setDrawColor(253, 200, 50);
  doc.setLineWidth(1);
  doc.line(0, 22, 210, 22);
}

// ─── Pie de página ────────────────────────────────────────────────────────────
function addPageFooters(doc: any, company: string) {
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setFillColor(245, 245, 250);
    doc.rect(0, 277, 210, 20, 'F');
    doc.setDrawColor(...C.navy);
    doc.setLineWidth(0.5);
    doc.line(0, 277, 210, 277);
    doc.setTextColor(...C.gray);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`NOM-035-STPS-2018 | ${company}`, 15, 284);
    doc.text(`Generado: ${new Date().toLocaleString('es-MX')}`, 15, 289);
    doc.text(`Página ${i} de ${n}`, 195, 284, { align: 'right' });
    doc.text('Documento oficial de cumplimiento normativo', 195, 289, { align: 'right' });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function coverage(stats: ReportStats) {
  return stats.totalEmployees > 0
    ? Math.round((stats.evaluationsCompleted / stats.totalEmployees) * 100)
    : 0;
}

function highRiskPct(stats: ReportStats) {
  return stats.evaluationsCompleted > 0
    ? parseFloat(((stats.highRiskCount / stats.evaluationsCompleted) * 100).toFixed(1))
    : 0;
}

function overallStatus(stats: ReportStats): { label: string; color: [number,number,number] } {
  const cov = coverage(stats);
  const hrp = highRiskPct(stats);
  if (cov >= 80 && hrp < 15) return { label: 'CUMPLE — Situación Favorable', color: C.green };
  if (cov < 60 || hrp > 25)  return { label: 'NO CUMPLE — Atención Urgente', color: C.red };
  return { label: 'EN PROCESO — Monitoreo Requerido', color: C.yellow };
}

// ─── SECCIÓN: Información de empresa ─────────────────────────────────────────
function sectionCompanyInfo(pg: Page, stats: ReportStats, reportLabel: string) {
  pg.sectionHeader('INFORMACIÓN DE LA ORGANIZACIÓN');
  pg.kv('Razón Social', stats.companyName);
  pg.kv('RFC', stats.rfc);
  pg.kv('Tipo de Reporte', reportLabel);
  pg.kv('Fecha de Generación', new Date().toLocaleDateString('es-MX', { day:'2-digit', month:'long', year:'numeric' }));
  pg.kv('Norma Aplicable', 'NOM-035-STPS-2018');
  pg.gap();
}

// ─── SECCIÓN: KPIs principales (tarjetas) ─────────────────────────────────────
function sectionKPIs(pg: Page, stats: ReportStats) {
  pg.sectionHeader('INDICADORES CLAVE');
  const cov  = coverage(stats);
  const hrp  = highRiskPct(stats);
  const status = overallStatus(stats);
  const cardW = 40; const cardH = 22; const gap = 6;
  const startX = pg.x + 3;
  const y = pg.y;

  pg.metricCard(startX,            y, cardW, cardH, String(stats.totalEmployees),       'Total Trabajadores',           C.navy);
  pg.metricCard(startX + cardW + gap, y, cardW, cardH, String(stats.evaluationsCompleted), 'Evaluaciones Completadas',     C.blue);
  pg.metricCard(startX + (cardW+gap)*2, y, cardW, cardH, `${cov}%`,                   'Cobertura NOM-035',             cov >= 80 ? C.green : C.red);
  pg.metricCard(startX + (cardW+gap)*3, y, cardW, cardH, `${hrp}%`,                   'En Riesgo Alto o Muy Alto',     hrp < 15 ? C.green : hrp < 25 ? C.orange : C.red);

  pg.y += cardH + 6;

  // Barra de cobertura
  pg.text('Cobertura de evaluaciones:', pg.x + 3, pg.y, C.gray, 8, true);
  pg.y += 5;
  pg.progressBar(pg.x + 3, pg.y, pg.w - 6, cov, cov >= 80 ? C.green : C.orange);
  pg.y += 8;
  pg.text(`${stats.evaluationsCompleted} de ${stats.totalEmployees} trabajadores evaluados (${stats.pendingEvaluations} pendientes)`, pg.x + 3, pg.y, C.gray, 8);
  pg.y += 8;

  // Estado general
  pg.fillRect(pg.x, pg.y, pg.w, 9, [...status.color, 20] as any);
  pg.fillRect(pg.x, pg.y, 3, 9, status.color);
  pg.text('Estado normativo:', pg.x + 7, pg.y + 6, C.gray, 8, true);
  pg.text(status.label, pg.x + 45, pg.y + 6, status.color, 8, true);
  pg.y += 13;
}

// ─── SECCIÓN: Distribución de riesgos ────────────────────────────────────────
function sectionRiskDistribution(pg: Page, stats: ReportStats) {
  pg.sectionHeader('DISTRIBUCIÓN DE NIVELES DE RIESGO', C.orange);
  const dist = stats.riskDistribution;
  const total = Object.values(dist).reduce((a, b) => a + b, 0);
  if (total === 0) {
    pg.line('No hay evaluaciones completadas.', 0, C.gray);
    return;
  }

  const order = ['sin-riesgo','muy-bajo','bajo','medio','alto','muy-alto'];
  order.forEach(level => {
    const count = dist[level] ?? 0;
    if (count === 0) return;
    const pct = Math.round((count / total) * 100);
    const color = RISK_COLOR[level];
    const label = RISK_LABEL[level];
    pg.ensure(10);

    // Etiqueta
    pg.doc?.setTextColor?.(...(color ?? C.black));
    pg.text(`${label}`, pg.x + 3, pg.y, color, 9, true);
    pg.text(`${count} (${pct}%)`, pg.x + 35, pg.y, C.black, 9);

    // Barra
    const barX = pg.x + 70;
    const barW = pg.w - 74;
    pg.fillRect(barX, pg.y - 5, barW, 6, [230, 230, 235]);
    pg.fillRect(barX, pg.y - 5, Math.round(barW * pct / 100), 6, color);
    pg.strokeRect(barX, pg.y - 5, barW, 6, [210, 210, 215]);
    pg.y += 8;
  });
  pg.gap(2);
}

// ─── SECCIÓN: Análisis por área ───────────────────────────────────────────────
function sectionAreaAnalysis(pg: Page, stats: ReportStats, employees: any[]) {
  pg.sectionHeader('ANÁLISIS POR ÁREA / DEPARTAMENTO', C.blue);
  const areas = Object.entries(stats.areaStats);
  if (areas.length === 0) {
    pg.line('No hay datos de áreas disponibles.', 0, C.gray);
    return;
  }

  const cols = ['Área', 'Trabajadores', 'Evaluados', 'Cobertura', 'Estado'];
  const widths = [65, 28, 25, 28, 34];
  pg.tableHeader(cols, widths, pg.x);

  areas.forEach(([area, s], idx) => {
    const areaCov = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
    const statusLabel = areaCov >= 80 ? 'Cumple' : areaCov >= 50 ? 'En proceso' : 'Pendiente';
    const statusColor = areaCov >= 80 ? C.green : areaCov >= 50 ? C.yellow : C.red;
    pg.tableRow(
      [area, String(s.total), String(s.completed), `${areaCov}%`, statusLabel],
      widths, pg.x, idx % 2 === 0,
      [C.black, C.black, C.black, areaCov >= 80 ? C.green : C.orange, statusColor]
    );
  });
  pg.gap(4);
}

// ─── SECCIÓN: Trabajadores de alto riesgo ────────────────────────────────────
function sectionHighRiskEmployees(pg: Page, employees: any[], evaluations: any[]) {
  const highRisk = evaluations.filter(e => e.riskLevel === 'alto' || e.riskLevel === 'muy-alto');
  if (highRisk.length === 0) return;

  pg.sectionHeader('TRABAJADORES QUE REQUIEREN ATENCIÓN PRIORITARIA', C.red);

  const cols = ['Nombre', 'Área', 'Puesto', 'Nivel de Riesgo', 'Acción'];
  const widths = [52, 32, 32, 32, 32];
  pg.tableHeader(cols, widths, pg.x);

  highRisk.forEach((ev, idx) => {
    const emp = employees.find(e => e.id === ev.employeeId);
    if (!emp) return;
    const fullName = `${emp.nombre || ''} ${emp.apellidos || ''}`.trim();
    const color = ev.riskLevel === 'muy-alto' ? C.red : C.orange;
    pg.tableRow(
      [fullName, emp.area || '—', emp.puesto || '—',
       RISK_LABEL[ev.riskLevel] || ev.riskLevel,
       ev.riskLevel === 'muy-alto' ? 'Inmediata' : 'Urgente'],
      widths, pg.x, idx % 2 === 0,
      [C.black, C.black, C.black, color, color]
    );
  });
  pg.gap(4);
}

// ─── SECCIÓN: Cumplimiento normativo ─────────────────────────────────────────
function sectionCompliance(pg: Page, stats: ReportStats) {
  const cov = coverage(stats);
  const hrp = highRiskPct(stats);
  const status = overallStatus(stats);

  pg.sectionHeader('ANÁLISIS DE CUMPLIMIENTO NOM-035-STPS-2018', C.navy);

  // Checklist de cumplimiento
  const checks: [boolean, string][] = [
    [cov >= 80,  `Cobertura mínima 80% — Actual: ${cov}%`],
    [stats.evaluationsCompleted > 0, 'Cuestionarios aplicados a trabajadores'],
    [hrp < 25,   `Trabajadores en riesgo alto < 25% — Actual: ${hrp}%`],
    [Object.keys(stats.areaStats).length > 0, 'Análisis por áreas realizado'],
  ];

  checks.forEach(([ok, label]) => {
    pg.ensure(8);
    pg.fillRect(pg.x + 3, pg.y - 4, 7, 6, ok ? C.green : C.red);
    pg.text(ok ? '✓' : '✗', pg.x + 4.5, pg.y, C.white, 7, true);
    pg.text(label, pg.x + 13, pg.y, ok ? C.green : C.red, 9, true);
    pg.y += 8;
  });

  pg.gap(3);
  pg.fillRect(pg.x, pg.y, pg.w, 10, status.color);
  pg.textCenter(`RESULTADO: ${status.label}`, pg.y + 7, C.white, 10, true);
  pg.y += 14;
}

// ─── SECCIÓN: Recomendaciones ─────────────────────────────────────────────────
function sectionRecommendations(pg: Page, stats: ReportStats) {
  const hrp = highRiskPct(stats);
  const cov = coverage(stats);

  pg.sectionHeader('RECOMENDACIONES Y PLAN DE ACCIÓN', C.purple);

  const immediate: string[] = [];
  const shortTerm: string[] = [];
  const longTerm: string[] = [];

  if (hrp > 25) {
    immediate.push('Atención clínica urgente a trabajadores en riesgo muy alto');
    immediate.push('Activar protocolos de apoyo psicológico especializado');
    immediate.push('Notificar formalmente a dirección y supervisores');
  }
  if (cov < 80) {
    immediate.push(`Completar ${stats.pendingEvaluations} evaluaciones pendientes para alcanzar 80% de cobertura`);
  }
  if (hrp > 15) {
    shortTerm.push('Implementar programa de intervención organizacional (Numeral 8.1 NOM-035)');
    shortTerm.push('Capacitación a líderes en manejo de factores psicosociales');
  }
  shortTerm.push('Establecer comité permanente de bienestar organizacional');
  shortTerm.push('Revisar y mejorar procesos de comunicación interna');
  longTerm.push('Cultura organizacional de prevención y bienestar psicosocial');
  longTerm.push('Evaluación anual de cumplimiento NOM-035-STPS-2018');
  longTerm.push('Integración de indicadores de bienestar en KPIs corporativos');

  pg.text('ACCIONES INMEDIATAS (0–30 días):', pg.x + 3, pg.y, C.red, 9, true);
  pg.y += 6;
  immediate.forEach(a => pg.bullet(a, 3, C.black));
  pg.gap(3);
  pg.text('MEDIANO PLAZO (1–3 meses):', pg.x + 3, pg.y, C.orange, 9, true);
  pg.y += 6;
  shortTerm.forEach(a => pg.bullet(a, 3, C.black));
  pg.gap(3);
  pg.text('LARGO PLAZO (3–12 meses):', pg.x + 3, pg.y, C.green, 9, true);
  pg.y += 6;
  longTerm.forEach(a => pg.bullet(a, 3, C.black));
  pg.gap(4);
}

// ─── SECCIÓN: Reporte individual por empleado ────────────────────────────────
function sectionEmployeeReport(pg: Page, employee: any, evaluation: any) {
  pg.sectionHeader('DATOS DEL TRABAJADOR');
  pg.kv('Nombre', `${employee.nombre || ''} ${employee.apellidos || ''}`.trim());
  pg.kv('Área', employee.area || '—');
  pg.kv('Puesto', employee.puesto || '—');
  pg.kv('Fecha de evaluación', evaluation?.completedAt
    ? new Date(evaluation.completedAt).toLocaleDateString('es-MX')
    : 'No evaluado');
  pg.gap();

  if (!evaluation) {
    pg.line('Este trabajador aún no ha completado la evaluación NOM-035.', 0, C.gray);
    return;
  }

  pg.sectionHeader('RESULTADO DE LA EVALUACIÓN', RISK_COLOR[evaluation.riskLevel] ?? C.gray);
  pg.kv('Nivel de Riesgo', RISK_LABEL[evaluation.riskLevel] || evaluation.riskLevel, RISK_COLOR[evaluation.riskLevel] ?? C.black);
  pg.kv('Tipo de Cuestionario', evaluation.questionnaireType === 'guia2' ? 'Guía II (< 50 trabajadores)' : 'Guía III (≥ 50 trabajadores)');

  if (evaluation.answers) {
    pg.gap(2);
    pg.sectionHeader('PUNTAJES POR DOMINIO', C.blue);
    const domains = typeof evaluation.answers === 'string'
      ? JSON.parse(evaluation.answers)
      : evaluation.answers;
    if (domains?.domainScores) {
      const domCols = ['Dominio', 'Puntaje', 'Nivel'];
      const domWidths = [100, 35, 45];
      pg.tableHeader(domCols, domWidths, pg.x);
      domains.domainScores.forEach((d: any, idx: number) => {
        const color = RISK_COLOR[d.riskLevel] ?? C.black;
        pg.tableRow(
          [d.domainName || d.domain, String(d.score ?? '—'), RISK_LABEL[d.riskLevel] || d.riskLevel],
          domWidths, pg.x, idx % 2 === 0,
          [C.black, C.black, color]
        );
      });
      pg.gap(4);
    }
  }
}

// ─── GENERADOR PRINCIPAL ──────────────────────────────────────────────────────
export async function generateReport(config: ReportConfig): Promise<{ success: boolean; fileName?: string; error?: string }> {
  try {
    const jsPDFModule = await import('jspdf');
    const doc = new jsPDFModule.default({ unit: 'mm', format: 'a4' });

    const { stats, employees, evaluations } = await fetchReportData();

    const REPORT_META: Record<ReportType, { title: string; subtitle: string; label: string }> = {
      'executive-dashboard': {
        title: 'DASHBOARD EJECUTIVO NOM-035-STPS-2018',
        subtitle: 'Indicadores generales de cumplimiento y riesgo psicosocial',
        label: 'Dashboard Ejecutivo'
      },
      'nom035-compliance': {
        title: 'REPORTE DE CUMPLIMIENTO NOM-035-STPS-2018',
        subtitle: 'Análisis de conformidad con la norma vigente',
        label: 'Cumplimiento Normativo'
      },
      'risk-analysis': {
        title: 'ANÁLISIS DE RIESGOS PSICOSOCIALES — NOM-035',
        subtitle: 'Identificación, análisis y prevención de factores de riesgo',
        label: 'Análisis de Riesgos'
      },
      'intervention-plan': {
        title: 'PLAN DE INTERVENCIÓN — NOM-035-STPS-2018',
        subtitle: 'Medidas correctivas y preventivas de riesgo psicosocial',
        label: 'Plan de Intervención'
      },
      'employee-report': {
        title: 'REPORTE INDIVIDUAL DE EMPLEADO — NOM-035',
        subtitle: 'Evaluación individual de factores de riesgo psicosocial',
        label: 'Reporte Individual'
      },
      'area-report': {
        title: 'REPORTE POR ÁREA / DEPARTAMENTO — NOM-035',
        subtitle: 'Análisis de riesgo psicosocial por área organizacional',
        label: 'Reporte por Área'
      },
    };

    const meta = REPORT_META[config.type];
    drawPageHeader(doc, meta.title, meta.subtitle);

    const pg = new Page(doc);
    // Inyectar doc en pg (necesario para métodos internos)
    (pg as any).doc = doc;

    // ── Información de empresa (siempre) ──
    sectionCompanyInfo(pg, stats, meta.label);

    // ── Contenido según tipo ──
    switch (config.type) {

      case 'executive-dashboard':
        sectionKPIs(pg, stats);
        pg.separator();
        sectionRiskDistribution(pg, stats);
        pg.separator();
        sectionAreaAnalysis(pg, stats, employees);
        pg.ensure(40);
        sectionHighRiskEmployees(pg, employees, evaluations);
        pg.ensure(50);
        sectionRecommendations(pg, stats);
        break;

      case 'nom035-compliance':
        sectionKPIs(pg, stats);
        pg.separator();
        sectionCompliance(pg, stats);
        pg.separator();
        sectionRiskDistribution(pg, stats);
        pg.ensure(50);
        sectionRecommendations(pg, stats);
        break;

      case 'risk-analysis':
        sectionKPIs(pg, stats);
        pg.separator();
        sectionRiskDistribution(pg, stats);
        pg.separator();
        sectionAreaAnalysis(pg, stats, employees);
        pg.ensure(40);
        sectionHighRiskEmployees(pg, employees, evaluations);
        break;

      case 'intervention-plan':
        sectionKPIs(pg, stats);
        pg.separator();
        sectionHighRiskEmployees(pg, employees, evaluations);
        pg.ensure(60);
        sectionRecommendations(pg, stats);
        break;

      case 'employee-report': {
        const emp = employees.find(e => e.id === config.employeeId) ?? employees[0];
        if (!emp) { pg.line('Empleado no encontrado.', 0, C.red); break; }
        const ev = evaluations.find(e => e.employeeId === emp.id);
        sectionEmployeeReport(pg, emp, ev);
        break;
      }

      case 'area-report': {
        const targetArea = config.area;
        const areaEmps = targetArea
          ? employees.filter(e => e.area === targetArea)
          : employees;
        const areaEvals = areaEmps.map(e => evaluations.find(ev => ev.employeeId === e.id)).filter(Boolean);
        
        pg.sectionHeader(`ÁREA: ${targetArea || 'TODAS LAS ÁREAS'}`, C.blue);
        pg.kv('Total trabajadores en área', String(areaEmps.length));
        pg.kv('Evaluados', String(areaEvals.length));
        pg.gap(3);
        sectionHighRiskEmployees(pg, areaEmps, areaEvals);
        pg.ensure(50);
        sectionRecommendations(pg, stats);
        break;
      }
    }

    // ── Pies de página ──
    addPageFooters(doc, stats.companyName);

    // ── Guardar ──
    const fileNames: Record<ReportType, string> = {
      'executive-dashboard': 'Dashboard-Ejecutivo',
      'nom035-compliance':   'Cumplimiento-NOM035',
      'risk-analysis':       'Analisis-Riesgos',
      'intervention-plan':   'Plan-Intervencion',
      'employee-report':     'Reporte-Empleado',
      'area-report':         'Reporte-Area',
    };
    const fileName = `${fileNames[config.type]}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

    return { success: true, fileName };
  } catch (err: any) {
    console.error('[reportGenerator]', err);
    return { success: false, error: err?.message || 'Error desconocido al generar el reporte' };
  }
}

// ─── Compatibilidad con código existente ─────────────────────────────────────
/** @deprecated Usa generateReport() directamente */
export async function generateProfessionalReport(data: any) {
  const typeMap: Record<string, ReportType> = {
    'nom035-compliance': 'nom035-compliance',
    'risk-analysis':     'risk-analysis',
    'intervention-plan': 'intervention-plan',
    'executive-dashboard': 'executive-dashboard',
    'executive-report':    'executive-dashboard',
  };
  const type = typeMap[data?.templateId] ?? 'executive-dashboard';
  return generateReport({ type });
}
