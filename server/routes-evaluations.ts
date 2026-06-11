// Evaluation duplicate prevention endpoint
import type { Express } from "express";
import { storage } from "./storage";

export function registerDuplicateCheckRoutes(app: Express) {
  // Check if employee can start a specific questionnaire
  app.get("/api/evaluations/check/:employeeId/:questionnaireType", async (req, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const questionnaireType = req.params.questionnaireType;
      const companyId = parseInt(req.query.companyId as string) || 1;
      
      if (!employeeId || !questionnaireType) {
        return res.status(400).json({ 
          message: "Employee ID and questionnaire type are required" 
        });
      }
      
      const hasCompleted = await storage.hasCompletedQuestionnaire(employeeId, questionnaireType, companyId);
      const employee = await storage.getEmployee(employeeId);
      
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      res.json({
        canStart: !hasCompleted,
        hasCompleted,
        employee: {
          id: employee.id,
          nombre: employee.nombre,
          apellidos: employee.apellidos,
          area: employee.area
        },
        questionnaireType,
        message: hasCompleted 
          ? `${employee.nombre} ${employee.apellidos} ya ha completado el cuestionario de ${questionnaireType}`
          : `${employee.nombre} ${employee.apellidos} puede realizar el cuestionario de ${questionnaireType}`
      });
    } catch (error) {
      console.error('Error checking questionnaire status:', error);
      res.status(500).json({ message: "Error checking questionnaire status" });
    }
  });
  
  // Get all completed questionnaires for an employee
  app.get("/api/evaluations/completed/:employeeId", async (req, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const companyId = parseInt(req.query.companyId as string) || 1;
      
      if (!employeeId) {
        return res.status(400).json({ message: "Employee ID is required" });
      }
      
      const evaluations = await storage.getEvaluationsByEmployee(employeeId, companyId);
      const completedQuestionnaires = evaluations
        .filter(evaluation => evaluation.completed)
        .map(evaluation => ({
          id: evaluation.id,
          questionnaireType: evaluation.questionnaireType,
          riskLevel: evaluation.riskLevel,
          overallScore: evaluation.overallScore,
          completedAt: evaluation.completedAt,
          createdAt: evaluation.createdAt
        }));
      
      res.json({
        employeeId,
        totalCompleted: completedQuestionnaires.length,
        completedQuestionnaires,
        availableTypes: [
          'microenterprise',
          'guide_i', 
          'guide_ii',
          'guide_iii',
          'traumatic_events'
        ].filter(type => 
          !completedQuestionnaires.some(q => q.questionnaireType === type)
        )
      });
    } catch (error) {
      console.error('Error fetching completed questionnaires:', error);
      res.status(500).json({ message: "Error fetching completed questionnaires" });
    }
  });
}