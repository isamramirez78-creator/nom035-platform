warning: in the working copy of 'server/vite.ts', LF will be replaced by CRLF the next time Git touches it
[1mdiff --git a/server/vite.ts b/server/vite.ts[m
[1mindex a92f54c..bb62d22 100644[m
[1m--- a/server/vite.ts[m
[1m+++ b/server/vite.ts[m
[36m@@ -7,7 +7,6 @@[m [mimport { type Server } from "http";[m
 import viteConfig from "../vite.config";[m
 import { nanoid } from "nanoid";[m
 [m
[31m-// ESM-compatible __dirname for Node 18[m
 const __filename = fileURLToPath(import.meta.url);[m
 const __dirname = path.dirname(__filename);[m
 [m
[36m@@ -15,32 +14,20 @@[m [mconst viteLogger = createLogger();[m
 [m
 export function log(message: string, source = "express") {[m
   const formattedTime = new Date().toLocaleTimeString("en-US", {[m
[31m-    hour: "numeric",[m
[31m-    minute: "2-digit",[m
[31m-    second: "2-digit",[m
[31m-    hour12: true,[m
[32m+[m[32m    hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true,[m
   });[m
   console.log(`${formattedTime} [${source}] ${message}`);[m
 }[m
 [m
 export async function setupVite(app: Express, server: Server) {[m
[31m-  const serverOptions = {[m
[31m-    middlewareMode: true,[m
[31m-    hmr: { server },[m
[31m-    allowedHosts: true,[m
[31m-  };[m
[31m-[m
   const vite = await createViteServer({[m
     ...viteConfig,[m
     configFile: false,[m
     customLogger: {[m
       ...viteLogger,[m
[31m-      error: (msg, options) => {[m
[31m-        viteLogger.error(msg, options);[m
[31m-        process.exit(1);[m
[31m-      },[m
[32m+[m[32m      error: (msg, options) => { viteLogger.error(msg, options); process.exit(1); },[m
     },[m
[31m-    server: serverOptions,[m
[32m+[m[32m    server: { middlewareMode: true, hmr: { server }, allowedHosts: true },[m
     appType: "custom",[m
   });[m
 [m
[36m@@ -48,17 +35,9 @@[m [mexport async function setupVite(app: Express, server: Server) {[m
   app.use("*", async (req, res, next) => {[m
     const url = req.originalUrl;[m
     try {[m
[31m-      const clientTemplate = path.resolve([m
[31m-        __dirname,[m
[31m-        "..",[m
[31m-        "client",[m
[31m-        "index.html",[m
[31m-      );[m
[32m+[m[32m      const clientTemplate = path.resolve(__dirname, "..", "client", "index.html");[m
       let template = await fs.promises.readFile(clientTemplate, "utf-8");[m
[31m-      template = template.replace([m
[31m-        `src="/src/main.tsx"`,[m
[31m-        `src="/src/main.tsx?v=${nanoid()}"`,[m
[31m-      );[m
[32m+[m[32m      template = template.replace(`src="/src/main.tsx"`, `src="/src/main.tsx?v=${nanoid()}"`);[m
       const page = await vite.transformIndexHtml(url, template);[m
       res.status(200).set({ "Content-Type": "text/html" }).end(page);[m
     } catch (e) {[m
[36m@@ -70,15 +49,10 @@[m [mexport async function setupVite(app: Express, server: Server) {[m
 [m
 export function serveStatic(app: Express) {[m
   const distPath = path.resolve(__dirname, "public");[m
[31m-[m
   if (!fs.existsSync(distPath)) {[m
[31m-    throw new Error([m
[31m-      `Could not find the build directory: ${distPath}, make sure to build the client first`,[m
[31m-    );[m
[32m+[m[32m    throw new Error(`Could not find the build directory: ${distPath}`);[m
   }[m
[31m-[m
   app.use(express.static(distPath));[m
[31m-[m
   app.use("*", (_req, res) => {[m
     res.sendFile(path.resolve(distPath, "index.html"));[m
   });[m
