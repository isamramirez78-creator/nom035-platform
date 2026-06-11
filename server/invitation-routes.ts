import type { Express } from "express";
import { storage } from "./storage";
import { insertQuestionnaireInvitationSchema } from "@shared/schema";
import { emailService } from "./email-service";
import crypto from "crypto";

export function registerInvitationRoutes(app: Express) {
  // Send questionnaire invitations
  app.post("/api/questionnaire-invitations/send", async (req, res) => {
    try {
      const { employeeIds, questionnaireType, customMessage, expirationDays = 10 } = req.body;
      
      if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
        return res.status(400).json({ message: "Employee IDs are required" });
      }

      if (!questionnaireType) {
        return res.status(400).json({ message: "Questionnaire type is required" });
      }

      const invitations = [];
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + expirationDays);

      for (const employeeId of employeeIds) {
        // Check if employee exists
        const employee = await storage.getEmployee(employeeId);
        if (!employee) {
          console.warn(`Employee ${employeeId} not found, skipping invitation`);
          continue;
        }

        // Check if employee has already completed this questionnaire
        const hasCompleted = await storage.hasCompletedQuestionnaire(employeeId, questionnaireType, 1);
        if (hasCompleted) {
          console.warn(`Employee ${employeeId} has already completed ${questionnaireType}, skipping invitation`);
          continue;
        }

        // Generate unique access token
        const accessToken = crypto.randomBytes(32).toString('hex');

        // Create invitation
        const invitationData = {
          employeeId,
          questionnaireType,
          accessToken,
          expiresAt: expirationDate,
          companyId: 1, // Default company
          invitedBy: "Sistema administrativo",
          customMessage: customMessage || null,
          status: "pending"
        };

        const validatedData = insertQuestionnaireInvitationSchema.parse(invitationData);
        const invitation = await storage.createQuestionnaireInvitation(validatedData);
        
        // Send email invitation if email service is available
        const baseUrl = process.env.REPLIT_DOMAINS ? 
          `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 
          'http://localhost:5000';
        
        const invitationUrl = `${baseUrl}/cuestionario/${accessToken}`;
        
        if (employee.email) {
          try {
            await emailService.sendQuestionnaireInvitation(
              employee,
              questionnaireType,
              invitationUrl,
              expirationDate,
              customMessage
            );
            
            // Update invitation as sent
            await storage.updateQuestionnaireInvitationStatus(invitation.id, 'pending', undefined);
          } catch (emailError) {
            console.error(`Failed to send email to ${employee.email}:`, emailError);
          }
        }

        invitations.push({
          ...invitation,
          employee: {
            id: employee.id,
            nombre: employee.nombre,
            apellidos: employee.apellidos,
            email: employee.email,
            area: employee.area
          },
          invitationUrl
        });
      }

      res.json({
        message: `${invitations.length} invitations sent successfully`,
        invitations,
        skipped: employeeIds.length - invitations.length
      });
    } catch (error) {
      console.error('Error sending invitations:', error);
      res.status(500).json({ message: "Error sending invitations" });
    }
  });

  // Get all invitations
  app.get("/api/questionnaire-invitations", async (req, res) => {
    try {
      const companyId = parseInt(req.query.companyId as string) || 1;
      const invitations = await storage.getAllInvitations(companyId);
      res.json(invitations);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      res.status(500).json({ message: "Error fetching invitations" });
    }
  });

  // Get invitation by access token (for public access)
  app.get("/api/questionnaire-invitations/access/:token", async (req, res) => {
    try {
      const token = req.params.token;
      
      if (!token) {
        return res.status(400).json({ message: "Access token is required" });
      }

      const invitation = await storage.getQuestionnaireInvitation(token);
      
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }

      // Check if invitation has expired
      if (new Date() > new Date(invitation.expiresAt)) {
        // Update status to expired
        await storage.updateQuestionnaireInvitationStatus(invitation.id, 'expired');
        return res.status(410).json({ 
          message: "Invitation has expired",
          invitation: { ...invitation, status: 'expired' }
        });
      }

      res.json(invitation);
    } catch (error) {
      console.error('Error fetching invitation:', error);
      res.status(500).json({ message: "Error fetching invitation" });
    }
  });

  // Send reminder for specific invitation
  app.post("/api/questionnaire-invitations/:id/reminder", async (req, res) => {
    try {
      const invitationId = parseInt(req.params.id);
      
      if (!invitationId) {
        return res.status(400).json({ message: "Invitation ID is required" });
      }

      const invitation = await storage.getQuestionnaireInvitation(''); // We need to get by ID, will fix this
      
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }

      if (invitation.status !== 'pending') {
        return res.status(400).json({ message: "Can only send reminders for pending invitations" });
      }

      // Check if invitation has expired
      if (new Date() > new Date(invitation.expiresAt)) {
        await storage.updateQuestionnaireInvitationStatus(invitation.id, 'expired');
        return res.status(410).json({ message: "Invitation has expired" });
      }

      // Update reminder count
      await storage.updateInvitationReminderCount(invitationId);

      // Send reminder email if email service is available
      if (invitation.employee?.email) {
        const baseUrl = process.env.REPLIT_DOMAINS ? 
          `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 
          'http://localhost:5000';
        
        const invitationUrl = `${baseUrl}/cuestionario/${invitation.accessToken}`;
        
        try {
          await emailService.sendQuestionnaireReminder(
            invitation.employee,
            invitation.questionnaireType,
            invitationUrl,
            new Date(invitation.expiresAt)
          );
        } catch (emailError) {
          console.error('Failed to send reminder email:', emailError);
        }
      }

      res.json({ message: "Reminder sent successfully" });
    } catch (error) {
      console.error('Error sending reminder:', error);
      res.status(500).json({ message: "Error sending reminder" });
    }
  });

  // Complete invitation (called when questionnaire is submitted)
  app.post("/api/questionnaire-invitations/:token/complete", async (req, res) => {
    try {
      const token = req.params.token;
      
      if (!token) {
        return res.status(400).json({ message: "Access token is required" });
      }

      const invitation = await storage.getQuestionnaireInvitation(token);
      
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }

      if (invitation.status === 'completed') {
        return res.status(400).json({ message: "Invitation already completed" });
      }

      // Update invitation as completed
      const updatedInvitation = await storage.updateQuestionnaireInvitationStatus(
        invitation.id, 
        'completed', 
        new Date()
      );

      res.json({
        message: "Invitation completed successfully",
        invitation: updatedInvitation
      });
    } catch (error) {
      console.error('Error completing invitation:', error);
      res.status(500).json({ message: "Error completing invitation" });
    }
  });
}