import type { Express } from "express";
import { createServer, type Server } from "http";
import ExcelJS from "exceljs";
import { storage } from "./storage";
import { emailService } from "./email-service";
import { authenticateCompany, checkSubscriptionLimits, requireActiveSubscription } from "./auth";
import { registerCompanyRoutes } from "./company-routes";
import { stripeService } from "./stripe-service";
import { mercadoPagoService } from "./mercadopago-service";
import { companyStorage } from "./company-storage";
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

  // ── Health check (Railway) ───────────────────────────────────────────────
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

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
  app.get("/api/employees", async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Error fetching employees" });
    }
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
      const validated = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee({
        ...validated,
        companyId: req.companyId
      });
      res.status(201).json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating employee" });
    }
  });

  app.put("/api/employees/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validated = insertEmployeeSchema.partial().parse(req.body);
      const employee = await storage.updateEmployee(id, validated);
      if (!employee) {
        return res.status(404).json({ message: "Empleado no encontrado" });
      }
      res.json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating employee" });
    }
  });

  app.delete("/api/employees/:id", async (req, res) => {
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
  app.get("/api/evaluations", async (req, res) => {
    try {
      const evaluations = await storage.getAllEvaluations();
      res.json(evaluations);
    } catch (error) {
      console.error("Error fetching evaluations:", error);
      res.status(500).json({ message: "Error fetching evaluations" });
    }
  });

  app.get("/api/evaluations/employee/:employeeId", async (req, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const evaluations = await storage.getEvaluationsByEmployee(employeeId);
      res.json(evaluations);
    } catch (error) {
      res.status(500).json({ message: "Error fetching employee evaluations" });
    }
  });

  app.post("/api/evaluations", async (req, res) => {
    try {
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
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getEvaluationStats();
      res.json(stats);
    } catch (error) {
      console.error("Stats error:", error);
      res.status(500).json({ message: "Error fetching statistics", error: error.message });
    }
  });

  // Employee Files routes
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

  // ── Mercado Pago — Suscripciones recurrentes ──────────────────────────────

  // Crear link de suscripción (la empresa elige plan en /subscription-plans)
  app.post("/api/mercadopago/create-subscription", authenticateCompany, async (req: any, res) => {
    try {
      const { planId } = req.body;
      const company = req.company;

      if (!planId) {
        return res.status(400).json({ message: "planId es requerido" });
      }

      const baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;

      const result = await mercadoPagoService.createSubscriptionLink({
        companyId: company.id,
        email: company.correoElectronico || company.email,
        planId,
        backUrl: `${baseUrl}/subscription-plans?status=success`,
      });

      if (!result) {
        return res.status(503).json({
          message: "Mercado Pago no está configurado. Contacta al administrador."
        });
      }

      res.json({ checkoutUrl: result.initPoint, preapprovalId: result.preapprovalId });
    } catch (error) {
      console.error('Error creating MP subscription:', error);
      res.status(500).json({ message: "Error al crear la suscripción" });
    }
  });

  // Webhook — Mercado Pago notifica cambios de estado aquí (público, sin auth)
  app.post("/api/mercadopago/webhook", async (req, res) => {
    try {
      await mercadoPagoService.handleWebhook(req.body);
      res.status(200).send('OK');
    } catch (error) {
      console.error('Error processing MP webhook:', error);
      // Siempre responder 200 para que Mercado Pago no reintente innecesariamente
      res.status(200).send('OK');
    }
  });

  // Cancelar suscripción activa
  app.post("/api/mercadopago/cancel-subscription", authenticateCompany, async (req: any, res) => {
    try {
      const company = req.company;
      if (!company.mercadopagoSubscriptionId) {
        return res.status(400).json({ message: "No hay suscripción activa" });
      }
      const success = await mercadoPagoService.cancelSubscription(company.mercadopagoSubscriptionId);
      if (success) {
        await companyStorage.updateCompanySubscription(company.id, { subscriptionStatus: 'cancelled' });
      }
      res.json({ success });
    } catch (error) {
      console.error('Error cancelling MP subscription:', error);
      res.status(500).json({ message: "Error al cancelar la suscripción" });
    }
  });

  // Employee template — público, no requiere autenticación
  app.get("/api/employees/template/:format", async (req, res) => {
    try {
      const format = req.params.format as 'excel' | 'csv';

      const examples = [
        { nombre: "Juan", apellidos: "Pérez García", email: "juan.perez@empresa.com", puesto: "Analista de Sistemas", area: "Tecnología", fechaIngreso: "15/01/2024", genero: "Masculino", generacion: "Millennials" },
        { nombre: "María", apellidos: "López Rodríguez", email: "maria.lopez@empresa.com", puesto: "Gerente de Operaciones", area: "Operaciones", fechaIngreso: "01/03/2024", genero: "Femenino", generacion: "Generación X" },
        { nombre: "Carlos", apellidos: "Martínez Sánchez", email: "carlos.martinez@empresa.com", puesto: "Contador Senior", area: "Finanzas", fechaIngreso: "10/02/2024", genero: "Masculino", generacion: "Baby Boomers" },
        { nombre: "Ana", apellidos: "Fernández Torres", email: "ana.fernandez@empresa.com", puesto: "Ejecutiva de Ventas", area: "Comercial", fechaIngreso: "22/04/2024", genero: "Femenino", generacion: "Generación Z" },
      ];

      if (format === 'csv') {
        const headers = ['nombre','apellidos','email','puesto','area','fechaIngreso','genero','generacion'];
        const rows = [
          headers.join(','),
          ...examples.map(e => headers.map(h => e[h as keyof typeof e] || '').join(','))
        ].join('\n');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=plantilla-empleados.csv');
        res.send('\ufeff' + rows);

      } else if (format === 'excel') {
        // Generar .xlsx real con ExcelJS
        const wb = new ExcelJS.Workbook();
        wb.creator = 'NOM-035 Platform';
        wb.created = new Date();

        // ── Hoja 1: Plantilla ──────────────────────────────────────────────
        const ws = wb.addWorksheet('Empleados');

        // Ancho de columnas
        ws.columns = [
          { header: 'nombre',       key: 'nombre',       width: 18 },
          { header: 'apellidos',    key: 'apellidos',    width: 22 },
          { header: 'email',        key: 'email',        width: 30 },
          { header: 'puesto',       key: 'puesto',       width: 25 },
          { header: 'area',         key: 'area',         width: 20 },
          { header: 'fechaIngreso', key: 'fechaIngreso', width: 16 },
          { header: 'genero',       key: 'genero',       width: 16 },
          { header: 'generacion',   key: 'generacion',   width: 20 },
        ];

        // Estilo del encabezado
        const headerRow = ws.getRow(1);
        headerRow.eachCell(cell => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.border = {
            bottom: { style: 'medium', color: { argb: 'FF84CC16' } }
          };
        });
        headerRow.height = 28;

        // Fila de instrucciones (fila 2, merged)
        ws.mergeCells('A2:H2');
        const instrCell = ws.getCell('A2');
        instrCell.value = '⚠ INSTRUCCIONES: Completa los datos desde la fila 4. No modifiques los encabezados. Fecha formato DD/MM/AAAA. Género: Masculino | Femenino | No binario | Prefiero no decir. Generación: Baby Boomers | Generación X | Millennials | Generación Z';
        instrCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF9C3' } };
        instrCell.font = { italic: true, color: { argb: 'FF854D0E' }, size: 10 };
        instrCell.alignment = { wrapText: true, vertical: 'middle' };
        ws.getRow(2).height = 36;

        // Fila vacía separadora
        ws.getRow(3).height = 6;

        // Datos de ejemplo (desde fila 4)
        examples.forEach((emp, i) => {
          const row = ws.addRow(emp);
          row.eachCell(cell => {
            cell.fill = {
              type: 'pattern', pattern: 'solid',
              fgColor: { argb: i % 2 === 0 ? 'FFF8FAFC' : 'FFFFFFFF' }
            };
            cell.font = { size: 10 };
            cell.alignment = { vertical: 'middle' };
          });
          row.height = 20;
        });

        // Congelar primera fila
        ws.views = [{ state: 'frozen', ySplit: 1 }];

        // ── Hoja 2: Instrucciones ──────────────────────────────────────────
        const wsInstr = wb.addWorksheet('Instrucciones');
        wsInstr.mergeCells('A1:C1');
        wsInstr.getCell('A1').value = 'GUÍA DE IMPORTACIÓN — NOM-035 Platform';
        wsInstr.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF1E3A5F' } };
        wsInstr.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFCCB' } };
        wsInstr.getRow(1).height = 32;

        const instrLines = [
          ['Campo', 'Obligatorio', 'Descripción / Valores válidos'],
          ['nombre', 'SÍ', 'Nombre(s) del empleado'],
          ['apellidos', 'SÍ', 'Apellidos completos'],
          ['email', 'No', 'Correo electrónico (debe ser único)'],
          ['puesto', 'SÍ', 'Cargo o posición laboral'],
          ['area', 'SÍ', 'Departamento o área de trabajo'],
          ['fechaIngreso', 'SÍ', 'Fecha en formato DD/MM/AAAA — Ej: 15/03/2024'],
          ['genero', 'No', 'Masculino | Femenino | No binario | Prefiero no decir'],
          ['generacion', 'No', 'Baby Boomers | Generación X | Millennials | Generación Z'],
        ];
        instrLines.forEach((line, i) => {
          const r = wsInstr.addRow(line);
          if (i === 0) {
            r.eachCell(c => {
              c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
              c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
            });
          } else {
            r.eachCell((c, ci) => {
              c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: i % 2 === 0 ? 'FFF8FAFC' : 'FFFFFFFF' } };
              if (ci === 2) c.font = { color: { argb: line[1] === 'SÍ' ? 'FF15803D' : 'FF64748B' }, bold: line[1] === 'SÍ' };
            });
          }
          r.height = 20;
        });
        wsInstr.columns = [{ width: 18 }, { width: 14 }, { width: 60 }];

        // Enviar respuesta — usar writeBuffer (más confiable que stream directo)
        const buffer = await wb.xlsx.writeBuffer();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=plantilla-empleados.xlsx');
        res.setHeader('Content-Length', buffer.byteLength.toString());
        res.send(Buffer.from(buffer));

      } else {
        res.status(400).json({ message: "Formato no soportado. Use 'excel' o 'csv'" });
      }
    } catch (error) {
      console.error('Template generation error:', error);
      res.status(500).json({ message: "Error al generar la plantilla" });
    }
  });

  app.post("/api/employees/import", authenticateCompany, async (req: any, res) => {
    try {
      const companyId = req.companyId;
      
      if (!req.files || !req.files.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const file = req.files.file;
      const fileContent = file.data.toString('utf8');
      
      // Parse CSV content
      const lines = fileContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
      const headers = lines[0].split(',').map(h => h.trim());
      
      const requiredHeaders = ['nombre', 'apellidos', 'email', 'puesto', 'area', 'fechaIngreso'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        return res.status(400).json({ 
          message: `Missing required columns: ${missingHeaders.join(', ')}` 
        });
      }
      
      const results = {
        total: lines.length - 1,
        successful: 0,
        errors: [] as Array<{ row: number; error: string; data: any }>
      };
      
      // Process each row
      for (let i = 1; i < lines.length; i++) {
        try {
          const values = lines[i].split(',').map(v => v.trim());
          const rowData: any = {};
          
          headers.forEach((header, index) => {
            rowData[header] = values[index] || '';
          });
          
          // Validate required fields
          for (const field of requiredHeaders) {
            if (!rowData[field]) {
              throw new Error(`Missing required field: ${field}`);
            }
          }
          
          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(rowData.email)) {
            throw new Error('Invalid email format');
          }
          
          // Validate area
          const validAreas = ['administracion', 'operaciones', 'ventas', 'recursos-humanos', 'finanzas'];
          if (!validAreas.includes(rowData.area)) {
            throw new Error(`Invalid area. Must be one of: ${validAreas.join(', ')}`);
          }
          
          // Parse date
          const dateParts = rowData.fechaIngreso.split('/');
          if (dateParts.length !== 3) {
            throw new Error('Invalid date format. Use DD/MM/YYYY');
          }
          
          const [day, month, year] = dateParts;
          const fechaIngreso = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          
          if (isNaN(fechaIngreso.getTime())) {
            throw new Error('Invalid date');
          }
          
          // Create employee
          const employee = await storage.createEmployee({
            companyId,
            nombre: rowData.nombre,
            apellidos: rowData.apellidos,
            email: rowData.email,
            puesto: rowData.puesto,
            area: rowData.area,
            fechaIngreso
          });
          
          results.successful++;
        } catch (error: any) {
          results.errors.push({
            row: i + 1,
            error: error.message,
            data: lines[i]
          });
        }
      }
      
      res.json(results);
    } catch (error) {
      console.error('Import error:', error);
      res.status(500).json({ message: "Error processing import" });
    }
  });

  // Reports generation
  app.get("/api/reports", async (req, res) => {
    try {
      // Return empty array for now - in production this would fetch saved reports
      res.json([]);
    } catch (error) {
      console.error('Get reports error:', error);
      res.status(500).json({ message: "Error fetching reports" });
    }
  });

  app.post("/api/reports/generate", async (req, res) => {
    try {
      const { templateId, filters, customConfig } = req.body;

      // Get all evaluations and employees for report generation
      const evaluations = await storage.getAllEvaluations();
      const employees = await storage.getAllEmployees();
      
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
  app.get("/api/companies/profile", async (req, res) => {
    try {
      const company = await storage.getCompanyById(1);
      res.json(company);
    } catch (error) {
      res.status(500).json({ message: "Error fetching company profile" });
    }
  });

  // Compliance metrics endpoint
  app.get("/api/compliance/metrics", async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      const evaluations = await storage.getAllEvaluations();
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
  app.get("/api/company-info", async (req, res) => {
    try {
      // En un entorno real, esto vendría de la sesión autenticada
      const companyId = 1;
      const company = await storage.getCompanyById(companyId);
      res.json(company);
    } catch (error) {
      console.error('Get company info error:', error);
      res.status(500).json({ message: "Error fetching company info" });
    }
  });

  app.get("/api/compliance/nom035-status", async (req, res) => {
    try {
      // Calcular estado de cumplimiento NOM-035
      const companyId = 1;
      const company = await storage.getCompanyById(companyId);
      const employees = await storage.getAllEmployees();
      const evaluations = await storage.getAllEvaluations();
      
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
      const companyId = 1;
      
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
  app.post("/api/questionnaire-invitations", async (req, res) => {
    try {
      const { employeeIds, questionnaireType, message, customMessage, invitedBy } = req.body;
      
      if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
        return res.status(400).json({ message: "Employee IDs are required" });
      }

      const invitations = [];
      
      for (const employeeId of employeeIds) {
        // Generate unique access token
        const accessToken = `questionnaire_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Set expiration date (10 days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 10);

        const invitation = await storage.createQuestionnaireInvitation({
          employeeId,
          companyId: 1, // Default company
          questionnaireType: questionnaireType || 'microempresa',
          accessToken,
          invitedBy: invitedBy || 'administrador@empresa.com',
          expiresAt,
          status: 'pending',
          reminderCount: 0,
          customMessage: customMessage || undefined
        });

        // Get employee details for email
        const employee = await storage.getEmployee(employeeId);
        
        if (employee && employee.email) {
          // Create email notification
          const emailContent = `
Estimado/a ${employee.nombre} ${employee.apellidos},

Le invitamos a completar el cuestionario de evaluación de riesgos psicosociales NOM-035-STPS.

${message ? `Mensaje del administrador: ${message}` : ''}

Para acceder al cuestionario, haga clic en el siguiente enlace:
${process.env.REPLIT_DEV_DOMAIN || 'https://localhost:5000'}/questionnaire/${accessToken}

Este enlace es válido hasta el ${expiresAt.toLocaleDateString('es-MX')}.

Atentamente,
Equipo de Recursos Humanos
          `;

          await storage.createEmailNotification({
            employeeId,
            type: 'questionnaire-invitation',
            recipientEmails: [employee.email],
            subject: 'Invitación para completar cuestionario NOM-035-STPS',
            content: emailContent,
            status: 'pending'
          });
        }

        invitations.push(invitation);
      }

      res.status(201).json({ 
        message: `${invitations.length} invitations sent successfully`,
        invitations 
      });
    } catch (error) {
      console.error("Error creating questionnaire invitations:", error);
      res.status(500).json({ message: "Error creating invitations" });
    }
  });

  app.get("/api/questionnaire-invitations", async (req, res) => {
    try {
      const invitations = await storage.getPendingInvitations(1); // Default company
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      res.status(500).json({ message: "Error fetching invitations" });
    }
  });

  app.get("/api/questionnaire/:token", async (req, res) => {
    try {
      const { token } = req.params;
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

      // Get employee details
      const employee = await storage.getEmployee(invitation.employeeId);
      
      res.json({
        invitation,
        employee,
        questionnaireType: invitation.questionnaireType
      });
    } catch (error) {
      console.error("Error validating invitation:", error);
      res.status(500).json({ message: "Error validating invitation" });
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
  return httpServer;
}
