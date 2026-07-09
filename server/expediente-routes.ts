import type { Express } from "express";
import { authenticateCompany } from "./auth";
import { db } from "./db";
import { sql } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configurar multer para subida de archivos
const uploadDir = process.env.UPLOAD_DIR || "/tmp/uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_, file, cb) => {
    const allowed = [".pdf", ".jpg", ".jpeg", ".png", ".docx", ".xlsx"];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

export function registerExpedienteRoutes(app: Express) {

  // ── GET /api/expedientes — listar expedientes de la empresa ─────────────────
  app.get("/api/expedientes", authenticateCompany, async (req: any, res) => {
    try {
      const companyId = req.company.id;
      const rows = await db.execute(sql`
        SELECT e.*, 
          emp.nombre, emp.apellidos,
          emp.apellido_paterno, emp.apellido_materno
        FROM expedientes e
        LEFT JOIN employees emp ON emp.id = e.employee_id
        WHERE e.company_id = ${companyId}
        ORDER BY e.fecha_apertura DESC
      `);
      res.json(rows.rows);
    } catch (err) {
      console.error("Error getting expedientes:", err);
      res.status(500).json({ message: "Error al obtener expedientes" });
    }
  });

  // ── POST /api/expedientes — crear expediente ────────────────────────────────
  app.post("/api/expedientes", authenticateCompany, async (req: any, res) => {
    try {
      const companyId = req.company.id;
      const { employeeId, nivelRiesgo, motivoApertura, resumen, evaluationId } = req.body;

      if (!employeeId || !nivelRiesgo || !motivoApertura) {
        return res.status(400).json({ message: "employeeId, nivelRiesgo y motivoApertura son requeridos" });
      }

      const result = await db.execute(sql`
        INSERT INTO expedientes 
          (company_id, employee_id, evaluation_id, nivel_riesgo, motivo_apertura, resumen)
        VALUES 
          (${companyId}, ${employeeId}, ${evaluationId || null}, ${nivelRiesgo}, ${motivoApertura}, ${resumen || null})
        RETURNING *
      `);
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error("Error creating expediente:", err);
      res.status(500).json({ message: "Error al crear el expediente" });
    }
  });

  // ── PATCH /api/expedientes/:id — actualizar estado ──────────────────────────
  app.patch("/api/expedientes/:id", authenticateCompany, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { estado, resumen, fechaCierre } = req.body;
      const companyId = req.company.id;

      const setCierre = estado === "cerrado" ? sql`, fecha_cierre = NOW()` : sql``;

      const result = await db.execute(sql`
        UPDATE expedientes
        SET estado = COALESCE(${estado || null}, estado),
            resumen = COALESCE(${resumen || null}, resumen),
            updated_at = NOW()
            ${setCierre}
        WHERE id = ${parseInt(id)} AND company_id = ${companyId}
        RETURNING *
      `);
      if (!result.rows.length) return res.status(404).json({ message: "Expediente no encontrado" });
      res.json(result.rows[0]);
    } catch (err) {
      console.error("Error updating expediente:", err);
      res.status(500).json({ message: "Error al actualizar el expediente" });
    }
  });

  // ── GET /api/expedientes/:id/citas ──────────────────────────────────────────
  app.get("/api/expedientes/:id/citas", authenticateCompany, async (req: any, res) => {
    try {
      const { id } = req.params;
      const rows = await db.execute(sql`
        SELECT * FROM expediente_citas 
        WHERE expediente_id = ${parseInt(id)}
        ORDER BY fecha_cita DESC
      `);
      res.json(rows.rows);
    } catch (err) {
      res.status(500).json({ message: "Error al obtener citas" });
    }
  });

  // ── POST /api/expedientes/:id/citas ─────────────────────────────────────────
  app.post("/api/expedientes/:id/citas", authenticateCompany, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { tipo, fechaCita, responsable, notas, resultado, proximaCita } = req.body;

      if (!fechaCita || !responsable) {
        return res.status(400).json({ message: "fechaCita y responsable son requeridos" });
      }

      const result = await db.execute(sql`
        INSERT INTO expediente_citas 
          (expediente_id, tipo, fecha_cita, responsable, notas, resultado, proxima_cita)
        VALUES
          (${parseInt(id)}, ${tipo || "seguimiento"}, ${fechaCita}, ${responsable}, 
           ${notas || null}, ${resultado || null}, ${proximaCita || null})
        RETURNING *
      `);

      // Actualizar estado del expediente a "en_seguimiento" si estaba abierto
      await db.execute(sql`
        UPDATE expedientes SET estado = 'en_seguimiento', updated_at = NOW()
        WHERE id = ${parseInt(id)} AND estado = 'abierto'
      `);

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error("Error creating cita:", err);
      res.status(500).json({ message: "Error al registrar la cita" });
    }
  });

  // ── GET /api/expedientes/:id/documentos ─────────────────────────────────────
  app.get("/api/expedientes/:id/documentos", authenticateCompany, async (req: any, res) => {
    try {
      const { id } = req.params;
      const rows = await db.execute(sql`
        SELECT * FROM expediente_documentos 
        WHERE expediente_id = ${parseInt(id)}
        ORDER BY created_at DESC
      `);
      res.json(rows.rows);
    } catch (err) {
      res.status(500).json({ message: "Error al obtener documentos" });
    }
  });

  // ── POST /api/expedientes/documentos — subir archivo ────────────────────────
  app.post("/api/expedientes/documentos", authenticateCompany, upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No se recibió ningún archivo" });

      const { expedienteId } = req.body;
      const fileName = req.file.originalname;
      const fileUrl = `/uploads/${safeName}`;

      const result = await db.execute(sql`
        INSERT INTO expediente_documentos 
          (expediente_id, nombre, tipo, url, tamanio_bytes, uploaded_by)
        VALUES
          (${parseInt(expedienteId)}, ${fileName}, 'evidencia', ${fileUrl},
           ${uploadedFile.size || uploadedFile.data?.length || 0}, ${req.company.correoElectronico})
        RETURNING *
      `);

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error("Error uploading document:", err);
      res.status(500).json({ message: "Error al subir el documento" });
    }
  });

  // ── GET endpoint para importación CSV ───────────────────────────────────────
  // (El endpoint /api/employees/import ya existe, solo ajustamos el mapeo de campos)

  // ── Documentos Normativos NOM-035 ─────────────────────────────────────────────

  // GET — listar documentos normativos de la empresa
  app.get("/api/documentos-normativos", authenticateCompany, async (req: any, res) => {
    try {
      const companyId = req.company.id;
      const rows = await db.execute(sql`
        SELECT * FROM documentos_normativos
        WHERE company_id = ${companyId}
        ORDER BY created_at DESC
      `);
      res.json(rows.rows);
    } catch (err) {
      console.error("Error getting documentos normativos:", err);
      res.status(500).json({ message: "Error al obtener documentos" });
    }
  });

  // POST — subir documento normativo
  app.post("/api/documentos-normativos", authenticateCompany, async (req: any, res) => {
    try {
      const uploadedFile = req.files?.file as any;
      if (!uploadedFile) return res.status(400).json({ message: "No se recibió ningún archivo" });

      const companyId = req.company.id;
      const { tipo } = req.body;
      const fileName = uploadedFile.name;

      // Guardar archivo en /tmp/uploads/
      const uploadDir = "/tmp/uploads";
      const fsModule = await import("fs");
      if (!fsModule.existsSync(uploadDir)) fsModule.mkdirSync(uploadDir, { recursive: true });
      const safeName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      await uploadedFile.mv(`${uploadDir}/${safeName}`);
      const fileUrl = `/uploads/${safeName}`;

      // Si ya existe una versión, incrementar versión
      const existing = await db.execute(sql`
        SELECT MAX(version) as max_version FROM documentos_normativos
        WHERE company_id = ${companyId} AND tipo = ${tipo}
      `);
      const version = ((existing.rows[0] as any)?.max_version || 0) + 1;

      const result = await db.execute(sql`
        INSERT INTO documentos_normativos
          (company_id, tipo, nombre, url, tamanio_bytes, subido_por, version)
        VALUES
          (${companyId}, ${tipo}, ${fileName}, ${fileUrl},
           ${uploadedFile.size || uploadedFile.data?.length || 0}, ${req.company.correoElectronico}, ${version})
        RETURNING *
      `);

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error("Error uploading documento normativo:", err);
      res.status(500).json({ message: "Error al subir el documento" });
    }
  });

  // GET — plantillas base (por ahora retorna 404 con mensaje amigable)
  app.get("/api/plantillas-nom035/:id", authenticateCompany, async (req, res) => {
    res.status(404).json({ message: "Plantilla próximamente disponible" });
  });
}
