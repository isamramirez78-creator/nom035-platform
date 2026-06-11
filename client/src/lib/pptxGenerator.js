/**
 * Generador de Presentación Ejecutiva NOM-035-STPS-2018
 * Estilo basado en el reporte profesional de referencia:
 * - Portada oscura (navy), contenido en blanco/gris claro
 * - Donut charts para categorías
 * - Tablas por área, dominio, generación, género
 * - Hallazgos narrativos con texto enriquecido
 */

const PptxGenJS = require("pptxgenjs");

// ─── Paleta de colores ────────────────────────────────────────────────────────
const C = {
  navy:    "1E3A5F",
  navyDark:"152B47",
  blue:    "2563EB",
  green:   "22C55E",
  yellow:  "EAB308",
  orange:  "F97316",
  red:     "EF4444",
  gray:    "64748B",
  lightBg: "F8FAFC",
  white:   "FFFFFF",
  black:   "0F172A",
  limeGreen:"84CC16",
};

// Colores por nivel de riesgo (hex sin #)
const RISK_COLORS = {
  "nulo":     "06B6D4",
  "muy-bajo": "22C55E",
  "bajo":     "84CC16",
  "medio":    "EAB308",
  "alto":     "F97316",
  "muy-alto": "EF4444",
};

const RISK_LABELS = {
  "nulo":     "Nulo",
  "muy-bajo": "Muy Bajo",
  "bajo":     "Bajo",
  "medio":    "Medio",
  "alto":     "Alto",
  "muy-alto": "Muy Alto",
};

// ─── Datos de ejemplo (en producción se reciben por parámetro) ────────────────
function getMockData() {
  return {
    companyName: "Corporativo AP S.A. de C.V.",
    rfc: "CAP000101AAA",
    reportDate: new Date().toLocaleDateString("es-MX", { day:"2-digit", month:"long", year:"numeric" }),
    guia1: {
      totalInvited: 84,
      totalParticipants: 77,
      participationPct: 92,
      atsCount: 15,
      atsPct: 19,
    },
    guia3: {
      totalInvited: 84,
      totalParticipants: 80,
      participationPct: 95,
      globalScore: 79,
      maxScore: 288,
      riskLevel: "medio",
      benchmarkScore: 88,
      benchmarkCompanies: 57,
      canalizationCount: 6,
      canalizationPct: 8,
      canalizationByType: [
        { type: "Violencia laboral", count: 5 },
        { type: "Factores de Riesgo Psicosocial", count: 1 },
      ],
      categories: [
        { name: "Factores propios de la actividad", score: 38, maxScore: 100, riskLevel: "medio" },
        { name: "Organización del tiempo de trabajo", score: 9, maxScore: 24, riskLevel: "medio" },
        { name: "Liderazgo y relaciones en el trabajo", score: 17, maxScore: 104, riskLevel: "bajo" },
        { name: "Entorno organizacional", score: 11, maxScore: 40, riskLevel: "bajo" },
        { name: "Ambiente de trabajo", score: 5, maxScore: 20, riskLevel: "bajo" },
      ],
      domains: [
        { name: "Carga de trabajo", score: 24, maxScore: 60, riskLevel: "medio" },
        { name: "Jornada de trabajo", score: 3, maxScore: 8, riskLevel: "medio" },
        { name: "Falta de control sobre el trabajo", score: 15, maxScore: 40, riskLevel: "medio" },
        { name: "Interferencia trabajo-familia", score: 5, maxScore: 16, riskLevel: "bajo" },
        { name: "Liderazgo", score: 6, maxScore: 36, riskLevel: "nulo" },
        { name: "Relaciones en el trabajo", score: 6, maxScore: 36, riskLevel: "nulo" },
        { name: "Violencia laboral", score: 6, maxScore: 32, riskLevel: "nulo" },
        { name: "Reconocimiento del desempeño", score: 7, maxScore: 24, riskLevel: "bajo" },
        { name: "Sentido de pertenencia", score: 4, maxScore: 16, riskLevel: "bajo" },
        { name: "Cond. ambiente de trabajo", score: 5, maxScore: 20, riskLevel: "bajo" },
      ],
      focusAreas: ["Carga de trabajo", "Jornada de trabajo"],
      byArea: [
        { name: "Inteligencia Artificial", n: 1, global: 113, riskLevel: "alto" },
        { name: "Jurídico", n: 6, global: 110, riskLevel: "alto" },
        { name: "Imagen", n: 1, global: 99, riskLevel: "alto" },
        { name: "Dirección", n: 2, global: 98, riskLevel: "alto" },
        { name: "Auditoría", n: 5, global: 96, riskLevel: "alto" },
        { name: "Sistemas", n: 4, global: 91, riskLevel: "medio" },
        { name: "Finanzas", n: 25, global: 76, riskLevel: "medio" },
        { name: "Operaciones", n: 8, global: 59, riskLevel: "bajo" },
        { name: "Administración", n: 2, global: 48, riskLevel: "nulo" },
      ],
      byGender: [
        { name: "Masculino", n: 40, global: 82 },
        { name: "Femenino", n: 40, global: 76 },
      ],
      byGeneration: [
        { name: "Generación Y (Millennials)", n: 28, global: 83 },
        { name: "Baby Boomers", n: 2, global: 81 },
        { name: "Generación X", n: 18, global: 77 },
        { name: "Generación Z", n: 32, global: 77 },
      ],
    },
    findings: [
      "El nivel general de riesgo se ubica en **Nivel Medio** con **79 puntos**, que es **-9 puntos** por debajo del promedio de empresas comparables (88 pts). Si bien el resultado es favorable respecto al benchmark, es importante implementar acciones de control para reducir los niveles de riesgo.",
      "Los dominios con mayor nivel de riesgo son **Carga de Trabajo** y **Jornada de Trabajo**, ambos en nivel Medio. Estos factores deben ser prioritarios en el programa de intervención, asegurando una distribución equilibrada de tareas y jornadas regulares.",
      "Los dominios de **Relaciones en el Trabajo**, **Liderazgo** y **Violencia Laboral** presentan los puntajes más bajos con nivel Nulo. Estas son fortalezas organizacionales importantes que deben mantenerse y reforzarse.",
    ],
  };
}

// ─── Helpers de diseño ────────────────────────────────────────────────────────

/** Slide header estándar: logo area + title + subtitle */
function addSlideHeader(slide, pres, title, subtitle = "") {
  // Fondo claro
  slide.background = { color: "F8FAFC" };

  // Bloque navy superior izquierdo (decorativo, pequeño)
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.18, h: 5.625,
    fill: { color: C.navy }, line: { color: C.navy }
  });

  // Título
  slide.addText(title, {
    x: 0.35, y: 0.15, w: 8, h: 0.55,
    fontSize: 26, bold: true, color: C.navy, fontFace: "Calibri",
    margin: 0,
  });

  // Subtítulo (en verde lima como en el original)
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.35, y: 0.68, w: 7, h: 0.35,
      fontSize: 14, bold: true, color: C.limeGreen, fontFace: "Calibri",
      margin: 0,
    });
  }

  // Línea divisoria
  slide.addShape(pres.shapes.LINE, {
    x: 0.35, y: 1.05, w: 9.45, h: 0,
    line: { color: "E2E8F0", width: 1 }
  });
}

/** Tarjeta de métrica grande */
function addMetricCard(slide, pres, x, y, w, h, value, label, color) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h,
    fill: { color: "FFFFFF" },
    rectRadius: 0.08,
    shadow: { type: "outer", color: "000000", blur: 8, offset: 2, angle: 45, opacity: 0.08 }
  });
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w: w, h: 0.05,
    fill: { color }, line: { color }, rectRadius: 0.08,
  });
  slide.addText(value, {
    x, y: y + 0.15, w, h: h * 0.55,
    fontSize: 28, bold: true, color, align: "center", valign: "middle",
    fontFace: "Calibri", margin: 0,
  });
  slide.addText(label, {
    x: x + 0.05, y: y + h * 0.65, w: w - 0.1, h: h * 0.32,
    fontSize: 9, color: C.gray, align: "center", valign: "top",
    fontFace: "Calibri", margin: 0, wrap: true,
  });
}

/** Donut chart nativo para una categoría */
function addCategoryDonut(slide, pres, x, y, w, h, score, maxScore, name, riskLevel) {
  const pct = Math.round((score / maxScore) * 100);
  const color = RISK_COLORS[riskLevel] || C.gray;

  slide.addChart(pres.charts.DOUGHNUT, [{
    name: "Score",
    labels: ["Obtenido", "Restante"],
    values: [score, maxScore - score],
  }], {
    x, y, w, h,
    chartColors: [color, "E2E8F0"],
    holeSize: 60,
    showLegend: false,
    showLabel: false,
    showValue: false,
    showPercent: false,
    chartArea: { fill: { color: "F8FAFC" }, border: { color: "F8FAFC" } },
    dataLabelFontSize: 8,
    dataLabelColor: C.white,
  });

  // Texto central del donut
  slide.addText([
    { text: String(score), options: { bold: true, fontSize: 16, color: C.navy, breakLine: true } },
    { text: String(maxScore), options: { fontSize: 10, color: C.gray } },
  ], {
    x: x + 0.05, y: y + h * 0.3, w: w - 0.1, h: h * 0.4,
    align: "center", valign: "middle", fontFace: "Calibri", margin: 0,
  });

  // Nombre de categoría
  slide.addText(name, {
    x: x - 0.1, y: y + h + 0.05, w: w + 0.2, h: 0.55,
    fontSize: 9, bold: true, color: C.navy, align: "center",
    fontFace: "Calibri", margin: 0, wrap: true,
  });
}

/** Barra de riesgo horizontal */
function addRiskBar(slide, pres, x, y, w, h, score, maxScore, name, riskLevel) {
  const pct = Math.max(0.03, score / maxScore);
  const color = RISK_COLORS[riskLevel] || C.gray;
  const label = RISK_LABELS[riskLevel] || riskLevel;

  // Nombre
  slide.addText(name, {
    x, y, w: 3.2, h,
    fontSize: 9, color: C.navy, bold: false, fontFace: "Calibri",
    valign: "middle", margin: 0,
  });

  // Barra fondo
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: x + 3.3, y: y + h * 0.2, w: w - 3.3 - 1.1, h: h * 0.6,
    fill: { color: "E2E8F0" }, line: { color: "E2E8F0" }, rectRadius: 0.04,
  });
  // Barra relleno
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: x + 3.3, y: y + h * 0.2, w: Math.max(0.05, (w - 3.3 - 1.1) * pct), h: h * 0.6,
    fill: { color }, line: { color }, rectRadius: 0.04,
  });

  // Score y etiqueta
  slide.addText(`${score}/${maxScore}`, {
    x: x + w - 1.05, y, w: 0.6, h,
    fontSize: 8, bold: true, color, align: "right",
    fontFace: "Calibri", valign: "middle", margin: 0,
  });
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: x + w - 0.42, y: y + h * 0.15, w: 0.4, h: h * 0.7,
    fill: { color }, line: { color }, rectRadius: 0.05,
  });
  slide.addText(label, {
    x: x + w - 0.42, y: y + h * 0.15, w: 0.4, h: h * 0.7,
    fontSize: 7, bold: true, color: C.white, align: "center",
    fontFace: "Calibri", valign: "middle", margin: 0,
  });
}

/** Tabla de resultados por corte */
function addResultsTable(slide, data, headers, colWidths) {
  const headerRow = headers.map(h => ({
    text: h,
    options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 8, align: "center", fontFace: "Calibri" }
  }));

  const rows = [headerRow];
  data.forEach((row, idx) => {
    const even = idx % 2 === 0;
    rows.push(row.map((cell, ci) => ({
      text: String(cell.text ?? cell),
      options: {
        fontSize: 8,
        color: cell.color || C.black,
        fill: { color: even ? "F8FAFC" : C.white },
        bold: cell.bold || false,
        align: ci === 0 ? "left" : "center",
        fontFace: "Calibri",
      }
    })));
  });

  return rows;
}

// ─── SLIDES ───────────────────────────────────────────────────────────────────

function slidePortada(pres, data) {
  const slide = pres.addSlide();
  slide.background = { color: C.navyDark };

  // Forma decorativa superior derecha (curva simulada con óvalo)
  slide.addShape(pres.shapes.OVAL, {
    x: 6.5, y: -1.2, w: 5, h: 3.5,
    fill: { color: C.navy, transparency: 0 }, line: { color: C.navy }
  });

  // Título principal
  slide.addText("NOM-035-STPS-2018", {
    x: 0.7, y: 1.8, w: 8, h: 1.0,
    fontSize: 44, bold: true, color: C.white, fontFace: "Calibri",
  });

  slide.addText("Presentación de Resultados 2025", {
    x: 0.7, y: 2.85, w: 7, h: 0.5,
    fontSize: 18, color: C.limeGreen, fontFace: "Calibri",
  });

  slide.addText(data.companyName, {
    x: 0.7, y: 3.35, w: 7, h: 0.4,
    fontSize: 14, color: "CBD5E1", fontFace: "Calibri",
  });

  // Puntos decorativos
  [0,1,2,3,4,5,6,7].forEach(i => {
    slide.addShape(pres.shapes.OVAL, {
      x: 0.7 + i * 0.38, y: 3.85, w: 0.18, h: 0.18,
      fill: { color: i < 3 ? C.limeGreen : "4B5E7A" }, line: { color: "00000000" }
    });
  });

  slide.addText(`Fecha de generación: ${data.reportDate}`, {
    x: 0.7, y: 5.1, w: 5, h: 0.3,
    fontSize: 9, color: "94A3B8", fontFace: "Calibri",
  });
}

function slideContenido(pres) {
  const slide = pres.addSlide();
  slide.background = { color: "F8FAFC" };

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.18, h: 5.625,
    fill: { color: C.navy }, line: { color: C.navy }
  });

  slide.addText("Contenido", {
    x: 0.35, y: 0.18, w: 4, h: 0.55,
    fontSize: 28, bold: true, color: C.navy, fontFace: "Calibri", margin: 0,
  });
  slide.addText("NOM-035-STPS-2018", {
    x: 0.35, y: 0.72, w: 4, h: 0.35,
    fontSize: 14, bold: true, color: C.limeGreen, fontFace: "Calibri", margin: 0,
  });

  const items = [
    "01  Introducción a la NOM-035",
    "02  Metodología | NOM-035",
    "03  Escala de medición de Resultados",
    "04  Resultados | Guía 1 (ATS)",
    "05  Resultados | Guía 3 (Riesgo psicosocial)",
    "06  Casos de canalización",
    "07  Hallazgos generales",
  ];

  items.forEach((item, i) => {
    const isOdd = i % 2 === 0;
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 4.6, y: 0.95 + i * 0.63, w: 5.15, h: 0.52,
      fill: { color: isOdd ? "EFF6FF" : "F8FAFC" },
      line: { color: "E2E8F0" }, rectRadius: 0.06,
    });
    slide.addText(item, {
      x: 4.75, y: 0.97 + i * 0.63, w: 4.9, h: 0.48,
      fontSize: 11, color: C.navy, fontFace: "Calibri",
      valign: "middle", margin: 0,
    });
  });
}

function slideIntroduccion(pres) {
  const slide = pres.addSlide();
  addSlideHeader(slide, pres, "Introducción a la NOM-035", "1. ¿Qué es la NOM-035?");

  const cards = [
    { icon: "🎯", title: "Objetivo", text: "Identificar, analizar y prevenir factores de riesgo psicosocial en los centros de trabajo.", color: C.blue },
    { icon: "🏢", title: "Campo de aplicación", text: "Obligatoria para todos los centros de trabajo del territorio mexicano. Empresas +50 empleados aplican Guía III.", color: C.navy },
    { icon: "🛡️", title: "Prevención", text: "Violencia laboral y factores que afectan la salud psicológica del trabajador.", color: "7C3AED" },
    { icon: "🌱", title: "Promoción", text: "Entorno Organizacional Favorable que promueva el bienestar y productividad.", color: C.green },
  ];

  cards.forEach((card, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.35 + col * 4.85;
    const y = 1.2 + row * 2.0;

    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y, w: 4.5, h: 1.75,
      fill: { color: C.white },
      rectRadius: 0.1,
      shadow: { type: "outer", color: "000000", blur: 8, offset: 2, angle: 45, opacity: 0.08 }
    });
    slide.addText(card.icon + "  " + card.title, {
      x: x + 0.18, y: y + 0.18, w: 4.2, h: 0.4,
      fontSize: 13, bold: true, color: card.color, fontFace: "Calibri", margin: 0,
    });
    slide.addText(card.text, {
      x: x + 0.18, y: y + 0.6, w: 4.15, h: 1.0,
      fontSize: 10, color: C.gray, fontFace: "Calibri",
      valign: "top", margin: 0, wrap: true,
    });
  });
}

function slideResultadosGuia1(pres, data) {
  const g1 = data.guia1;
  const slide = pres.addSlide();
  addSlideHeader(slide, pres, "Resultados | Guía de Referencia 1", "4. Acontecimientos Traumáticos Severos (ATS)");

  // Tarjetas de métricas
  addMetricCard(slide, pres, 0.35, 1.2, 2.1, 1.3, `${g1.totalInvited}`, "Total Invitados", C.navy);
  addMetricCard(slide, pres, 2.6,  1.2, 2.1, 1.3, `${g1.totalParticipants}`, "Participantes", C.blue);
  addMetricCard(slide, pres, 4.85, 1.2, 2.1, 1.3, `${g1.participationPct}%`, "Participación", C.green);
  addMetricCard(slide, pres, 7.1,  1.2, 2.5, 1.3, `${g1.atsCount}`, "Casos ATS detectados", C.orange);

  // Detalle ATS
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.35, y: 2.75, w: 9.3, h: 1.3,
    fill: { color: "FFF7ED" }, line: { color: "FED7AA" }, rectRadius: 0.1,
  });
  slide.addText([
    { text: "⚠️  Casos ATS", options: { bold: true, fontSize: 14, color: C.orange, breakLine: true } },
    { text: `${g1.atsCount} colaboradores (${g1.atsPct}%) reportaron haber vivido un acontecimiento traumático severo durante o con motivo del trabajo.`, options: { fontSize: 11, color: C.black } },
  ], {
    x: 0.6, y: 2.85, w: 9.0, h: 1.1,
    fontFace: "Calibri", valign: "middle", margin: 0,
  });

  // Nota metodológica
  slide.addText("Los casos detectados son canalizados para atención a la institución de seguridad social o privada designada por la empresa, conforme al numeral 8.1 de la NOM-035-STPS-2018.", {
    x: 0.35, y: 4.2, w: 9.3, h: 0.7,
    fontSize: 9, color: C.gray, fontFace: "Calibri",
    italic: true, wrap: true, margin: 0,
  });
}

function slideDiagnosticoGlobal(pres, data) {
  const g3 = data.guia3;
  const riskColor = RISK_COLORS[g3.riskLevel] || C.yellow;
  const riskLabel = RISK_LABELS[g3.riskLevel] || g3.riskLevel;
  const scorePct = g3.globalScore / g3.maxScore;

  const slide = pres.addSlide();
  addSlideHeader(slide, pres, "Diagnóstico General de Riesgo", "5. Global | Guía 3");

  // Gauge semicircular como donut
  slide.addChart(pres.charts.DOUGHNUT, [{
    name: "Riesgo",
    labels: ["Puntaje", "Restante"],
    values: [g3.globalScore, g3.maxScore - g3.globalScore],
  }], {
    x: 2.8, y: 1.1, w: 4.4, h: 3.2,
    chartColors: [riskColor, "E2E8F0"],
    holeSize: 65,
    showLegend: false, showLabel: false, showValue: false, showPercent: false,
    chartArea: { fill: { color: "F8FAFC" }, border: { color: "F8FAFC" } },
  });

  // Puntaje en el centro
  slide.addText([
    { text: "Puntaje", options: { fontSize: 11, color: C.gray, breakLine: true } },
    { text: String(g3.globalScore), options: { fontSize: 36, bold: true, color: riskColor, breakLine: true } },
    { text: `Nivel de Riesgo`, options: { fontSize: 10, color: C.gray, breakLine: true } },
    { text: riskLabel.toUpperCase(), options: { fontSize: 14, bold: true, color: riskColor } },
  ], {
    x: 3.5, y: 2.05, w: 3.0, h: 1.5,
    align: "center", valign: "middle", fontFace: "Calibri", margin: 0,
  });

  // Escala (izquierda)
  slide.addText("Niveles de Riesgo", {
    x: 0.35, y: 1.15, w: 2.1, h: 0.4,
    fontSize: 11, bold: true, color: C.navy, fontFace: "Calibri", margin: 0,
  });
  const levels = [
    { label: "Muy Alto", color: "EF4444", range: "≥ 140 pts" },
    { label: "Alto",     color: "F97316", range: "99–139 pts" },
    { label: "Medio",    color: "EAB308", range: "75–98 pts" },
    { label: "Bajo",     color: "84CC16", range: "50–74 pts" },
    { label: "Nulo",     color: "06B6D4", range: "0–49 pts" },
  ];
  levels.forEach((lv, i) => {
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.35, y: 1.65 + i * 0.64, w: 2.1, h: 0.52,
      fill: { color: lv.color }, line: { color: lv.color }, rectRadius: 0.05,
    });
    slide.addText(`${lv.label}  ·  ${lv.range}`, {
      x: 0.35, y: 1.65 + i * 0.64, w: 2.1, h: 0.52,
      fontSize: 9, bold: true, color: C.white, align: "center",
      fontFace: "Calibri", valign: "middle", margin: 0,
    });
  });

  // Benchmark (derecha)
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 7.4, y: 1.15, w: 2.25, h: 1.5,
    fill: { color: C.white }, line: { color: "E2E8F0" },
    rectRadius: 0.1,
    shadow: { type: "outer", color: "000000", blur: 6, offset: 2, angle: 45, opacity: 0.08 }
  });
  slide.addText([
    { text: `Puntaje: ${g3.benchmarkScore}`, options: { fontSize: 14, bold: true, color: C.navy, breakLine: true } },
    { text: `Benchmark`, options: { fontSize: 10, bold: true, color: C.limeGreen, breakLine: true } },
    { text: `${g3.benchmarkCompanies} empresas`, options: { fontSize: 9, color: C.gray } },
  ], {
    x: 7.4, y: 1.2, w: 2.25, h: 1.4,
    align: "center", valign: "middle", fontFace: "Calibri", margin: 0,
  });

  // Participación
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 7.4, y: 2.85, w: 2.25, h: 1.1,
    fill: { color: C.white }, line: { color: "E2E8F0" }, rectRadius: 0.1,
    shadow: { type: "outer", color: "000000", blur: 6, offset: 2, angle: 45, opacity: 0.08 }
  });
  slide.addText([
    { text: `${g3.participationPct}%`, options: { fontSize: 22, bold: true, color: C.green, breakLine: true } },
    { text: `Participación`, options: { fontSize: 9, bold: true, color: C.navy, breakLine: true } },
    { text: `${g3.totalParticipants}/${g3.totalInvited} colaboradores`, options: { fontSize: 8, color: C.gray } },
  ], {
    x: 7.4, y: 2.9, w: 2.25, h: 1.0,
    align: "center", valign: "middle", fontFace: "Calibri", margin: 0,
  });

  // Nota comparativa
  const diff = g3.globalScore - g3.benchmarkScore;
  const diffText = diff < 0 ? `${diff} pts por debajo del promedio` : `${diff} pts por encima del promedio`;
  slide.addText(`A nivel general el resultado es ${diffText} registrado en empresas que realizaron el mismo proceso (${g3.benchmarkScore} pts).`, {
    x: 0.35, y: 4.55, w: 9.3, h: 0.65,
    fontSize: 9, color: C.gray, italic: true, fontFace: "Calibri", wrap: true, margin: 0,
  });
}

function slideCategorias(pres, data) {
  const cats = data.guia3.categories;
  const slide = pres.addSlide();
  addSlideHeader(slide, pres, "Categorías", "5. Guía 3 — Resultados por Categoría");

  // 5 donuts en fila horizontal con espacio para nombre abajo
  const donutW = 1.7;
  const donutH = 1.55;
  const gap = 0.22;
  const startX = (10 - (donutW * 5 + gap * 4)) / 2;

  cats.slice(0, 5).forEach((cat, i) => {
    const x = startX + i * (donutW + gap);
    const y = 1.2;
    const color = RISK_COLORS[cat.riskLevel] || C.gray;

    // Donut nativo
    slide.addChart(pres.charts.DOUGHNUT, [{
      name: "Score",
      labels: ["Obtenido", "Restante"],
      values: [cat.score, cat.maxScore - cat.score],
    }], {
      x, y, w: donutW, h: donutH,
      chartColors: [color, "E2E8F0"],
      holeSize: 62,
      showLegend: false, showLabel: false, showValue: false, showPercent: false,
      chartArea: { fill: { color: "F8FAFC" }, border: { color: "F8FAFC" } },
    });

    // Texto central
    slide.addText([
      { text: String(cat.score), options: { bold: true, fontSize: 15, color: C.navy, breakLine: true } },
      { text: String(cat.maxScore), options: { fontSize: 9, color: C.gray } },
    ], {
      x: x + 0.02, y: y + donutH * 0.28, w: donutW - 0.04, h: donutH * 0.45,
      align: "center", valign: "middle", fontFace: "Calibri", margin: 0,
    });

    // Chip de nivel de riesgo
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: x + donutW * 0.15, y: y + donutH + 0.04, w: donutW * 0.7, h: 0.28,
      fill: { color }, line: { color }, rectRadius: 0.04,
    });
    slide.addText(RISK_LABELS[cat.riskLevel] || cat.riskLevel, {
      x: x + donutW * 0.15, y: y + donutH + 0.04, w: donutW * 0.7, h: 0.28,
      fontSize: 7.5, bold: true, color: C.white, align: "center",
      fontFace: "Calibri", valign: "middle", margin: 0,
    });

    // Nombre de la categoría (full width, wrap)
    slide.addText(cat.name, {
      x: x - 0.05, y: y + donutH + 0.38, w: donutW + 0.1, h: 0.75,
      fontSize: 8.5, bold: true, color: C.navy, align: "center",
      fontFace: "Calibri", margin: 0, wrap: true,
    });
  });

  // Escala de medición (bottom)
  const scaleItems = ["NULO","BAJO","MEDIO","ALTO","MUY ALTO"];
  const scaleColors = ["06B6D4","84CC16","EAB308","F97316","EF4444"];
  slide.addText("Escala:", {
    x: 0.35, y: 5.2, w: 0.7, h: 0.28,
    fontSize: 7.5, color: C.gray, fontFace: "Calibri", margin: 0, valign: "middle",
  });
  scaleItems.forEach((s, i) => {
    slide.addShape(pres.shapes.OVAL, {
      x: 1.1 + i * 1.72, y: 5.2, w: 1.5, h: 0.28,
      fill: { color: scaleColors[i] }, line: { color: scaleColors[i] },
    });
    slide.addText(s, {
      x: 1.1 + i * 1.72, y: 5.2, w: 1.5, h: 0.28,
      fontSize: 7.5, bold: true, color: C.white,
      align: "center", valign: "middle", fontFace: "Calibri", margin: 0,
    });
  });
}

function slideDominios(pres, data) {
  const slide = pres.addSlide();
  addSlideHeader(slide, pres, "Dominios", "5. Guía 3 — Resultados por Dominio");

  const domains = data.guia3.domains;
  domains.forEach((d, i) => {
    addRiskBar(slide, pres, 0.35, 1.18 + i * 0.42, 9.3, 0.38, d.score, d.maxScore, d.name, d.riskLevel);
  });
}

function slideFocosAtencion(pres, data) {
  const slide = pres.addSlide();
  slide.background = { color: C.navyDark };

  slide.addText("Focos de Atención", {
    x: 1, y: 0.5, w: 8, h: 0.65,
    fontSize: 30, bold: true, color: C.white, fontFace: "Calibri", align: "center",
  });
  slide.addText("Guía 3 — Dominios prioritarios de intervención", {
    x: 1, y: 1.1, w: 8, h: 0.4,
    fontSize: 14, color: C.limeGreen, fontFace: "Calibri", align: "center",
  });

  data.guia3.focusAreas.forEach((area, i) => {
    const x = 1.5 + i * 4.2;
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y: 1.85, w: 3.6, h: 2.5,
      fill: { color: C.navy }, line: { color: C.limeGreen }, rectRadius: 0.15,
    });
    slide.addText(area, {
      x, y: 1.85, w: 3.6, h: 2.5,
      fontSize: 18, bold: true, color: C.white, fontFace: "Calibri",
      align: "center", valign: "middle", margin: 0,
    });
  });

  slide.addText("Estos dominios deben ser prioritarios en el Programa de Intervención, implementando acciones de control que aseguren una distribución equilibrada de tareas y jornadas regulares.", {
    x: 0.8, y: 4.65, w: 8.4, h: 0.7,
    fontSize: 10, color: "94A3B8", fontFace: "Calibri", align: "center", italic: true, wrap: true,
  });
}

function slideCanalizaciones(pres, data) {
  const g3 = data.guia3;
  const slide = pres.addSlide();
  addSlideHeader(slide, pres, "Casos de Canalizaciones", "6. Global | Guía 3");

  // Círculo central grande
  slide.addShape(pres.shapes.OVAL, {
    x: 0.8, y: 1.2, w: 3.2, h: 3.2,
    fill: { color: C.navy }, line: { color: C.navy },
  });
  slide.addText([
    { text: "TOTAL A\nCANALIZAR", options: { fontSize: 11, color: "94A3B8", breakLine: true } },
    { text: String(g3.canalizationCount), options: { fontSize: 52, bold: true, color: C.white, breakLine: true } },
  ], {
    x: 0.8, y: 1.5, w: 3.2, h: 2.6,
    align: "center", valign: "middle", fontFace: "Calibri", margin: 0,
  });

  // Porcentaje
  slide.addText([
    { text: `${g3.canalizationPct}%`, options: { fontSize: 22, bold: true, color: C.orange, breakLine: true } },
    { text: "de los trabajadores\nrequieren canalización", options: { fontSize: 10, color: C.navy } },
  ], {
    x: 0.8, y: 4.55, w: 3.2, h: 0.85,
    align: "center", fontFace: "Calibri", margin: 0,
  });

  // Líneas y tarjetas de desglose
  const typeColors = [C.navy, C.orange, C.red, "7C3AED"];
  g3.canalizationByType.forEach((t, i) => {
    const y = 1.8 + i * 1.5;
    slide.addShape(pres.shapes.LINE, {
      x: 4.0, y: y + 0.3, w: 1.0, h: 0,
      line: { color: C.limeGreen, width: 1.5 }
    });
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 5.1, y: y, w: 4.4, h: 0.95,
      fill: { color: typeColors[i] || C.navy }, line: { color: typeColors[i] || C.navy }, rectRadius: 0.08,
    });
    slide.addText([
      { text: String(t.count), options: { fontSize: 24, bold: true, color: C.white } },
      { text: `  ${t.type}`, options: { fontSize: 11, bold: true, color: C.white } },
    ], {
      x: 5.3, y: y + 0.08, w: 4.0, h: 0.78,
      valign: "middle", fontFace: "Calibri", margin: 0,
    });
  });
}

function slideResultadosPorArea(pres, data) {
  const areas = data.guia3.byArea;
  const slide = pres.addSlide();
  addSlideHeader(slide, pres, "Resultados por Área", "Corte de Información — Guía 3");

  const tableData = areas.map(a => {
    const color = RISK_COLORS[a.riskLevel] || C.gray;
    const label = RISK_LABELS[a.riskLevel] || a.riskLevel;
    return [
      { text: a.name },
      { text: String(a.n) },
      { text: String(a.global), bold: true, color },
      { text: label, bold: true, color },
    ];
  });

  const rows = addResultsTable(slide, tableData,
    ["Área", "No. Colaboradores", "Puntaje Global", "Nivel de Riesgo"],
    [4.0, 1.8, 1.8, 1.7]
  );

  slide.addTable(rows, {
    x: 0.35, y: 1.18, w: 9.3,
    colW: [4.0, 1.8, 1.8, 1.7],
    rowH: 0.42,
    border: { pt: 0.5, color: "E2E8F0" },
    autoPage: false,
    fontFace: "Calibri",
  });
}

function slideResultadosPorDemografia(pres, data) {
  const slide = pres.addSlide();
  addSlideHeader(slide, pres, "Resultados Demográficos", "Género y Generación — Guía 3");

  // Gráfica de género
  slide.addText("Por Género", {
    x: 0.35, y: 1.15, w: 4.3, h: 0.35,
    fontSize: 13, bold: true, color: C.navy, fontFace: "Calibri", margin: 0,
  });
  slide.addChart(pres.charts.BAR, [{
    name: "Puntaje",
    labels: data.guia3.byGender.map(g => g.name),
    values: data.guia3.byGender.map(g => g.global),
  }], {
    x: 0.35, y: 1.5, w: 4.3, h: 2.5, barDir: "col",
    chartColors: [C.blue, "7C3AED"],
    chartArea: { fill: { color: "F8FAFC" }, border: { color: "F8FAFC" } },
    valAxisMinVal: 0, valAxisMaxVal: 150,
    showValue: true, dataLabelColor: C.navy,
    catAxisLabelColor: C.gray, valAxisLabelColor: C.gray,
    valGridLine: { color: "E2E8F0", size: 0.5 },
    catGridLine: { style: "none" },
    showLegend: false,
    dataLabelFontSize: 11, dataLabelFontBold: true,
  });

  // Gráfica de generación
  slide.addText("Por Generación", {
    x: 5.1, y: 1.15, w: 4.6, h: 0.35,
    fontSize: 13, bold: true, color: C.navy, fontFace: "Calibri", margin: 0,
  });
  slide.addChart(pres.charts.BAR, [{
    name: "Puntaje",
    labels: data.guia3.byGeneration.map(g => g.name),
    values: data.guia3.byGeneration.map(g => g.global),
  }], {
    x: 5.1, y: 1.5, w: 4.6, h: 2.5, barDir: "col",
    chartColors: [C.navy, C.blue, C.limeGreen, C.green],
    chartArea: { fill: { color: "F8FAFC" }, border: { color: "F8FAFC" } },
    valAxisMinVal: 0, valAxisMaxVal: 150,
    showValue: true, dataLabelColor: C.navy,
    catAxisLabelColor: C.gray, valAxisLabelColor: C.gray,
    valGridLine: { color: "E2E8F0", size: 0.5 },
    catGridLine: { style: "none" },
    showLegend: false,
    dataLabelFontSize: 11, dataLabelFontBold: true,
  });

  // Nota
  slide.addText("Escala NOM-035: Nulo 0–49 | Bajo 50–74 | Medio 75–98 | Alto 99–139 | Muy Alto ≥140", {
    x: 0.35, y: 4.2, w: 9.3, h: 0.35,
    fontSize: 8.5, color: C.gray, italic: true, fontFace: "Calibri", align: "center", margin: 0,
  });
}

function slideHallazgo(pres, index, text, title = "Hallazgos Generales") {
  const slide = pres.addSlide();
  addSlideHeader(slide, pres, title, `7. Guía 3 — Hallazgo ${index + 1}`);

  // Parsear el texto buscando **negritas**
  const parts = text.split(/\*\*(.*?)\*\*/g);
  const richText = parts.map((part, i) => ({
    text: part,
    options: { bold: i % 2 !== 0, color: i % 2 !== 0 ? C.navy : C.black }
  }));

  slide.addText(richText, {
    x: 0.7, y: 1.4, w: 7.5, h: 3.5,
    fontSize: 14, fontFace: "Calibri",
    align: "justify", valign: "middle",
    lineSpacingMultiple: 1.6, wrap: true, margin: 0,
  });

  // Imagen decorativa (círculo con número)
  slide.addShape(pres.shapes.OVAL, {
    x: 8.5, y: 1.5, w: 1.15, h: 1.15,
    fill: { color: C.navy }, line: { color: C.navy }
  });
  slide.addText(String(index + 1), {
    x: 8.5, y: 1.5, w: 1.15, h: 1.15,
    fontSize: 32, bold: true, color: C.white,
    align: "center", valign: "middle", fontFace: "Calibri", margin: 0,
  });
}

function slideCierre(pres, data) {
  const slide = pres.addSlide();
  slide.background = { color: C.navyDark };

  slide.addShape(pres.shapes.OVAL, {
    x: 6.5, y: -1.2, w: 5, h: 3.5,
    fill: { color: C.navy }, line: { color: C.navy }
  });

  slide.addText("¡Gracias!", {
    x: 0.7, y: 1.6, w: 8.5, h: 1.2,
    fontSize: 52, bold: true, color: C.white,
    fontFace: "Calibri", align: "center",
  });

  slide.addText(data.companyName, {
    x: 0.7, y: 2.9, w: 8.5, h: 0.45,
    fontSize: 16, color: C.limeGreen, fontFace: "Calibri", align: "center",
  });

  slide.addText(`NOM-035-STPS-2018 | Resultados 2025 | Generado: ${data.reportDate}`, {
    x: 0.7, y: 4.9, w: 8.5, h: 0.35,
    fontSize: 9, color: "64748B", fontFace: "Calibri", align: "center",
  });
}

// ─── FUNCIÓN PRINCIPAL ────────────────────────────────────────────────────────
async function generateNOM035Presentation(data, outputPath) {
  const pres = new PptxGenJS();
  pres.layout = "LAYOUT_16x9";
  pres.author = "NOM-035 Platform";
  pres.title = `NOM-035-STPS-2018 | ${data.companyName}`;

  // Construir slides en orden
  slidePortada(pres, data);
  slideContenido(pres);
  slideIntroduccion(pres);
  slideResultadosGuia1(pres, data);
  slideDiagnosticoGlobal(pres, data);
  slideCategorias(pres, data);
  slideDominios(pres, data);
  slideFocosAtencion(pres, data);
  slideResultadosPorArea(pres, data);
  // Solo incluir slide demográfica si hay datos capturados
  if ((data.guia3.byGender?.length > 0) || (data.guia3.byGeneration?.length > 0)) {
    slideResultadosPorDemografia(pres, data);
  }
  data.findings.forEach((text, i) => slideHallazgo(pres, i, text));
  slideCanalizaciones(pres, data);
  slideCierre(pres, data);

  await pres.writeFile({ fileName: outputPath });
  console.log(`✅ Presentación generada: ${outputPath}`);
}

// ─── Ejecutar con datos de ejemplo ───────────────────────────────────────────
const data = getMockData();
generateNOM035Presentation(data, "/home/claude/nom035_resultado.pptx")
  .catch(err => { console.error("Error:", err); process.exit(1); });
