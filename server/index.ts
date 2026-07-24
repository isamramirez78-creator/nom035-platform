import express, { type Request, Response, NextFunction } from "express";
import fileUpload from "express-fileupload";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Skip express.json for webhook route so body is received raw
app.use((req, res, next) => {
  if (req.originalUrl === "/api/stripe/webhook") return next();
  express.json()(req, res, next);
});
app.use(express.urlencoded({ extended: false }));

app.use(fileUpload({ limits: { fileSize: 10 * 1024 * 1024 }, useTempFiles: false }));

const uploadsDir = path.resolve(__dirname, "..", "public", "uploads");
const plantillasDir = path.resolve(__dirname, "..", "public", "plantillas");
app.use("/uploads", express.static(uploadsDir));
app.use("/plantillas", express.static(plantillasDir));

app.use((req, res, next) => {
  const start = Date.now();
  const path2 = req.path;
  let capturedJsonResponse: Record<string, unknown> | undefined = undefined;
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path2.startsWith("/api")) {
      let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
      log(logLine);
    }
  });
  next();
});

(async () => {
  app.post("/api/stripe/crear-sesion", async (req: any, res: any) => {
    try {
      const { plan, periodo } = req.body;
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
      const precio = PRECIOS[plan]?.[periodo === "annual" ? "annual" : "monthly"];
      if (!precio) return res.status(400).json({ message: "Plan o período inválido" });

  app.post("/api/mercadopago/crear-preferencia", (_req: any, res: any) => {
    res.status(503).json({ message: "MercadoPago no disponible" });
  });

  // Stripe webhook - must be before registerRoutes and serveStatic
  app.post("/api/stripe/webhook", express.raw({type: "application/json"}), async (req: any, res: any) => {
    const sig = req.headers["stripe-signature"];
    process.stderr.write("WEBHOOK HIT body="+typeof req.body+" sig="+(sig?"yes":"no")+"\n");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
    try {
      const Stripe = await import("stripe");
      const stripe = new (Stripe.default || Stripe as any)(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2024-06-20" as any });
      const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as any;
        const plan = session.metadata?.plan || "starter";
        const companyEmail = session.customer_email || session.metadata?.email;
        if (companyEmail) {
          const { Pool } = await import("pg");
          const pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
          await pgPool.query(
            "UPDATE companies SET subscription_status = $1, subscription_plan = $2, subscription_end_date = NOW() + INTERVAL " + "'1 year' WHERE LOWER(correo_electronico) = LOWER($3)",
            ["active", plan, companyEmail]
          );
          await pgPool.end();
          process.stderr.write("Empresa activada: "+companyEmail+" "+plan+"\n");
        }
      }
      res.json({ received: true });
    } catch (e: any) {
      process.stderr.write("Webhook error: "+e.message+"\n");
      res.status(400).json({ error: e.message });
    }
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
})();
