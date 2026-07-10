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
  // Mercado Pago — registrar ANTES de serveStatic para evitar que React lo intercepte
  app.post("/api/mercadopago/crear-preferencia", async (req: any, res: any) => {
    try {
      const { plan, periodo } = req.body;
      const PRECIOS: Record<string, Record<string, number>> = {
        basic:        { monthly: 899,   annual: 9169  },
        professional: { monthly: 1899,  annual: 19369 },
        enterprise:   { monthly: 3499,  annual: 35689 },
      };
      const precio = PRECIOS[plan]?.[periodo === "annual" ? "annual" : "monthly"];
      if (!precio) return res.status(400).json({ message: "Plan o período inválido" });
      const PLAN_NAMES: Record<string, string> = { basic:"Básico", professional:"Profesional", enterprise:"Empresarial" };
      const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`,
          "X-Idempotency-Key": `nom035-${plan}-${periodo}-${Date.now()}`,
        },
        body: JSON.stringify({
          items: [{
            id: plan,
            title: `NOM-035 Platform — Plan ${PLAN_NAMES[plan]}`,
            description: `Suscripción ${periodo === "annual" ? "anual" : "mensual"} a la plataforma NOM-035-STPS-2018`,
            quantity: 1,
            unit_price: precio,
            currency_id: "MXN",
            category_id: "services",
          }],
          back_urls: {
            success: "https://nom035-platform-production.up.railway.app/pago-exitoso",
            failure: "https://nom035-platform-production.up.railway.app/pago-fallido",
            pending: "https://nom035-platform-production.up.railway.app/pago-pendiente",
          },
          auto_return: "approved",
          statement_descriptor: "NOM035 PLATFORM",
          external_reference: `${plan}-${periodo}-${Date.now()}`,
          metadata: { plan, periodo },
        }),
      });
      const mpData = await mpRes.json();
      if (!mpRes.ok) {
        console.error("MP Error:", JSON.stringify(mpData));
        return res.status(500).json({ message: "Error Mercado Pago", detail: mpData });
      }
      res.json({ preferenceId: mpData.id, initPoint: mpData.init_point, sandboxInitPoint: mpData.sandbox_init_point });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/mercadopago/webhook", async (req: any, res: any) => {
    res.status(200).json({ received: true });
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
