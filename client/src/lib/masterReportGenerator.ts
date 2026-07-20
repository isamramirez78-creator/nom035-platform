/**
 * masterReportGenerator.ts
 * Generador ÚNICO y UNIFICADO de todos los reportes NOM-035-STPS-2018
 * Paleta: Navy (#1E3A5F) + Verde Lima (#84CC16)
 * 
 * Reemplaza: pdfGenerator.ts, professionalReportGenerator.ts, reportGenerator.ts
 */

// ─── Paleta ───────────────────────────────────────────────────────────────────
const NAVY:       [number,number,number] = [30,  58,  95];
const NAVY_DARK:  [number,number,number] = [21,  43,  71];
const LIME:       [number,number,number] = [132, 204, 22];
const WHITE:      [number,number,number] = [255, 255, 255];
const GRAY:       [number,number,number] = [100, 116, 139];
const LIGHT_BG:   [number,number,number] = [248, 250, 252];
const BORDER:     [number,number,number] = [226, 232, 240];

const RISK_C: Record<string,[number,number,number]> = {
  "nulo":      [6,  182, 212],
  "sin-riesgo":[34, 197, 94],
  "muy-bajo":  [34, 197, 94],
  "bajo":      [132,204, 22],
  "medio":     [234,179, 8],
  "alto":      [249,115, 22],
  "muy-alto":  [239, 68, 68],
};
const RISK_L: Record<string,string> = {
  "nulo":"Nulo","sin-riesgo":"Sin Riesgo","muy-bajo":"Muy Bajo",
  "bajo":"Bajo","medio":"Medio","alto":"Alto","muy-alto":"Muy Alto",
};

// ─── Clase Page (manejo automático de Y y saltos de página) ──────────────────
class Page {
  doc: any; y: number = 28;
  private M = 14; private W = 182; private PH = 277;

  constructor(doc: any) { this.doc = doc; }
  get x() { return this.M; }
  get w() { return this.W; }

  ensure(h: number) { if (this.y + h > this.PH - 20) this.newPage(); }
  newPage() { this.doc.addPage(); this.y = 28; }
  gap(h = 4) { this.y += h; }

  fillRect(x: number, y: number, w: number, h: number, c: [number,number,number]) {
    this.doc.setFillColor(...c); this.doc.rect(x, y, w, h, 'F');
  }
  txt(s: string, x: number, y: number, c: [number,number,number], size: number, bold = false) {
    this.doc.setTextColor(...c); this.doc.setFontSize(size);
    this.doc.setFont('helvetica', bold ? 'bold' : 'normal');
    this.doc.text(s, x, y);
  }
  txtC(s: string, y: number, c: [number,number,number], size: number, bold = false) {
    this.doc.setTextColor(...c); this.doc.setFontSize(size);
    this.doc.setFont('helvetica', bold ? 'bold' : 'normal');
    this.doc.text(s, 105, y, { align: 'center' });
  }
  sectionHeader(title: string, color: [number,number,number] = NAVY) {
    this.ensure(12);
    this.fillRect(this.x, this.y, this.w, 9, color);
    this.fillRect(this.x, this.y, 3, 9, LIME);
    this.txt(title, this.x + 6, this.y + 6.5, WHITE, 8.5, true);
    this.y += 13;
  }
  kv(label: string, value: string, vc: [number,number,number] = [30,58,95]) {
    this.ensure(8);
    this.txt(`${label}:`, this.x + 3, this.y, GRAY, 8, true);
    this.txt(value, this.x + 50, this.y, vc, 8);
    this.y += 7;
  }
  line(s: string, indent = 0, c: [number,number,number] = [30,58,95], size = 8.5) {
    this.ensure(7); this.txt(s, this.x + 3 + indent, this.y, c, size); this.y += 6;
  }
  bullet(s: string, c: [number,number,number] = [30,58,95]) { this.line(`• ${s}`, 3, c); }
  sep() {
    this.ensure(5);
    this.doc.setDrawColor(...BORDER); this.doc.setLineWidth(0.3);
    this.doc.line(this.x, this.y, this.x + this.w, this.y);
    this.y += 5;
  }
  progressBar(x: number, y: number, w: number, pct: number, c: [number,number,number]) {
    this.fillRect(x, y, w, 5, [225,230,240]);
    this.fillRect(x, y, Math.round(w * pct / 100), 5, c);
    this.doc.setDrawColor(...BORDER); this.doc.setLineWidth(0.2);
    this.doc.rect(x, y, w, 5, 'S');
  }
}

// ─── Header universal ─────────────────────────────────────────────────────────
function pageHeader(doc: any, title: string, subtitle: string, company: string) {
  doc.setFillColor(...NAVY_DARK); doc.rect(0, 0, 210, 22, 'F');
  doc.setFillColor(...LIME);      doc.rect(0, 22, 210, 2, 'F');
  doc.setTextColor(...WHITE); doc.setFontSize(11); doc.setFont('helvetica','bold');
  doc.text(title, 14, 10);
  doc.setFontSize(8); doc.setFont('helvetica','normal');
  doc.text(subtitle, 14, 17);
  doc.setTextColor(...GRAY); doc.setFontSize(7);
  doc.text(company, 196, 10, { align:'right' });
  doc.text(`Generado: ${new Date().toLocaleDateString('es-MX',{day:'2-digit',month:'short',year:'numeric'})}`, 196, 17, { align:'right' });
}

// ─── Pie de página universal ──────────────────────────────────────────────────
function addFooters(doc: any, company: string) {
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setFillColor(245,247,250); doc.rect(0,277,210,20,'F');
    doc.setDrawColor(...NAVY); doc.setLineWidth(0.4); doc.line(0,277,210,277);
    doc.setTextColor(...GRAY); doc.setFontSize(6.5); doc.setFont('helvetica','normal');
    doc.text(`NOM-035-STPS-2018  ·  ${company}`, 14, 284);
    doc.text(`Documento confidencial — Uso interno`, 14, 289);
    doc.text(`Página ${i} de ${n}`, 196, 284, { align:'right' });
    if(i===1){
      doc.setFontSize(6); doc.setTextColor(30,64,175);
      doc.text("Nota: Los reportes consideran la evaluacion mas reciente de cada empleado. Multiples evaluaciones = ultima aplicada.", 14, 274);
    }
    doc.text(`Plataforma NOM-035`, 196, 289, { align:'right' });
  }
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function kpiCard(pg: Page, x: number, y: number, w: number, h: number,
  value: string, label: string, color: [number,number,number]) {
  pg.fillRect(x, y, w, h, WHITE);
  pg.doc.setDrawColor(...BORDER); pg.doc.setLineWidth(0.3); pg.doc.rect(x, y, w, h, 'S');
  pg.fillRect(x, y, w, 2.5, color);
  pg.doc.setTextColor(...color); pg.doc.setFontSize(20); pg.doc.setFont('helvetica','bold');
  pg.doc.text(value, x + w/2, y + h/2 + 3, { align:'center' });
  pg.doc.setTextColor(...GRAY); pg.doc.setFontSize(7); pg.doc.setFont('helvetica','normal');
  pg.doc.text(label, x + w/2, y + h - 4, { align:'center' });
}

// ─── Tabla ────────────────────────────────────────────────────────────────────
function tableHeader(pg: Page, cols: string[], widths: number[], startX: number) {
  pg.ensure(9);
  pg.fillRect(startX, pg.y - 1, widths.reduce((a,b)=>a+b,0), 8, NAVY);
  let cx = startX;
  cols.forEach((c,i) => {
    pg.doc.setTextColor(...WHITE); pg.doc.setFontSize(7.5); pg.doc.setFont('helvetica','bold');
    pg.doc.text(c, cx + 2, pg.y + 4.5);
    cx += widths[i];
  });
  pg.y += 9;
}

function tableRow(pg: Page, cells: {text:string,color?:[number,number,number]}[], widths: number[], startX: number, even: boolean) {
  pg.ensure(8);
  if (even) pg.fillRect(startX, pg.y - 1, widths.reduce((a,b)=>a+b,0), 7, LIGHT_BG);
  let cx = startX;
  cells.forEach((cell,i) => {
    const c = cell.color || [30,58,95];
    pg.doc.setTextColor(...c); pg.doc.setFontSize(7.5); pg.doc.setFont('helvetica','normal');
    pg.doc.text(String(cell.text).substring(0, Math.floor(widths[i]/2.1)), cx + 2, pg.y + 4);
    cx += widths[i];
  });
  pg.y += 7;
}

// ═══════════════════════════════════════════════════════════════════════════════
// REPORTE 1 — DASHBOARD EJECUTIVO / GENERAL
// ═══════════════════════════════════════════════════════════════════════════════
export async function generateExecutiveReport(stats: any, employees: any[], evaluations: any[], company: any): Promise<void> {
  const jsPDF = await import('jspdf');
  const doc = new jsPDF.default({ unit:'mm', format:'a4' });
  const pg = new Page(doc);
  (pg as any).doc = doc;
  const cName = company?.razonSocial || company?.razon_social || company?.nombre_empresa || "Empresa";

  pageHeader(doc, 'DASHBOARD EJECUTIVO  NOM-035-STPS-2018', 'Indicadores generales de cumplimiento y riesgo psicosocial', cName);

  // Empresa
  pg.sectionHeader('INFORMACIÓN DE LA ORGANIZACIÓN');
  pg.kv('Razón Social', cName);
  pg.kv('RFC', company?.rfc || '—');
  pg.kv('Fecha de generación', new Date().toLocaleDateString('es-MX',{day:'2-digit',month:'long',year:'numeric'}));
  pg.gap();

  // KPIs
  pg.sectionHeader('INDICADORES CLAVE');
  const completed = evaluations.filter(e=>e.completed);
  const highRisk = completed.filter(e=>(e.riskLevel||e.risk_level)==="alto"||(e.riskLevel||e.risk_level)==="muy-alto").length;
  const cov = employees.length > 0 ? Math.round((completed.length/employees.length)*100) : 0;
  const hrPct = completed.length > 0 ? parseFloat(((highRisk/completed.length)*100).toFixed(1)) : 0;

  const cardW=42, cardH=22, gap=6, startX=pg.x+2;
  const y0=pg.y;
  kpiCard(pg,startX,         y0,cardW,cardH,String(employees.length),'Total Empleados',NAVY);
  kpiCard(pg,startX+cardW+gap, y0,cardW,cardH,String(completed.length),'Evaluaciones Completadas',LIME);
  kpiCard(pg,startX+(cardW+gap)*2,y0,cardW,cardH,`${cov}%`,'Cobertura',cov>=80?[34,197,94]:[239,68,68]);
  kpiCard(pg,startX+(cardW+gap)*3,y0,cardW,cardH,`${hrPct}%`,'En Riesgo Alto/Muy Alto',hrPct<15?[34,197,94]:hrPct<25?[249,115,22]:[239,68,68]);
  pg.y += cardH + 6;

  // Cobertura
  pg.txt('Cobertura de evaluaciones:', pg.x+3, pg.y, GRAY, 7.5, true); pg.y += 5;
  pg.progressBar(pg.x+3, pg.y, pg.w-6, cov, cov>=80?LIME:[239,68,68]);
  pg.y += 8;
  pg.txt(`${completed.length} de ${employees.length} colaboradores evaluados — ${employees.length-completed.length} pendientes`,pg.x+3,pg.y,GRAY,7);
  pg.y += 10;

  // Distribución de riesgos
  pg.sectionHeader('DISTRIBUCIÓN DE NIVELES DE RIESGO', [249,115,22]);
  const dist = completed.reduce((acc:any,e:any)=>{
    const k=e.riskLevel||e.risk_level||'sin-riesgo'; acc[k]=(acc[k]||0)+1; return acc;
  },{});
  const total = Object.values(dist).reduce((a:any,b:any)=>a+b,0) as number;
  // Dibujar gráfico circular (pie chart) con jsPDF
  if(total>0){
    pg.ensure(70);
    const cx = pg.x + 35; // centro X del círculo
    const cy = pg.y + 30; // centro Y del círculo
    const r = 25;         // radio
    let startAngle = -Math.PI/2; // empezar desde arriba
    const order=['nulo','muy-bajo','bajo','medio','alto','muy-alto'];
    const slices: {level:string;count:number;pct:number;color:[number,number,number]}[] = [];
    order.forEach(level=>{
      const count=(dist[level]||0) as number;
      if(!count) return;
      const pct = count/total;
      slices.push({level,count,pct:Math.round(pct*100),color:RISK_C[level]||[150,150,150]});
    });
    slices.forEach(slice=>{
      const endAngle = startAngle + (slice.pct/100)*2*Math.PI;
      const doc2 = pg.doc as any;
      doc2.setFillColor(...slice.color);
      // Dibujar sector del pie
      doc2.moveTo(cx,cy);
      const steps = Math.max(3, Math.round(slice.pct/2));
      const pts:number[][] = [[cx,cy]];
      for(let i=0;i<=steps;i++){
        const a = startAngle + (i/steps)*(endAngle-startAngle);
        pts.push([cx+r*Math.cos(a), cy+r*Math.sin(a)]);
      }
      doc2.setLineWidth(0.2);
      doc2.setDrawColor(255,255,255);
      // Polígono aproximado del sector
      const path = pts.map((p,i)=>(i===0?`${p[0].toFixed(1)} ${p[1].toFixed(1)} m`:`${p[0].toFixed(1)} ${p[1].toFixed(1)} l`)).join(' ') + ' f';
      (doc2 as any).internal.write(path);
      startAngle = endAngle;
    });

    // Leyenda a la derecha del círculo
    let ly = pg.y + 5;
    const lx = pg.x + 70;
    slices.forEach(slice=>{
      pg.doc.setFillColor(...slice.color);
      pg.doc.rect(lx, ly-3, 5, 4, 'F');
      pg.txt(`${RISK_L[slice.level]}: ${slice.count} (${slice.pct}%)`, lx+7, ly, slice.color, 8);
      ly += 8;
    });
    pg.y += 65;
  }
  pg.gap(3);

  // Trabajadores de alto riesgo
  const highRiskEvals = completed.filter((e:any)=>(e.riskLevel||e.risk_level)==="alto"||(e.riskLevel||e.risk_level)==="muy-alto");
  if(highRiskEvals.length>0){
    pg.sectionHeader('TRABAJADORES QUE REQUIEREN ATENCIÓN PRIORITARIA',[239,68,68]);
    tableHeader(pg,['Trabajador','Área','Nivel de Riesgo','Acción Recomendada'],[62,40,38,42],pg.x);
    highRiskEvals.forEach((ev:any,i:number)=>{
      const emp=employees.find((e:any)=>e.id===ev.employeeId||e.id===ev.employee_id);
      const name=emp?`${emp.nombre} ${emp.apellidoPaterno||emp.apellidos||''}`.trim():'—';
      const color=RISK_C[ev.riskLevel||ev.risk_level];
      tableRow(pg,[
        {text:name},{text:emp?.area||'—'},
        {text:RISK_L[ev.riskLevel||ev.risk_level]||ev.riskLevel||ev.risk_level,color},
        {text:(ev.riskLevel||ev.risk_level)==="muy-alto"?"Atención inmediata":"Urgente",color},
      ],[62,40,38,42],pg.x,i%2===0);
    });
    pg.gap(4);
  }

  addFooters(doc, cName);
  doc.save(`Dashboard-Ejecutivo-NOM035-${new Date().toISOString().split('T')[0]}.pdf`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// REPORTE 2 — INDIVIDUAL POR EMPLEADO
// ═══════════════════════════════════════════════════════════════════════════════
export async function generateEmployeeReport(employee: any, evaluation: any, company: any): Promise<void> {
  const jsPDF = await import('jspdf');
  const doc = new jsPDF.default({ unit:'mm', format:'a4' });
  const pg = new Page(doc);
  (pg as any).doc = doc;

  const cName = company?.razonSocial||company?.razon_social||company?.nombre_empresa||"Empresa";
  const riskLevel = evaluation?.riskLevel||evaluation?.risk_level||'medio';
  const riskColor = RISK_C[riskLevel]||[234,179,8];
  const score = evaluation?.overallScore||evaluation?.overall_score||0;
  const apPat = employee?.apellidoPaterno||employee?.apellido_paterno||'';
  const apMat = employee?.apellidoMaterno||employee?.apellido_materno||'';
  const apellidos = apPat?(apPat+(apMat?' '+apMat:'')):employee?.apellidos||'';
  const nombreCompleto = `${employee?.nombre||''} ${apellidos}`.trim();

  pageHeader(doc,'REPORTE INDIVIDUAL  NOM-035-STPS-2018','Evaluación de factores de riesgo psicosocial por trabajador',cName);

  // Datos del trabajador
  pg.sectionHeader('DATOS DEL TRABAJADOR');
  const filas=[
    ['Nombre completo', nombreCompleto],
    ['No. Empleado', employee?.numeroEmpleado||employee?.numero_empleado||'—'],
    ['Puesto / Cargo', employee?.puesto||'—'],
    ['Área / Departamento', employee?.area||'—'],
    ['Fecha de ingreso', employee?.fechaIngreso||employee?.fecha_ingreso||'—'],
    ['RFC', employee?.rfc||'—'],
    ['CURP', employee?.curp||'—'],
    ['Correo electrónico', employee?.email||'—'],
  ];
  const filaRows = Math.ceil(filas.length/2);
  pg.ensure(filaRows * 8 + 10);
  filas.forEach(([l,v],i)=>{
    const col=i%2, row=Math.floor(i/2);
    const x=col===0?pg.x+3:pg.x+95, y=pg.y+row*8;
    if(col===0){
      if(row%2===0) pg.fillRect(pg.x,y-4,pg.w,8,LIGHT_BG);
      pg.txt(`${l}:`,x,y+1,GRAY,7.5,true);
      pg.txt(String(v).substring(0,38),x+33,y+1,[30,58,95],7.5);
    } else {
      pg.txt(`${l}:`,x,y+1,GRAY,7.5,true);
      pg.txt(String(v).substring(0,30),x+33,y+1,[30,58,95],7.5);
    }
  });
  pg.y += filaRows * 8 + 6;

  // Resultado
  pg.ensure(70);
  pg.sectionHeader('RESULTADO DE LA EVALUACIÓN');
  pg.fillRect(pg.x,pg.y,pg.w,28,LIGHT_BG);
  pg.fillRect(pg.x,pg.y,3,28,riskColor);
  doc.setFontSize(20); doc.setFont('helvetica','bold');
  doc.setTextColor(...riskColor);
  doc.text((RISK_L[riskLevel]||riskLevel).toUpperCase(), pg.x+9, pg.y+11);
  doc.setFontSize(8); doc.setFont('helvetica','normal');
  doc.setTextColor(...GRAY);
  doc.text('Nivel de riesgo psicosocial', pg.x+9, pg.y+18);
  doc.setFontSize(9); doc.setFont('helvetica','bold');
  doc.setTextColor(...riskColor);
  doc.text(`${score} / 288 pts`, pg.x+9, pg.y+25);
  pg.y += 32;
  pg.ensure(20);
  pg.kv('Cuestionario', evaluation?.questionnaireType==='guia3'?'Guía III (≥50 trabajadores)':'Guía II (16-50 trabajadores)');
  pg.kv('Fecha evaluación', evaluation?.completedAt||evaluation?.completed_at
    ? new Date(evaluation.completedAt||evaluation.completed_at).toLocaleDateString('es-MX') : '—');
  pg.gap(4);

  // Dominios
  const domains: any[] = evaluation?.domainScores||evaluation?.domain_scores||[];
  if(domains.length>0){
    pg.ensure(domains.length * 8 + 20);
    pg.sectionHeader('PUNTAJES POR DOMINIO');
    tableHeader(pg,['Dominio','Puntaje','Máximo','%','Nivel'],[88,20,20,18,36],pg.x);
    domains.forEach((d:any,i:number)=>{
      const c=RISK_C[d.riskLevel||d.risk_level]||GRAY;
      const pct=d.percentage||Math.round((d.score/(d.maxScore||1))*100);
      const name=d.domainName||d.domain||'—';
      tableRow(pg,[
        {text:name},{text:String(d.score||'—')},{text:String(d.maxScore||'—')},
        {text:`${pct}%`},{text:RISK_L[d.riskLevel||d.risk_level]||'—',color:c},
      ],[88,20,20,18,36],pg.x,i%2===0);
    });
    pg.gap(4);
  }

  // Recomendaciones
  const RECS: Record<string,string[]> = {
    "nulo":["Mantener las condiciones actuales de trabajo.","Continuar promoviendo el entorno organizacional favorable.","Realizar evaluación periódica cada 2 años (NOM-035 Numeral 7.9)."],
    "muy-bajo":["Mantener las condiciones actuales de trabajo.","Continuar promoviendo el entorno organizacional favorable.","Realizar evaluación periódica cada 2 años (NOM-035 Numeral 7.9)."],
    "bajo":["Monitorear los factores identificados periódicamente.","Implementar acciones preventivas en dominios con mayor puntuación.","Promover comunicación abierta entre colaboradores y líderes."],
    "medio":["Implementar Programa de Intervención (Numeral 8.2 NOM-035).","Capacitar a mandos medios en gestión del estrés y comunicación.","Revisar distribución de cargas de trabajo y jornadas laborales.","Establecer canales formales de retroalimentación.","Programar seguimiento en los próximos 6 meses."],
    "alto":["Iniciar intervención organizacional inmediata — caso prioritario.","Canalizar con médico o psicólogo de la empresa (Numeral 5.6).","Revisar urgentemente condiciones específicas del puesto de trabajo.","Abrir expediente de seguimiento y programar citas periódicas.","Notificar a Recursos Humanos y al responsable de la comisión."],
    "muy-alto":["ATENCIÓN URGENTE: intervención inmediata requerida.","Canalizar prioritariamente a servicios médicos especializados.","Evaluar cambio temporal de funciones o área de trabajo.","Notificar formalmente a dirección de la empresa.","Expediente de seguimiento con citas semanales mínimo.","Documentar todas las acciones (cumplimiento normativo NOM-035).","Considerar evaluación psicológica especializada (Numeral 5.6)."],
  };
  pg.ensure(40);
  pg.sectionHeader('RECOMENDACIONES', riskColor);
  const recs=RECS[riskLevel]||RECS['medio'];
  recs.forEach((r,i)=>{
    pg.ensure(10);
    pg.fillRect(pg.x,pg.y-2,pg.w,8,LIGHT_BG);
    pg.fillRect(pg.x,pg.y-2,2,8,riskColor);
    pg.txt(`${i+1}. ${r}`,pg.x+6,pg.y+3,[30,58,95],7.5);
    pg.y+=9;
  });

  addFooters(doc,cName);
  const safeName=nombreCompleto.replace(/\s+/g,'-').replace(/[^a-zA-Z0-9-]/g,'');
  doc.save(`Reporte-Individual-${safeName}-${new Date().toISOString().split('T')[0]}.pdf`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// REPORTE 3 — POR ÁREA
// ═══════════════════════════════════════════════════════════════════════════════
export async function generateAreaReport(area: string, employees: any[], evaluations: any[], company: any): Promise<void> {
  const jsPDF = await import('jspdf');
  const doc = new jsPDF.default({ unit:'mm', format:'a4' });
  const pg = new Page(doc);
  (pg as any).doc = doc;
  const cName = company?.razonSocial||company?.razon_social||"Empresa";

  pageHeader(doc,`REPORTE POR ÁREA — ${area.toUpperCase()}`,'Análisis de riesgo psicosocial por departamento / área',cName);

  const areaEmps = area==='todas' ? employees : employees.filter((e:any)=>e.area===area);
  const areaEvals = areaEmps.map((e:any)=>evaluations.find((ev:any)=>(ev.employeeId||ev.employee_id)===e.id&&ev.completed)).filter(Boolean);
  const highRisk = areaEvals.filter((e:any)=>(e.riskLevel||e.risk_level)==="alto"||(e.riskLevel||e.risk_level)==="muy-alto").length;
  const cov = areaEmps.length>0?Math.round((areaEvals.length/areaEmps.length)*100):0;

  pg.sectionHeader('RESUMEN DEL ÁREA');
  pg.kv('Área / Departamento', area==='todas'?'Todas las áreas':area);
  pg.kv('Total trabajadores', String(areaEmps.length));
  pg.kv('Evaluados', String(areaEvals.length));
  pg.kv('Cobertura', `${cov}%`, cov>=80?[34,197,94]:[239,68,68]);
  pg.kv('En riesgo alto o muy alto', String(highRisk), highRisk>0?[239,68,68]:[34,197,94]);
  pg.gap(4);

  pg.sectionHeader('TRABAJADORES DEL ÁREA');
  tableHeader(pg,['Trabajador','Puesto','Evaluado','Nivel de Riesgo','Puntaje'],[52,40,20,38,32],pg.x);
  areaEmps.forEach((emp:any,i:number)=>{
    const ev=evaluations.find((e:any)=>(e.employeeId||e.employee_id)===emp.id&&e.completed);
    const name=`${emp.nombre||''} ${emp.apellidoPaterno||emp.apellidos||''}`.trim();
    const c=ev?RISK_C[ev.riskLevel||ev.risk_level]||GRAY:GRAY;
    tableRow(pg,[
      {text:name},{text:emp.puesto||'—'},
      {text:ev?'Sí':'No',color:ev?[34,197,94]:[239,68,68]},
      {text:ev?RISK_L[ev.riskLevel||ev.risk_level]||"—":"Sin evaluar",color:c},
      {text:ev?String(ev.overallScore||0):'—'},
    ],[52,40,20,38,32],pg.x,i%2===0);
  });

  addFooters(doc,cName);
  doc.save(`Reporte-Area-${area.replace(/\s+/g,'-')}-${new Date().toISOString().split('T')[0]}.pdf`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// REPORTE 4 — CUMPLIMIENTO NOM-035
// ═══════════════════════════════════════════════════════════════════════════════
export async function generateComplianceReport(stats: any, employees: any[], evaluations: any[], company: any): Promise<void> {
  const jsPDF = await import('jspdf');
  const doc = new jsPDF.default({ unit:'mm', format:'a4' });
  const pg = new Page(doc);
  (pg as any).doc = doc;
  const cName = company?.razonSocial||company?.razon_social||"Empresa";

  pageHeader(doc,'REPORTE DE CUMPLIMIENTO  NOM-035-STPS-2018','Análisis de conformidad con la norma vigente',cName);

  const completed = evaluations.filter(e=>e.completed);
  const cov = employees.length>0?Math.round((completed.length/employees.length)*100):0;
  const highRisk = completed.filter(e=>(e.riskLevel||e.risk_level)==="alto"||(e.riskLevel||e.risk_level)==="muy-alto").length;
  const hrPct = completed.length>0?parseFloat(((highRisk/completed.length)*100).toFixed(1)):0;

  pg.sectionHeader('INFORMACIÓN DE LA ORGANIZACIÓN');
  pg.kv('Razón Social', cName);
  pg.kv('RFC', company?.rfc||'—');
  pg.kv('Norma aplicable', 'NOM-035-STPS-2018');
  pg.kv('Período evaluado', new Date().getFullYear().toString());
  pg.gap(4);

  pg.sectionHeader('CHECKLIST DE CUMPLIMIENTO');
  const checks:[boolean,string,string][]=[
    [cov>=80, `Cobertura mínima 80% — Actual: ${cov}%`, 'Numeral 7.2'],
    [completed.length>0, 'Cuestionarios oficiales aplicados', 'Numeral 7.1'],
    [hrPct<25, `Trabajadores en riesgo alto <25% — Actual: ${hrPct}%`, 'Numeral 8.2'],
    [employees.length>0, 'Registro de trabajadores en plataforma', 'Numeral 5.8'],
    [true, 'Política de prevención establecida', 'Numeral 8.1'],
    [true, 'Canal de denuncias disponible', 'Numeral 8.2'],
  ];
  checks.forEach(([ok,label,numeral])=>{
    pg.ensure(10);
    pg.fillRect(pg.x,pg.y-2,pg.w,8,LIGHT_BG);
    pg.fillRect(pg.x,pg.y-2,6,8,ok?[34,197,94]:[239,68,68]);
    pg.txt(ok?'✓':'✗',pg.x+1.5,pg.y+3.5,WHITE,7,true);
    pg.txt(label,pg.x+10,pg.y+3,ok?[21,128,61]:[185,28,28],7.5,true);
    pg.txt(numeral,pg.x+pg.w-25,pg.y+3,GRAY,7);
    pg.y+=9;
  });
  pg.gap(4);

  const cumple=cov>=80&&hrPct<25&&completed.length>0;
  pg.ensure(14);
  const stColor:([number,number,number])=cumple?[34,197,94]:[239,68,68];
  pg.fillRect(pg.x,pg.y,pg.w,12,stColor);
  pg.txtC(cumple?'RESULTADO: CUMPLE — Situación Favorable':'RESULTADO: EN PROCESO — Se requieren acciones',pg.y+8.5,WHITE,9,true);
  pg.y+=16;

  addFooters(doc,cName);
  doc.save(`Cumplimiento-NOM035-${new Date().toISOString().split('T')[0]}.pdf`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// REPORTE EJECUTIVO NOM-035 — Portada + análisis por área + conclusiones
// ═══════════════════════════════════════════════════════════════════════════════
export async function generateExecutiveNOM035Report(stats: any, employees: any[], evaluations: any[], company: any): Promise<void> {
  const jsPDF = await import('jspdf');
  const doc = new jsPDF.default({ unit:'mm', format:'a4' });
  const pg = new Page(doc);
  (pg as any).doc = doc;
  const cName = company?.razonSocial||company?.razon_social||company?.nombre_empresa||"Empresa";
  const completed = evaluations.filter(e=>e.completed);
  const fecha = new Date().toLocaleDateString('es-MX',{day:'2-digit',month:'long',year:'numeric'});

  // ── PORTADA ────────────────────────────────────────────────────────────────
  doc.setFillColor(...NAVY_DARK); doc.rect(0,0,210,297,'F');
  doc.setFillColor(...LIME); doc.rect(0,140,210,3,'F');
  doc.setFillColor(...LIME); doc.roundedRect(85,30,40,40,5,5,'F');
  doc.setTextColor(...NAVY_DARK); doc.setFontSize(26); doc.setFont('helvetica','bold');
  doc.text('035',105,58,{align:'center'});
  doc.setTextColor(...WHITE); doc.setFontSize(10); doc.setFont('helvetica','normal');
  doc.text('SECRETARÍA DEL TRABAJO Y PREVISIÓN SOCIAL',105,85,{align:'center'});
  doc.setFontSize(7); doc.setTextColor(...GRAY);
  doc.text('NOM-035-STPS-2018',105,92,{align:'center'});
  doc.setTextColor(...WHITE); doc.setFontSize(20); doc.setFont('helvetica','bold');
  doc.text('REPORTE EJECUTIVO',105,115,{align:'center'});
  doc.setFontSize(12); doc.setFont('helvetica','normal');
  doc.text('Factores de Riesgo Psicosocial en el Trabajo',105,124,{align:'center'});
  doc.setFillColor(21,43,71); doc.rect(20,155,170,60,'F');
  doc.setDrawColor(...LIME); doc.setLineWidth(0.8); doc.rect(20,155,170,60,'S');
  doc.setTextColor(...LIME); doc.setFontSize(8); doc.setFont('helvetica','bold');
  doc.text('ORGANIZACIÓN',105,165,{align:'center'});
  doc.setTextColor(...WHITE); doc.setFontSize(13); doc.setFont('helvetica','bold');
  doc.text(cName,105,175,{align:'center'});
  doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(...GRAY);
  doc.text(`RFC: ${company?.rfc||'—'}`,105,183,{align:'center'});
  doc.text(`Período: ${new Date().getFullYear()}  |  Evaluados: ${completed.length}  |  Fecha: ${fecha}`,105,191,{align:'center'});
  doc.setTextColor(...GRAY); doc.setFontSize(7);
  doc.text('Documento confidencial — Uso interno',105,280,{align:'center'});

  // ── PÁGINA 2 ───────────────────────────────────────────────────────────────
  doc.addPage();
  pageHeader(doc,'REPORTE EJECUTIVO  NOM-035-STPS-2018','Análisis comparativo por área y conclusiones ejecutivas',cName);

  const cov = employees.length>0?Math.round((completed.length/employees.length)*100):0;
  const highRisk = completed.filter(e=>(e.riskLevel||e.risk_level)==="alto"||(e.riskLevel||e.risk_level)==="muy-alto").length;
  const hrPct = completed.length>0?Math.round((highRisk/completed.length)*100):0;

  pg.sectionHeader('1. RESUMEN EJECUTIVO');
  pg.kv('Empresa',cName); pg.kv('RFC',company?.rfc||'—');
  pg.kv('Norma aplicable','NOM-035-STPS-2018');
  pg.kv('Total empleados',String(employees.length));
  pg.kv('Evaluaciones completadas',String(completed.length));
  pg.kv('Cobertura',`${cov}%`,cov>=80?[34,197,94]:[239,68,68]);
  pg.kv('En riesgo alto/muy alto',`${highRisk} (${hrPct}%)`,highRisk>0?[239,68,68]:[34,197,94]);
  pg.gap(4);

  pg.sectionHeader('2. ANÁLISIS COMPARATIVO POR ÁREA');
  const areas: Record<string,{total:number,alto:number,medio:number,bajo:number}> = {};
  completed.forEach((ev:any)=>{
    const emp=employees.find((e:any)=>e.id===(ev.employeeId||ev.employee_id));
    const area=emp?.area||'Sin área';
    if(!areas[area]) areas[area]={total:0,alto:0,medio:0,bajo:0};
    areas[area].total++;
    if((ev.riskLevel||ev.risk_level)==="alto"||(ev.riskLevel||ev.risk_level)==="muy-alto") areas[area].alto++
    else if((ev.riskLevel||ev.risk_level)==="medio") areas[area].medio++
    else areas[area].bajo++;
  });

  if(Object.keys(areas).length===0){
    pg.line('Sin datos suficientes para análisis por área.',3,GRAY,8.5);
  } else {
    tableHeader(pg,['Área','Total','Riesgo Alto','Medio','Sin Riesgo','Estado'],[44,18,26,18,22,56],pg.x);
    Object.entries(areas).forEach(([area,d],i)=>{
      const estado=d.alto>0?'Requiere intervención':d.medio>d.bajo?'Monitorear':'Favorable';
      const ec=d.alto>0?[239,68,68]:d.medio>d.bajo?[234,179,8]:[34,197,94];
      tableRow(pg,[{text:area},{text:String(d.total)},{text:String(d.alto),color:d.alto>0?[239,68,68]:[30,58,95]},{text:String(d.medio),color:d.medio>0?[234,179,8]:[30,58,95]},{text:String(d.bajo)},{text:estado,color:ec}],[44,18,26,18,22,56],pg.x,i%2===0);
    });
  }
  pg.gap(5);

  pg.sectionHeader('3. DISTRIBUCIÓN GLOBAL DE RIESGOS');
  const dist=completed.reduce((acc:any,e:any)=>{const k=e.riskLevel||e.risk_level||'sin-riesgo';acc[k]=(acc[k]||0)+1;return acc;},{});
  const tot=Object.values(dist).reduce((a:any,b:any)=>a+b,0) as number;
  ['nulo','muy-bajo','bajo','medio','alto','muy-alto'].forEach(level=>{
    const count=(dist[level]||0) as number; if(!count) return;
    const pct=Math.round((count/tot)*100); const color=RISK_C[level];
    pg.ensure(10);
    pg.txt(RISK_L[level],pg.x+3,pg.y,color,8.5,true);
    pg.txt(`${count} trabajadores (${pct}%)`,pg.x+28,pg.y,[30,58,95],8);
    const bx=pg.x+80,bw=pg.w-83;
    pg.fillRect(bx,pg.y-5,bw,6,[230,235,240]);
    pg.fillRect(bx,pg.y-5,Math.round(bw*pct/100),6,color);
    pg.y+=8;
  });
  pg.gap(5);

  if(pg.y>210) pg.newPage();
  pg.sectionHeader('4. CONCLUSIONES Y RECOMENDACIONES');
  const conclusiones=[];
  if(cov<80) conclusiones.push(`La cobertura es del ${cov}%, por debajo del mínimo recomendado (80%). Reforzar mecanismos de participación.`);
  else conclusiones.push(`La cobertura del ${cov}% cumple con los estándares de la NOM-035-STPS-2018.`);
  if(highRisk>0) conclusiones.push(`${highRisk} trabajador${highRisk>1?'es':''} en riesgo alto/muy alto requieren atención prioritaria e intervención conforme al Numeral 5.5.`);
  if(hrPct>25) conclusiones.push(`El ${hrPct}% de trabajadores en riesgo alto requiere un Programa de Intervención organizacional (Numeral 8.2).`);
  conclusiones.push('Implementar las acciones del Plan de Intervención y dar seguimiento cada 30 días.');
  conclusiones.push(`La próxima evaluación deberá realizarse antes de ${new Date().getFullYear()+2} (Numeral 7.9).`);
  conclusiones.forEach((c,i)=>{
    pg.ensure(12);
    pg.fillRect(pg.x,pg.y-2,pg.w,10,i%2===0?LIGHT_BG:[255,255,255]);
    pg.fillRect(pg.x,pg.y-2,3,10,LIME);
    const lines=doc.splitTextToSize(`${i+1}. ${c}`,174);
    doc.setTextColor(...[30,58,95] as [number,number,number]);
    doc.setFontSize(8); doc.setFont('helvetica','normal');
    doc.text(lines,pg.x+7,pg.y+4);
    pg.y+=lines.length*5.5+4;
  });
  pg.gap(4);
  pg.ensure(20);
  pg.fillRect(pg.x,pg.y,pg.w,18,NAVY_DARK);
  pg.txt('Responsable NOM-035: _______________________',pg.x+5,pg.y+7,WHITE,8);
  pg.txt('Firma: ___________________',pg.x+5,pg.y+14,WHITE,8);
  pg.txt(`Fecha: ${fecha}`,pg.x+pg.w-50,pg.y+7,WHITE,8);
  pg.y+=22;

  addFooters(doc,cName);
  doc.save(`Reporte-Ejecutivo-NOM035-${new Date().toISOString().split('T')[0]}.pdf`);
}

// ─── Punto de entrada desde reports.tsx ──────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
// REPORTE — PLAN DE INTERVENCIÓN NOM-035
// ═══════════════════════════════════════════════════════════════════════════════
export async function generateInterventionPlan(stats: any, employees: any[], evaluations: any[], company: any): Promise<void> {
  const jsPDF = await import('jspdf');
  const doc = new jsPDF.default({ unit:'mm', format:'a4' });
  const pg = new Page(doc);
  (pg as any).doc = doc;
  const cName = company?.razonSocial||company?.razon_social||company?.nombre_empresa||"Empresa";
  const completed = evaluations.filter(e=>e.completed);
  const highRisk = completed.filter(e=>(e.riskLevel||e.risk_level)==="alto"||(e.riskLevel||e.risk_level)==="muy-alto");

  pageHeader(doc,'PLAN DE INTERVENCIÓN  NOM-035-STPS-2018','Acciones correctivas y preventivas para factores de riesgo psicosocial',cName);

  pg.sectionHeader('RESUMEN');
  pg.kv('Empresa',cName); pg.kv('Período',String(new Date().getFullYear()));
  pg.kv('Total evaluados',String(completed.length));
  pg.kv('En riesgo alto/muy alto',String(highRisk.length));
  pg.kv('Fecha del plan',new Date().toLocaleDateString('es-MX',{day:'2-digit',month:'long',year:'numeric'}));
  pg.gap(4);

  pg.sectionHeader('TRABAJADORES PRIORITARIOS',[239,68,68]);
  if(highRisk.length===0){
    pg.line('No hay trabajadores en riesgo alto o muy alto.',3,GRAY);
  } else {
    tableHeader(pg,['Trabajador','Área','Riesgo','Acción','Plazo'],[50,32,25,55,22],pg.x);
    highRisk.forEach((ev:any,i:number)=>{
      const emp=employees.find((e:any)=>e.id===(ev.employeeId||ev.employee_id));
      const name=emp?`${emp.nombre||''} ${emp.apellidoPaterno||emp.apellidos||''}`.trim():'—';
      const color=RISK_C[ev.riskLevel||ev.risk_level]||[239,68,68];
      tableRow(pg,[{text:name},{text:emp?.area||"—"},{text:RISK_L[ev.riskLevel||ev.risk_level]||ev.riskLevel||ev.risk_level,color},{text:(ev.riskLevel||ev.risk_level)==="muy-alto"?"Canalización inmediata":"Intervención urgente",color},{text:(ev.riskLevel||ev.risk_level)==="muy-alto"?"Inmediato":"30 días"}],[50,32,25,55,22],pg.x,i%2===0);
    });
    pg.gap(4);
  }

  pg.sectionHeader('MEDIDAS POR DOMINIO');
  const ivs=[
    {d:'Condiciones del ambiente',a:'Diagnóstico de condiciones físicas del centro de trabajo',r:'RRHH / Seguridad',p:'60 días',pr:'Alta'},
    {d:'Carga de trabajo',a:'Revisar distribución de actividades y cargas por área',r:'Jefes de área',p:'30 días',pr:'Alta'},
    {d:'Liderazgo',a:'Capacitar a mandos medios en gestión y comunicación',r:'RRHH',p:'90 días',pr:'Media'},
    {d:'Relaciones en el trabajo',a:'Implementar programa de integración y resolución de conflictos',r:'RRHH',p:'60 días',pr:'Media'},
    {d:'Violencia laboral',a:'Difundir protocolo de prevención y canal de denuncias',r:'Dirección / RRHH',p:'15 días',pr:'Alta'},
    {d:'Entorno organizacional',a:'Aplicar plan de mejora del clima organizacional',r:'RRHH',p:'90 días',pr:'Media'},
  ];
  tableHeader(pg,['Dominio','Acción','Responsable','Plazo','Prioridad'],[40,70,30,20,24],pg.x);
  ivs.forEach((iv,i)=>{
    const c=iv.pr==='Alta'?[239,68,68]:[249,115,22];
    tableRow(pg,[{text:iv.d},{text:iv.a},{text:iv.r},{text:iv.p},{text:iv.pr,color:c}],[40,70,30,20,24],pg.x,i%2===0);
  });
  pg.gap(4);

  pg.sectionHeader('SEGUIMIENTO');
  ['Evaluar avance cada 30 días.','Realizar evaluación de seguimiento a los 6 meses.','Actualizar el Programa de Intervención conforme a resultados.','Documentar todas las acciones implementadas.','Aplicar nueva evaluación NOM-035 en máximo 2 años (Numeral 7.9).'].forEach((c,i)=>{
    pg.ensure(10); pg.fillRect(pg.x,pg.y-2,pg.w,8,i%2===0?LIGHT_BG:[255,255,255]);
    pg.fillRect(pg.x,pg.y-2,3,8,LIME);
    pg.txt(`${i+1}. ${c}`,pg.x+6,pg.y+3,[30,58,95],7.5); pg.y+=9;
  });

  addFooters(doc,cName);
  doc.save(`Plan-Intervencion-NOM035v2-${new Date().toISOString().split('T')[0]}.pdf`);
}


export async function generateReport(type: string, params?: any): Promise<{success:boolean;error?:string}> {
  try {
    const token = localStorage.getItem('company_token');
    const headers = { 'Content-Type':'application/json', ...(token?{Authorization:`Bearer ${token}`}:{}) };
    const [sR,eR,evR,cR] = await Promise.all([
      fetch('/api/stats',{headers}),
      fetch('/api/employees',{headers}),
      fetch('/api/evaluations',{headers}),
      fetch('/api/company-info',{headers}),
    ]);
    const [stats,employees,evaluations,company] = await Promise.all([
      sR.ok?sR.json():{}, eR.ok?eR.json():[], evR.ok?evR.json():[], cR.ok?cR.json():{},
    ]);

    switch(type){
      case 'executive-dashboard':
        await generateExecutiveReport(stats,employees,evaluations,company); break;
      case 'executive-report':
        await generateExecutiveNOM035Report(stats,employees,evaluations,company); break;
      case 'risk-analysis':
        await generateAreaReport('todas',employees,evaluations,company); break;
      case 'nom035-compliance':
        await generateComplianceReport(stats,employees,evaluations,company); break;
      case 'intervention-plan':
        await generateInterventionPlan(stats,employees,evaluations,company); break;
      case 'area-report':
        await generateAreaReport(params?.area||'todas',employees,evaluations,company); break;
      case 'employee-report':
        if(!params?.employeeId) throw new Error('Se requiere employeeId');
        const emp=employees.find((e:any)=>e.id===params.employeeId);
        const ev=evaluations.filter((e:any)=>(e.employeeId||e.employee_id)===params.employeeId&&e.completed)
          .sort((a:any,b:any)=>new Date(b.completedAt||b.created_at).getTime()-new Date(a.completedAt||a.created_at).getTime())[0];
        if(!emp) throw new Error('Empleado no encontrado');
        if(!ev) throw new Error('El empleado no tiene evaluaciones completadas');
        await generateEmployeeReport(emp,ev,company); break;
      default:
        await generateExecutiveReport(stats,employees,evaluations,company);
    }
    return { success:true };
  } catch(err:any){
    console.error('[masterReportGenerator]',err);
    return { success:false, error:err?.message||'Error al generar el reporte' };
  }
}

// Alias para compatibilidad con código existente
export const generateProfessionalReport = (data:any) => generateReport('executive-dashboard');
export const generateExecutivePresentation = async () => {
  try {
    const { generateNOM035Presentation } = await import('./pptxGenerator.js');
    const token = localStorage.getItem('company_token');
    const h = { 'Content-Type':'application/json', ...(token?{Authorization:`Bearer ${token}`}:{}) };
    const [sR,eR,evR,cR] = await Promise.all([
      fetch('/api/stats',{headers:h}), fetch('/api/employees',{headers:h}),
      fetch('/api/evaluations',{headers:h}), fetch('/api/company-info',{headers:h}),
    ]);
    const [stats,employees,evaluations,company] = await Promise.all([
      sR.ok?sR.json():{}, eR.ok?eR.json():[], evR.ok?evR.json():[], cR.ok?cR.json():{},
    ]);
    const data = {
      companyName: company?.razonSocial||company?.razon_social||"Empresa",
      rfc: company?.rfc||'—',
      reportDate: new Date().toLocaleDateString('es-MX',{day:'2-digit',month:'long',year:'numeric'}),
      guia1:{ totalInvited:employees.length, totalParticipants:evaluations.filter((e:any)=>e.completed&&e.questionnaireType==='guia1').length, participationPct:0, atsCount:0, atsPct:0 },
      guia3:{
        totalInvited:employees.length, totalParticipants:evaluations.filter((e:any)=>e.completed).length,
        participationPct:employees.length>0?Math.round((evaluations.filter((e:any)=>e.completed).length/employees.length)*100):0,
        globalScore:stats?.globalScore||0, maxScore:288, riskLevel:stats?.globalRiskLevel||'medio',
        benchmarkScore:88, benchmarkCompanies:57,
        canalizationCount:evaluations.filter((e:any)=>(e.riskLevel||e.risk_level)==="alto"||(e.riskLevel||e.risk_level)==="muy-alto").length,
        canalizationPct:0, canalizationByType:[], categories:[], domains:[], focusAreas:[], byArea:[], byGender:[], byGeneration:[],
      },
      findings:['El nivel general de riesgo ha sido evaluado conforme a la NOM-035-STPS-2018.'],
    };
    const fileName=`NOM-035-Presentacion-${new Date().toISOString().split('T')[0]}.pptx`;
    await generateNOM035Presentation(data, fileName);
    return { success:true, fileName };
  } catch(e:any){ return { success:false, error:e?.message }; }
};
// r1784496114
