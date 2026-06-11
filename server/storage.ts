import { 
  type Company,
  type InsertCompany,
  type Employee, 
  type InsertEmployee, 
  type Evaluation, 
  type InsertEvaluation,
  type EmployeeFile,
  type InsertEmployeeFile,
  type Intervention,
  type InsertIntervention,
  type InterventionNote,
  type InsertInterventionNote,
  type EmailNotification,
  type InsertEmailNotification,
  type NotificationSetting,
  type InsertNotificationSetting,
  type SubscriptionPlan,
  type InsertSubscriptionPlan,
  type UsageMetric,
  type InsertUsageMetric,
  type QuestionnaireInvitation,
  type InsertQuestionnaireInvitation,
  companies, employees, evaluations, employeeFiles, interventions,
  interventionNotes, emailNotifications, notificationSettings,
  subscriptionPlans, usageMetrics, questionnaireInvitations
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";

export interface IStorage {
  getCompanyById(id: number): Promise<Company | undefined>;
  getCompanyByEmail(email: string): Promise<Company | undefined>;
  getCompanyByRFC(rfc: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, updates: Partial<InsertCompany>): Promise<Company | undefined>;
  updateCompanySubscription(id: number, subscriptionData: any): Promise<Company | undefined>;
  getEmployee(id: number, companyId?: number): Promise<Employee | undefined>;
  getAllEmployees(companyId?: number): Promise<Employee[]>;
  getEmployeesByArea(area: string, companyId?: number): Promise<Employee[]>;
  getEmployeeCount(companyId: number): Promise<number>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, updates: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: number): Promise<boolean>;
  getEvaluation(id: number, companyId?: number): Promise<Evaluation | undefined>;
  getEvaluationsByEmployee(employeeId: number, companyId?: number): Promise<Evaluation[]>;
  getAllEvaluations(companyId?: number): Promise<Evaluation[]>;
  getEvaluationsByArea(area: string, companyId?: number): Promise<Evaluation[]>;
  createEvaluation(evaluation: InsertEvaluation): Promise<Evaluation>;
  updateEvaluation(id: number, updates: Partial<InsertEvaluation>): Promise<Evaluation | undefined>;
  deleteEvaluation(id: number): Promise<boolean>;
  hasCompletedQuestionnaire(employeeId: number, questionnaireType: string, companyId?: number): Promise<boolean>;
  getEvaluationStats(companyId?: number): Promise<{
    totalEmployees: number;
    evaluationsCompleted: number;
    pendingEvaluations: number;
    highRiskCount: number;
    riskDistribution: { [key: string]: number };
    areaStats: { [key: string]: { total: number; completed: number; avgRisk: number } };
  }>;
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlan(planId: string): Promise<SubscriptionPlan | undefined>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  getUsageMetrics(companyId: number, month: number, year: number): Promise<UsageMetric>;
  updateUsageMetrics(companyId: number, month: number, year: number, updates: Partial<InsertUsageMetric>): Promise<UsageMetric>;
  incrementEvaluationCount(companyId: number): Promise<void>;
  incrementEmailCount(companyId: number): Promise<void>;
  getEmployeeFiles(employeeId: number): Promise<EmployeeFile[]>;
  createEmployeeFile(file: InsertEmployeeFile): Promise<EmployeeFile>;
  updateEmployeeFile(id: number, updates: Partial<InsertEmployeeFile>): Promise<EmployeeFile | undefined>;
  deleteEmployeeFile(id: number): Promise<boolean>;
  getInterventionsByEmployee(employeeId: number): Promise<Intervention[]>;
  createIntervention(intervention: InsertIntervention): Promise<Intervention>;
  updateIntervention(id: number, updates: Partial<InsertIntervention>): Promise<Intervention | undefined>;
  deleteIntervention(id: number): Promise<boolean>;
  getInterventionNotes(interventionId: number): Promise<InterventionNote[]>;
  createInterventionNote(note: InsertInterventionNote): Promise<InterventionNote>;
  getEmailNotifications(employeeId?: number): Promise<EmailNotification[]>;
  createEmailNotification(notification: InsertEmailNotification): Promise<EmailNotification>;
  updateEmailNotificationStatus(id: number, status: string, sentAt?: Date, errorMessage?: string): Promise<EmailNotification | undefined>;
  getNotificationSettings(): Promise<NotificationSetting[]>;
  getNotificationSetting(key: string): Promise<NotificationSetting | undefined>;
  createOrUpdateNotificationSetting(setting: InsertNotificationSetting): Promise<NotificationSetting>;
  createQuestionnaireInvitation(invitation: InsertQuestionnaireInvitation): Promise<QuestionnaireInvitation>;
  getQuestionnaireInvitation(accessToken: string): Promise<QuestionnaireInvitation | undefined>;
  updateQuestionnaireInvitationStatus(id: number, status: string, completedAt?: Date): Promise<QuestionnaireInvitation | undefined>;
  getEmployeeInvitations(employeeId: number): Promise<QuestionnaireInvitation[]>;
  getPendingInvitations(): Promise<QuestionnaireInvitation[]>;
  getAllInvitations(companyId?: number): Promise<QuestionnaireInvitation[]>;
  updateInvitationReminderCount(id: number): Promise<QuestionnaireInvitation | undefined>;
}

// ─── DATABASE STORAGE (PostgreSQL) ────────────────────────────────────────────
export class DatabaseStorage implements IStorage {

  // ── Companies ──────────────────────────────────────────────────────────────
  async getCompanyById(id: number) {
    const [c] = await db.select().from(companies).where(eq(companies.id, id));
    return c;
  }
  async getCompanyByEmail(email: string) {
    const [c] = await db.select().from(companies).where(eq(companies.correoElectronico, email));
    return c;
  }
  async getCompanyByRFC(rfc: string) {
    const [c] = await db.select().from(companies).where(eq(companies.rfc, rfc));
    return c;
  }
  async createCompany(company: InsertCompany) {
    const [c] = await db.insert(companies).values(company).returning();
    return c;
  }
  async updateCompany(id: number, updates: Partial<InsertCompany>) {
    const [c] = await db.update(companies).set({ ...updates, updatedAt: new Date() }).where(eq(companies.id, id)).returning();
    return c;
  }
  async updateCompanySubscription(id: number, data: any) {
    const [c] = await db.update(companies).set({ ...data, updatedAt: new Date() }).where(eq(companies.id, id)).returning();
    return c;
  }

  // ── Employees ──────────────────────────────────────────────────────────────
  async getEmployee(id: number, companyId?: number) {
    const conditions = companyId
      ? and(eq(employees.id, id), eq(employees.companyId, companyId))
      : eq(employees.id, id);
    const [e] = await db.select().from(employees).where(conditions);
    return e;
  }
  async getAllEmployees(companyId?: number) {
    if (companyId) return db.select().from(employees).where(eq(employees.companyId, companyId));
    return db.select().from(employees);
  }
  async getEmployeesByArea(area: string, companyId?: number) {
    const conditions = companyId
      ? and(eq(employees.area, area), eq(employees.companyId, companyId))
      : eq(employees.area, area);
    return db.select().from(employees).where(conditions);
  }
  async getEmployeeCount(companyId: number) {
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` })
      .from(employees).where(eq(employees.companyId, companyId));
    return count;
  }
  async createEmployee(employee: InsertEmployee) {
    const [e] = await db.insert(employees).values(employee).returning();
    return e;
  }
  async updateEmployee(id: number, updates: Partial<InsertEmployee>) {
    const [e] = await db.update(employees).set(updates).where(eq(employees.id, id)).returning();
    return e;
  }
  async deleteEmployee(id: number) {
    const result = await db.delete(employees).where(eq(employees.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // ── Evaluations ────────────────────────────────────────────────────────────
  async getEvaluation(id: number, companyId?: number) {
    const conditions = companyId
      ? and(eq(evaluations.id, id), eq(evaluations.companyId, companyId))
      : eq(evaluations.id, id);
    const [e] = await db.select().from(evaluations).where(conditions);
    return e;
  }
  async getEvaluationsByEmployee(employeeId: number, companyId?: number) {
    const conditions = companyId
      ? and(eq(evaluations.employeeId, employeeId), eq(evaluations.companyId, companyId))
      : eq(evaluations.employeeId, employeeId);
    return db.select().from(evaluations).where(conditions);
  }
  async getAllEvaluations(companyId?: number) {
    if (companyId) return db.select().from(evaluations).where(eq(evaluations.companyId, companyId));
    return db.select().from(evaluations);
  }
  async getEvaluationsByArea(area: string, companyId?: number) {
    // Join with employees to filter by area
    const emps = await this.getEmployeesByArea(area, companyId);
    const empIds = emps.map(e => e.id);
    if (empIds.length === 0) return [];
    return db.select().from(evaluations).where(
      sql`${evaluations.employeeId} = ANY(${sql.raw(`ARRAY[${empIds.join(',')}]::int[]`)})` 
    );
  }
  async createEvaluation(evaluation: InsertEvaluation) {
    const [e] = await db.insert(evaluations).values(evaluation).returning();
    return e;
  }
  async updateEvaluation(id: number, updates: Partial<InsertEvaluation>) {
    const [e] = await db.update(evaluations).set(updates).where(eq(evaluations.id, id)).returning();
    return e;
  }
  async deleteEvaluation(id: number) {
    const result = await db.delete(evaluations).where(eq(evaluations.id, id));
    return (result.rowCount ?? 0) > 0;
  }
  async hasCompletedQuestionnaire(employeeId: number, questionnaireType: string, companyId?: number) {
    const conditions = companyId
      ? and(eq(evaluations.employeeId, employeeId), eq(evaluations.questionnaireType, questionnaireType), eq(evaluations.completed, true), eq(evaluations.companyId, companyId))
      : and(eq(evaluations.employeeId, employeeId), eq(evaluations.questionnaireType, questionnaireType), eq(evaluations.completed, true));
    const [e] = await db.select().from(evaluations).where(conditions).limit(1);
    return !!e;
  }
  async getEvaluationStats(companyId?: number) {
    const [emps, evals] = await Promise.all([
      this.getAllEmployees(companyId),
      this.getAllEvaluations(companyId),
    ]);
    const completedEvals = evals.filter(e => e.completed);
    const highRiskCount = completedEvals.filter(e => e.riskLevel === 'alto' || e.riskLevel === 'muy-alto').length;
    const riskDistribution = completedEvals.reduce((acc: any, e) => {
      const key = e.riskLevel || 'sin-riesgo';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const areaStats = emps.reduce((acc: any, emp) => {
      const area = emp.area || 'Sin área';
      if (!acc[area]) acc[area] = { total: 0, completed: 0, avgRisk: 0 };
      acc[area].total += 1;
      if (completedEvals.some(e => e.employeeId === emp.id)) acc[area].completed += 1;
      return acc;
    }, {});
    return {
      totalEmployees: emps.length,
      evaluationsCompleted: completedEvals.length,
      pendingEvaluations: emps.length - completedEvals.length,
      highRiskCount,
      riskDistribution,
      areaStats,
    };
  }

  // ── Subscription Plans ─────────────────────────────────────────────────────
  async getSubscriptionPlans() {
    return db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true));
  }
  async getSubscriptionPlan(planId: string) {
    const [p] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.planId, planId));
    return p;
  }
  async createSubscriptionPlan(plan: InsertSubscriptionPlan) {
    const [p] = await db.insert(subscriptionPlans).values(plan).returning();
    return p;
  }

  // ── Usage Metrics ──────────────────────────────────────────────────────────
  async getUsageMetrics(companyId: number, month: number, year: number) {
    const [m] = await db.select().from(usageMetrics)
      .where(and(eq(usageMetrics.companyId, companyId), eq(usageMetrics.month, month), eq(usageMetrics.year, year)));
    if (m) return m;
    // Auto-create if not exists
    const [created] = await db.insert(usageMetrics)
      .values({ companyId, month, year, employeesCount: 0, evaluationsCount: 0, emailsSent: 0, storageUsed: "0" })
      .returning();
    return created;
  }
  async updateUsageMetrics(companyId: number, month: number, year: number, updates: Partial<InsertUsageMetric>) {
    await this.getUsageMetrics(companyId, month, year); // ensure row exists
    const [m] = await db.update(usageMetrics)
      .set(updates)
      .where(and(eq(usageMetrics.companyId, companyId), eq(usageMetrics.month, month), eq(usageMetrics.year, year)))
      .returning();
    return m;
  }
  async incrementEvaluationCount(companyId: number) {
    const now = new Date();
    await this.updateUsageMetrics(companyId, now.getMonth() + 1, now.getFullYear(), {});
    await db.execute(sql`
      UPDATE usage_metrics SET evaluations_count = evaluations_count + 1
      WHERE company_id = ${companyId} AND month = ${now.getMonth() + 1} AND year = ${now.getFullYear()}
    `);
  }
  async incrementEmailCount(companyId: number) {
    const now = new Date();
    await this.getUsageMetrics(companyId, now.getMonth() + 1, now.getFullYear());
    await db.execute(sql`
      UPDATE usage_metrics SET emails_sent = emails_sent + 1
      WHERE company_id = ${companyId} AND month = ${now.getMonth() + 1} AND year = ${now.getFullYear()}
    `);
  }

  // ── Employee Files ─────────────────────────────────────────────────────────
  async getEmployeeFiles(employeeId: number) {
    return db.select().from(employeeFiles).where(eq(employeeFiles.employeeId, employeeId));
  }
  async createEmployeeFile(file: InsertEmployeeFile) {
    const [f] = await db.insert(employeeFiles).values(file).returning();
    return f;
  }
  async updateEmployeeFile(id: number, updates: Partial<InsertEmployeeFile>) {
    const [f] = await db.update(employeeFiles).set({ ...updates, updatedAt: new Date() }).where(eq(employeeFiles.id, id)).returning();
    return f;
  }
  async deleteEmployeeFile(id: number) {
    const result = await db.delete(employeeFiles).where(eq(employeeFiles.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // ── Interventions ──────────────────────────────────────────────────────────
  async getInterventionsByEmployee(employeeId: number) {
    return db.select().from(interventions).where(eq(interventions.employeeId, employeeId));
  }
  async createIntervention(intervention: InsertIntervention) {
    const [i] = await db.insert(interventions).values(intervention).returning();
    return i;
  }
  async updateIntervention(id: number, updates: Partial<InsertIntervention>) {
    const [i] = await db.update(interventions).set({ ...updates, updatedAt: new Date() }).where(eq(interventions.id, id)).returning();
    return i;
  }
  async deleteIntervention(id: number) {
    const result = await db.delete(interventions).where(eq(interventions.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // ── Intervention Notes ─────────────────────────────────────────────────────
  async getInterventionNotes(interventionId: number) {
    return db.select().from(interventionNotes).where(eq(interventionNotes.interventionId, interventionId));
  }
  async createInterventionNote(note: InsertInterventionNote) {
    const [n] = await db.insert(interventionNotes).values(note).returning();
    return n;
  }

  // ── Email Notifications ────────────────────────────────────────────────────
  async getEmailNotifications(employeeId?: number) {
    if (employeeId) return db.select().from(emailNotifications).where(eq(emailNotifications.employeeId, employeeId));
    return db.select().from(emailNotifications);
  }
  async createEmailNotification(notification: InsertEmailNotification) {
    const [n] = await db.insert(emailNotifications).values(notification).returning();
    return n;
  }
  async updateEmailNotificationStatus(id: number, status: string, sentAt?: Date, errorMessage?: string) {
    const [n] = await db.update(emailNotifications)
      .set({ status, sentAt: sentAt ?? null, errorMessage: errorMessage ?? null })
      .where(eq(emailNotifications.id, id)).returning();
    return n;
  }

  // ── Notification Settings ──────────────────────────────────────────────────
  async getNotificationSettings() {
    return db.select().from(notificationSettings).where(eq(notificationSettings.isActive, true));
  }
  async getNotificationSetting(key: string) {
    const [s] = await db.select().from(notificationSettings).where(eq(notificationSettings.settingKey, key));
    return s;
  }
  async createOrUpdateNotificationSetting(setting: InsertNotificationSetting) {
    const existing = await this.getNotificationSetting(setting.settingKey);
    if (existing) {
      const [s] = await db.update(notificationSettings)
        .set({ ...setting, updatedAt: new Date() })
        .where(eq(notificationSettings.settingKey, setting.settingKey)).returning();
      return s;
    }
    const [s] = await db.insert(notificationSettings).values(setting).returning();
    return s;
  }

  // ── Questionnaire Invitations ──────────────────────────────────────────────
  async createQuestionnaireInvitation(invitation: InsertQuestionnaireInvitation) {
    const [i] = await db.insert(questionnaireInvitations).values(invitation).returning();
    return i;
  }
  async getQuestionnaireInvitation(accessToken: string) {
    const [i] = await db.select().from(questionnaireInvitations).where(eq(questionnaireInvitations.accessToken, accessToken));
    return i;
  }
  async updateQuestionnaireInvitationStatus(id: number, status: string, completedAt?: Date) {
    const [i] = await db.update(questionnaireInvitations)
      .set({ status: status as any, completedAt: completedAt ?? null })
      .where(eq(questionnaireInvitations.id, id)).returning();
    return i;
  }
  async getEmployeeInvitations(employeeId: number) {
    return db.select().from(questionnaireInvitations).where(eq(questionnaireInvitations.employeeId, employeeId));
  }
  async getPendingInvitations() {
    return db.select().from(questionnaireInvitations).where(eq(questionnaireInvitations.status, 'pending'));
  }
  async getAllInvitations(companyId?: number) {
    if (companyId) return db.select().from(questionnaireInvitations).where(eq(questionnaireInvitations.companyId, companyId));
    return db.select().from(questionnaireInvitations);
  }
  async updateInvitationReminderCount(id: number) {
    const [i] = await db.update(questionnaireInvitations)
      .set({ reminderCount: sql`reminder_count + 1`, lastReminderAt: new Date() })
      .where(eq(questionnaireInvitations.id, id)).returning();
    return i;
  }
}

export const storage = new DatabaseStorage();
