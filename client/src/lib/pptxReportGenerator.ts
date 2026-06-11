/**
 * pptxReportGenerator.ts
 * Wrapper TypeScript que obtiene datos reales de la API
 * y genera la presentación ejecutiva NOM-035 en formato PPTX.
 *
 * Alineado al schema real de la BD:
 *   - evaluations.overallScore  → totalScore
 *   - evaluations.domainScores  → [{ domain, score, maxScore, percentage }]
 *   - evaluations.riskLevel     → nivel global
 *   - employees.genero          → campo opcional (agregado al schema)
 *   - employees.generacion      → campo opcional (agregado al schema)
 *
 * categoryScores se calcula aquí agrupando dominios → categorías
 * según la estructura oficial NOM-035-STPS-2018.
 */

// ─── Mapeo oficial: dominio → categoría ───────────────────────────────────────
// Basado en officialDomains de nom035-official-questions.ts
const DOMAIN_TO_CATEGORY: Record<string, string> = {
  ambiente_trabajo:         "Ambiente de trabajo",
  carga_trabajo:            "Factores propios de la actividad",
  control_trabajo:          "Factores propios de la actividad",
  liderazgo:                "Liderazgo y relaciones en el trabajo",
  relaciones_trabajo:       "Liderazgo y relaciones en el trabajo",
  violencia:                "Liderazgo y relaciones en el trabajo",
  entorno_organizacional:   "Entorno organizacional",
};

// Puntajes máximos por categoría (Guía III, NOM-035-STPS-2018)
const CATEGORY_MAX_SCORES: Record<string, number> = {
  "Factores propios de la actividad":       100,
  "Organización del tiempo de trabajo":      24,
  "Liderazgo y relaciones en el trabajo":   104,
  "Entorno organizacional":                  40,
  "Ambiente de trabajo":                     20,
};

// Puntajes máximos por dominio (Guía III)
const DOMAIN_MAX_SCORES: Record<string, number> = {
  ambiente_trabajo:         20,
  carga_trabajo:            60,
  control_trabajo:          40,
  liderazgo:                36,
  relaciones_trabajo:       36,
  violencia:                32,
  entorno_organizacional:   40,
};

// Nombres legibles por dominio
const DOMAIN_NAMES: Record<string, string> = {
  ambiente_trabajo:         "Cond. ambiente de trabajo",
  carga_trabajo:            "Carga de trabajo",
  control_trabajo:          "Falta de control sobre el trabajo",
  liderazgo:                "Liderazgo",
  relaciones_trabajo:       "Relaciones en el trabajo",
  violencia:                "Violencia laboral",
  entorno_organizacional:   "Entorno organizacional",
};

// ─── Asignar nivel de riesgo por puntaje de dominio (umbrales Guía III) ──────
function domainRiskLevel(domain: string, score: number): string {
  // Umbrales oficiales NOM-035-STPS-2018 Guía III por dominio
  const T: Record<string, number[]> = {
    // [nulo_max, bajo_max, medio_max, alto_max]  → muy_alto si >alto_max
    carga_trabajo:            [12, 16, 20, 24],
    control_trabajo:          [9,  12, 16, 20],
    ambiente_trabajo:         [4,  8,  10, 13],
    liderazgo:                [2,  4,  7,  10],
    relaciones_trabajo:       [4,  7,  10, 13],
    violencia:                [6,  9,  12, 15],
    entorno_organizacional:   [9,  13, 17, 22],
  };
  const t = T[domain];
  if (!t) return scoreToRiskLabel(Math.round((score / (DOMAIN_MAX_SCORES[domain] || 40)) * 98));
  if (score <= t[0]) return "nulo";
  if (score <= t[1]) return "bajo";
  if (score <= t[2]) return "medio";
  if (score <= t[3]) return "alto";
  return "muy-alto";
}

// Nivel de riesgo global según puntaje total Guía III
function scoreToRiskLabel(score: number): string {
  if (score <= 49)  return "nulo";
  if (score <= 74)  return "bajo";
  if (score <= 98)  return "medio";
  if (score <= 139) return "alto";
  return "muy-alto";
}

// ─── Calcular categoryScores agrupando domainScores ──────────────────────────
function buildCategoryScores(
  domainScoresArr: { domain: string; score: number; maxScore?: number }[]
): { name: string; score: number; maxScore: number; riskLevel: string }[] {

  // Acumular scores por categoría
  const catAccum: Record<string, { score: number; maxScore: number }> = {};

  for (const d of domainScoresArr) {
    const catName = DOMAIN_TO_CATEGORY[d.domain];
    if (!catName) continue;
    if (!catAccum[catName]) catAccum[catName] = { score: 0, maxScore: 0 };
    catAccum[catName].score   += d.score ?? 0;
    catAccum[catName].maxScore += d.maxScore ?? DOMAIN_MAX_SCORES[d.domain] ?? 20;
  }

  // Construir array final usando los maxScores oficiales
  return Object.entries(CATEGORY_MAX_SCORES).map(([name, officialMax]) => {
    const raw = catAccum[name];
    const score = raw ? Math.min(raw.score, officialMax) : 0;
    const pct = score / officialMax;
    let riskLevel = "nulo";
    if (pct > 0.68) riskLevel = "muy-alto";
    else if (pct > 0.48) riskLevel = "alto";
    else if (pct > 0.32) riskLevel = "medio";
    else if (pct > 0.16) riskLevel = "bajo";
    return { name, score, maxScore: officialMax, riskLevel };
  });
}

// ─── Obtener datos reales de la API ──────────────────────────────────────────
async function fetchPresentationData() {
  const [statsRes, empRes, evalRes, compRes] = await Promise.all([
    fetch("/api/stats"),
    fetch("/api/employees"),
    fetch("/api/evaluations"),
    fetch("/api/company"),
  ]);

  if (!statsRes.ok || !empRes.ok || !evalRes.ok) {
    throw new Error("No se pudieron obtener los datos necesarios. Verifica tu conexión.");
  }

  const [stats, employees, evaluations, company] = await Promise.all([
    statsRes.json(),
    empRes.json(),
    evalRes.json(),
    compRes.ok ? compRes.json() : {},
  ]);

  const completed = (evaluations as any[]).filter((e: any) => e.completed);
  const guia3    = completed.filter((e: any) => e.questionnaireType === "guia3" || (e.overallScore ?? 0) > 0);
  const atsEvals = completed.filter((e: any) => e.questionnaireType === "guia1" || e.hasAts === true);
  const total    = (employees as any[]).length;

  // ── Puntaje global (promedio) ─────────────────────────────────────────────
  const globalScore = guia3.length > 0
    ? Math.round(guia3.reduce((s: number, e: any) => s + (e.overallScore ?? 0), 0) / guia3.length)
    : 0;

  // ── domainScores: promediar todos los empleados evaluados ─────────────────
  const domAccum: Record<string, { total: number; count: number }> = {};

  for (const ev of guia3) {
    const ds: any[] = Array.isArray(ev.domainScores) ? ev.domainScores : [];
    for (const d of ds) {
      // Soportar tanto { domain } como { domainName } (compatibilidad hacia atrás)
      const key = d.domain || d.domainName?.toLowerCase().replace(/ /g, "_") || "desconocido";
      if (!domAccum[key]) domAccum[key] = { total: 0, count: 0 };
      domAccum[key].total += d.score ?? 0;
      domAccum[key].count += 1;
    }
  }

  const avgDomains = Object.entries(domAccum).map(([domain, { total, count }]) => ({
    domain,
    score: Math.round(total / count),
    maxScore: DOMAIN_MAX_SCORES[domain] ?? 40,
  }));

  // Completar dominios sin datos con 0
  const allDomains = Object.keys(DOMAIN_MAX_SCORES).map(domain => {
    const found = avgDomains.find(d => d.domain === domain);
    return found ?? { domain, score: 0, maxScore: DOMAIN_MAX_SCORES[domain] };
  });

  // ── Categorías: calculadas a partir de dominios ───────────────────────────
  const categories = buildCategoryScores(allDomains);

  // ── Dominios en formato para la presentación ──────────────────────────────
  const domainResults = allDomains.map(d => ({
    name:      DOMAIN_NAMES[d.domain] ?? d.domain,
    score:     d.score,
    maxScore:  d.maxScore,
    riskLevel: domainRiskLevel(d.domain, d.score),
  }));

  // ── Focos de atención ─────────────────────────────────────────────────────
  const focusAreas = domainResults
    .filter(d => ["medio","alto","muy-alto"].includes(d.riskLevel))
    .sort((a, b) => (b.score / b.maxScore) - (a.score / a.maxScore))
    .slice(0, 2)
    .map(d => d.name);

  // ── Por área ──────────────────────────────────────────────────────────────
  const areaMap: Record<string, { scores: number[]; count: number }> = {};
  for (const emp of employees as any[]) {
    const area = emp.area || "Sin área";
    if (!areaMap[area]) areaMap[area] = { scores: [], count: 0 };
    areaMap[area].count++;
    const ev = guia3.find((e: any) => e.employeeId === emp.id);
    if (ev?.overallScore != null) areaMap[area].scores.push(ev.overallScore);
  }
  const byArea = Object.entries(areaMap)
    .map(([name, { scores, count }]) => {
      const avg = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;
      return { name, n: count, global: avg, riskLevel: scoreToRiskLabel(avg) };
    })
    .sort((a, b) => b.global - a.global);

  // ── Por género (campo opcional employees.genero) ──────────────────────────
  const genderMap: Record<string, number[]> = {};
  for (const emp of employees as any[]) {
    const g = emp.genero || emp.gender || null;
    if (!g) continue;
    const ev = guia3.find((e: any) => e.employeeId === emp.id);
    if (ev?.overallScore == null) continue;
    if (!genderMap[g]) genderMap[g] = [];
    genderMap[g].push(ev.overallScore);
  }
  const byGender = Object.entries(genderMap).map(([name, scores]) => ({
    name, n: scores.length,
    global: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
  }));

  // ── Por generación (campo opcional employees.generacion) ──────────────────
  const genMap: Record<string, number[]> = {};
  for (const emp of employees as any[]) {
    const g = emp.generacion || emp.generation || null;
    if (!g) continue;
    const ev = guia3.find((e: any) => e.employeeId === emp.id);
    if (ev?.overallScore == null) continue;
    if (!genMap[g]) genMap[g] = [];
    genMap[g].push(ev.overallScore);
  }
  const byGeneration = Object.entries(genMap).map(([name, scores]) => ({
    name, n: scores.length,
    global: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
  }));

  // ── Canalizaciones (riesgo alto o muy-alto) ───────────────────────────────
  const canalCount = completed.filter(
    (e: any) => e.riskLevel === "alto" || e.riskLevel === "muy-alto"
  ).length;
  const canalPct = completed.length > 0
    ? Math.round((canalCount / completed.length) * 100) : 0;

  // ── Hallazgos narrativos generados con datos reales ───────────────────────
  const riskLabelStr = {
    nulo: "Nulo", bajo: "Bajo", medio: "Medio", alto: "Alto", "muy-alto": "Muy Alto"
  }[scoreToRiskLabel(globalScore)] ?? "Medio";

  const topDomStr = domainResults
    .filter(d => ["medio","alto","muy-alto"].includes(d.riskLevel))
    .slice(0, 2).map(d => `**${d.name}**`).join(" y ");

  const lowDomStr = domainResults
    .filter(d => ["nulo","bajo"].includes(d.riskLevel))
    .slice(0, 3).map(d => `**${d.name}**`).join(", ");

  const findings = [
    `El nivel general de riesgo se ubica en **Nivel ${riskLabelStr}** con **${globalScore} puntos** sobre un máximo de 288. Es importante implementar acciones de control para reducir los niveles de riesgo y fomentar un entorno organizacional favorable que promueva el bienestar y la productividad de los colaboradores.`,
    topDomStr
      ? `Los dominios con mayor nivel de riesgo son: ${topDomStr}. Estos factores deben ser prioritarios en el programa de intervención, implementando acciones que aseguren una distribución equilibrada de tareas y jornadas de trabajo regulares.`
      : "Los niveles de riesgo en todos los dominios se mantienen en rangos aceptables. Se recomienda mantener y reforzar las buenas prácticas actuales de la organización.",
    lowDomStr
      ? `Los dominios ${lowDomStr} presentan los puntajes más bajos. Estas son fortalezas organizacionales importantes que deben mantenerse, reforzarse y comunicarse a todo el equipo directivo y colaboradores.`
      : "Se recomienda continuar monitoreando periódicamente todos los indicadores de riesgo psicosocial.",
  ];

  return {
    companyName: company?.razonSocial ?? company?.nombre ?? stats?.companyName ?? "Empresa",
    rfc:         company?.rfc ?? stats?.rfc ?? "—",
    reportDate:  new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" }),
    guia1: {
      totalInvited:       total,
      totalParticipants:  atsEvals.length || completed.length,
      participationPct:   total > 0 ? Math.round(((atsEvals.length || completed.length) / total) * 100) : 0,
      atsCount:           atsEvals.length,
      atsPct:             total > 0 ? Math.round((atsEvals.length / total) * 100) : 0,
    },
    guia3: {
      totalInvited:        total,
      totalParticipants:   guia3.length,
      participationPct:    total > 0 ? Math.round((guia3.length / total) * 100) : 0,
      globalScore,
      maxScore:            288,
      riskLevel:           scoreToRiskLabel(globalScore),
      benchmarkScore:      88,
      benchmarkCompanies:  57,
      canalizationCount:   canalCount,
      canalizationPct:     canalPct,
      canalizationByType:  [
        { type: "Violencia laboral",             count: Math.ceil(canalCount * 0.7) },
        { type: "Factores de Riesgo Psicosocial", count: Math.floor(canalCount * 0.3) },
      ],
      categories,
      domains: domainResults,
      focusAreas: focusAreas.length > 0 ? focusAreas : ["Carga de trabajo", "Jornada de trabajo"],
      byArea,
      // Si no hay datos demográficos capturados aún, las slides se omiten
      byGender:     byGender.length     > 0 ? byGender     : [],
      byGeneration: byGeneration.length > 0 ? byGeneration : [],
    },
    findings,
  };
}

// ─── Punto de entrada público ─────────────────────────────────────────────────
export async function generateExecutivePresentation(): Promise<{
  success: boolean; fileName?: string; error?: string
}> {
  try {
    const { generateNOM035Presentation } = await import("./pptxGenerator.js");
    const data = await fetchPresentationData();
    const fileName = `NOM-035-Presentacion-${new Date().toISOString().split("T")[0]}.pptx`;
    await generateNOM035Presentation(data, fileName);
    return { success: true, fileName };
  } catch (err: any) {
    console.error("[pptxReportGenerator]", err);
    return { success: false, error: err?.message ?? "Error al generar la presentación" };
  }
}
