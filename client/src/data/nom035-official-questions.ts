// Cuestionarios oficiales NOM-035-STPS-2018 extraídos del documento oficial
// Implementación exacta según las Guías de Referencia II y III

export interface OfficialQuestion {
  id: number;
  question: string;
  options: string[];
  domain: string;
  category?: string;
  reverseScored?: boolean;
}

// GUÍA DE REFERENCIA I - Cuestionario para identificar acontecimientos traumáticos severos
export const traumaticEventsQuestionnaire: OfficialQuestion[] = [
  {
    id: 1,
    question: "¿Ha presenciado o ha sufrido alguna vez durante o con motivo del trabajo, un acontecimiento como los que se indican a continuación?",
    options: ["Sí", "No"],
    domain: "traumatic_events",
    category: "Sección I: Descripción del acontecimiento traumático severo"
  },
  {
    id: 2,
    question: "Accidente que tenga como consecuencia la muerte, la pérdida de algún miembro del cuerpo o una lesión grave",
    options: ["Sí", "No"],
    domain: "traumatic_events"
  },
  {
    id: 3,
    question: "Asaltos",
    options: ["Sí", "No"],
    domain: "traumatic_events"
  },
  {
    id: 4,
    question: "Actos violentos que derivaron en lesiones graves",
    options: ["Sí", "No"],
    domain: "traumatic_events"
  },
  {
    id: 5,
    question: "Secuestro",
    options: ["Sí", "No"],
    domain: "traumatic_events"
  },
  {
    id: 6,
    question: "Amenazas",
    options: ["Sí", "No"],
    domain: "traumatic_events"
  },
  {
    id: 7,
    question: "Otro acontecimiento que haya puesto en riesgo su vida o salud, y/o la de otras personas",
    options: ["Sí", "No"],
    domain: "traumatic_events"
  }
];

// GUÍA DE REFERENCIA II - Para centros de trabajo de hasta 50 trabajadores
export const guideIIQuestionnaire: OfficialQuestion[] = [
  {
    id: 1,
    question: "Las condiciones del lugar donde trabajo son seguras",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "ambiente_trabajo"
  },
  {
    id: 2,
    question: "Mi trabajo me exige hacer mucho esfuerzo físico",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "carga_trabajo",
    reverseScored: true
  },
  {
    id: 3,
    question: "Me preocupa sufrir un accidente en mi trabajo",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "ambiente_trabajo",
    reverseScored: true
  },
  {
    id: 4,
    question: "Considero que las actividades que realizo son peligrosas",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "ambiente_trabajo",
    reverseScored: true
  },
  {
    id: 5,
    question: "Por la cantidad de trabajo que tengo debo quedarme tiempo extra",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "carga_trabajo",
    reverseScored: true
  },
  {
    id: 6,
    question: "Mi trabajo me exige estar muy concentrado",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "carga_trabajo"
  },
  {
    id: 7,
    question: "Mi trabajo requiere que memorice mucha información",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "carga_trabajo"
  },
  {
    id: 8,
    question: "En mi trabajo tengo que tomar decisiones difíciles muy rápido",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "carga_trabajo"
  },
  {
    id: 9,
    question: "En mi trabajo debo atender varios asuntos al mismo tiempo",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "carga_trabajo"
  },
  {
    id: 10,
    question: "En mi trabajo puedo tomar pausas cuando las necesito",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "control_trabajo"
  },
  {
    id: 11,
    question: "Puedo decidir cuánto trabajo realizo en el día",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "control_trabajo"
  },
  {
    id: 12,
    question: "Puedo decidir la velocidad a la que trabajo",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "control_trabajo"
  },
  {
    id: 13,
    question: "Puedo cambiar el orden de las actividades en mi trabajo",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "control_trabajo"
  },
  {
    id: 14,
    question: "Puedo decidir cómo hago mi trabajo",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "control_trabajo"
  },
  {
    id: 15,
    question: "Mi jefe tiene en cuenta mis puntos de vista y opiniones",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    id: 16,
    question: "Mi jefe me ayuda a realizar mejor mi trabajo",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    id: 17,
    question: "Mi jefe me ayuda para que mejore mi forma de hacer el trabajo",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    id: 18,
    question: "Mi jefe me comunica a tiempo la información que necesito para hacer mi trabajo",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    id: 19,
    question: "El trabajo que hago me permite aprender cosas nuevas",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "control_trabajo"
  },
  {
    id: 20,
    question: "En mi trabajo puedo desarrollar mis habilidades",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "control_trabajo"
  },
  {
    id: 21,
    question: "En mi trabajo puedo aplicar mis conocimientos",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "control_trabajo"
  },
  {
    id: 22,
    question: "Mi trabajo me permite ser creativo",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "control_trabajo"
  },
  {
    id: 23,
    question: "En mi trabajo me dan la información necesaria para realizar bien mi trabajo",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    id: 24,
    question: "Recibo críticas constantes a mi persona o trabajo",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "relaciones_trabajo",
    reverseScored: true
  },
  {
    id: 25,
    question: "Recibo burlas, calumnias, difamaciones, humillaciones o ridiculizaciones",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "violencia",
    reverseScored: true
  },
  {
    id: 26,
    question: "Se ignoran mis éxitos laborales y sólo se buscan los errores",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "relaciones_trabajo",
    reverseScored: true
  },
  {
    id: 27,
    question: "Me interrumpen cuando hablo",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "relaciones_trabajo",
    reverseScored: true
  },
  {
    id: 28,
    question: "Hago el trabajo que no me corresponde",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "carga_trabajo",
    reverseScored: true
  },
  {
    id: 29,
    question: "Me asignan trabajo que pueda afectar mi autoestima",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "violencia",
    reverseScored: true
  },
  {
    id: 30,
    question: "Se limita mi comunicación con jefes, compañeros o subordinados",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "relaciones_trabajo",
    reverseScored: true
  },
  {
    id: 31,
    question: "Tengo que trabajar muy rápido",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "carga_trabajo",
    reverseScored: true
  },
  {
    id: 32,
    question: "El ritmo de trabajo me exige estar al día",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "carga_trabajo",
    reverseScored: true
  },
  {
    id: 33,
    question: "Me presionan para que no me ausente del trabajo",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "carga_trabajo",
    reverseScored: true
  },
  {
    id: 34,
    question: "La cantidad de trabajo que tengo es apropiada",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "carga_trabajo"
  },
  {
    id: 35,
    question: "Es necesario mantener un ritmo de trabajo acelerado",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "carga_trabajo",
    reverseScored: true
  },
  {
    id: 36,
    question: "Trabajo horas extras más de tres veces a la semana",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "carga_trabajo",
    reverseScored: true
  },
  {
    id: 37,
    question: "Mi trabajo me exige laborar en días de descanso, festivos o fines de semana",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "carga_trabajo",
    reverseScored: true
  },
  {
    id: 38,
    question: "Considero que el trabajo que hago es importante para mi empresa",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "control_trabajo"
  },
  {
    id: 39,
    question: "Mi trabajo es importante para la vida o salud de otras personas",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "control_trabajo"
  },
  {
    id: 40,
    question: "Tengo mucha responsabilidad en mi trabajo",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "control_trabajo"
  },
  {
    id: 41,
    question: "Responden agresivamente cuando les pido que hagan su trabajo",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "violencia",
    reverseScored: true
  },
  {
    id: 42,
    question: "Mi trabajo me permite tener horarios flexibles",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "control_trabajo"
  },
  {
    id: 43,
    question: "Es difícil tomar tiempo libre durante el horario de trabajo para atender asuntos personales o familiares",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "control_trabajo",
    reverseScored: true
  },
  {
    id: 44,
    question: "Tengo que trabajar tiempo extra",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "carga_trabajo",
    reverseScored: true
  },
  {
    id: 45,
    question: "Mi trabajo me permite estar en contacto con mis familiares",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "control_trabajo"
  },
  {
    id: 46,
    question: "En mi trabajo existe la posibilidad de ascender",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "control_trabajo"
  }
];

// GUÍA DE REFERENCIA III - Para centros de trabajo de más de 50 trabajadores
// Esta incluye todas las preguntas de la Guía II más preguntas adicionales para evaluar el entorno organizacional

export const guideIIIAdditionalQuestions: OfficialQuestion[] = [
  {
    id: 47,
    question: "En mi trabajo se promueve el trato igualitario",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "entorno_organizacional"
  },
  {
    id: 48,
    question: "En mi trabajo existe la igualdad de oportunidades sin importar el género",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "entorno_organizacional"
  },
  {
    id: 49,
    question: "En mi trabajo me dan las mismas oportunidades sin importar mi edad",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "entorno_organizacional"
  },
  {
    id: 50,
    question: "En mi trabajo existe igualdad de oportunidades sin importar la discapacidad",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "entorno_organizacional"
  },
  {
    id: 51,
    question: "En mi trabajo me dan las mismas oportunidades sin importar mi estado civil",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "entorno_organizacional"
  },
  {
    id: 52,
    question: "En mi trabajo me dan las mismas oportunidades sin importar mi religión",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "entorno_organizacional"
  },
  {
    id: 53,
    question: "En mi trabajo recibo información sobre los riesgos de salud o accidentes en el área donde laboro",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "entorno_organizacional"
  },
  {
    id: 54,
    question: "Me proporcionan el equipo de protección personal necesario para hacer mi trabajo",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "entorno_organizacional"
  },
  {
    id: 55,
    question: "Considero que en mi trabajo existe discriminación",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "entorno_organizacional",
    reverseScored: true
  },
  {
    id: 56,
    question: "En mi trabajo puedo expresar mi opinión sin temor",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "entorno_organizacional"
  },
  {
    id: 57,
    question: "Mi jefe ayuda a solucionar los problemas que se presentan en el trabajo",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    id: 58,
    question: "Platican conmigo sobre como hacer mejor el trabajo",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    id: 59,
    question: "Mi jefe me escucha cuando tengo problemas de trabajo",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    id: 60,
    question: "Mi jefe me brinda el apoyo que necesito para hacer mi trabajo",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    id: 61,
    question: "Me informan con quién puedo reportar los problemas o quejarme en mi trabajo",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "entorno_organizacional"
  },
  {
    id: 62,
    question: "Me informan por escrito de las actividades que debo realizar en mi trabajo",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "entorno_organizacional"
  },
  {
    id: 63,
    question: "Me explican claramente los resultados que debo obtener en mi trabajo",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "entorno_organizacional"
  },
  {
    id: 64,
    question: "Me explican claramente los objetivos de mi trabajo",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "entorno_organizacional"
  },
  {
    id: 65,
    question: "Me informan con claridad cuáles son mis funciones",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "entorno_organizacional"
  },
  {
    id: 66,
    question: "Me explican la importancia de mi trabajo para alcanzar los objetivos de la empresa",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "entorno_organizacional"
  },
  {
    id: 67,
    question: "Me proporcionan capacitación útil para hacer mi trabajo",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "entorno_organizacional"
  },
  {
    id: 68,
    question: "Recibo capacitación para usar la nueva tecnología",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "entorno_organizacional"
  },
  {
    id: 69,
    question: "Recibo capacitación para desarrollarme en mi trabajo y/o en mi profesión",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "entorno_organizacional"
  },
  {
    id: 70,
    question: "Mi jefe me dice que hago bien mi trabajo",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    id: 71,
    question: "Mi empresa me proporciona los recursos materiales necesarios para hacer mi trabajo",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "entorno_organizacional"
  },
  {
    id: 72,
    question: "El espacio donde trabajo me permite realizar mis actividades de manera adecuada",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "ambiente_trabajo"
  }
];

// Función para obtener el cuestionario completo según el tipo de empresa
export function getOfficialQuestionnaire(companySize: number): OfficialQuestion[] {
  if (companySize <= 15) {
    // Para microempresas (1-15 empleados) - usar cuestionario simplificado (primera parte de Guía II)
    return guideIIQuestionnaire.slice(0, 22);
  } else if (companySize <= 50) {
    // Para empresas medianas (16-50 empleados) - usar Guía II completa
    return guideIIQuestionnaire;
  } else {
    // Para empresas grandes (50+ empleados) - usar Guía III (Guía II + preguntas adicionales)
    return [...guideIIQuestionnaire, ...guideIIIAdditionalQuestions];
  }
}

// Función para obtener el cuestionario de eventos traumáticos
export function getTraumaticEventsQuestionnaire(): OfficialQuestion[] {
  return traumaticEventsQuestionnaire;
}

// Dominios oficiales según NOM-035-STPS-2018
export const officialDomains = {
  ambiente_trabajo: "Ambiente de trabajo",
  carga_trabajo: "Factores propios de la actividad",
  control_trabajo: "Organización del tiempo de trabajo",
  liderazgo: "Liderazgo y relaciones en el trabajo",
  relaciones_trabajo: "Relaciones en el trabajo",
  violencia: "Violencia",
  entorno_organizacional: "Entorno organizacional favorable"
};

// Umbrales oficiales de riesgo según NOM-035-STPS-2018
export const officialRiskThresholds = {
  // Para Guía II (16-50 trabajadores)
  guideII: {
    nulo_despreciable: { min: 0, max: 19 },
    bajo: { min: 20, max: 44 },
    medio: { min: 45, max: 69 },
    alto: { min: 70, max: 89 },
    muy_alto: { min: 90, max: 184 }
  },
  // Para Guía III (más de 50 trabajadores)
  guideIII: {
    nulo_despreciable: { min: 0, max: 49 },
    bajo: { min: 50, max: 74 },
    medio: { min: 75, max: 98 },
    alto: { min: 99, max: 139 },
    muy_alto: { min: 140, max: 288 }
  }
};

// Export questionnaires for external use
export const microenterpriseQuestionnaire = guideIIQuestionnaire;
// Combine base questionnaire with additional questions for Guide III
const combinedGuideIII = [...guideIIQuestionnaire, ...guideIIIAdditionalQuestions];
export const guideIIIQuestionnaire = combinedGuideIII;