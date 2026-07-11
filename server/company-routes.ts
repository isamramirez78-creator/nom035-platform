import type { Express } from "express";
import { hashPassword, verifyPassword, generateToken, authenticateCompany } from "./auth";
import { companyStorage } from "./company-storage";
import { insertCompanySchema } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { sql } from "drizzle-orm";

export function registerCompanyRoutes(app: Express) {
  // Company registration
  app.post("/api/companies/register", async (req, res) => {
    try {
      const validatedData = insertCompanySchema.parse(req.body);
      
      // Check if company already exists
      const existingCompanyByEmail = await companyStorage.getCompanyByEmail(validatedData.correoElectronico);
      if (existingCompanyByEmail) {
        return res.status(400).json({ message: "Ya existe una empresa registrada con este email" });
      }

      const existingCompanyByRFC = await companyStorage.getCompanyByRFC(validatedData.rfc);
      if (existingCompanyByRFC) {
        return res.status(400).json({ message: "Ya existe una empresa registrada con este RFC" });
      }

      // Hash password
      const hashedPassword = await hashPassword(validatedData.contrasena);
      
      // Create company
      const company = await companyStorage.createCompany({
        ...validatedData,
        contrasena: hashedPassword,
      });

      // Generate token
      const token = generateToken(company.id, company.correoElectronico);

      // Return company data without password
      const { contrasena, ...companyResponse } = company;
      
      res.status(201).json({
        company: companyResponse,
        token,
        message: "Empresa registrada exitosamente"
      });
    } catch (error) {
      console.error("Company registration error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Datos inválidos", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // ── Crear cuenta de Admin (un solo uso, protegida por clave secreta) ──────
  // Llamar UNA VEZ desde Postman/curl: POST /api/admin/seed con header x-setup-key
  app.post("/api/admin/seed", async (req, res) => {
    try {
      const setupKey = req.headers['x-setup-key'];
      if (!process.env.ADMIN_SETUP_KEY || setupKey !== process.env.ADMIN_SETUP_KEY) {
        return res.status(403).json({ message: "Clave de configuración inválida" });
      }

      const { correoElectronico, contrasena, razonSocial } = req.body;
      if (!correoElectronico || !contrasena) {
        return res.status(400).json({ message: "correoElectronico y contrasena son requeridos" });
      }

      const existing = await companyStorage.getCompanyByEmail(correoElectronico);
      if (existing) {
        // Si ya existe, solo lo promovemos a admin (útil si te registraste normal antes)
        const updated = await companyStorage.updateCompanySubscription(existing.id, {
          isAdmin: true,
          subscriptionPlan: 'enterprise',
          subscriptionStatus: 'active',
          maxEmployees: 999999,
          maxEvaluationsPerMonth: 999999,
        });
        const { contrasena: _, ...safe } = updated!;
        return res.json({ message: "Cuenta existente promovida a Admin", company: safe });
      }

      const hashedPassword = await hashPassword(contrasena);
      const company = await companyStorage.createCompany({
        razonSocial: razonSocial || "Administración NOM-035",
        rfc: "ADMIN000000XXX",
        correoElectronico,
        contrasena: hashedPassword,
        telefono: "0000000000",
        direccion: "N/A",
        sector: "Administración",
        numeroEmpleados: 0,
      } as any);

      await companyStorage.updateCompanySubscription(company.id, {
        isAdmin: true,
        subscriptionPlan: 'enterprise',
        subscriptionStatus: 'active',
        maxEmployees: 999999,
        maxEvaluationsPerMonth: 999999,
      });

      const token = generateToken(company.id, company.correoElectronico);
      res.status(201).json({ message: "Cuenta de Admin creada exitosamente", token });
    } catch (error) {
      console.error("Admin seed error:", error);
      res.status(500).json({ message: "Error al crear cuenta de Admin" });
    }
  });

  // Company login
  app.post("/api/companies/login", async (req, res) => {
    try {
      const { correoElectronico, contrasena } = req.body;

      if (!correoElectronico || !contrasena) {
        return res.status(400).json({ message: "Email y contraseña son requeridos" });
      }

      // Find company
      const company = await companyStorage.getCompanyByEmail(correoElectronico);
      if (!company) {
        return res.status(401).json({ message: "Credenciales incorrectas" });
      }

      // Verify password
      const isValidPassword = await verifyPassword(contrasena, company.contrasena);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Credenciales incorrectas" });
      }

      // Check if company is active
      if (!company.isActive) {
        return res.status(403).json({ message: "Cuenta desactivada" });
      }

      // Verificar estado de trial/suscripción desde la BD
      let trialDaysLeft = null;
      let subscriptionStatus = "trial";
      try {
        const trialResult = await db.execute(sql`
          SELECT trial_ends_at, subscription_status, subscription_end_date 
          FROM companies WHERE id = ${company.id}
        `);
        const trialData = trialResult.rows[0] as any;
        if (trialData) {
          subscriptionStatus = trialData.subscription_status || "trial";
          const now = new Date();
          if (trialData.trial_ends_at && subscriptionStatus === "trial") {
            const trialEnd = new Date(trialData.trial_ends_at);
            if (trialEnd < now) {
              return res.status(403).json({ 
                message: "Tu período de prueba ha expirado. Por favor elige un plan.",
                code: "TRIAL_EXPIRED",
                redirectTo: "/plans"
              });
            }
            trialDaysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          }
        }
      } catch (e) { console.error("Trial check error:", e); }

      // Generate token
      const token = generateToken(company.id, company.correoElectronico);

      // Return company data without password
      const { contrasena: _, ...companyResponse } = company;
      
      res.json({
        company: companyResponse,
        token,
        trialDaysLeft,
        subscriptionStatus,
        message: "Inicio de sesión exitoso"
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Get current company profile
  app.get("/api/companies/profile", authenticateCompany, async (req: any, res) => {
    try {
      const { contrasena, ...companyResponse } = req.company;
      res.json(companyResponse);
    } catch (error) {
      console.error("Profile fetch error:", error);
      res.status(500).json({ message: "Error fetching profile" });
    }
  });

  // Update company profile
  app.patch("/api/companies/profile", authenticateCompany, async (req: any, res) => {
    try {
      const companyId = req.company.id;
      const updates = req.body;

      // Remove sensitive fields that shouldn't be updated this way
      const { contrasena, rfc, stripeCustomerId, stripeSubscriptionId, ...allowedUpdates } = updates;

      const updatedCompany = await companyStorage.updateCompany(companyId, allowedUpdates);
      
      if (!updatedCompany) {
        return res.status(404).json({ message: "Empresa no encontrada" });
      }

      const { contrasena: _, ...companyResponse } = updatedCompany;
      res.json(companyResponse);
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ message: "Error updating profile" });
    }
  });

  // Get subscription plans
  app.get("/api/subscription-plans", async (req, res) => {
    try {
      const plans = await companyStorage.getSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ message: "Error fetching subscription plans" });
    }
  });

  // Get company usage metrics
  app.get("/api/companies/usage", authenticateCompany, async (req: any, res) => {
    try {
      const companyId = req.company.id;
      const now = new Date();
      const month = parseInt(req.query.month as string) || (now.getMonth() + 1);
      const year = parseInt(req.query.year as string) || now.getFullYear();

      const usage = await companyStorage.getUsageMetrics(companyId, month, year);
      
      res.json({
        usage,
        limits: {
          maxEmployees: req.company.maxEmployees,
          maxEvaluationsPerMonth: req.company.maxEvaluationsPerMonth,
        },
        subscription: {
          plan: req.company.subscriptionPlan,
          status: req.company.subscriptionStatus,
          trialEndDate: req.company.trialEndDate,
        }
      });
    } catch (error) {
      console.error("Usage metrics error:", error);
      res.status(500).json({ message: "Error fetching usage metrics" });
    }
  });

  // Check subscription status
  app.get("/api/companies/subscription-status", authenticateCompany, async (req: any, res) => {
    try {
      const company = req.company;
      const now = new Date();

      let status = {
        plan: company.subscriptionPlan,
        status: company.subscriptionStatus,
        isTrialActive: false,
        daysLeft: 0,
        needsUpgrade: false,
      };

      if (company.subscriptionPlan === 'trial' && company.trialEndDate) {
        const trialEnd = new Date(company.trialEndDate);
        const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        status.isTrialActive = daysLeft > 0;
        status.daysLeft = Math.max(0, daysLeft);
        status.needsUpgrade = daysLeft <= 7; // Show upgrade notice 7 days before trial ends
      }

      res.json(status);
    } catch (error) {
      console.error("Subscription status error:", error);
      res.status(500).json({ message: "Error fetching subscription status" });
    }
  });
}