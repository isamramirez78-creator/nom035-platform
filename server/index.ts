import express, { type Request, Response, NextFunction } from "express";
import fileUpload from "express-fileupload";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use((req, res, next) => { if (req.originalUrl === "/api/stripe/webhook") return next(); express.json()(req, res, next); });
app.use(express.urlencoded({ extended: false }));

// File upload middleware
app.use(fileUpload({ limits: { fileSize: 10 * 1024 * 1024 }, useTempFiles: false }));

// Health check — ANTES de todo para que Railway lo detecte
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Servir plantillas NOM-035 como archivos estáticos
app.use("/plantillas", express.static(path.resolve(__dirname, "..", "public", "plantillas")));

app.use((req, res, next) => {
  const start = Date.now();
  const p = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (p.startsWith("/api")) {
      let logLine = `${req.method} ${p} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
      log(logLine);
    }
  });
  next();
});

(async () => {
  // Stripe — pagos con tarjeta
  app.post("/api/stripe/crear-sesion", async (req: any, res: any) => {
    try {
      const { plan, periodo } = req.body;
      // Normalizar planId (ej: starter-monthly -> starter)
      const planNorm = (plan || "").replace(/-monthly|-yearly|-annual/g, "").replace(/starter/,"basic");
      // Obtener email de la empresa desde el token
      let companyEmail = "";
      try {
        const token = req.headers.authorization?.replace("Bearer ", "");
        if (token) {
          const { verifyToken } = await import("./auth.js");
          const decoded = verifyToken(token) as any;
          companyEmail = decoded?.email || "";
        }
      } catch {}

      // Precios en centavos (Stripe usa centavos)
      const PRECIOS: Record<string, Record<string, number>> = {
        basic:        { monthly: 89900,   annual: 916900  },
        professional: { monthly: 189900,  annual: 1936900 },
        enterprise:   { monthly: 349900,  annual: 3568900 },
      };
      const precio = PRECIOS[planNorm]?.[periodo === "annual" ? "annual" : "monthly"];
      if (!precio) return res.status(400).json({ message: "Plan o período inválido" });

      const PLAN_NAMES: Record<string, string> = { basic:"Básico", professional:"Profesional", enterprise:"Empresarial" };
      const Stripe = await import("stripe");
      const stripe = new (Stripe.default || Stripe)(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2024-06-20" as any });

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{
          price_data: {
            currency: "mxn",
            product_data: {
              name: `NOM-035 Platform — Plan ${PLAN_NAMES[plan]}`,
              description: `Suscripción ${periodo === "annual" ? "anual" : "mensual"} — Cumplimiento NOM-035-STPS-2018`,
            },
            unit_amount: precio,
          },
          quantity: 1,
        }],
        mode: "payment",
        customer_email: companyEmail || undefined,
        success_url: "https://nom035-platform-production.up.railway.app/pago-exitoso?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: "https://nom035-platform-production.up.railway.app/pago-fallido",
        metadata: { plan: planNorm, periodo, email: companyEmail },
      });

      res.json({ sessionId: session.id, url: session.url });
    } catch (e: any) {
      console.error("Stripe error:", e.message);
      res.status(500).json({ message: e.message });
    }
  });


  // Mantener MP endpoint por compatibilidad
  app.post("/api/mercadopago/crear-preferencia", (_req: any, res: any) => {
    res.status(503).json({ message: "Mercado Pago no disponible, use Stripe" });
  });

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "5000");
  server.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
    log(`serving on port ${port}`);
  });
  // Stripe webhook
  app.post("/api/stripe/webhook", express.raw({type: "application/json"}), async (req: any, res: any) => {
    const sig = req.headers["stripe-signature"];
    console.log("WEBHOOK received, sig:", req.headers["stripe-signature"] ? "yes" : "no", "body:", typeof req.body);
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
      console.log("WEBHOOK body type:", typeof req.body, "sig:", sig ? "present" : "missing", "secret:", webhookSecret ? "present" : "missing");
    try {
      const Stripe = await import("stripe");
      const stripe = new (Stripe.default || Stripe as any)(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2024-06-20" as any });
      const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as any;
        const plan = session.metadata?.plan || "starter";
        const companyEmail = session.customer_email || session.metadata?.email;
        if (companyEmail) {
          const { db } = await import("./db.js");
          const { sql } = await import("drizzle-orm");
          await db.execute(sql`UPDATE companies SET subscription_status = 'active', subscription_plan = ${plan}, subscription_end_date = NOW() + INTERVAL '1 year' WHERE LOWER(correo_electronico) = LOWER(${companyEmail})`);
          console.log("Empresa activada:", companyEmail, plan);
        }
      }
      res.json({ received: true });
    } catch (e: any) {
      console.error("Webhook error:", e.message);
      res.status(400).json({ error: e.message });
    }
  });

})();
