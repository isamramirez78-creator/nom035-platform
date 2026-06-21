import { 
  companies,
  subscriptionPlans,
  usageMetrics,
  type Company,
  type InsertCompany,
  type SubscriptionPlan,
  type InsertSubscriptionPlan,
  type UsageMetric,
  type InsertUsageMetric
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export class CompanyStorage {
  // Company operations
  async getCompanyById(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company || undefined;
  }

  async getCompanyByEmail(email: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.correoElectronico, email));
    return company || undefined;
  }

  async getCompanyByRFC(rfc: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.rfc, rfc));
    return company || undefined;
  }

  // Lista todas las empresas — usado solo por el panel de Admin
  async getAllCompanies(): Promise<Company[]> {
    return db.select().from(companies).orderBy(companies.createdAt);
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    // Set trial end date to 30 days from now
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 30);

    const companyData = {
      ...insertCompany,
      subscriptionPlan: "trial" as const,
      subscriptionStatus: "active" as const,
      trialEndDate,
      maxEmployees: insertCompany.cantidadEmpleados <= 15 ? 15 : 
                   insertCompany.cantidadEmpleados <= 49 ? 49 : 250,
      maxEvaluationsPerMonth: insertCompany.cantidadEmpleados <= 15 ? 50 : 
                             insertCompany.cantidadEmpleados <= 49 ? 150 : 500,
    };

    const [company] = await db
      .insert(companies)
      .values(companyData)
      .returning();
    
    // Create initial usage metrics
    const now = new Date();
    await this.createInitialUsageMetrics(company.id, now.getMonth() + 1, now.getFullYear());
    
    return company;
  }

  async updateCompany(id: number, updates: Partial<InsertCompany>): Promise<Company | undefined> {
    const [company] = await db
      .update(companies)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return company || undefined;
  }

  async updateCompanySubscription(id: number, subscriptionData: any): Promise<Company | undefined> {
    const [company] = await db
      .update(companies)
      .set({ 
        ...subscriptionData, 
        updatedAt: new Date() 
      })
      .where(eq(companies.id, id))
      .returning();
    return company || undefined;
  }

  // Subscription plans
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true));
  }

  async getSubscriptionPlan(planId: string): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.planId, planId));
    return plan || undefined;
  }

  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [subscriptionPlan] = await db
      .insert(subscriptionPlans)
      .values(plan)
      .returning();
    return subscriptionPlan;
  }

  // Usage tracking
  async getUsageMetrics(companyId: number, month: number, year: number): Promise<UsageMetric> {
    const [usage] = await db
      .select()
      .from(usageMetrics)
      .where(
        and(
          eq(usageMetrics.companyId, companyId),
          eq(usageMetrics.month, month),
          eq(usageMetrics.year, year)
        )
      );

    if (usage) {
      return usage;
    }

    // Create new usage metrics if not exists
    return await this.createInitialUsageMetrics(companyId, month, year);
  }

  async updateUsageMetrics(companyId: number, month: number, year: number, updates: Partial<InsertUsageMetric>): Promise<UsageMetric> {
    const [usage] = await db
      .update(usageMetrics)
      .set(updates)
      .where(
        and(
          eq(usageMetrics.companyId, companyId),
          eq(usageMetrics.month, month),
          eq(usageMetrics.year, year)
        )
      )
      .returning();

    if (usage) {
      return usage;
    }

    // Create if doesn't exist
    return await this.createInitialUsageMetrics(companyId, month, year);
  }

  async incrementEvaluationCount(companyId: number): Promise<void> {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const current = await this.getUsageMetrics(companyId, month, year);
    await this.updateUsageMetrics(companyId, month, year, {
      evaluationsCount: current.evaluationsCount + 1
    });
  }

  async incrementEmailCount(companyId: number): Promise<void> {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const current = await this.getUsageMetrics(companyId, month, year);
    await this.updateUsageMetrics(companyId, month, year, {
      emailsSent: current.emailsSent + 1
    });
  }

  private async createInitialUsageMetrics(companyId: number, month: number, year: number): Promise<UsageMetric> {
    const [usage] = await db
      .insert(usageMetrics)
      .values({
        companyId,
        month,
        year,
        employeesCount: 0,
        evaluationsCount: 0,
        emailsSent: 0,
        storageUsed: "0",
      })
      .returning();
    return usage;
  }

  async getEmployeeCount(companyId: number): Promise<number> {
    // This will be implemented in the main storage class
    return 0;
  }
}

export const companyStorage = new CompanyStorage();