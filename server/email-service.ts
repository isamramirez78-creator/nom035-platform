import { MailService } from '@sendgrid/mail';
import type { Employee, Evaluation, Intervention } from "@shared/schema";

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY not found. Email notifications will be disabled.");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailTemplate {
  to: string[];
  subject: string;
  html: string;
  text: string;
}

export class EmailNotificationService {
  private isEmailEnabled(): boolean {
    return !!process.env.SENDGRID_API_KEY;
  }

  async sendHighRiskAlert(employee: Employee, evaluation: Evaluation, supervisorEmails: string[]): Promise<boolean> {
    if (!this.isEmailEnabled()) {
      console.log(`Email disabled - Would send high risk alert for ${employee.nombre} ${employee.apellidos}`);
      return false;
    }

    const template = this.createHighRiskAlertTemplate(employee, evaluation, supervisorEmails);
    return await this.sendEmail(template);
  }

  async sendInterventionReminder(employee: Employee, intervention: Intervention, responsibleEmails: string[]): Promise<boolean> {
    if (!this.isEmailEnabled()) {
      console.log(`Email disabled - Would send intervention reminder for ${employee.nombre} ${employee.apellidos}`);
      return false;
    }

    const template = this.createInterventionReminderTemplate(employee, intervention, responsibleEmails);
    return await this.sendEmail(template);
  }

  async sendFollowUpReminder(employee: Employee, intervention: Intervention, responsibleEmails: string[]): Promise<boolean> {
    if (!this.isEmailEnabled()) {
      console.log(`Email disabled - Would send follow-up reminder for ${employee.nombre} ${employee.apellidos}`);
      return false;
    }

    const template = this.createFollowUpReminderTemplate(employee, intervention, responsibleEmails);
    return await this.sendEmail(template);
  }

  private async sendEmail(template: EmailTemplate): Promise<boolean> {
    try {
      const msg = {
        to: template.to,
        from: {
          email: 'noreply@nom035-system.com',
          name: 'Sistema NOM-035-STPS'
        },
        subject: template.subject,
        text: template.text,
        html: template.html,
      };

      await mailService.send(msg);
      console.log(`Email sent successfully to: ${template.to.join(', ')}`);
      return true;
    } catch (error) {
      console.error('SendGrid email error:', error);
      return false;
    }
  }

  private createHighRiskAlertTemplate(employee: Employee, evaluation: Evaluation, supervisorEmails: string[]): EmailTemplate {
    const riskLevelText = this.getRiskLevelText(evaluation.riskLevel);
    const urgencyLevel = evaluation.riskLevel === 'muy-alto' ? 'CRÍTICA' : 'ALTA';
    
    const subject = `⚠️ ATENCIÓN ${urgencyLevel}: Empleado con ${riskLevelText} - ${employee.nombre} ${employee.apellidos}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background: ${evaluation.riskLevel === 'muy-alto' ? '#dc2626' : '#f97316'}; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .alert-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
          .employee-info { background: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .actions { background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; }
          .score { font-size: 24px; font-weight: bold; color: ${evaluation.riskLevel === 'muy-alto' ? '#dc2626' : '#f97316'}; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🚨 Alerta de Riesgo Psicosocial ${urgencyLevel}</h1>
          <p>Sistema de Evaluación NOM-035-STPS</p>
        </div>
        
        <div class="content">
          <div class="alert-box">
            <h2>⚠️ Se requiere atención inmediata</h2>
            <p>Un empleado ha sido evaluado con <strong>${riskLevelText}</strong> en la evaluación NOM-035-STPS y requiere intervención prioritaria.</p>
          </div>

          <div class="employee-info">
            <h3>📋 Información del Empleado</h3>
            <ul>
              <li><strong>Nombre:</strong> ${employee.nombre} ${employee.apellidos}</li>
              <li><strong>Puesto:</strong> ${employee.puesto}</li>
              <li><strong>Área:</strong> ${employee.area}</li>
              <li><strong>Email:</strong> ${employee.email || 'No registrado'}</li>
              <li><strong>Fecha de evaluación:</strong> ${new Date(evaluation.completedAt || '').toLocaleDateString('es-ES')}</li>
            </ul>
          </div>

          <div class="employee-info">
            <h3>📊 Resultados de la Evaluación</h3>
            <ul>
              <li><strong>Nivel de Riesgo:</strong> <span class="score">${riskLevelText}</span></li>
              <li><strong>Puntuación:</strong> ${evaluation.overallScore}/100</li>
              <li><strong>Tipo de Cuestionario:</strong> ${this.getQuestionnaireTypeText(evaluation.questionnaireType)}</li>
            </ul>
          </div>

          <div class="actions">
            <h3>🎯 Acciones Requeridas</h3>
            <ul>
              <li>✅ <strong>Contactar al empleado</strong> en las próximas 24 horas</li>
              <li>✅ <strong>Crear plan de intervención</strong> inmediato</li>
              <li>✅ <strong>Asignar responsable</strong> del seguimiento</li>
              <li>✅ <strong>Programar evaluación de seguimiento</strong></li>
              <li>✅ <strong>Documentar todas las acciones</strong> en el expediente</li>
            </ul>
          </div>

          <div class="alert-box">
            <h3>⏰ Tiempo de Respuesta</h3>
            <p><strong>Riesgo ${evaluation.riskLevel === 'muy-alto' ? 'Muy Alto' : 'Alto'}:</strong> 
            ${evaluation.riskLevel === 'muy-alto' ? 
              'Requiere atención inmediata (máximo 24 horas)' : 
              'Requiere atención prioritaria (máximo 72 horas)'}</p>
          </div>

          <p style="text-align: center; margin: 30px 0;">
            <a href="${process.env.BASE_URL || 'http://localhost:5000'}/employees/${employee.id}" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Ver Expediente Completo
            </a>
          </p>
        </div>

        <div class="footer">
          <p>Este mensaje fue generado automáticamente por el Sistema NOM-035-STPS</p>
          <p>Para más información, contacte al administrador del sistema</p>
        </div>
      </body>
      </html>
    `;

    const text = `
ALERTA DE RIESGO PSICOSOCIAL ${urgencyLevel}

Empleado: ${employee.nombre} ${employee.apellidos}
Puesto: ${employee.puesto}
Área: ${employee.area}
Nivel de Riesgo: ${riskLevelText}
Puntuación: ${evaluation.overallScore}/100

ACCIONES REQUERIDAS:
- Contactar al empleado en las próximas ${evaluation.riskLevel === 'muy-alto' ? '24' : '72'} horas
- Crear plan de intervención inmediato
- Asignar responsable del seguimiento
- Programar evaluación de seguimiento

Para ver el expediente completo: ${process.env.BASE_URL || 'http://localhost:5000'}/employees/${employee.id}
    `;

    return {
      to: supervisorEmails,
      subject,
      html,
      text
    };
  }

  private createInterventionReminderTemplate(employee: Employee, intervention: Intervention, responsibleEmails: string[]): EmailTemplate {
    const subject = `📅 Recordatorio: Intervención pendiente - ${employee.nombre} ${employee.apellidos}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .info-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          .employee-info { background: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📅 Recordatorio de Intervención</h1>
          <p>Sistema de Seguimiento NOM-035-STPS</p>
        </div>
        
        <div class="content">
          <div class="info-box">
            <h2>Intervención Programada</h2>
            <p>Se le recuerda que tiene una intervención pendiente de seguimiento para el empleado <strong>${employee.nombre} ${employee.apellidos}</strong>.</p>
          </div>

          <div class="employee-info">
            <h3>Detalles de la Intervención</h3>
            <ul>
              <li><strong>Empleado:</strong> ${employee.nombre} ${employee.apellidos}</li>
              <li><strong>Tipo de Intervención:</strong> ${this.getInterventionTypeText(intervention.interventionType)}</li>
              <li><strong>Título:</strong> ${intervention.title}</li>
              <li><strong>Prioridad:</strong> ${intervention.priority}</li>
              <li><strong>Estado:</strong> ${intervention.status}</li>
              <li><strong>Responsable:</strong> ${intervention.responsiblePerson}</li>
              ${intervention.expectedEndDate ? `<li><strong>Fecha límite:</strong> ${new Date(intervention.expectedEndDate).toLocaleDateString('es-ES')}</li>` : ''}
            </ul>
          </div>

          <div class="employee-info">
            <h3>Descripción</h3>
            <p>${intervention.description}</p>
            ${intervention.objective ? `<h4>Objetivo</h4><p>${intervention.objective}</p>` : ''}
          </div>

          <p style="text-align: center; margin: 30px 0;">
            <a href="${process.env.BASE_URL || 'http://localhost:5000'}/employees/${employee.id}" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Actualizar Progreso
            </a>
          </p>
        </div>

        <div class="footer">
          <p>Sistema NOM-035-STPS - Recordatorio automático</p>
        </div>
      </body>
      </html>
    `;

    const text = `
RECORDATORIO DE INTERVENCIÓN

Empleado: ${employee.nombre} ${employee.apellidos}
Tipo: ${this.getInterventionTypeText(intervention.interventionType)}
Título: ${intervention.title}
Prioridad: ${intervention.priority}
Estado: ${intervention.status}
Responsable: ${intervention.responsiblePerson}

Descripción: ${intervention.description}

Para actualizar el progreso: ${process.env.BASE_URL || 'http://localhost:5000'}/employees/${employee.id}
    `;

    return {
      to: responsibleEmails,
      subject,
      html,
      text
    };
  }

  private createFollowUpReminderTemplate(employee: Employee, intervention: Intervention, responsibleEmails: string[]): EmailTemplate {
    const subject = `🔄 Seguimiento requerido - ${employee.nombre} ${employee.apellidos}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .info-box { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; }
          .employee-info { background: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🔄 Seguimiento Requerido</h1>
          <p>Sistema de Seguimiento NOM-035-STPS</p>
        </div>
        
        <div class="content">
          <div class="info-box">
            <h2>Evaluación de Seguimiento</h2>
            <p>Es momento de evaluar el progreso de la intervención para <strong>${employee.nombre} ${employee.apellidos}</strong> y determinar los próximos pasos.</p>
          </div>

          <div class="employee-info">
            <h3>Información de la Intervención</h3>
            <ul>
              <li><strong>Empleado:</strong> ${employee.nombre} ${employee.apellidos}</li>
              <li><strong>Intervención:</strong> ${intervention.title}</li>
              <li><strong>Tipo:</strong> ${this.getInterventionTypeText(intervention.interventionType)}</li>
              <li><strong>Fecha de revisión:</strong> ${intervention.nextReviewDate ? new Date(intervention.nextReviewDate).toLocaleDateString('es-ES') : 'Programada'}</li>
            </ul>
          </div>

          <div class="employee-info">
            <h3>Acciones Requeridas</h3>
            <ul>
              <li>✅ Evaluar efectividad de la intervención</li>
              <li>✅ Documentar resultados obtenidos</li>
              <li>✅ Determinar si se requiere intervención adicional</li>
              <li>✅ Programar próxima revisión si es necesario</li>
              <li>✅ Actualizar el expediente del empleado</li>
            </ul>
          </div>

          <p style="text-align: center; margin: 30px 0;">
            <a href="${process.env.BASE_URL || 'http://localhost:5000'}/employees/${employee.id}" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Registrar Seguimiento
            </a>
          </p>
        </div>

        <div class="footer">
          <p>Sistema NOM-035-STPS - Seguimiento automático</p>
        </div>
      </body>
      </html>
    `;

    const text = `
SEGUIMIENTO REQUERIDO

Empleado: ${employee.nombre} ${employee.apellidos}
Intervención: ${intervention.title}
Tipo: ${this.getInterventionTypeText(intervention.interventionType)}

ACCIONES REQUERIDAS:
- Evaluar efectividad de la intervención
- Documentar resultados obtenidos
- Determinar si se requiere intervención adicional
- Programar próxima revisión si es necesario

Para registrar el seguimiento: ${process.env.BASE_URL || 'http://localhost:5000'}/employees/${employee.id}
    `;

    return {
      to: responsibleEmails,
      subject,
      html,
      text
    };
  }

  private getRiskLevelText(riskLevel: string): string {
    switch (riskLevel) {
      case 'sin-riesgo': return 'Sin Riesgo';
      case 'bajo': return 'Riesgo Bajo';
      case 'medio': return 'Riesgo Medio';
      case 'alto': return 'Riesgo Alto';
      case 'muy-alto': return 'Riesgo Muy Alto';
      default: return 'Riesgo Desconocido';
    }
  }

  private getQuestionnaireTypeText(type: string): string {
    switch (type) {
      case 'microempresa': return 'Microempresa (1-15 trabajadores)';
      case 'guia1': return 'Guía I (16-49 trabajadores)';
      case 'guia2': return 'Guía II (50+ trabajadores)';
      case 'guia3': return 'Guía III (50+ trabajadores)';
      default: return type;
    }
  }

  private getInterventionTypeText(type: string): string {
    switch (type) {
      case 'counseling': return 'Asesoría Psicológica';
      case 'training': return 'Capacitación';
      case 'medical': return 'Atención Médica';
      case 'organizational': return 'Cambio Organizacional';
      case 'environmental': return 'Mejora del Ambiente';
      default: return type;
    }
  }

  // Questionnaire invitation emails
  async sendQuestionnaireInvitation(
    employee: Employee, 
    questionnaireType: string, 
    invitationUrl: string, 
    expirationDate: Date,
    customMessage?: string
  ): Promise<boolean> {
    if (!this.isEmailEnabled()) {
      console.log(`Email disabled - Would send questionnaire invitation to ${employee.nombre} ${employee.apellidos}`);
      return false;
    }

    const template = this.createQuestionnaireInvitationTemplate(
      employee, 
      questionnaireType, 
      invitationUrl, 
      expirationDate,
      customMessage
    );
    
    return await this.sendEmail(template);
  }

  async sendQuestionnaireReminder(
    employee: Employee, 
    questionnaireType: string, 
    invitationUrl: string, 
    expirationDate: Date
  ): Promise<boolean> {
    if (!this.isEmailEnabled()) {
      console.log(`Email disabled - Would send questionnaire reminder to ${employee.nombre} ${employee.apellidos}`);
      return false;
    }

    const template = this.createQuestionnaireReminderTemplate(
      employee, 
      questionnaireType, 
      invitationUrl, 
      expirationDate
    );
    
    return await this.sendEmail(template);
  }

  private createQuestionnaireInvitationTemplate(
    employee: Employee, 
    questionnaireType: string, 
    invitationUrl: string, 
    expirationDate: Date,
    customMessage?: string
  ): EmailTemplate {
    const questionnaireTypeNames: { [key: string]: string } = {
      'microenterprise': 'Microempresa',
      'guide_i': 'Guía de Referencia I',
      'guide_ii': 'Guía de Referencia II', 
      'guide_iii': 'Guía de Referencia III',
      'traumatic_events': 'Acontecimientos Traumáticos Severos'
    };

    const typeName = questionnaireTypeNames[questionnaireType] || questionnaireType;
    const expirationFormatted = expirationDate.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const subject = `Invitación: Evaluación NOM-035 - ${typeName}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Evaluación NOM-035-STPS</h1>
          <p style="margin: 5px 0 0 0;">Sistema de Evaluación de Riesgos Psicosociales</p>
        </div>
        
        <div style="padding: 30px 20px;">
          <h2 style="color: #1f2937;">Hola ${employee.nombre},</h2>
          
          <p>Has sido invitado/a a completar una evaluación de riesgos psicosociales conforme a la NOM-035-STPS-2018.</p>
          
          <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #1e40af;">Detalles de la evaluación:</h3>
            <p style="margin: 5px 0;"><strong>Tipo:</strong> ${typeName}</p>
            <p style="margin: 5px 0;"><strong>Área:</strong> ${employee.area}</p>
            <p style="margin: 5px 0;"><strong>Válido hasta:</strong> ${expirationFormatted}</p>
          </div>

          ${customMessage ? `
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0; color: #92400e;">Mensaje de tu supervisor:</h4>
              <p style="margin: 0; color: #92400e;">${customMessage}</p>
            </div>
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Iniciar Evaluación
            </a>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #374151;">Información importante:</h4>
            <ul style="margin: 0; padding-left: 20px; color: #6b7280;">
              <li>Tus respuestas son completamente confidenciales</li>
              <li>La evaluación toma aproximadamente 15-30 minutos</li>
              <li>Puedes completarla en una sola sesión</li>
              <li>Este enlace expira el ${expirationFormatted}</li>
            </ul>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            Si tienes problemas para acceder al enlace, copia y pega la siguiente URL en tu navegador:<br>
            <span style="color: #2563eb; word-break: break-all;">${invitationUrl}</span>
          </p>
        </div>
        
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>Este es un mensaje automático del sistema de evaluación NOM-035-STPS.</p>
          <p>Por favor no respondas a este correo.</p>
        </div>
      </div>
    `;

    const text = `
      Evaluación NOM-035-STPS
      
      Hola ${employee.nombre},
      
      Has sido invitado/a a completar una evaluación de riesgos psicosociales conforme a la NOM-035-STPS-2018.
      
      Tipo: ${typeName}
      Área: ${employee.area}
      Válido hasta: ${expirationFormatted}
      
      ${customMessage ? `Mensaje de tu supervisor: ${customMessage}\n\n` : ''}
      
      Para completar la evaluación, visita: ${invitationUrl}
      
      Información importante:
      - Tus respuestas son completamente confidenciales
      - La evaluación toma aproximadamente 15-30 minutos  
      - Puedes completarla en una sola sesión
      - Este enlace expira el ${expirationFormatted}
    `;

    return {
      to: [employee.email!],
      subject,
      html,
      text
    };
  }

  private createQuestionnaireReminderTemplate(
    employee: Employee, 
    questionnaireType: string, 
    invitationUrl: string, 
    expirationDate: Date
  ): EmailTemplate {
    const questionnaireTypeNames: { [key: string]: string } = {
      'microenterprise': 'Microempresa',
      'guide_i': 'Guía de Referencia I',
      'guide_ii': 'Guía de Referencia II',
      'guide_iii': 'Guía de Referencia III', 
      'traumatic_events': 'Acontecimientos Traumáticos Severos'
    };

    const typeName = questionnaireTypeNames[questionnaireType] || questionnaireType;
    const expirationFormatted = expirationDate.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });

    const subject = `Recordatorio: Evaluación NOM-035 pendiente - ${typeName}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f59e0b; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Recordatorio - Evaluación NOM-035</h1>
          <p style="margin: 5px 0 0 0;">Tienes una evaluación pendiente</p>
        </div>
        
        <div style="padding: 30px 20px;">
          <h2 style="color: #1f2937;">Hola ${employee.nombre},</h2>
          
          <p>Te recordamos que tienes una evaluación de riesgos psicosociales pendiente de completar.</p>
          
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #92400e;">Detalles de la evaluación:</h3>
            <p style="margin: 5px 0;"><strong>Tipo:</strong> ${typeName}</p>
            <p style="margin: 5px 0;"><strong>Área:</strong> ${employee.area}</p>
            <p style="margin: 5px 0;"><strong>Expira:</strong> ${expirationFormatted}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationUrl}" 
               style="background-color: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Completar Evaluación
            </a>
          </div>
          
          <p style="color: #dc2626; font-weight: bold; text-align: center;">
            ⚠️ Tu enlace expira el ${expirationFormatted}
          </p>
        </div>
        
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>Este es un recordatorio automático del sistema de evaluación NOM-035-STPS.</p>
        </div>
      </div>
    `;

    const text = `
      Recordatorio - Evaluación NOM-035
      
      Hola ${employee.nombre},
      
      Te recordamos que tienes una evaluación de riesgos psicosociales pendiente de completar.
      
      Tipo: ${typeName}
      Área: ${employee.area}
      Expira: ${expirationFormatted}
      
      Para completar la evaluación, visita: ${invitationUrl}
      
      ⚠️ Tu enlace expira el ${expirationFormatted}
    `;

    return {
      to: [employee.email!],
      subject,
      html,
      text
    };
  }
}

export const emailService = new EmailNotificationService();