import { pgTable, text, serial, integer, jsonb, timestamp, boolean, varchar, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Company profiles and subscriptions
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  
  // Datos básicos de la empresa (NOM-035 requeridos)
  nombreEmpresa: text("nombre_empresa").notNull(),
  razonSocial: text("razon_social").notNull(),
  rfc: varchar("rfc", { length: 13 }).notNull(),
  domicilio: text("domicilio").notNull(),
  telefono: varchar("telefono", { length: 20 }),
  correoElectronico: text("correo_electronico").notNull().unique(),
  sitioWeb: text("sitio_web"),
  
  // Datos específicos NOM-035
  registroPatronal: varchar("registro_patronal", { length: 20 }),
  actividadEconomica: text("actividad_economica").notNull(),
  giroEmpresarial: text("giro_empresarial").notNull(),
  cantidadEmpleados: integer("cantidad_empleados").notNull(),
  centrosTrabajo: integer("centros_trabajo").default(1),
  
  // Representante legal
  representanteLegal: text("representante_legal").notNull(),
  cargoRepresentante: text("cargo_representante").notNull(),
  rfcRepresentante: varchar("rfc_representante", { length: 13 }).notNull(),
  
  // Datos del administrador de la cuenta
  nombreAdministrador: text("nombre_administrador").notNull(),
  apellidosAdministrador: text("apellidos_administrador").notNull(),
  cargoAdministrador: text("cargo_administrador").notNull(),
  telefonoAdministrador: varchar("telefono_administrador", { length: 20 }),
  correoAdministrador: text("correo_administrador").notNull(),
  contrasena: text("contrasena").notNull(),
  
  // Configuración NOM-035
  fechaInicioImplementacion: timestamp("fecha_inicio_implementacion"),
  responsableNom035: text("responsable_nom035"),
  cargoResponsableNom035: text("cargo_responsable_nom035"),
  
  // Subscription fields
  subscriptionPlan: text("subscription_plan").default("trial"),
  subscriptionStatus: text("subscription_status").default("active"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  mercadopagoSubscriptionId: text("mercadopago_subscription_id"),
  subscriptionStartDate: timestamp("subscription_start_date").defaultNow(),
  subscriptionEndDate: timestamp("subscription_end_date"),
  trialEndDate: timestamp("trial_end_date"),
  maxEmployees: integer("max_employees").default(5),
  maxEvaluationsPerMonth: integer("max_evaluations_per_month").default(50),
  
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscription plans catalog
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  planId: text("plan_id").notNull(),
  planName: text("plan_name").notNull(),
  description: text("description"),
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }).notNull(),
  semesterPrice: decimal("semester_price", { precision: 10, scale: 2 }),
  yearlyPrice: decimal("yearly_price", { precision: 10, scale: 2 }),
  maxEmployees: integer("max_employees").notNull(),
  maxEvaluationsPerMonth: integer("max_evaluations_per_month").notNull(),
  features: jsonb("features").notNull(),
  stripePriceIdMonthly: text("stripe_price_id_monthly"),
  stripePriceIdSemester: text("stripe_price_id_semester"),
  stripePriceIdYearly: text("stripe_price_id_yearly"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Company usage tracking
export const usageMetrics = pgTable("usage_metrics", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  employeesCount: integer("employees_count").default(0),
  evaluationsCount: integer("evaluations_count").default(0),
  emailsSent: integer("emails_sent").default(0),
  storageUsed: decimal("storage_used_mb", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  nombre: text("nombre").notNull(),
  apellidos: text("apellidos").notNull(),
  puesto: text("puesto").notNull(),
  area: text("area").notNull(),
  fechaIngreso: text("fecha_ingreso").notNull(),
  email: text("email"),
  // Campos demográficos opcionales — usados en reportes NOM-035
  genero: text("genero"),          // "Masculino" | "Femenino" | "No binario" | "Prefiero no decir"
  generacion: text("generacion"),  // "Baby Boomers" | "Generación X" | "Millennials" | "Generación Z"
  riskStatus: text("risk_status").default("sin-evaluar"),
  lastEvaluationDate: timestamp("last_evaluation_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const evaluations = pgTable("evaluations", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  questionnaireType: text("questionnaire_type").notNull(),
  answers: jsonb("answers").default('[]'),
  scores: jsonb("scores").default('[]'), // Keep for backward compatibility  
  domainScores: jsonb("domainScores").default('[]'),
  recommendations: jsonb("recommendations").default('[]'),
  riskLevel: text("risk_level").default('sin-riesgo'),
  overallScore: integer("overall_score").default(0),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  companyId: integer("company_id").default(1),
});

// Employee file/record system for tracking history and interventions
export const employeeFiles = pgTable("employee_files", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  evaluationId: integer("evaluation_id"), // Optional reference to specific evaluation
  fileType: text("file_type").notNull(), // 'evaluation', 'intervention', 'follow_up', 'medical', 'note'
  title: text("title").notNull(),
  description: text("description"),
  content: jsonb("content"), // Flexible content storage
  attachments: jsonb("attachments"), // File references if needed
  priority: text("priority").default("normal"), // 'low', 'normal', 'high', 'urgent'
  status: text("status").default("active"), // 'active', 'completed', 'cancelled', 'archived'
  dueDate: timestamp("due_date"),
  assignedTo: text("assigned_to"), // Who is responsible for follow-up
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Intervention tracking for employees requiring attention
export const interventions = pgTable("interventions", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  evaluationId: integer("evaluation_id"), // Source evaluation that triggered intervention
  interventionType: text("intervention_type").notNull(), // 'counseling', 'training', 'medical', 'organizational', 'environmental'
  title: text("title").notNull(),
  description: text("description").notNull(),
  objective: text("objective"), // What we aim to achieve
  actions: jsonb("actions").notNull(), // Array of specific actions to take
  timeline: text("timeline"), // Expected duration or schedule
  responsiblePerson: text("responsible_person").notNull(),
  status: text("status").default("planned"), // 'planned', 'in_progress', 'completed', 'cancelled', 'on_hold'
  priority: text("priority").default("medium"), // 'low', 'medium', 'high', 'critical'
  startDate: timestamp("start_date"),
  expectedEndDate: timestamp("expected_end_date"),
  actualEndDate: timestamp("actual_end_date"),
  results: text("results"), // Outcomes and effectiveness
  followUpRequired: boolean("follow_up_required").default(false),
  nextReviewDate: timestamp("next_review_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Progress notes for interventions
export const interventionNotes = pgTable("intervention_notes", {
  id: serial("id").primaryKey(),
  interventionId: integer("intervention_id").notNull(),
  noteType: text("note_type").notNull(), // 'progress', 'setback', 'completion', 'review'
  note: text("note").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Email notification settings and logs
export const emailNotifications = pgTable("email_notifications", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  evaluationId: integer("evaluation_id"),
  interventionId: integer("intervention_id"),
  notificationType: text("notification_type").notNull(), // 'high_risk_alert', 'intervention_reminder', 'follow_up_reminder'
  recipients: jsonb("recipients").notNull(), // Array of email addresses
  subject: text("subject").notNull(),
  status: text("status").default("pending"), // 'pending', 'sent', 'failed'
  sentAt: timestamp("sent_at"),
  errorMessage: text("error_message"),
  scheduledFor: timestamp("scheduled_for"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Email notification settings per organization
export const notificationSettings = pgTable("notification_settings", {
  id: serial("id").primaryKey(),
  settingKey: text("setting_key").notNull(), // 'supervisor_emails', 'hr_emails', 'admin_emails'
  settingValue: jsonb("setting_value").notNull(), // Configuration data
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Questionnaire invitations for employee access control
export const questionnaireInvitations = pgTable("questionnaire_invitations", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  questionnaireType: varchar("questionnaire_type", { length: 50 }).notNull(),
  accessToken: varchar("access_token", { length: 255 }).unique().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, completed, expired
  sentAt: timestamp("sent_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  companyId: integer("company_id").references(() => companies.id).default(1).notNull(),
  invitedBy: varchar("invited_by", { length: 255 }), // Who sent the invitation
  reminderCount: integer("reminder_count").default(0), // Track reminder emails sent
  lastReminderAt: timestamp("last_reminder_at"),
  customMessage: text("custom_message") // Custom message from supervisor
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
});

export const insertEvaluationSchema = createInsertSchema(evaluations).omit({
  id: true,
  createdAt: true,
}).extend({
  // Make fields optional with proper defaults
  answers: z.array(z.object({
    questionId: z.number(),
    value: z.number().min(0).max(4)
  })).optional().default([]),
  domainScores: z.array(z.object({
    domain: z.string(),
    score: z.number(),
    maxScore: z.number(), 
    percentage: z.number()
  })).optional().default([]),
  recommendations: z.array(z.string()).optional().default([]),
  overallScore: z.number().optional().default(0),
  riskLevel: z.string().optional().default('sin-riesgo'),
  completed: z.boolean().default(false),
  companyId: z.number().optional().default(1)
});

export const insertEmployeeFileSchema = createInsertSchema(employeeFiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInterventionSchema = createInsertSchema(interventions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInterventionNoteSchema = createInsertSchema(interventionNotes).omit({
  id: true,
  createdAt: true,
});

export const insertEmailNotificationSchema = createInsertSchema(emailNotifications).omit({
  id: true,
  createdAt: true,
  sentAt: true,
});

export const insertNotificationSettingSchema = createInsertSchema(notificationSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCompanySchema = createInsertSchema(companies, {
  correoElectronico: z.string().email("Correo electrónico inválido"),
  rfc: z.string().length(13, "RFC debe tener 13 caracteres"),
  rfcRepresentante: z.string().length(13, "RFC del representante debe tener 13 caracteres"),
  cantidadEmpleados: z.number().min(1, "Debe tener al menos 1 empleado"),
  contrasena: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  nombreEmpresa: z.string().min(2, "Nombre de empresa muy corto"),
  razonSocial: z.string().min(2, "Razón social muy corta"),
  domicilio: z.string().min(10, "Domicilio debe ser más específico"),
  actividadEconomica: z.string().min(5, "Descripción de actividad económica muy corta"),
  giroEmpresarial: z.string().min(3, "Giro empresarial muy corto"),
  representanteLegal: z.string().min(5, "Nombre del representante legal muy corto"),
  cargoRepresentante: z.string().min(3, "Cargo del representante muy corto"),
  nombreAdministrador: z.string().min(2, "Nombre del administrador muy corto"),
  apellidosAdministrador: z.string().min(2, "Apellidos del administrador muy cortos"),
  cargoAdministrador: z.string().min(3, "Cargo del administrador muy corto"),
  correoAdministrador: z.string().email("Correo del administrador inválido"),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
  subscriptionStartDate: true,
  trialEndDate: true,
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
});

export const insertUsageMetricSchema = createInsertSchema(usageMetrics).omit({
  id: true,
  createdAt: true,
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type UsageMetric = typeof usageMetrics.$inferSelect;
export type InsertUsageMetric = z.infer<typeof insertUsageMetricSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Evaluation = typeof evaluations.$inferSelect;
export type InsertEvaluation = z.infer<typeof insertEvaluationSchema>;
export type EmployeeFile = typeof employeeFiles.$inferSelect;
export type InsertEmployeeFile = z.infer<typeof insertEmployeeFileSchema>;
export type Intervention = typeof interventions.$inferSelect;
export type InsertIntervention = z.infer<typeof insertInterventionSchema>;
export type InterventionNote = typeof interventionNotes.$inferSelect;
export type InsertInterventionNote = z.infer<typeof insertInterventionNoteSchema>;
export type EmailNotification = typeof emailNotifications.$inferSelect;
export type InsertEmailNotification = z.infer<typeof insertEmailNotificationSchema>;
export type NotificationSetting = typeof notificationSettings.$inferSelect;
export type InsertNotificationSetting = z.infer<typeof insertNotificationSettingSchema>;

export const insertQuestionnaireInvitationSchema = createInsertSchema(questionnaireInvitations).omit({
  id: true,
  createdAt: true,
  sentAt: true,
  completedAt: true,
}).extend({
  customMessage: z.string().optional(),
  reminderCount: z.number().default(0),
});

export type InsertQuestionnaireInvitation = z.infer<typeof insertQuestionnaireInvitationSchema>;
export type QuestionnaireInvitation = typeof questionnaireInvitations.$inferSelect & {
  employee?: {
    id: number;
    nombre: string;
    apellidos: string;
    email: string | null;
    area: string | null;
    puesto: string | null;
  };
};

// NOM-035 specific types
export interface QuestionnaireAnswer {
  questionId: number;
  value: number; // 0-4 scale for regular questionnaires, 0-1 for traumatic events
}

export interface DomainScore {
  domain: string;
  score: number;
  maxScore: number;
  percentage: number;
}

export interface EvaluationResult {
  employeeId: number;
  questionnaireType: string;
  answers: QuestionnaireAnswer[];
  domainScores: DomainScore[];
  overallScore: number;
  riskLevel: string;
  recommendations: string[];
}

export const loginCompanySchema = z.object({
  correoElectronico: z.string().email("Correo electrónico inválido"),
  contrasena: z.string().min(1, "La contraseña es requerida"),
});

export type LoginCompany = z.infer<typeof loginCompanySchema>;
