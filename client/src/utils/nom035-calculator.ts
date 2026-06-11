import type { QuestionnaireAnswer, DomainScore, EvaluationResult } from "@shared/schema";
import { nom035Questions } from "@/data/nom035-questions";

interface RiskThresholds {
  [domain: string]: {
    low: number;
    medium: number;
    high: number;
    veryHigh: number;
  };
}

// Official NOM-035 risk thresholds
const riskThresholds: RiskThresholds = {
  ambiente: { low: 5, medium: 9, high: 14, veryHigh: 20 },
  actividad: { low: 15, medium: 21, high: 27, veryHigh: 37 },
  tiempo: { low: 6, medium: 9, high: 12, veryHigh: 16 },
  liderazgo: { low: 18, medium: 36, high: 46, veryHigh: 60 }
};

// Adjusted thresholds for microempresas (simplified scoring)
const microempresaThresholds: RiskThresholds = {
  ambiente: { low: 3, medium: 6, high: 9, veryHigh: 12 },
  actividad: { low: 8, medium: 12, high: 16, veryHigh: 20 },
  tiempo: { low: 3, medium: 5, high: 7, veryHigh: 9 },
  liderazgo: { low: 10, medium: 18, high: 24, veryHigh: 30 }
};

const guia1Thresholds: RiskThresholds = {
  ambiente: { low: 5, medium: 9, high: 14, veryHigh: 20 },
  actividad: { low: 10, medium: 16, high: 22, veryHigh: 30 },
  tiempo: { low: 4, medium: 6, high: 9, veryHigh: 12 },
  liderazgo: { low: 11, medium: 21, high: 32, veryHigh: 44 }
};

const guia2Thresholds: RiskThresholds = {
  ambiente: { low: 11, medium: 17, high: 25, veryHigh: 35 },
  actividad: { low: 16, medium: 25, high: 36, veryHigh: 50 },
  tiempo: { low: 6, medium: 9, high: 14, veryHigh: 19 },
  liderazgo: { low: 38, medium: 55, high: 77, veryHigh: 102 }
};

const guia3Thresholds: RiskThresholds = {
  ambiente: { low: 11, medium: 17, high: 25, veryHigh: 35 },
  actividad: { low: 21, medium: 33, high: 47, veryHigh: 65 },
  tiempo: { low: 9, medium: 14, high: 20, veryHigh: 28 },
  liderazgo: { low: 42, medium: 60, high: 84, veryHigh: 112 }
};

const eventosTraumaticosThresholds: RiskThresholds = {
  eventos_traumaticos: { low: 0, medium: 1, high: 3, veryHigh: 5 }
};

export function calculateNOM035Risk(
  answers: QuestionnaireAnswer[],
  questionnaireType: string
): EvaluationResult {
  const questions = nom035Questions[questionnaireType as keyof typeof nom035Questions];
  
  if (!questions) {
    throw new Error(`Invalid questionnaire type: ${questionnaireType}`);
  }

  // Group answers by domain
  const domainScores: { [domain: string]: number[] } = {};
  
  answers.forEach(answer => {
    const question = questions[answer.questionId];
    if (!question) return;
    
    const domain = question.domain;
    if (!domainScores[domain]) {
      domainScores[domain] = [];
    }
    
    // Apply reverse scoring if needed
    let score = answer.value;
    if (question.reverseScored) {
      if (questionnaireType === 'eventos_traumaticos') {
        score = 1 - score; // For yes/no questions: 0=No, 1=Yes
      } else {
        score = 4 - score; // Reverse the 0-4 scale for Likert questions
      }
    }
    
    domainScores[domain].push(score);
  });

  // Calculate domain scores
  const calculatedDomainScores: DomainScore[] = [];
  let totalScore = 0;
  let maxPossibleScore = 0;

  Object.entries(domainScores).forEach(([domain, scores]) => {
    const domainScore = scores.reduce((sum, score) => sum + score, 0);
    const maxScore = scores.length * (questionnaireType === 'eventos_traumaticos' ? 1 : 4); // Maximum possible score for this domain
    const percentage = maxScore > 0 ? (domainScore / maxScore) * 100 : 0;
    
    calculatedDomainScores.push({
      domain,
      score: domainScore,
      maxScore,
      percentage
    });
    
    totalScore += domainScore;
    maxPossibleScore += maxScore;
  });

  // Determine overall risk level
  const riskLevel = determineRiskLevel(calculatedDomainScores, questionnaireType);
  
  // Generate recommendations based on risk level and domain scores
  const recommendations = generateRecommendations(calculatedDomainScores, riskLevel, questionnaireType);

  return {
    employeeId: 0, // Will be set by the caller
    questionnaireType,
    answers,
    domainScores: calculatedDomainScores,
    overallScore: totalScore,
    riskLevel,
    recommendations
  };
}

function determineRiskLevel(domainScores: DomainScore[], questionnaireType?: string): string {
  let highestRiskLevel = 'sin-riesgo';
  
  domainScores.forEach(domain => {
    const thresholds = questionnaireType === 'microempresa' ? 
      microempresaThresholds[domain.domain] : 
      riskThresholds[domain.domain];
    if (!thresholds) return;
    
    let currentRiskLevel = 'sin-riesgo';
    
    if (domain.score >= thresholds.veryHigh) {
      currentRiskLevel = 'muy-alto';
    } else if (domain.score >= thresholds.high) {
      currentRiskLevel = 'alto';
    } else if (domain.score >= thresholds.medium) {
      currentRiskLevel = 'medio';
    } else if (domain.score >= thresholds.low) {
      currentRiskLevel = 'bajo';
    }
    
    // Keep the highest risk level found
    const riskLevels = ['sin-riesgo', 'bajo', 'medio', 'alto', 'muy-alto'];
    const currentIndex = riskLevels.indexOf(currentRiskLevel);
    const highestIndex = riskLevels.indexOf(highestRiskLevel);
    
    if (currentIndex > highestIndex) {
      highestRiskLevel = currentRiskLevel;
    }
  });
  
  return highestRiskLevel;
}

function generateRecommendations(domainScores: DomainScore[], riskLevel: string, questionnaireType?: string): string[] {
  const recommendations: string[] = [];
  
  // General recommendations based on overall risk level
  switch (riskLevel) {
    case 'muy-alto':
      recommendations.push('Se requiere intervención inmediata para reducir los factores de riesgo psicosocial');
      recommendations.push('Considerar evaluación médica especializada');
      break;
    case 'alto':
      recommendations.push('Implementar medidas de control prioritarias');
      recommendations.push('Realizar seguimiento mensual del empleado');
      break;
    case 'medio':
      recommendations.push('Aplicar medidas de prevención y control');
      recommendations.push('Realizar seguimiento trimestral');
      break;
    case 'bajo':
      recommendations.push('Mantener las condiciones actuales de trabajo');
      recommendations.push('Realizar seguimiento anual');
      break;
    default:
      recommendations.push('Mantener las buenas condiciones de trabajo identificadas');
  }
  
  // Specific recommendations based on domain scores
  domainScores.forEach(domain => {
    const thresholds = questionnaireType === 'microempresa' ? 
      microempresaThresholds[domain.domain] : 
      riskThresholds[domain.domain];
    if (!thresholds) return;
    
    if (domain.score >= thresholds.high) {
      switch (domain.domain) {
        case 'ambiente':
          recommendations.push('Mejorar las condiciones físicas del ambiente de trabajo');
          recommendations.push('Revisar la adecuación del salario y beneficios');
          break;
        case 'actividad':
          recommendations.push('Redistribuir la carga de trabajo y responsabilidades');
          recommendations.push('Proporcionar capacitación adicional si es necesaria');
          break;
        case 'tiempo':
          recommendations.push('Revisar y ajustar los horarios de trabajo');
          recommendations.push('Implementar medidas de flexibilidad laboral');
          break;
        case 'liderazgo':
          recommendations.push('Mejorar la comunicación entre jefes y subordinados');
          recommendations.push('Capacitar al personal directivo en liderazgo');
          break;
      }
    }
  });
  
  return recommendations;
}
