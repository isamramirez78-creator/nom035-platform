import type { Express } from "express";
import { authenticateCompany } from "./auth";
import { db } from "./db";
import { sql } from "drizzle-orm";
import crypto from "crypto";

export function registerComplianceRoutes(app: Express) {

  // ── Calendario NOM-035 ────────────────────────────────────────────────────
  app.get("/api/calendario-nom035", authenticateCompany, async (req: any, res) => {
    try {
      const rows = await db.execute(sql`
        SELECT * FROM calendario_nom035 WHERE company_id = ${req.company.id}
        ORDER BY fecha_vencimiento ASC
      `);
      res.json(rows.rows);
    } catch { res.status(500).json({ message: "Error al obtener calendario" }); }
  });

  app.post("/api/calendario-nom035/inicializar", authenticateCompany, async (req: any, res) => {
    try {
      const companyId = req.company.id;
      const ahora = new Date();
      const eventos = [
        { tipo: "evaluacion_bianual",   descripcion: "Evaluación de factores de riesgo psicosocial (cada 2 años)", meses: 24 },
        { tipo: "renovacion_politica",  descripcion: "Renovación y difusión de la Política de Prevención", meses: 12 },
        { tipo: "capacitacion",         descripcion: "Capacitación a trabajadores y mandos en NOM-035", meses: 12 },
        { tipo: "difusion",             descripcion: "Difusión de política y mecanismos de atención", meses: 6 },
        { tipo: "revision_programa",    descripcion: "Revisión del Programa de Intervención vigente", meses: 12 },
        { tipo: "examen_medico",        descripcion: "Exámenes médicos a trabajadores en riesgo alto/muy alto", meses: 12 },
      ];
      for (const ev of eventos) {
        const vencimiento = new Date(ahora);
        vencimiento.setMonth(vencimiento.getMonth() + ev.meses);
        await db.execute(sql`
          INSERT INTO calendario_nom035 (company_id, tipo, descripcion, fecha_vencimiento)
          VALUES (${companyId}, ${ev.tipo}, ${ev.descripcion}, ${vencimiento.toISOString()})
          ON CONFLICT DO NOTHING
        `);
      }
      const rows = await db.execute(sql`SELECT * FROM calendario_nom035 WHERE company_id = ${companyId}`);
      res.json(rows.rows);
    } catch (e) { console.error(e); res.status(500).json({ message: "Error al inicializar calendario" }); }
  });

  app.patch("/api/calendario-nom035/:id/al-dia", authenticateCompany, async (req: any, res) => {
    try {
      const { id } = req.params;
      const row = await db.execute(sql`SELECT * FROM calendario_nom035 WHERE id = ${parseInt(id)}`);
      const ev = row.rows[0] as any;
      if (!ev) return res.status(404).json({ message: "No encontrado" });

      // Calcular próximo vencimiento según tipo
      const mesesMap: Record<string, number> = {
        evaluacion_bianual: 24, renovacion_politica: 12, capacitacion: 12,
        difusion: 6, revision_programa: 12, examen_medico: 12,
      };
      const meses = mesesMap[ev.tipo] || 12;
      const proximo = new Date();
      proximo.setMonth(proximo.getMonth() + meses);

      const result = await db.execute(sql`
        UPDATE calendario_nom035
        SET estado = 'al_dia', fecha_ultima = NOW(), fecha_vencimiento = ${proximo.toISOString()}, updated_at = NOW()
        WHERE id = ${parseInt(id)} AND company_id = ${req.company.id}
        RETURNING *
      `);
      res.json(result.rows[0]);
    } catch { res.status(500).json({ message: "Error al actualizar" }); }
  });

  // ── Canal de Denuncias ────────────────────────────────────────────────────
  app.get("/api/denuncias", authenticateCompany, async (req: any, res) => {
    try {
      const rows = await db.execute(sql`
        SELECT * FROM denuncias WHERE company_id = ${req.company.id}
        ORDER BY created_at DESC
      `);
      res.json(rows.rows);
    } catch { res.status(500).json({ message: "Error al obtener denuncias" }); }
  });

  app.post("/api/denuncias", authenticateCompany, async (req: any, res) => {
    try {
      const companyId = req.company.id;
      const { tipo, descripcion, area_involucrada, fecha_ocurrencia, anonima, nombre_denunciante, email_denunciante } = req.body;
      const folio = `DEN-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
      const result = await db.execute(sql`
        INSERT INTO denuncias (company_id, folio, tipo, descripcion, area_involucrada, fecha_ocurrencia, anonima, nombre_denunciante, email_denunciante)
        VALUES (${companyId}, ${folio}, ${tipo}, ${descripcion}, ${area_involucrada || null},
          ${fecha_ocurrencia || null}, ${anonima !== false}, ${anonima ? null : nombre_denunciante || null},
          ${anonima ? null : email_denunciante || null})
        RETURNING *
      `);
      res.status(201).json(result.rows[0]);
    } catch (e) { console.error(e); res.status(500).json({ message: "Error al registrar denuncia" }); }
  });

  app.patch("/api/denuncias/:id", authenticateCompany, async (req: any, res) => {
    try {
      const { estado, resolucion } = req.body;
      const result = await db.execute(sql`
        UPDATE denuncias SET estado = ${estado},
          resolucion = COALESCE(${resolucion || null}, resolucion),
          fecha_resolucion = CASE WHEN ${estado} IN ('resuelta','cerrada') THEN NOW() ELSE fecha_resolucion END,
          updated_at = NOW()
        WHERE id = ${parseInt(req.params.id)} AND company_id = ${req.company.id}
        RETURNING *
      `);
      if (!result.rows.length) return res.status(404).json({ message: "No encontrada" });
      res.json(result.rows[0]);
    } catch { res.status(500).json({ message: "Error al actualizar denuncia" }); }
  });

  // ── Centros de Trabajo ────────────────────────────────────────────────────
  app.get("/api/centros-trabajo", authenticateCompany, async (req: any, res) => {
    try {
      const rows = await db.execute(sql`
        SELECT * FROM centros_trabajo WHERE company_id = ${req.company.id} ORDER BY nombre ASC
      `);
      res.json(rows.rows);
    } catch { res.status(500).json({ message: "Error al obtener centros" }); }
  });

  app.post("/api/centros-trabajo", authenticateCompany, async (req: any, res) => {
    try {
      const { nombre, direccion, municipio, estadoRepublica, numeroTrabajadores, responsable, registroPatronalImss } = req.body;
      const result = await db.execute(sql`
        INSERT INTO centros_trabajo (company_id, nombre, direccion, municipio, estado_republica, numero_trabajadores, responsable, registro_patronal_imss)
        VALUES (${req.company.id}, ${nombre}, ${direccion || null}, ${municipio || null},
          ${estadoRepublica || null}, ${numeroTrabajadores || 0}, ${responsable || null}, ${registroPatronalImss || null})
        RETURNING *
      `);
      res.status(201).json(result.rows[0]);
    } catch (e) { console.error(e); res.status(500).json({ message: "Error al crear centro" }); }
  });

  app.put("/api/centros-trabajo/:id", authenticateCompany, async (req: any, res) => {
    try {
      const { nombre, direccion, municipio, estadoRepublica, numeroTrabajadores, responsable, registroPatronalImss } = req.body;
      const result = await db.execute(sql`
        UPDATE centros_trabajo SET nombre = ${nombre}, direccion = ${direccion || null},
          municipio = ${municipio || null}, estado_republica = ${estadoRepublica || null},
          numero_trabajadores = ${numeroTrabajadores || 0}, responsable = ${responsable || null},
          registro_patronal_imss = ${registroPatronalImss || null}
        WHERE id = ${parseInt(req.params.id)} AND company_id = ${req.company.id}
        RETURNING *
      `);
      res.json(result.rows[0]);
    } catch { res.status(500).json({ message: "Error al actualizar centro" }); }
  });

  // ── Constancias de difusión ───────────────────────────────────────────────
  app.post("/api/constancias-difusion", authenticateCompany, async (req: any, res) => {
    try {
      const { employeeId, tipo } = req.body;
      const ip = req.ip || req.socket?.remoteAddress || null;
      const result = await db.execute(sql`
        INSERT INTO constancias_difusion (company_id, employee_id, tipo, ip_confirmacion)
        VALUES (${req.company.id}, ${employeeId}, ${tipo || "politica_prevencion"}, ${ip})
        ON CONFLICT DO NOTHING RETURNING *
      `);
      res.status(201).json(result.rows[0] || { message: "Ya registrado" });
    } catch { res.status(500).json({ message: "Error al registrar constancia" }); }
  });

  app.get("/api/constancias-difusion", authenticateCompany, async (req: any, res) => {
    try {
      const rows = await db.execute(sql`
        SELECT cd.*, e.nombre, e.apellidos FROM constancias_difusion cd
        LEFT JOIN employees e ON e.id = cd.employee_id
        WHERE cd.company_id = ${req.company.id} ORDER BY cd.created_at DESC
      `);
      res.json(rows.rows);
    } catch { res.status(500).json({ message: "Error" }); }
  });
}
