// Datos temporales para testing del PDF mientras se corrige el backend
export const mockStats = {
  totalEmployees: 5,
  evaluationsCompleted: 5,
  pendingEvaluations: 0,
  highRiskCount: 2,
  riskDistribution: {
    'sin-riesgo': 1,
    'bajo': 1,
    'medio': 1,
    'alto': 1,
    'muy-alto': 1
  },
  areaStats: {
    'Administración': { total: 2, completed: 2, avgRisk: 1.5 },
    'Operaciones': { total: 2, completed: 2, avgRisk: 2.5 },
    'Recursos Humanos': { total: 1, completed: 1, avgRisk: 1.0 }
  }
};