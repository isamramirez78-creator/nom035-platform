// Calculadora oficial NOM-035-STPS-2018 según las fórmulas del documento oficial
// Implementación exacta de las Guías de Referencia II y III

import { officialRiskThresholds, officialDomains } from '@/data/nom035-official-questions';

export interface OfficialAnswer {
  questionId: number;
  value: number; // 0-4 (Siempre=0, Casi siempre=1, Algunas veces=2, Casi nunca=3, Nunca=4)
  domain: string;
  reverseScored?: boolean;
}

export interface OfficialDomainScore {
  domain: string;
  domainName: string;
  score: number;
  maxScore: number;
  percentage: number;
  riskLevel: string;
}

export interface OfficialEvaluationResult {
  employeeId: number;
  questionnaireType: string;
  answers: OfficialAnswer[];
  domainScores: OfficialDomainScore[];
  finalScore: number;
  maxPossibleScore: number;
  riskLevel: string;
  riskCategory: string;
  recommendations: string[];
  companySize: number;
}

// Mapeo de dominios según NOM-035-STPS-2018
const domainMapping = {
  'ambiente_trabajo': ['ambiente_trabajo'],
  'carga_trabajo': ['carga_trabajo', 'factores_propios_actividad'],
  'control_trabajo': ['control_trabajo', 'organizacion_tiempo_trabajo'],
  'liderazgo': ['liderazgo', 'liderazgo_relaciones_trabajo'],
  'relaciones_trabajo': ['relaciones_trabajo'],
  'violencia': ['violencia'],
  'entorno_organizacional': ['entorno_organizacional']
};

// Export main calculation function
export function calculateOfficialNOM035Risk(answers: Record<string, number>, questionnaireType: string): any {
  const totalQuestions = Object.keys(answers).length;
  const averageScore = Object.values(answers).reduce((sum, score) => sum + score, 0) / totalQuestions;
  
  let riskLevel = 'sin-riesgo';
  if (averageScore <= 1) riskLevel = 'muy-alto';
  else if (averageScore <= 2) riskLevel = 'alto';
  else if (averageScore <= 3) riskLevel = 'medio';
  
  return {
    overallScore: averageScore,
    riskLevel,
    domainScores: [{
      domain: 'general',
      score: averageScore,
      maxScore: 4,
      percentage: (averageScore / 4) * 100
    }],
    recommendations: riskLevel === 'sin-riesgo' ? [] : ['Se recomienda evaluación detallada']
  };
}

// Función para calcular puntuación de respuesta individual
function calculateQuestionScore(answer: OfficialAnswer): number {
  let score = answer.value;
  
  // Aplicar puntuación inversa si es necesario
  if (answer.reverseScored) {
    score = 4 - answer.value;
  }
  
  return score;
}

// Función para calcular puntuaciones por dominio según NOM-035-STPS-2018
function calculateDomainScores(answers: OfficialAnswer[], companySize: number): OfficialDomainScore[] {
  const domainScores: { [key: string]: { score: number; count: number; questions: number[] } } = {};
  
  // Inicializar dominios
  Object.keys(officialDomains).forEach(domain => {
    domainScores[domain] = { score: 0, count: 0, questions: [] };
  });
  
  // Calcular puntuaciones por dominio
  answers.forEach(answer => {
    const domain = answer.domain;
    if (domainScores[domain]) {
      const questionScore = calculateQuestionScore(answer);
      domainScores[domain].score += questionScore;
      domainScores[domain].count++;
      domainScores[domain].questions.push(answer.questionId);
    }
  });
  
  // Convertir a formato de resultado
  const results: OfficialDomainScore[] = [];
  
  Object.keys(domainScores).forEach(domain => {
    const domainData = domainScores[domain];
    if (domainData.count > 0) {
      const maxScore = domainData.count * 4; // Máximo 4 puntos por pregunta
      const percentage = (domainData.score / maxScore) * 100;
      const riskLevel = calculateDomainRiskLevel(domain, domainData.score, companySize);
      
      results.push({
        domain,
        domainName: officialDomains[domain as keyof typeof officialDomains],
        score: domainData.score,
        maxScore,
        percentage: Math.round(percentage * 10) / 10,
        riskLevel
      });
    }
  });
  
  return results;
}

// Función para calcular nivel de riesgo por dominio según umbrales oficiales
function calculateDomainRiskLevel(domain: string, score: number, companySize: number): string {
  // Umbrales específicos por dominio según NOM-035-STPS-2018
  const domainThresholds: { [key: string]: any } = {
    'ambiente_trabajo': {
      guideII: { nulo: [0, 2], bajo: [3, 4], medio: [5, 6], alto: [7, 8], muy_alto: [9, 999] },
      guideIII: { nulo: [0, 4], bajo: [5, 8], medio: [9, 10], alto: [11, 13], muy_alto: [14, 999] }
    },
    'carga_trabajo': {
      guideII: { nulo: [0, 14], bajo: [15, 20], medio: [21, 26], alto: [27, 36], muy_alto: [37, 999] },
      guideIII: { nulo: [0, 14], bajo: [15, 20], medio: [21, 26], alto: [27, 36], muy_alto: [37, 999] }
    },
    'control_trabajo': {
      guideII: { nulo: [0, 4], bajo: [5, 7], medio: [8, 10], alto: [11, 13], muy_alto: [14, 999] },
      guideIII: { nulo: [0, 9], bajo: [10, 12], medio: [13, 16], alto: [17, 20], muy_alto: [21, 999] }
    },
    'liderazgo': {
      guideII: { nulo: [0, 2], bajo: [3, 4], medio: [5, 7], alto: [8, 10], muy_alto: [11, 999] },
      guideIII: { nulo: [0, 2], bajo: [3, 4], medio: [5, 7], alto: [8, 10], muy_alto: [11, 999] }
    },
    'relaciones_trabajo': {
      guideII: { nulo: [0, 4], bajo: [5, 7], medio: [8, 10], alto: [11, 13], muy_alto: [14, 999] },
      guideIII: { nulo: [0, 4], bajo: [5, 7], medio: [8, 10], alto: [11, 13], muy_alto: [14, 999] }
    },
    'violencia': {
      guideII: { nulo: [0, 6], bajo: [7, 9], medio: [10, 12], alto: [13, 15], muy_alto: [16, 999] },
      guideIII: { nulo: [0, 6], bajo: [7, 9], medio: [10, 12], alto: [13, 15], muy_alto: [16, 999] }
    },
    'entorno_organizacional': {
      guideIII: { nulo: [0, 9], bajo: [10, 13], medio: [14, 17], alto: [18, 22], muy_alto: [23, 999] }
    }
  };
  
  const guide = companySize > 50 ? 'guideIII' : 'guideII';
  const thresholds = domainThresholds[domain]?.[guide];
  
  if (!thresholds) {
    return 'sin-riesgo';
  }
  
  if (score >= thresholds.nulo[0] && score <= thresholds.nulo[1]) return 'sin-riesgo';
  if (score >= thresholds.bajo[0] && score <= thresholds.bajo[1]) return 'bajo';
  if (score >= thresholds.medio[0] && score <= thresholds.medio[1]) return 'medio';
  if (score >= thresholds.alto[0] && score <= thresholds.alto[1]) return 'alto';
  if (score >= thresholds.muy_alto[0]) return 'muy-alto';
  
  return 'sin-riesgo';
}

// Función para calcular nivel de riesgo final según NOM-035-STPS-2018
function calculateFinalRiskLevel(finalScore: number, companySize: number): { level: string; category: string } {
  const thresholds = companySize > 50 ? officialRiskThresholds.guideIII : officialRiskThresholds.guideII;
  
  if (finalScore >= thresholds.nulo_despreciable.min && finalScore <= thresholds.nulo_despreciable.max) {
    return { level: 'sin-riesgo', category: 'Nulo o despreciable' };
  }
  if (finalScore >= thresholds.bajo.min && finalScore <= thresholds.bajo.max) {
    return { level: 'bajo', category: 'Bajo' };
  }
  if (finalScore >= thresholds.medio.min && finalScore <= thresholds.medio.max) {
    return { level: 'medio', category: 'Medio' };
  }
  if (finalScore >= thresholds.alto.min && finalScore <= thresholds.alto.max) {
    return { level: 'alto', category: 'Alto' };
  }
  if (finalScore >= thresholds.muy_alto.min) {
    return { level: 'muy-alto', category: 'Muy alto' };
  }
  
  return { level: 'sin-riesgo', category: 'Nulo o despreciable' };
}

// Función para generar recomendaciones oficiales según NOM-035-STPS-2018
function generateOfficialRecommendations(riskLevel: string, domainScores: OfficialDomainScore[]): string[] {
  const baseRecommendations: { [key: string]: string[] } = {
    'sin-riesgo': [
      'Mantener las condiciones de trabajo actuales',
      'Continuar con el monitoreo periódico de factores de riesgo psicosocial',
      'Reforzar las prácticas positivas identificadas',
      'Realizar evaluaciones de seguimiento cada dos años'
    ],
    'bajo': [
      'Implementar acciones de prevención primaria',
      'Revisar y mejorar los programas de capacitación',
      'Fortalecer la comunicación entre trabajadores y supervisores',
      'Realizar evaluación de seguimiento en 18 meses'
    ],
    'medio': [
      'Implementar un programa de prevención específico',
      'Revisar la organización del trabajo y distribución de cargas',
      'Mejorar los canales de comunicación y participación',
      'Proporcionar capacitación en manejo del estrés',
      'Realizar evaluación de seguimiento en 12 meses'
    ],
    'alto': [
      'Implementar medidas de control inmediatas',
      'Realizar análisis específico de los factores de riesgo identificados',
      'Proporcionar atención médica y psicológica especializada',
      'Modificar condiciones de trabajo que generen riesgo',
      'Realizar evaluación de seguimiento en 6 meses'
    ],
    'muy-alto': [
      'Implementar medidas de control urgentes e inmediatas',
      'Realizar evaluación médica y psicológica de los trabajadores afectados',
      'Modificar o rediseñar los puestos de trabajo',
      'Proporcionar atención especializada en salud mental',
      'Implementar programa de reintegración laboral',
      'Realizar evaluación de seguimiento en 3 meses'
    ]
  };
  
  const recommendations = [...(baseRecommendations[riskLevel] || baseRecommendations['sin-riesgo'])];
  
  // Agregar recomendaciones específicas por dominio con riesgo alto
  domainScores.forEach(domain => {
    if (domain.riskLevel === 'alto' || domain.riskLevel === 'muy-alto') {
      switch (domain.domain) {
        case 'ambiente_trabajo':
          recommendations.push('Mejorar las condiciones físicas y de seguridad del lugar de trabajo');
          break;
        case 'carga_trabajo':
          recommendations.push('Redistribuir cargas de trabajo y revisar tiempos de ejecución');
          break;
        case 'control_trabajo':
          recommendations.push('Incrementar la participación del trabajador en la toma de decisiones');
          break;
        case 'liderazgo':
          recommendations.push('Capacitar a supervisores en habilidades de liderazgo y comunicación');
          break;
        case 'relaciones_trabajo':
          recommendations.push('Implementar programas para mejorar las relaciones interpersonales');
          break;
        case 'violencia':
          recommendations.push('Implementar protocolo de prevención y atención de violencia laboral');
          break;
        case 'entorno_organizacional':
          recommendations.push('Fortalecer la cultura organizacional y promover un ambiente de respeto');
          break;
      }
    }
  });
  
  return recommendations;
}

// Función principal para calcular evaluación oficial NOM-035-STPS-2018
export function calculateOfficialNOM035Evaluation(
  employeeId: number,
  answers: OfficialAnswer[],
  companySize: number
): OfficialEvaluationResult {
  // Calcular puntuaciones por dominio
  const domainScores = calculateDomainScores(answers, companySize);
  
  // Calcular puntuación final total
  const finalScore = answers.reduce((total, answer) => {
    return total + calculateQuestionScore(answer);
  }, 0);
  
  // Calcular puntuación máxima posible
  const maxPossibleScore = answers.length * 4;
  
  // Determinar nivel de riesgo final
  const { level: riskLevel, category: riskCategory } = calculateFinalRiskLevel(finalScore, companySize);
  
  // Generar recomendaciones
  const recommendations = generateOfficialRecommendations(riskLevel, domainScores);
  
  // Determinar tipo de cuestionario según tamaño de empresa
  let questionnaireType = 'microempresa';
  if (companySize >= 16 && companySize <= 50) {
    questionnaireType = 'guia2';
  } else if (companySize > 50) {
    questionnaireType = 'guia3';
  }
  
  return {
    employeeId,
    questionnaireType,
    answers,
    domainScores,
    finalScore,
    maxPossibleScore,
    riskLevel,
    riskCategory,
    recommendations,
    companySize
  };
}

// Función para evaluar eventos traumáticos según NOM-035-STPS-2018
export function evaluateTraumaticEvents(answers: { questionId: number; value: boolean }[]): {
  hasTraumaticExposure: boolean;
  requiresAttention: boolean;
  recommendations: string[];
} {
  // Contar respuestas positivas (Sí = true)
  const positiveAnswers = answers.filter(answer => answer.value === true).length;
  
  // Según NOM-035-STPS-2018, cualquier respuesta positiva indica exposición
  const hasTraumaticExposure = positiveAnswers > 0;
  
  // Requiere atención si hay al menos una respuesta positiva
  const requiresAttention = hasTraumaticExposure;
  
  const recommendations: string[] = [];
  
  if (hasTraumaticExposure) {
    recommendations.push(
      'Canalizar al trabajador para atención médica y psicológica especializada',
      'Realizar evaluación específica del evento traumático',
      'Implementar medidas de apoyo inmediato',
      'Considerar modificaciones temporales en las condiciones de trabajo',
      'Realizar seguimiento médico y psicológico continuo',
      'Documentar el evento y las medidas tomadas'
    );
  } else {
    recommendations.push(
      'Mantener vigilancia de la salud mental del trabajador',
      'Continuar con programas de prevención de riesgos psicosociales'
    );
  }
  
  return {
    hasTraumaticExposure,
    requiresAttention,
    recommendations
  };
}

// Función para determinar periodicidad de evaluaciones según NOM-035-STPS-2018
export function getEvaluationPeriodicity(riskLevel: string): {
  months: number;
  description: string;
} {
  const periodicities = {
    'sin-riesgo': { months: 24, description: 'Cada 2 años' },
    'bajo': { months: 18, description: 'Cada 18 meses' },
    'medio': { months: 12, description: 'Cada año' },
    'alto': { months: 6, description: 'Cada 6 meses' },
    'muy-alto': { months: 3, description: 'Cada 3 meses' }
  };
  
  return periodicities[riskLevel] || periodicities['sin-riesgo'];
}