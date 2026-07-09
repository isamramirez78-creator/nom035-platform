import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { companies, type Company } from '@shared/schema';
import { storage } from './storage';

const JWT_SECRET = process.env.JWT_SECRET || 'nom035-default-secret-change-in-production';
const SALT_ROUNDS = 12;

export interface AuthenticatedRequest extends Request {
  company?: Company;
  companyId?: number;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(companyId: number, email: string): string {
  return jwt.sign(
    { 
      companyId, 
      email,
      type: 'company'
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): { companyId: number; email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return { companyId: decoded.companyId, email: decoded.email };
  } catch (error) {
    return null;
  }
}

export function generateAdminToken(adminId: number, email: string): string {
  return jwt.sign({ adminId, email, role: "admin" }, JWT_SECRET, { expiresIn: "8h" });
}

export function verifyAdminToken(token: string): { adminId: number; email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.role !== "admin") return null;
    return { adminId: decoded.adminId, email: decoded.email };
  } catch { return null; }
}

export async function authenticateCompany(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Token de autenticación requerido' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Token inválido o expirado' });
    }

    const company = await storage.getCompanyById(decoded.companyId);
    if (!company || !company.isActive) {
      return res.status(401).json({ message: 'Empresa no encontrada o inactiva' });
    }

    // Check subscription status
    if (company.subscriptionStatus === 'expired' || company.subscriptionStatus === 'cancelled') {
      return res.status(403).json({ 
        message: 'Suscripción expirada o cancelada',
        subscriptionStatus: company.subscriptionStatus 
      });
    }

    req.company = company;
    req.companyId = company.id;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Error de autenticación' });
  }
}

export async function checkSubscriptionLimits(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.company) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const company = req.company;

    // Las cuentas de Admin no tienen límites de plan — para pruebas y administración
    if (company.isAdmin) {
      return next();
    }

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    // Get current usage
    const usage = await storage.getUsageMetrics(company.id, currentMonth, currentYear);
    
    // Check limits based on the endpoint
    const path = req.path;
    
    if (path.includes('/employees') && req.method === 'POST') {
      const employeeCount = await storage.getEmployeeCount(company.id);
      if (employeeCount >= company.maxEmployees) {
        return res.status(403).json({ 
          message: 'Límite de empleados alcanzado',
          limit: company.maxEmployees,
          current: employeeCount
        });
      }
    }
    
    if (path.includes('/evaluations') && req.method === 'POST') {
      if (usage.evaluationsCount >= company.maxEvaluationsPerMonth) {
        return res.status(403).json({ 
          message: 'Límite de evaluaciones mensuales alcanzado',
          limit: company.maxEvaluationsPerMonth,
          current: usage.evaluationsCount
        });
      }
    }

    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    next(); // Continue on error to avoid blocking
  }
}

export function requireActiveSubscription(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.company) {
    return res.status(401).json({ message: 'No autenticado' });
  }

  const company = req.company;

  // Las cuentas de Admin siempre tienen acceso completo — para pruebas y administración
  if (company.isAdmin) {
    return next();
  }

  const now = new Date();

  // Check if trial period is active
  if (company.subscriptionPlan === 'trial') {
    if (company.trialEndDate && now > company.trialEndDate) {
      return res.status(403).json({ 
        message: 'Período de prueba expirado',
        action: 'upgrade_required'
      });
    }
  }

  // Check subscription status
  if (company.subscriptionStatus !== 'active') {
    return res.status(403).json({ 
      message: 'Suscripción inactiva',
      status: company.subscriptionStatus,
      action: 'subscription_required'
    });
  }

  next();
}