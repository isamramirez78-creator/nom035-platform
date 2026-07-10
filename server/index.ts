import express, { type Request, Response, NextFunction } from "express";
import fileUpload from "express-fileupload";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
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
      const rawPlan = req.body.plan || ""; const periodo = req.body.periodo || (rawPlan.includes("yearly") ? "annual" : "monthly"); const plan = rawPlan.replace(/-monthly|-yearly|-annual/g, "");
      const PRECIOS: any = { starter:{monthly:89900,annual:916900}, professional:{monthly:189900,annual:1936900}, enterprise:{monthly:349900,annual:3568900} };
      const precio = PRECIOS[plan]?.[periodo === "annual" ? "annual" : "monthly"];
      if (!precio) return res.status(400).json({ message: "Plan invalido" });
      const Stripe = await import("stripe");
      const stripe = new (Stripe.default || Stripe as any)(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2024-06-20" as any });
      const session = await (stripe as any).checkout.sessions.create({ payment_method_types: ["card"], line_items: [{ price_data: { currency: "mxn", product_data: { name: "NOM-035 Plan " + plan }, unit_amount: precio }, quantity: 1 }], mode: "payment", success_url: "https://nom035-platform-production.up.railway.app/pago-exitoso", cancel_url: "https://nom035-platform-production.up.railway.app/pago-fallido", metadata: { plan, periodo } });
      res.json({ sessionId: session.id, url: session.url });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
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
// stripe Fri Jul 10 13:35:55     2026
