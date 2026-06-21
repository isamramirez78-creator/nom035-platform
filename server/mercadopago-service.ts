/**
 * mercadopago-service.ts
 * Servicio de suscripciones recurrentes con Mercado Pago (PreApproval API)
 *
 * Flujo:
 * 1. Empresa elige plan en /subscription-plans
 * 2. createSubscriptionLink() genera un link de autorización de Mercado Pago
 * 3. Empresa autoriza el cobro recurrente en Mercado Pago (sale de nuestro sitio)
 * 4. Mercado Pago redirige de vuelta + envía webhook a /api/mercadopago/webhook
 * 5. Confirmamos la suscripción y activamos el plan de la empresa
 */

import { MercadoPagoConfig, PreApproval, Payment } from 'mercadopago';
import { companyStorage } from './company-storage';

if (!process.env.MP_ACCESS_TOKEN) {
  console.warn('MP_ACCESS_TOKEN not found. Mercado Pago payment functionality will be disabled.');
}

const client = process.env.MP_ACCESS_TOKEN
  ? new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN })
  : null;

// ─── Planes y precios (deben coincidir con subscription-plans.tsx) ───────────
export const PLAN_PRICES: Record<string, { name: string; monthlyPrice: number; maxEmployees: number }> = {
  'starter-monthly':      { name: 'Plan Básico',       monthlyPrice: 899,  maxEmployees: 15 },
  'professional-monthly': { name: 'Plan Profesional',  monthlyPrice: 1899, maxEmployees: 50 },
  'enterprise-monthly':   { name: 'Plan Empresarial',  monthlyPrice: 3499, maxEmployees: 500 },
  // Anuales — cobro recurrente cada 12 meses, precio ya con descuento aplicado
  'starter-yearly':       { name: 'Plan Básico (anual)',      monthlyPrice: 8099,  maxEmployees: 15 },
  'professional-yearly':  { name: 'Plan Profesional (anual)', monthlyPrice: 17099, maxEmployees: 50 },
  'enterprise-yearly':    { name: 'Plan Empresarial (anual)', monthlyPrice: 31499, maxEmployees: 500 },
};

export class MercadoPagoService {
  private isEnabled(): boolean {
    return !!client;
  }

  /**
   * Crea un link de autorización de suscripción recurrente (PreApproval).
   * El usuario es redirigido a Mercado Pago para autorizar el cobro.
   */
  async createSubscriptionLink(params: {
    companyId: number;
    email: string;
    planId: string;
    backUrl: string;
  }): Promise<{ initPoint: string; preapprovalId: string } | null> {
    if (!this.isEnabled()) {
      console.warn('Mercado Pago not configured');
      return null;
    }

    const plan = PLAN_PRICES[params.planId];
    if (!plan) {
      console.error('Plan no encontrado:', params.planId);
      return null;
    }

    const isYearly = params.planId.includes('yearly');

    try {
      const preapproval = new PreApproval(client!);
      const result = await preapproval.create({
        body: {
          reason: `NOM-035 Platform — ${plan.name}`,
          external_reference: `${params.companyId}:${params.planId}`,
          payer_email: params.email,
          back_url: params.backUrl,
          auto_recurring: {
            frequency: isYearly ? 12 : 1,
            frequency_type: 'months',
            transaction_amount: plan.monthlyPrice,
            currency_id: 'MXN',
          },
          status: 'pending',
        },
      });

      return {
        initPoint: result.init_point!,
        preapprovalId: result.id!,
      };
    } catch (error) {
      console.error('Error creating Mercado Pago subscription:', error);
      return null;
    }
  }

  /**
   * Obtiene el estado actual de una suscripción (preapproval).
   */
  async getSubscriptionStatus(preapprovalId: string): Promise<{
    status: string;
    externalReference: string | null;
  } | null> {
    if (!this.isEnabled()) return null;

    try {
      const preapproval = new PreApproval(client!);
      const result = await preapproval.get({ id: preapprovalId });
      return {
        status: result.status || 'unknown',
        externalReference: result.external_reference || null,
      };
    } catch (error) {
      console.error('Error fetching Mercado Pago subscription:', error);
      return null;
    }
  }

  /**
   * Cancela una suscripción recurrente.
   */
  async cancelSubscription(preapprovalId: string): Promise<boolean> {
    if (!this.isEnabled()) return false;

    try {
      const preapproval = new PreApproval(client!);
      await preapproval.update({
        id: preapprovalId,
        body: { status: 'cancelled' },
      });
      return true;
    } catch (error) {
      console.error('Error cancelling Mercado Pago subscription:', error);
      return false;
    }
  }

  /**
   * Procesa el webhook de Mercado Pago.
   * Llamar desde el endpoint POST /api/mercadopago/webhook
   */
  async handleWebhook(body: { type: string; data: { id: string } }): Promise<void> {
    if (!this.isEnabled()) return;

    if (body.type === 'subscription_preapproval') {
      const status = await this.getSubscriptionStatus(body.data.id);
      if (!status || !status.externalReference) return;

      const [companyIdStr, planId] = status.externalReference.split(':');
      const companyId = parseInt(companyIdStr, 10);
      if (isNaN(companyId)) return;

      if (status.status === 'authorized') {
        // Suscripción activa — actualizar empresa
        await companyStorage.updateCompanySubscription(companyId, {
          subscriptionPlan: planId,
          subscriptionStatus: 'active',
          mercadopagoSubscriptionId: body.data.id,
        });
        console.log(`✅ Suscripción activada — Empresa ${companyId}, Plan ${planId}`);
      } else if (status.status === 'cancelled' || status.status === 'paused') {
        await companyStorage.updateCompanySubscription(companyId, {
          subscriptionStatus: status.status === 'cancelled' ? 'cancelled' : 'paused',
        });
        console.log(`⚠️ Suscripción ${status.status} — Empresa ${companyId}`);
      }
    }

    if (body.type === 'payment') {
      // Notificación de un cobro individual dentro de la suscripción recurrente
      try {
        const payment = new Payment(client!);
        const result = await payment.get({ id: body.data.id });
        console.log(`💳 Pago recibido — Status: ${result.status}, Monto: ${result.transaction_amount}`);
      } catch (error) {
        console.error('Error fetching payment details:', error);
      }
    }
  }
}

export const mercadoPagoService = new MercadoPagoService();
