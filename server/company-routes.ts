import type { Express } from "express";
import { hashPassword, verifyPassword, generateToken, authenticateCompany } from "./auth";
import { companyStorage } from "./company-storage";
import { insertCompanySchema } from "@shared/schema";
import { z } from "zod";

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

      // Generate token
      const token = generateToken(company.id, company.correoElectronico);

      // Return company data without password
      const { contrasena: _, ...companyResponse } = company;
      
      res.json({
        company: companyResponse,
        token,
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