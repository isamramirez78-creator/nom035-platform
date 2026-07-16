import type { Express } from "express";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { emailService } from "./email-service";
import { authenticateCompany, checkSubscriptionLimits, requireActiveSubscription } from "./auth";
import { registerCompanyRoutes } from "./company-routes";
import { stripeService } from "./stripe-service";
import { 
  insertEmployeeSchema, 
  insertEvaluationSchema,
  insertEmployeeFileSchema,
  insertInterventionSchema,
  insertInterventionNoteSchema,
  insertEmailNotificationSchema,
  insertNotificationSettingSchema
} from "@shared/schema";
import { z } from "zod";
import { registerDuplicateCheckRoutes } from "./routes-evaluations";
import { registerInvitationRoutes } from "./invitation-routes";
import Stripe from "stripe";

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-05-28.basil",
}) : null;

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Stripe subscription routes
  app.post("/api/create-subscription", async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ message: "Stripe not configured" });
    }

    try {
      const { planId, billingCycle } = req.body;
      
      // Create a payment intent for the subscription amount
      const paymentIntent = await stripe.paymentIntents.create({
        amount: getPriceForPlan(planId, billingCycle),
        currency: 'mxn',
        metadata: {
          planId: planId,
          billingCycle: billingCycle,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error: any) {
      console.error('Stripe error:', error);
      res.status(400).json({ error: { message: error.message } });
    }
  });

  // Helper function to get price for plan
  function getPriceForPlan(planId: string, billingCycle: string): number {
    const prices: { [key: string]: number } = {
      'price_starter_monthly': 89900, // $899 MXN in cents
      'price_professional_monthly': 189900, // $1899 MXN in cents
      'price_enterprise_monthly': 349900, // $3499 MXN in cents
      'price_starter_yearly': 809900, // $8099 MXN in cents
      'price_professional_yearly': 1709900, // $17099 MXN in cents
      'price_enterprise_yearly': 3149900, // $31499 MXN in cents
    };
    return prices[planId] || 89900;
  }

  // Employee routes
  app.get("/api/employees", authenticateCompany, async (req, res) => {
    try {
      const companyId = req.company?.id;
      const { db: dbE } = await import("./db.js");
      const { sql: sqlE } = await import("drizzle-orm");
      const result = await dbE.execute(sqlE`SELECT * FROM employees WHERE company_id = ${companyId} ORDER BY created_at DESC`);
      res.json(result.rows);
    } catch (error) { res.status(500).json({ message: "Error fetching employees" }); }
  });

  app.get("/api/employees/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employee = await storage.getEmployee(id);
      if (!employee) {
        return res.status(404).json({ message: "Empleado no encontrado" });
      }
      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: "Error fetching employee" });
    }
  });

  app.post("/api/employees", authenticateCompany, checkSubscriptionLimits, async (req: any, res) => {
    try {
      // Usar parse parcial para permitir campos nuevos no definidos en el schema original
      const body = req.body;
      const companyId = req.company?.id || req.companyId;

      if (!body.nombre || !body.puesto || !body.area || !body.fechaIngreso) {
        return res.status(400).json({ message: "Faltan campos requeridos: nombre, puesto, area, fechaIngreso" });
      }

      // Construir apellidos si vienen separados
      const apellidos = body.apellidos ||
        `${body.apellidoPaterno || ""}${body.apellidoMaterno ? " " + body.apellidoMaterno : ""}`.trim() || "";

      const employee = await storage.createEmployee({
        companyId,
        nombre:           body.nombre,
        apellidos:        apellidos,
        apellidoPaterno:  body.apellidoPaterno  || null,
        apellidoMaterno:  body.apellidoMaterno  || null,
        numeroEmpleado:   body.numeroEmpleado   || null,
        puesto:           body.puesto,
        area:             body.area,
        fechaIngreso:     body.fechaIngreso,
        email:            body.email            || null,
        genero:           body.genero           || null,
        generacion:       body.generacion       || null,
        rfc:              body.rfc              ? body.rfc.toUpperCase()  : null,
        curp:             body.curp             ? body.curp.toUpperCase() : null,
        riskStatus:       "sin-evaluar",
      });
      res.status(201).json(employee);
    } catch (error: any) {
      console.error("Error creating employee:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: error?.message || "Error al crear empleado" });
    }
  });

  app.put("/api/employees/:id", authenticateCompany, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const body = req.body;

      const apellidos = body.apellidos ||
        `${body.apellidoPaterno || ""}${body.apellidoMaterno ? " " + body.apellidoMaterno : ""}`.trim() || undefined;

      const updateData: any = {
        ...(body.nombre         && { nombre: body.nombre }),
        ...(apellidos           && { apellidos }),
        ...(body.apellidoPaterno !== undefined && { apellidoPaterno: body.apellidoPaterno || null }),
        ...(body.apellidoMaterno !== undefined && { apellidoMaterno: body.apellidoMaterno || null }),
        ...(body.numeroEmpleado !== undefined  && { numeroEmpleado: body.numeroEmpleado || null }),
        ...(body.puesto         && { puesto: body.puesto }),
        ...(body.area           && { area: body.area }),
        ...(body.fechaIngreso   && { fechaIngreso: body.fechaIngreso }),
        ...(body.email !== undefined           && { email: body.email || null }),
        ...(body.genero !== undefined          && { genero: body.genero || null }),
        ...(body.generacion !== undefined      && { generacion: body.generacion || null }),
        ...(body.rfc !== undefined             && { rfc: body.rfc ? body.rfc.toUpperCase() : null }),
        ...(body.curp !== undefined            && { curp: body.curp ? body.curp.toUpperCase() : null }),
      };

      const employee = await storage.updateEmployee(id, updateData);
      if (!employee) {
        return res.status(404).json({ message: "Empleado no encontrado" });
      }
      res.json(employee);
    } catch (error: any) {
      console.error("Error updating employee:", error);
      res.status(500).json({ message: error?.message || "Error al actualizar empleado" });
    }
  });

  app.delete("/api/employees/:id", authenticateCompany, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteEmployee(id);
      if (!deleted) {
        return res.status(404).json({ message: "Empleado no encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting employee" });
    }
  });

  // Evaluation routes
  app.get("/api/evaluations", authenticateCompany, async (req, res) => {
    try {
      const companyId = req.company?.id;
      const { db: dbEv } = await import("./db.js");
      const { sql: sqlEv } = await import("drizzle-orm");
      const result = await dbEv.execute(sqlEv`SELECT e.*, emp.nombre, emp.apellidos FROM evaluations e LEFT JOIN employees emp ON emp.id = e.employee_id WHERE e.company_id = ${companyId} ORDER BY e.created_at DESC`);
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error:", error);
    }
  });
  app.get("/api/evaluations/employee/:employeeId", authenticateCompany, async (req, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const companyId = req.company?.id;
      const { db: db2 } = await import("./db.js");
      const { sql: sql2 } = await import("drizzle-orm");
      const result = await db2.execute(sql2`SELECT * FROM evaluations WHERE employee_id = ${employeeId} AND company_id = ${companyId} ORDER BY created_at DESC`);
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ message: "Error fetching employee evaluations" });
    }
  });

  app.post("/api/evaluations", async (req, res) => {
    try {
      // Detectar si es una evaluación pública (sin token de empresa pero con datos de cuestionario)
      const hasCompanyToken = req.headers.authorization?.startsWith('Bearer ');
      const { invitationToken, questionnaireType: qt, answers, results } = req.body;
      
      if (!hasCompanyToken || invitationToken) {
        // Buscar la invitación pendiente más reciente para este tipo de cuestionario
        let invitation: any = null;
        
        if (invitationToken) {
          const invResult = await db.execute(sql`
            SELECT * FROM questionnaire_invitations 
            WHERE access_token = ${invitationToken}
            LIMIT 1
          `);
          invitation = invResult.rows[0];
        } else {
          // Sin token — buscar la invitación pendiente más reciente
          const invResult = await db.execute(sql`
            SELECT * FROM questionnaire_invitations 
            WHERE status = 'pending'
            ORDER BY created_at DESC
            LIMIT 1
          `);
          invitation = invResult.rows[0];
        }

        if (!invitation) {
          return res.status(404).json({ message: "No se encontró una invitación activa" });
        }

        const employeeId = invitation.employee_id;
        const companyId = invitation.company_id;
        const overallScore = parseInt(results?.overallScore || results?.overall_score || 0) || 0;
        const riskLevel = results?.riskLevel || results?.risk_level || 'medio';
        const domainScores = JSON.stringify(results?.domainScores || results?.domain_scores || []);
        const answersJson = JSON.stringify(Array.isArray(answers) ? answers : []);
        const questionnaireType = qt || invitation.questionnaire_type || 'guia3';

        await db.execute(sql`
          INSERT INTO evaluations 
            (employee_id, company_id, questionnaire_type, answers, overall_score, 
             risk_level, "domainScores", completed, completed_at)
          VALUES 
            (${employeeId}::integer, ${companyId}::integer, ${questionnaireType},
             ${answersJson}::jsonb, ${overallScore}::integer, ${riskLevel},
             ${domainScores}::jsonb, true, NOW())
        `);

        await db.execute(sql`
          UPDATE questionnaire_invitations SET status = 'completed', completed_at = NOW()
          WHERE id = ${invitation.id}
        `);

        return res.status(201).json({ success: true, message: "Evaluación guardada" });
      }

      console.log('Raw request body:', JSON.stringify(req.body, null, 2));
      
      // Check if employee has already completed this questionnaire type
      const employeeId = req.body.employeeId;
      const questionnaireType = req.body.questionnaireType;
      const companyId = req.body.companyId || 1;
      
      if (employeeId && questionnaireType) {
        const hasCompleted = await storage.hasCompletedQuestionnaire(employeeId, questionnaireType, companyId);
        if (hasCompleted) {
          return res.status(409).json({ 
            message: "El empleado ya ha completado este tipo de cuestionario",
            error: "QUESTIONNAIRE_ALREADY_COMPLETED",
            questionnaireType: questionnaireType
          });
        }
      }
      
      // Create a deep copy and process answers first
      let processedAnswers = req.body.answers || [];
      
      // Special handling for traumatic events questionnaire - convert boolean to numeric FIRST
      if (req.body.questionnaireType === "traumatic_events" && processedAnswers.length > 0) {
        processedAnswers = processedAnswers.map((answer: any) => {
          const processedAnswer = {
            ...answer,
            value: typeof answer.value === 'boolean' ? (answer.value ? 1 : 0) : Number(answer.value)
          };
          console.log(`Converting answer: ${JSON.stringify(answer)} -> ${JSON.stringify(processedAnswer)}`);
          return processedAnswer;
        });
        console.log('All processed traumatic events answers:', JSON.stringify(processedAnswers, null, 2));
      }
      
      // Map the frontend data to match database schema with processed answers
      const evaluationData = {
        employeeId: req.body.employeeId,
        questionnaireType: req.body.questionnaireType,
        answers: processedAnswers,
        scores: req.body.scores || req.body.domainScores || [],
        riskLevel: req.body.riskLevel || 'sin-riesgo',
        overallScore: req.body.overallScore || 0,
        completed: req.body.completed || false,
        completedAt: req.body.completed ? new Date() : null,
        companyId: req.body.companyId || 1 // Default company for now
      };

      console.log('Final evaluation data before validation:', JSON.stringify(evaluationData, null, 2));
      
      // The schema now handles boolean-to-numeric conversion automatically
      const validated = insertEvaluationSchema.parse(evaluationData);
      const evaluation = await storage.createEvaluation(validated);
      
      // Update employee risk status and last evaluation date if evaluation is completed
      if (evaluation.completed && evaluation.completedAt) {
        await storage.updateEmployee(evaluation.employeeId, {
          riskStatus: evaluation.riskLevel,
          lastEvaluationDate: evaluation.completedAt
        });
      }
      
      // Check if this is a high-risk evaluation and send notification
      if (evaluation.riskLevel === 'alto' || evaluation.riskLevel === 'muy-alto') {
        try {
          const employee = await storage.getEmployee(evaluation.employeeId);
          if (employee) {
            // Get supervisor emails from notification settings
            const supervisorSetting = await storage.getNotificationSetting('supervisor_emails');
            const hrSetting = await storage.getNotificationSetting('hr_emails');
            
            const supervisorEmails = supervisorSetting?.settingValue as string[] || [];
            const hrEmails = hrSetting?.settingValue as string[] || [];
            const allEmails = [...supervisorEmails, ...hrEmails].filter(email => email);
            
            if (allEmails.length > 0) {
              // Create email notification record
              const emailNotification = await storage.createEmailNotification({
                employeeId: employee.id,
                evaluationId: evaluation.id,
                notificationType: 'high_risk_alert',
                recipients: allEmails,
                subject: `⚠️ ATENCIÓN: Empleado con ${evaluation.riskLevel === 'muy-alto' ? 'Riesgo Muy Alto' : 'Riesgo Alto'} - ${employee.nombre} ${employee.apellidos}`,
                status: 'pending'
              });

              // Send the email
              const emailSent = await emailService.sendHighRiskAlert(employee, evaluation, allEmails);
              
              // Update notification status
              await storage.updateEmailNotificationStatus(
                emailNotification.id,
                emailSent ? 'sent' : 'failed',
                emailSent ? new Date() : undefined,
                emailSent ? undefined : 'Failed to send email notification'
              );
            }
          }
        } catch (emailError) {
          console.error('Error sending high-risk notification:', emailError);
          // Don't fail the evaluation creation if email fails
        }
      }
      
      res.status(201).json(evaluation);
    } catch (error) {
      console.error('Evaluation creation error:', error);
      if (error instanceof z.ZodError) {
        console.error('Validation errors:', error.errors);
        return res.status(400).json({ 
          message: "Error de validación", 
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            received: err.received
          }))
        });
      }
      res.status(500).json({ message: "Error creating evaluation" });
    }
  });

  app.put("/api/evaluations/:id", authenticateCompany, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Prepare update data with safe defaults
      const updateData = {
        ...req.body,
        answers: req.body.answers || [],
        domainScores: req.body.domainScores || req.body.scores || [],
        recommendations: req.body.recommendations || [],
        overallScore: req.body.overallScore || 0,
        riskLevel: req.body.riskLevel || 'sin-riesgo'
      };
      
      const validated = insertEvaluationSchema.partial().parse(updateData);
      const evaluation = await storage.updateEvaluation(id, validated);
      if (!evaluation) {
        return res.status(404).json({ message: "Evaluación no encontrada" });
      }
      res.json(evaluation);
    } catch (error) {
      console.error('Evaluation update error:', error);
      if (error instanceof z.ZodError) {
        console.error('Validation errors:', error.errors);
        return res.status(400).json({ 
          message: "Error de validación", 
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            received: err.received
          }))
        });
      }
      res.status(500).json({ message: "Error updating evaluation" });
    }
  });

  // Analytics and stats
  app.get("/api/stats", authenticateCompany, async (req, res) => {
    try {
      const companyId = req.company?.id;
      const { db: dbS } = await import("./db.js");
      const { sql: sqlS } = await import("drizzle-orm");
      const empR = await dbS.execute(sqlS`SELECT COUNT(*) as count FROM employees WHERE company_id = ${companyId}`);
      const evalR = await dbS.execute(sqlS`SELECT COUNT(*) as count FROM evaluations WHERE company_id = ${companyId} AND completed = true`);
      const totalEmp = parseInt(empR.rows[0].count || 0);
      const totalEval = parseInt(evalR.rows[0].count || 0);
      const riskR = await dbS.execute(sqlS`SELECT risk_level, COUNT(*) as count FROM evaluations WHERE company_id = ${companyId} AND completed = true GROUP BY risk_level`);
      const riskDist = riskR.rows.reduce((acc,r) => { acc[r.risk_level]=parseInt(r.count||0); return acc; }, {});
      res.json({ totalEmployees: totalEmp, evaluationsCompleted: totalEval, pendingEvaluations: Math.max(0, totalEmp - totalEval), coveragePercentage: totalEmp > 0 ? Math.round(totalEval / totalEmp * 100) : 0, riskDistribution: riskDist });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.get("/api/employee-files/:employeeId", async (req, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const files = await storage.getEmployeeFiles(employeeId);
      res.json(files);
    } catch (error) {
      console.error("Error fetching employee files:", error);
      res.status(500).json({ message: "Error fetching employee files" });
    }
  });

  app.post("/api/employee-files", async (req, res) => {
    try {
      const validatedData = insertEmployeeFileSchema.parse(req.body);
      const file = await storage.createEmployeeFile(validatedData);
      res.status(201).json(file);
    } catch (error) {
      console.error("Error creating employee file:", error);
      res.status(400).json({ message: "Error creating employee file" });
    }
  });

  // Interventions routes
  app.get("/api/interventions/employee/:employeeId", async (req, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const interventions = await storage.getInterventionsByEmployee(employeeId);
      res.json(interventions);
    } catch (error) {
      console.error("Error fetching interventions:", error);
      res.status(500).json({ message: "Error fetching interventions" });
    }
  });

  app.post("/api/interventions", async (req, res) => {
    try {
      const validatedData = insertInterventionSchema.parse(req.body);
      const intervention = await storage.createIntervention(validatedData);
      res.status(201).json(intervention);
    } catch (error) {
      console.error("Error creating intervention:", error);
      res.status(400).json({ message: "Error creating intervention" });
    }
  });

  // CSV import endpoint
  app.post("/api/employees/import-csv", async (req, res) => {
    try {
      const { employees: employeeData } = req.body;
      const results = [];
      
      for (const empData of employeeData) {
        try {
          const validated = insertEmployeeSchema.parse(empData);
          const employee = await storage.createEmployee(validated);
          results.push({ success: true, employee });
        } catch (error) {
          results.push({ success: false, error: error.message, data: empData });
        }
      }
      
      res.json({ results });
    } catch (error) {
      res.status(500).json({ message: "Error importing CSV data" });
    }
  });

  // Email Notifications routes
  app.get("/api/email-notifications", async (req, res) => {
    try {
      const employeeId = req.query.employeeId ? parseInt(req.query.employeeId as string) : undefined;
      const notifications = await storage.getEmailNotifications(employeeId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching email notifications:", error);
      res.status(500).json({ message: "Error fetching email notifications" });
    }
  });

  app.post("/api/email-notifications", async (req, res) => {
    try {
      const validatedData = insertEmailNotificationSchema.parse(req.body);
      const notification = await storage.createEmailNotification(validatedData);
      res.status(201).json(notification);
    } catch (error) {
      console.error("Error creating email notification:", error);
      res.status(400).json({ message: "Error creating email notification" });
    }
  });

  // Send manual notification
  app.post("/api/send-notification", async (req, res) => {
    try {
      const { employeeId, type, recipients } = req.body;
      const employee = await storage.getEmployee(employeeId);
      
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      let success = false;
      let subject = "";

      switch (type) {
        case 'intervention_reminder':
          // Get the latest intervention for the employee
          const interventions = await storage.getInterventionsByEmployee(employeeId);
          const latestIntervention = interventions.find(i => i.status !== 'completed');
          
          if (latestIntervention) {
            success = await emailService.sendInterventionReminder(employee, latestIntervention, recipients);
            subject = `Recordatorio: Intervención pendiente - ${employee.nombre} ${employee.apellidos}`;
          }
          break;
          
        case 'follow_up_reminder':
          // Get interventions requiring follow-up
          const followUpInterventions = await storage.getInterventionsByEmployee(employeeId);
          const interventionNeedingFollowUp = followUpInterventions.find(i => i.followUpRequired);
          
          if (interventionNeedingFollowUp) {
            success = await emailService.sendFollowUpReminder(employee, interventionNeedingFollowUp, recipients);
            subject = `Seguimiento requerido - ${employee.nombre} ${employee.apellidos}`;
          }
          break;
          
        default:
          return res.status(400).json({ message: "Invalid notification type" });
      }

      // Log the notification
      const notification = await storage.createEmailNotification({
        employeeId,
        notificationType: type,
        recipients,
        subject,
        status: success ? 'sent' : 'failed'
      });

      if (success) {
        await storage.updateEmailNotificationStatus(notification.id, 'sent', new Date());
      } else {
        await storage.updateEmailNotificationStatus(notification.id, 'failed', undefined, 'Manual notification failed');
      }

      res.json({ success, notificationId: notification.id });
    } catch (error) {
      console.error("Error sending manual notification:", error);
      res.status(500).json({ message: "Error sending notification" });
    }
  });

  // Notification Settings routes
  app.get("/api/notification-settings", async (req, res) => {
    try {
      const settings = await storage.getNotificationSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching notification settings:", error);
      res.status(500).json({ message: "Error fetching notification settings" });
    }
  });

  app.post("/api/notification-settings", async (req, res) => {
    try {
      const validatedData = insertNotificationSettingSchema.parse(req.body);
      const setting = await storage.createOrUpdateNotificationSetting(validatedData);
      res.status(201).json(setting);
    } catch (error) {
      console.error("Error creating/updating notification setting:", error);
      res.status(400).json({ message: "Error creating/updating notification setting" });
    }
  });

  // Stripe payment routes
  app.post("/api/payments/create-subscription", authenticateCompany, async (req: any, res) => {
    try {
      const { planId, billingCycle } = req.body;
      const company = req.company;

      if (!planId || !billingCycle) {
        return res.status(400).json({ message: "Plan ID and billing cycle are required" });
      }

      // Create Stripe customer if not exists
      let customerId = company.stripeCustomerId;
      if (!customerId) {
        customerId = await stripeService.createCustomer({
          email: company.correoElectronico,
          name: company.nombreEmpresa,
          rfc: company.rfc,
          address: company.domicilio,
        });

        if (customerId) {
          await storage.updateCompanySubscription(company.id, {
            stripeCustomerId: customerId,
          });
        }
      }

      if (!customerId) {
        return res.status(500).json({ message: "Error creating payment customer" });
      }

      // Create subscription
      const subscription = await stripeService.createSubscription(customerId, planId, billingCycle);
      
      if (!subscription) {
        return res.status(500).json({ message: "Error creating subscription" });
      }

      // Update company subscription info
      await storage.updateCompanySubscription(company.id, {
        stripeSubscriptionId: subscription.subscriptionId,
        subscriptionPlan: planId,
        subscriptionStatus: 'pending_payment',
      });

      res.json({
        subscriptionId: subscription.subscriptionId,
        clientSecret: subscription.clientSecret,
        status: subscription.status,
      });
    } catch (error) {
      console.error('Create subscription error:', error);
      res.status(500).json({ message: "Error creating subscription" });
    }
  });

  app.post("/api/payments/update-subscription", authenticateCompany, async (req: any, res) => {
    try {
      const { planId, billingCycle } = req.body;
      const company = req.company;

      if (!company.stripeSubscriptionId) {
        return res.status(400).json({ message: "No active subscription found" });
      }

      const success = await stripeService.updateSubscription(
        company.stripeSubscriptionId,
        planId,
        billingCycle
      );

      if (success) {
        await storage.updateCompanySubscription(company.id, {
          subscriptionPlan: planId,
        });
        res.json({ message: "Subscription updated successfully" });
      } else {
        res.status(500).json({ message: "Error updating subscription" });
      }
    } catch (error) {
      console.error('Update subscription error:', error);
      res.status(500).json({ message: "Error updating subscription" });
    }
  });

  app.post("/api/payments/cancel-subscription", authenticateCompany, async (req: any, res) => {
    try {
      const { immediately } = req.body;
      const company = req.company;

      if (!company.stripeSubscriptionId) {
        return res.status(400).json({ message: "No active subscription found" });
      }

      const success = await stripeService.cancelSubscription(
        company.stripeSubscriptionId,
        immediately
      );

      if (success) {
        const newStatus = immediately ? 'cancelled' : 'cancel_at_period_end';
        await storage.updateCompanySubscription(company.id, {
          subscriptionStatus: newStatus,
        });
        res.json({ message: "Subscription cancelled successfully" });
      } else {
        res.status(500).json({ message: "Error cancelling subscription" });
      }
    } catch (error) {
      console.error('Cancel subscription error:', error);
      res.status(500).json({ message: "Error cancelling subscription" });
    }
  });

  app.get("/api/payments/subscription-status", authenticateCompany, async (req: any, res) => {
    try {
      const company = req.company;

      if (!company.stripeSubscriptionId) {
        return res.json({
          hasSubscription: false,
          plan: company.subscriptionPlan,
          status: company.subscriptionStatus,
        });
      }

      const stripeStatus = await stripeService.getSubscriptionStatus(company.stripeSubscriptionId);
      
      if (stripeStatus) {
        // Update local status if different
        if (stripeStatus.status !== company.subscriptionStatus) {
          await storage.updateCompanySubscription(company.id, {
            subscriptionStatus: stripeStatus.status,
          });
        }

        res.json({
          hasSubscription: true,
          plan: company.subscriptionPlan,
          status: stripeStatus.status,
          currentPeriodEnd: stripeStatus.currentPeriodEnd,
          cancelAtPeriodEnd: stripeStatus.cancelAtPeriodEnd,
          stripeStatus,
        });
      } else {
        res.json({
          hasSubscription: false,
          plan: company.subscriptionPlan,
          status: company.subscriptionStatus,
        });
      }
    } catch (error) {
      console.error('Get subscription status error:', error);
      res.status(500).json({ message: "Error fetching subscription status" });
    }
  });

  // Stripe webhooks
  app.post("/api/webhooks/stripe", async (req, res) => {
    try {
      const signature = req.headers['stripe-signature'] as string;
      const payload = req.body;

      const success = await stripeService.handleWebhook(signature, payload);
      
      if (success) {
        res.status(200).json({ received: true });
      } else {
        res.status(400).json({ error: "Webhook processing failed" });
      }
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(400).json({ error: "Webhook processing failed" });
    }
  });

  // Employee template and import routes (public for download)
  app.get("/api/employees/template/:format", async (req, res) => {
    try {
      const format = req.params.format as 'excel' | 'csv';
      
      if (format === 'csv') {
        // Generate CSV template with detailed examples
        const csvHeaders = [
          'nombre',
          'apellidos', 
          'email',
          'puesto',
          'area',
          'fechaIngreso'
        ];
        
        const csvContent = [
          csvHeaders.join(','),
          '# PLANTILLA DE IMPORTACIÓN DE EMPLEADOS',
          '# Completa los datos siguiendo los ejemplos. No elimines esta línea de encabezados.',
          '# ÁREAS VÁLIDAS: administracion, operaciones, ventas, recursos-humanos, finanzas, tecnologia, produccion',
          '# FORMATO DE FECHA: DD/MM/AAAA (ejemplo: 15/03/2024)',
          '# EJEMPLOS:',
          'Juan,Pérez García,juan.perez@empresa.com,Analista de Sistemas,tecnologia,15/01/2024',
          'María,López Rodríguez,maria.lopez@empresa.com,Gerente de Operaciones,operaciones,01/03/2024',
          'Carlos,Martínez Sánchez,carlos.martinez@empresa.com,Contador Senior,administracion,10/02/2024',
          'Ana,Fernández Torres,ana.fernandez@empresa.com,Ejecutiva de Ventas,ventas,22/04/2024',
          'Roberto,Gómez Herrera,roberto.gomez@empresa.com,Supervisor de Producción,produccion,05/05/2024',
          '# Elimina estas líneas de ejemplo y agrega tus empleados debajo'
        ].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=plantilla-empleados.csv');
        res.send(csvContent);
      } else if (format === 'excel') {
        // For Excel, we'll create a simple CSV that can be opened in Excel
        // In a real implementation, you'd use a library like 'exceljs'
        const csvHeaders = [
          'nombre',
          'apellidos',
          'email', 
          'puesto',
          'area',
          'fechaIngreso'
        ];
        
        const csvContent = [
          csvHeaders.join(','),
          'Juan,Pérez García,juan.perez@empresa.com,Analista,administracion,01/01/2024',
          'María,López Rodríguez,maria.lopez@empresa.com,Gerente,operaciones,15/03/2024'
        ].join('\n');
        
        res.setHeader('Content-Type', 'application/vnd.ms-excel');
        res.setHeader('Content-Disposition', 'attachment; filename=plantilla-empleados.xlsx');
        res.send(csvContent);
      } else {
        res.status(400).json({ message: "Format not supported" });
      }
    } catch (error) {
      console.error('Template generation error:', error);
      res.status(500).json({ message: "Error generating template" });
    }
  });

  app.post("/api/employees/import", authenticateCompany, async (req: any, res) => {
    try {
      const companyId = req.company?.id || req.companyId;
      const { employees } = req.body;

      if (!Array.isArray(employees) || employees.length === 0) {
        return res.status(400).json({ message: "No hay empleados para importar" });
      }

      let imported = 0;
      let errors = 0;
      const errorList: string[] = [];

      for (const emp of employees) {
        try {
          const nombre        = emp.nombre        || emp.Nombre        || "";
          let apPat           = emp.apellido_paterno || emp.apellidoPaterno || emp["Apellido Paterno"] || "";
          let apMat           = emp.apellido_materno || emp.apellidoMaterno || emp["Apellido Materno"] || "";

          // Compatibilidad con columna "apellidos" unificada
          if (!apPat && (emp.apellidos || emp.Apellidos)) {
            const parts = (emp.apellidos || emp.Apellidos || "").split(" ");
            apPat = parts[0] || "";
            apMat = parts.slice(1).join(" ") || "";
          }

          const apellidos     = `${apPat}${apMat ? " " + apMat : ""}`.trim();
          const puesto        = emp.puesto        || emp.Puesto        || "";
          const area          = emp.area          || emp.Area          || emp["Área"] || "";
          const fechaIngreso  = emp.fecha_ingreso || emp.fechaIngreso  || emp["Fecha Ingreso"] || "";
          const email         = emp.email         || emp.Email         || null;
          const rfc           = emp.rfc           || emp.RFC           || null;
          const curp          = emp.curp          || emp.CURP          || null;
          const genero        = emp.genero        || emp["Género"]     || null;
          const generacion    = emp.generacion    || emp["Generación"] || null;
          const numeroEmpleado = emp.numero_empleado || emp.numeroEmpleado || emp["Número Empleado"] || null;

          if (!nombre || !apPat || !puesto || !area || !fechaIngreso) {
            errorList.push(`Fila incompleta — nombre: ${nombre || "(vacío)"}, apellido: ${apPat || "(vacío)"}`);
            errors++;
            continue;
          }

          await storage.createEmployee({
            companyId,
            nombre,
            apellidos,
            apellidoPaterno: apPat,
            apellidoMaterno: apMat || null,
            puesto,
            area,
            fechaIngreso,
            email:          email         || null,
            numeroEmpleado: numeroEmpleado || null,
            rfc:            rfc   ? rfc.toUpperCase()  : null,
            curp:           curp  ? curp.toUpperCase() : null,
            genero:         genero        || null,
            generacion:     generacion    || null,
            riskStatus:     "sin-evaluar",
          });
          imported++;
        } catch (rowErr: any) {
          errors++;
          errorList.push(rowErr?.message || "Error en fila");
        }
      }

      res.json({ imported, errors, errorList: errorList.slice(0, 10) });
    } catch (error) {
      console.error("Import error:", error);
      res.status(500).json({ message: "Error al importar empleados" });
    }
  });
  app.get("/api/reports", authenticateCompany, async (req: any, res) => {
    try {
      // Return empty array for now - in production this would fetch saved reports
      res.json([]);
    } catch (error) {
      console.error('Get reports error:', error);
      res.status(500).json({ message: "Error fetching reports" });
    }
  });

  app.post("/api/reports/generate", authenticateCompany, async (req, res) => {
    try {
      const { templateId, filters, customConfig } = req.body;

      // Get all evaluations and employees for report generation
      const companyId2 = req.company?.id;
      const { db: dbR } = await import("./db.js");
      const { sql: sqlR } = await import("drizzle-orm");
      const evalRows = await dbR.execute(sqlR`SELECT * FROM evaluations WHERE company_id = ${companyId2}`);
      const empRows = await dbR.execute(sqlR`SELECT * FROM employees WHERE company_id = ${companyId2}`);
      const evaluations = evalRows.rows;
      const employees = empRows.rows;
      
      // Filter evaluations based on criteria
      let filteredEvaluations = evaluations;
      
      if (filters?.riskLevel) {
        filteredEvaluations = filteredEvaluations.filter(evaluation => evaluation.riskLevel === filters.riskLevel);
      }
      
      if (filters?.dateFrom || filters?.dateTo) {
        filteredEvaluations = filteredEvaluations.filter(evaluation => {
          const evalDate = new Date(evaluation.createdAt);
          let inRange = true;
          
          if (filters.dateFrom) {
            inRange = inRange && evalDate >= new Date(filters.dateFrom);
          }
          
          if (filters.dateTo) {
            inRange = inRange && evalDate <= new Date(filters.dateTo);
          }
          
          return inRange;
        });
      }

      // Generate comprehensive report data
      const reportData = {
        templateId,
        reportId: `report_${Date.now()}`,
        status: 'completed',
        generatedAt: new Date().toISOString(),
        filters,
        data: {
          evaluations: filteredEvaluations,
          employees,
          summary: {
            totalEvaluations: filteredEvaluations.length,
            totalEmployees: employees.length,
            evaluationsByQuestionnaireType: filteredEvaluations.reduce((acc, evaluation) => {
              acc[evaluation.questionnaireType] = (acc[evaluation.questionnaireType] || 0) + 1;
              return acc;
            }, {} as Record<string, number>),
            riskDistribution: filteredEvaluations.reduce((acc, evaluation) => {
              acc[evaluation.riskLevel] = (acc[evaluation.riskLevel] || 0) + 1;
              return acc;
            }, {} as Record<string, number>),
            areaDistribution: employees.reduce((acc, emp) => {
              acc[emp.area || 'Sin área'] = (acc[emp.area || 'Sin área'] || 0) + 1;
              return acc;
            }, {} as Record<string, number>),
            highRiskEmployees: filteredEvaluations.filter(evaluation => 
              evaluation.riskLevel === 'alto' || evaluation.riskLevel === 'muy-alto'
            ).length,
            complianceMetrics: {
              evaluationCoverage: employees.length > 0 ? 
                (filteredEvaluations.length / employees.length * 100).toFixed(1) : '0',
              lastEvaluationDate: filteredEvaluations.length > 0 ? 
                Math.max(...filteredEvaluations.map(evaluation => new Date(evaluation.createdAt).getTime())) : null,
              pendingEvaluations: employees.length - filteredEvaluations.length,
              complianceStatus: employees.length > 0 && (filteredEvaluations.length / employees.length * 100) >= 80 ? 'compliant' : 'non-compliant'
            }
          }
        }
      };

      res.json(reportData);
    } catch (error) {
      console.error('Generate report error:', error);
      res.status(500).json({ message: "Error generating report" });
    }
  });

  // Company profile alias
  app.get("/api/companies/profile", authenticateCompany, async (req: any, res) => {
    try {
      const companyId = req.company?.id;
      const company = await storage.getCompanyById(companyId);
      res.json(company);
    } catch (error) {
      res.status(500).json({ message: "Error fetching company profile" });
    }
  });

  // Compliance metrics endpoint
  app.get("/api/compliance/metrics", authenticateCompany, async (req, res) => {
    try {
      const companyId3 = req.company?.id; const { db: dbC } = await import("./db.js"); const { sql: sqlC } = await import("drizzle-orm"); const empC = await dbC.execute(sqlC`SELECT * FROM employees WHERE company_id = ${companyId3}`); const employees = empC.rows;
      const evalC = await dbC.execute(sqlC`SELECT * FROM evaluations WHERE company_id = ${companyId3}`); const evaluations = evalC.rows;
      const completed = evaluations.filter(e => e.completed);

      const riskCounts = completed.reduce((acc: any, e) => {
        acc[e.riskLevel || 'sin-riesgo'] = (acc[e.riskLevel || 'sin-riesgo'] || 0) + 1;
        return acc;
      }, {});

      // Build area compliance
      const areas = [...new Set(employees.map(e => e.area || 'Sin área'))];
      const areaCompliance = areas.map(area => {
        const areaEmps = employees.filter(e => (e.area || 'Sin área') === area);
        const areaEvals = completed.filter(ev => {
          const emp = employees.find(e => e.id === ev.employeeId);
          return emp && (emp.area || 'Sin área') === area;
        });
        const avgRiskScore = areaEvals.length > 0
          ? areaEvals.reduce((s, e) => s + (e.totalScore || 0), 0) / areaEvals.length
          : 0;
        const avgRisk = avgRiskScore >= 75 ? 'muy-alto' : avgRiskScore >= 50 ? 'alto' : avgRiskScore >= 30 ? 'medio' : avgRiskScore >= 15 ? 'bajo' : 'sin-riesgo';
        return {
          area,
          total: areaEmps.length,
          evaluated: areaEvals.length,
          compliance: areaEmps.length > 0 ? Math.round(areaEvals.length / areaEmps.length * 100) : 0,
          avgRisk
        };
      });

      // Monthly trends (last 6 months)
      const monthlyTrends = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        const monthName = d.toLocaleString('es-MX', { month: 'short', year: 'numeric' });
        const count = completed.filter(e => {
          const ed = new Date(e.createdAt);
          return ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear();
        }).length;
        return {
          month: monthName,
          evaluations: count,
          compliance: employees.length > 0 ? Math.round(count / employees.length * 100) : 0,
          incidents: completed.filter(e => {
            const ed = new Date(e.createdAt);
            return ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear() &&
              (e.riskLevel === 'alto' || e.riskLevel === 'muy-alto');
          }).length
        };
      });

      const lastEval = completed.length > 0
        ? new Date(Math.max(...completed.map(e => new Date(e.createdAt).getTime())))
        : null;
      const nextDeadline = new Date();
      nextDeadline.setMonth(nextDeadline.getMonth() + 3);

      res.json({
        totalEmployees: employees.length,
        evaluatedEmployees: completed.length,
        pendingEvaluations: Math.max(0, employees.length - completed.length),
        complianceRate: employees.length > 0 ? Math.round(completed.length / employees.length * 100) : 0,
        highRiskEmployees: (riskCounts['alto'] || 0) + (riskCounts['muy-alto'] || 0),
        lastEvaluationDate: lastEval ? lastEval.toISOString() : null,
        nextDeadline: nextDeadline.toISOString(),
        riskDistribution: {
          sinRiesgo: riskCounts['sin-riesgo'] || 0,
          bajo: riskCounts['bajo'] || 0,
          medio: riskCounts['medio'] || 0,
          alto: riskCounts['alto'] || 0,
          muyAlto: riskCounts['muy-alto'] || 0,
        },
        areaCompliance,
        monthlyTrends
      });
    } catch (error) {
      console.error('Compliance metrics error:', error);
      res.status(500).json({ message: "Error fetching compliance metrics" });
    }
  });

  // NOM-035 Compliance endpoints
  app.get("/api/company-info", authenticateCompany, async (req, res) => {
    try {
      // En un entorno real, esto vendría de la sesión autenticada
      const companyId = req.company?.id;
      const company = await storage.getCompanyById(companyId);
      res.json(company);
    } catch (error) {
      console.error('Get company info error:', error);
      res.status(500).json({ message: "Error fetching company info" });
    }
  });

  app.get("/api/compliance/nom035-status", authenticateCompany, async (req, res) => {
    try {
      // Calcular estado de cumplimiento NOM-035
      const companyId = req.company?.id;
      const company = await storage.getCompanyById(companyId);
      const companyId4 = req.company?.id; const { db: dbN } = await import("./db.js"); const { sql: sqlN } = await import("drizzle-orm"); const empN = await dbN.execute(sqlN`SELECT * FROM employees WHERE company_id = ${companyId4}`); const employees = empN.rows;
      const evalN = await dbN.execute(sqlN`SELECT * FROM evaluations WHERE company_id = ${companyId4}`); const evaluations = evalN.rows;
      
      const complianceStatus = {
        companySize: employees.length,
        hasPolicy: !!company?.politicaPrevencionRiesgos,
        evaluationsCompleted: evaluations.filter(e => e.completed).length,
        totalEmployees: employees.length,
        lastEvaluationDate: evaluations.length > 0 ? 
          Math.max(...evaluations.map(e => new Date(e.createdAt).getTime())) : null,
        nextEvaluationDue: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año desde ahora
        compliancePercentage: company?.politicaPrevencionRiesgos ? 60 : 20
      };
      
      res.json(complianceStatus);
    } catch (error) {
      console.error('Get compliance status error:', error);
      res.status(500).json({ message: "Error fetching compliance status" });
    }
  });

  app.post("/api/compliance/update", async (req, res) => {
    try {
      const { type, data } = req.body;
      const companyId = req.company?.id;
      
      if (type === 'policy') {
        await storage.updateCompany(companyId, {
          politicaPrevencionRiesgos: data.politicaPrevencionRiesgos,
          fechaVigenciaPolitica: new Date()
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Update compliance error:', error);
      res.status(500).json({ message: "Error updating compliance" });
    }
  });

  // Individual report generation
  app.post("/api/reports/individual", async (req, res) => {
    try {
      const { evaluation, employee } = req.body;
      
      if (!evaluation || !employee) {
        return res.status(400).json({ message: "Evaluation and employee data are required" });
      }

      const reportData = {
        reportId: `individual_${Date.now()}`,
        generatedAt: new Date().toISOString(),
        type: 'individual',
        evaluation,
        employee
      };

      res.json(reportData);
    } catch (error) {
      console.error('Generate individual report error:', error);
      res.status(500).json({ message: "Error generating individual report" });
    }
  });

  // Questionnaire invitation routes
  app.post("/api/questionnaire-invitations", authenticateCompany, async (req: any, res) => {
    try {
      const companyId = req.company?.id;
      const { employeeIds, questionnaireType, customMessage, expirationDays } = req.body;

      if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
        return res.status(400).json({ message: "Selecciona al menos un empleado" });
      }

      const invitations = [];
      const baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;

      for (const employeeId of employeeIds) {
        const accessToken = `inv_${companyId}_${employeeId}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + (expirationDays || 10));

        const invResult = await db.execute(sql`
          INSERT INTO questionnaire_invitations
            (employee_id, company_id, questionnaire_type, access_token, invited_by, expires_at, status, custom_message)
          VALUES
            (${employeeId}, ${companyId}, ${questionnaireType || 'guia3'}, ${accessToken},
             ${req.company.correoElectronico || 'admin'}, ${expiresAt.toISOString()}, 'pending', ${customMessage || null})
          RETURNING *
        `);
        const invitation = invResult.rows[0];
        invitations.push(invitation);

        // Intentar enviar email usando SMTP de la empresa
        const employee = await storage.getEmployee(employeeId);
        const company = req.company;
        const link = `${baseUrl}/cuestionario/${accessToken}`;

        if (employee?.email && company.smtp_enabled && company.smtp_host && company.smtp_user && company.smtp_password) {
          try {
            const emailHtml = `
              <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:20px">
                <div style="background:#1E3A5F;padding:20px;border-radius:8px;margin-bottom:20px">
                  <h2 style="color:white;margin:0">NOM-035-STPS</h2>
                  <p style="color:#84CC16;margin:4px 0 0;font-size:13px">Evaluación de Factores de Riesgo Psicosocial</p>
                </div>
                <p>Estimado/a <strong>${employee.nombre} ${employee.apellidos || ""}</strong>,</p>
                <p>Te invitamos a completar el cuestionario de evaluación de riesgos psicosociales conforme a la <strong>NOM-035-STPS-2018</strong>.</p>
                ${customMessage ? `<p style="background:#F8FAFC;padding:12px;border-radius:8px;border-left:4px solid #84CC16">${customMessage}</p>` : ""}
                <div style="text-align:center;margin:30px 0">
                  <a href="${link}" style="background:#1E3A5F;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
                    Completar cuestionario →
                  </a>
                </div>
                <p style="color:#64748B;font-size:13px">Este enlace es válido hasta el ${expiresAt.toLocaleDateString("es-MX")}.</p>
                <p style="color:#64748B;font-size:12px">Si el botón no funciona, copia este link: ${link}</p>
              </div>`;

            await sendEmail({
              host: company.smtp_host, port: company.smtp_port || 587,
              user: company.smtp_user, password: company.smtp_password,
              fromName: company.smtp_from_name || company.razon_social || "RRHH",
              fromEmail: company.smtp_user,
            }, employee.email, "Invitación — Cuestionario NOM-035-STPS", emailHtml);
          } catch (emailErr) {
            console.warn("SMTP send failed:", emailErr);
          }
        }
      }

      res.status(201).json(invitations);
    } catch (error: any) {
      console.error("Error creating invitations:", error);
      res.status(500).json({ message: error?.message || "Error al crear invitaciones" });
    }
  });

  app.get("/api/questionnaire-invitations", authenticateCompany, async (req: any, res) => {
    try {
      const rows = await db.execute(sql`
        SELECT qi.*, e.nombre, e.apellidos, e.apellido_paterno, e.area, e.email
        FROM questionnaire_invitations qi
        LEFT JOIN employees e ON e.id = qi.employee_id
        WHERE qi.company_id = ${req.company.id}
        ORDER BY qi.created_at DESC
      `);
      res.json(rows.rows);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      res.status(500).json({ message: "Error al obtener invitaciones" });
    }
  });

  app.post("/api/questionnaire-invitations/:id/resend", authenticateCompany, async (req: any, res) => {
    try {
      res.json({ message: "Link disponible para copiar manualmente" });
    } catch (error) {
      res.status(500).json({ message: "Error" });
    }
  });

  // Validar qué guías puede usar la empresa según plan y número de trabajadores
  app.get("/api/company/questionnaire-access", authenticateCompany, async (req: any, res) => {
    try {
      const company = req.company;
      const numEmpleados = company.cantidadEmpleados || company.cantidad_empleados || 0;
      const plan = company.subscriptionPlan || company.subscription_plan || 'trial';
      const isAdmin = company.isAdmin || company.is_admin;

      // Guía I — todos (acontec. traumáticos severos)
      // Guía II — 16-50 trabajadores
      // Guía III — más de 50 trabajadores
      const access = {
        guia1: true, // siempre disponible
        guia2: isAdmin || numEmpleados >= 16 || ['professional', 'enterprise'].includes(plan),
        guia3: isAdmin || numEmpleados > 50  || plan === 'enterprise',
        maxEmployees: company.maxEmployees || company.max_employees || 5,
        plan,
        numEmpleados,
      };
      res.json(access);
    } catch (err) {
      res.status(500).json({ message: "Error" });
    }
  });

  // Endpoint que usa el frontend público del cuestionario
  app.get("/api/questionnaire-invitations/verify/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const result = await db.execute(sql`
        SELECT qi.*, e.nombre, e.apellidos, e.apellido_paterno, e.apellido_materno,
               e.puesto, e.area, e.email, e.rfc, e.curp, e.numero_empleado
        FROM questionnaire_invitations qi
        LEFT JOIN employees e ON e.id = qi.employee_id
        WHERE qi.access_token = ${token}
        LIMIT 1
      `);

      const inv = result.rows[0] as any;
      if (!inv) return res.status(404).json({ message: "Enlace no válido" });
      // No rechazar si ya fue completado — mostrar pantalla de éxito
      if (inv.expires_at && inv.status !== 'completed' && new Date() > new Date(inv.expires_at)) {
        return res.status(400).json({ message: "Enlace expirado" });
      }

      res.json({
        id: inv.id,
        accessToken: inv.access_token,
        questionnaireType: inv.questionnaire_type,
        status: inv.status,
        expiresAt: inv.expires_at,
        customMessage: inv.custom_message,
        companyId: inv.company_id,
        employee: {
          id: inv.employee_id,
          nombre: inv.nombre,
          apellidos: inv.apellidos || `${inv.apellido_paterno || ''} ${inv.apellido_materno || ''}`.trim(),
          puesto: inv.puesto,
          area: inv.area,
          email: inv.email,
        },
      });
    } catch (error) {
      console.error("Error verifying invitation:", error);
      res.status(500).json({ message: "Error al verificar el enlace" });
    }
  });

  app.get("/api/questionnaire/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const result = await db.execute(sql`
        SELECT qi.*, e.nombre, e.apellidos, e.apellido_paterno, e.apellido_materno,
               e.puesto, e.area, e.email, e.rfc, e.curp, e.numero_empleado
        FROM questionnaire_invitations qi
        LEFT JOIN employees e ON e.id = qi.employee_id
        WHERE qi.access_token = ${token}
        LIMIT 1
      `);

      const invitation = result.rows[0] as any;

      if (!invitation) {
        return res.status(404).json({ message: "Enlace no válido o no encontrado" });
      }

      if (invitation.status === 'completed') {
        return res.status(400).json({ message: "Este cuestionario ya fue completado" });
      }

      // Solo validar expiración si expires_at tiene valor
      if (invitation.expires_at && new Date() > new Date(invitation.expires_at)) {
        await db.execute(sql`UPDATE questionnaire_invitations SET status = 'expired' WHERE access_token = ${token}`);
        return res.status(400).json({ message: "Este enlace ha expirado" });
      }

      res.json({
        invitation: {
          id: invitation.id,
          accessToken: invitation.access_token,
          questionnaireType: invitation.questionnaire_type,
          status: invitation.status,
          expiresAt: invitation.expires_at,
          customMessage: invitation.custom_message,
        },
        employee: {
          id: invitation.employee_id,
          nombre: invitation.nombre,
          apellidos: invitation.apellidos || `${invitation.apellido_paterno || ''} ${invitation.apellido_materno || ''}`.trim(),
          puesto: invitation.puesto,
          area: invitation.area,
          email: invitation.email,
          rfc: invitation.rfc,
          curp: invitation.curp,
          numeroEmpleado: invitation.numero_empleado,
        },
        questionnaireType: invitation.questionnaire_type,
      });
    } catch (error) {
      console.error("Error validating invitation:", error);
      res.status(500).json({ message: "Error al validar el enlace" });
    }
  });

  // Endpoint público para guardar evaluación desde cuestionario público
  // No requiere login - usa el invitationToken como verificación
  app.post("/api/evaluations/public", async (req, res) => {
    try {
      const { employeeId: bodyEmployeeId, questionnaireType, answers, results, invitationToken } = req.body;

      if (!invitationToken) {
        return res.status(400).json({ message: "Token de invitación requerido" });
      }

      // Verificar token y obtener datos reales de la invitación
      const invResult = await db.execute(sql`
        SELECT * FROM questionnaire_invitations 
        WHERE access_token = ${invitationToken} AND status = 'pending'
        LIMIT 1
      `);

      const invitation = invResult.rows[0] as any;
      if (!invitation) {
        return res.status(404).json({ message: "Invitación no válida o ya completada" });
      }

      // Usar employee_id de la invitación (más confiable que el del body)
      const employeeId = invitation.employee_id || bodyEmployeeId;
      const companyId = invitation.company_id;

      if (!employeeId) {
        return res.status(400).json({ message: "No se pudo identificar al empleado" });
      }

      // Guardar evaluación usando columnas reales de la tabla
      const overallScore = parseInt(results?.overallScore || results?.overall_score || 0);
      const riskLevel = results?.riskLevel || results?.risk_level || 'medio';
      const domainScores = JSON.stringify(results?.domainScores || results?.domain_scores || []);
      const answersJson = JSON.stringify(Array.isArray(answers) ? answers : []);

      const evalResult = await db.execute(sql`
        INSERT INTO evaluations 
          (employee_id, company_id, questionnaire_type, answers, overall_score, 
           risk_level, "domainScores", completed, completed_at)
        VALUES 
          (${employeeId}::integer, ${companyId}::integer, ${questionnaireType},
           ${answersJson}::jsonb,
           ${overallScore}::integer,
           ${riskLevel},
           ${domainScores}::jsonb,
           true, NOW())
        RETURNING *
      `);

      // Marcar invitación como completada
      await db.execute(sql`
        UPDATE questionnaire_invitations 
        SET status = 'completed', completed_at = NOW()
        WHERE access_token = ${invitationToken}
      `);

      res.status(201).json({ 
        success: true, 
        message: "Evaluación guardada correctamente",
        evaluation: evalResult.rows[0]
      });
    } catch (error: any) {
      console.error("Error saving public evaluation:", error);
      res.status(500).json({ message: error?.message || "Error al guardar la evaluación" });
    }
  });

  app.post("/api/questionnaire/:token/complete", async (req, res) => {
    try {
      const { token } = req.params;
      const evaluationData = req.body;
      
      const invitation = await storage.getQuestionnaireInvitation(token);
      
      if (!invitation) {
        return res.status(404).json({ message: "Invalid invitation token" });
      }

      if (invitation.status === 'completed') {
        return res.status(400).json({ message: "Questionnaire already completed" });
      }

      if (new Date() > new Date(invitation.expiresAt)) {
        await storage.updateQuestionnaireInvitationStatus(invitation.id, 'expired');
        return res.status(400).json({ message: "Invitation has expired" });
      }

      // Create evaluation
      const evaluation = await storage.createEvaluation({
        ...evaluationData,
        employeeId: invitation.employeeId,
        questionnaireType: invitation.questionnaireType,
        completed: true
      });

      // Mark invitation as completed
      await storage.updateQuestionnaireInvitationStatus(invitation.id, 'completed', new Date());

      res.status(201).json({ 
        message: "Questionnaire completed successfully",
        evaluation 
      });
    } catch (error) {
      console.error("Error completing questionnaire:", error);
      res.status(500).json({ message: "Error completing questionnaire" });
    }
  });

  // Register company authentication routes
  registerCompanyRoutes(app);
  
  // Register other module routes
  registerDuplicateCheckRoutes(app);
  registerInvitationRoutes(app);

  const httpServer = createServer(app);
  // ── Expedientes de trabajadores en riesgo ──────────────────────────────────
  // ── Rutas adicionales ──────────────────────────────────────────────────────
  try {
    const { registerExpedienteRoutes } = await import("./expediente-routes.js");
    registerExpedienteRoutes(app);
  } catch(e) { console.error("expediente-routes error:", e); }

  try {
    const { registerComplianceRoutes } = await import("./compliance-routes.js");
    registerComplianceRoutes(app);
  } catch(e) { console.error("compliance-routes error:", e); }

  return httpServer;
}
