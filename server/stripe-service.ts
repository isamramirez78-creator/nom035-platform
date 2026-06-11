import Stripe from 'stripe';
import { companyStorage } from './company-storage';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY not found. Payment functionality will be disabled.');
}

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
}) : null;

export class StripeService {
  private isEnabled(): boolean {
    return !!stripe;
  }

  async createCustomer(companyData: { 
    email: string; 
    name: string; 
    rfc?: string;
    address?: string;
  }): Promise<string | null> {
    if (!this.isEnabled()) {
      console.warn('Stripe not configured');
      return null;
    }

    try {
      const customer = await stripe!.customers.create({
        email: companyData.email,
        name: companyData.name,
        metadata: {
          rfc: companyData.rfc || '',
          company_type: 'nom035_client'
        },
        address: companyData.address ? {
          line1: companyData.address,
          country: 'MX',
        } : undefined,
      });

      return customer.id;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      return null;
    }
  }

  async createSubscription(customerId: string, planId: string, billingCycle: 'monthly' | 'semester' | 'yearly'): Promise<{
    subscriptionId: string;
    clientSecret: string;
    status: string;
  } | null> {
    if (!this.isEnabled()) {
      console.warn('Stripe not configured');
      return null;
    }

    try {
      // Get plan details from database
      const plan = await companyStorage.getSubscriptionPlan(planId);
      if (!plan) {
        throw new Error('Plan not found');
      }

      // Determine price based on billing cycle
      let priceAmount: number;
      switch (billingCycle) {
        case 'monthly':
          priceAmount = parseFloat(plan.monthlyPrice);
          break;
        case 'semester':
          priceAmount = parseFloat(plan.semesterPrice || plan.monthlyPrice) * 100; // Convert to cents
          break;
        case 'yearly':
          priceAmount = parseFloat(plan.yearlyPrice || plan.monthlyPrice) * 100; // Convert to cents
          break;
        default:
          priceAmount = parseFloat(plan.monthlyPrice);
      }

      // Create or get existing price in Stripe
      const price = await stripe!.prices.create({
        unit_amount: Math.round(priceAmount * 100), // Convert to cents
        currency: 'mxn',
        recurring: {
          interval: billingCycle === 'yearly' ? 'year' : billingCycle === 'semester' ? 'month' : 'month',
          interval_count: billingCycle === 'semester' ? 6 : 1,
        },
        product_data: {
          name: `Plan ${plan.planName} - ${billingCycle}`,
          description: plan.description || '',
          metadata: {
            plan_id: planId,
            billing_cycle: billingCycle,
            max_employees: plan.maxEmployees.toString(),
            max_evaluations: plan.maxEvaluationsPerMonth.toString(),
          }
        },
        metadata: {
          plan_id: planId,
          billing_cycle: billingCycle,
        }
      });

      // Create subscription
      const subscription = await stripe!.subscriptions.create({
        customer: customerId,
        items: [{
          price: price.id,
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          plan_id: planId,
          billing_cycle: billingCycle,
        }
      });

      const invoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

      return {
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret!,
        status: subscription.status,
      };
    } catch (error) {
      console.error('Error creating Stripe subscription:', error);
      return null;
    }
  }

  async updateSubscription(subscriptionId: string, newPlanId: string, billingCycle: 'monthly' | 'semester' | 'yearly'): Promise<boolean> {
    if (!this.isEnabled()) {
      console.warn('Stripe not configured');
      return false;
    }

    try {
      const subscription = await stripe!.subscriptions.retrieve(subscriptionId);
      const plan = await companyStorage.getSubscriptionPlan(newPlanId);
      
      if (!plan) {
        throw new Error('Plan not found');
      }

      // Calculate new price
      let priceAmount: number;
      switch (billingCycle) {
        case 'monthly':
          priceAmount = parseFloat(plan.monthlyPrice);
          break;
        case 'semester':
          priceAmount = parseFloat(plan.semesterPrice || plan.monthlyPrice);
          break;
        case 'yearly':
          priceAmount = parseFloat(plan.yearlyPrice || plan.monthlyPrice);
          break;
        default:
          priceAmount = parseFloat(plan.monthlyPrice);
      }

      // Create new price
      const newPrice = await stripe!.prices.create({
        unit_amount: Math.round(priceAmount * 100),
        currency: 'mxn',
        recurring: {
          interval: billingCycle === 'yearly' ? 'year' : 'month',
          interval_count: billingCycle === 'semester' ? 6 : 1,
        },
        product_data: {
          name: `Plan ${plan.planName} - ${billingCycle}`,
          description: plan.description || '',
        },
        metadata: {
          plan_id: newPlanId,
          billing_cycle: billingCycle,
        }
      });

      // Update subscription
      await stripe!.subscriptions.update(subscriptionId, {
        items: [{
          id: subscription.items.data[0].id,
          price: newPrice.id,
        }],
        proration_behavior: 'create_prorations',
        metadata: {
          plan_id: newPlanId,
          billing_cycle: billingCycle,
        }
      });

      return true;
    } catch (error) {
      console.error('Error updating Stripe subscription:', error);
      return false;
    }
  }

  async cancelSubscription(subscriptionId: string, immediately: boolean = false): Promise<boolean> {
    if (!this.isEnabled()) {
      console.warn('Stripe not configured');
      return false;
    }

    try {
      if (immediately) {
        await stripe!.subscriptions.cancel(subscriptionId);
      } else {
        await stripe!.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
      }
      return true;
    } catch (error) {
      console.error('Error canceling Stripe subscription:', error);
      return false;
    }
  }

  async getSubscriptionStatus(subscriptionId: string): Promise<{
    status: string;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    latestInvoice?: any;
  } | null> {
    if (!this.isEnabled()) {
      console.warn('Stripe not configured');
      return null;
    }

    try {
      const subscription = await stripe!.subscriptions.retrieve(subscriptionId, {
        expand: ['latest_invoice']
      });

      return {
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        latestInvoice: subscription.latest_invoice,
      };
    } catch (error) {
      console.error('Error getting subscription status:', error);
      return null;
    }
  }

  async handleWebhook(signature: string, payload: string): Promise<boolean> {
    if (!this.isEnabled()) {
      console.warn('Stripe not configured');
      return false;
    }

    try {
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!endpointSecret) {
        console.warn('Stripe webhook secret not configured');
        return false;
      }

      const event = stripe!.webhooks.constructEvent(payload, signature, endpointSecret);

      switch (event.type) {
        case 'subscription.updated':
        case 'subscription.deleted':
        case 'invoice.payment_succeeded':
        case 'invoice.payment_failed':
          // Handle subscription events
          const subscription = event.data.object as Stripe.Subscription;
          console.log(`Received ${event.type} for subscription ${subscription.id}`);
          // Update company subscription status in database
          break;
        
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return true;
    } catch (error) {
      console.error('Webhook handling error:', error);
      return false;
    }
  }
}

export const stripeService = new StripeService();