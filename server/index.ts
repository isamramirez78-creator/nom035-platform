import express, { type Request, Response, NextFunction } from "express";
import fileUpload from "express-fileupload";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

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
  const p = req.path;
  let captured: Record<string, unknown> | undefined;
  const origJson = res.json;
  res.json = function (body: any, ...args: any[]) {
    captured = body;
    return origJson.apply(res, [body, ...args]);
  };
  res.on("finish", () => {
    const dur = Date.now() - start;
    if (p.startsWith("/api")) {
      let line = `${req.method} ${p} ${res.statusCode} in ${dur}ms`;
      if (captured) line += ` :: ${JSON.stringify(captured)}`;
      if (line.length > 80) line = line.slice(0, 79) + "…";
      log(line);
    }
  });
  next();
});

(async () => {
  // Stripe crear sesion
  app.post("/api/stripe/crear-sesion", async (req: any, res: any) => {
    try {
      const { plan, periodo } = req.body;
      let companyEmail = "";
      try {
        const token = req.headers.authorization?.replace("Bearer ", "");
        if (token) {
          const { verifyToken } = await import("./auth.js");
          const decoded = verifyToken(token) as any;
          companyEmail = decoded?.email || "";
        }
      } catch (_e) {}
      const planNorm = (plan || "").replace(/-monthly|-yearly|-annual/g, "").replace(/starter/, "basic");
      const PRECIOS: Record<string, Record<string, number>> = {
        basic:        { monthly: 89900,   annual: 916900  },
        professional: { monthly: 189900,  annual: 1936900 },
        enterprise:   { monthly: 349900,  annual: 3568900 },
      };
      const precio = PRECIOS[planNorm]?.[periodo === "annual" ? "annual" : "monthly"];
      if (!precio) return res.status(400).json({ message: "Plan o periodo invalido" });
      const PLAN_NAMES: Record<string, string> = { basic: "Basico", professional: "Profesional", enterprise: "Empresarial" };
      const Stripe = await import("stripe");
      const stripe = new (Stripe.default || Stripe as any)(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2024-06-20" as any });
      const session = await (stripe as any).checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{ price_data: { currency: "mxn", product_data: { name: "NOM-035 Platform - Plan " + PLAN_NAMES[planNorm], description: "Suscripcion " + (periodo === "annual" ? "anual" : "mensual") }, unit_amount: precio }, quantity: 1 }],
        mode: "payment",
        customer_email: companyEmail || undefined,
        success_url: "https://nom035-platform-production.up.railway.app/pago-exitoso?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: "https://nom035-platform-production.up.railway.app/pago-fallido",
        metadata: { plan: planNorm, periodo, email: companyEmail },
      });
      res.json({ sessionId: session.id, url: session.url });
    } catch (e: any) {
      console.error("Stripe error:", e.message);
      res.status(500).json({ message: "No se pudo iniciar el pago" });
    }
  });

  app.post("/api/mercadopago/crear-preferencia", (_req: any, res: any) => {
    res.status(503).json({ message: "MercadoPago no disponible" });
  });

  // Stripe webhook
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req: any, res: any) => {
    const sig = req.headers["stripe-signature"];
    const secret = process.env.STRIPE_WEBHOOK_SECRET || "";
    process.stderr.write("WEBHOOK HIT sig=" + (sig ? "yes" : "no") + " bodyType=" + typeof req.body + "\n");
    let event: any;
    try {
      const Stripe = await import("stripe");
      const stripe = new (Stripe.default || Stripe as any)(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2024-06-20" as any });
      event = stripe.webhooks.constructEvent(req.body, sig, secret);
    } catch (err: any) {
      process.stderr.write("Webhook verify error: " + err.message + "\n");
      return res.status(400).json({ error: err.message });
    }
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const plan = session.metadata?.plan || "basic";
      const email = session.customer_email || session.metadata?.email;
      process.stderr.write("Activando empresa: " + email + " plan=" + plan + "\n");
      if (email) {
        try {
          const { Pool } = await import("pg");
          const pool = new Pool({ connectionString: process.env.DATABASE_URL });
          const interval = "1 year";
          await pool.query(
            "UPDATE companies SET subscription_status=$1, subscription_plan=$2, subscription_end_date=NOW()+($3::interval) WHERE LOWER(correo_electronico)=LOWER($4)",
            ["active", plan, interval, email]
          );
          await pool.end();
          process.stderr.write("Empresa activada OK: " + email + "\n");
        } catch (dbErr: any) {
          process.stderr.write("DB error: " + dbErr.message + "\n");
        }
      }
    }
    res.json({ received: true });
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
    log("serving on port " + port);
  });
})();
