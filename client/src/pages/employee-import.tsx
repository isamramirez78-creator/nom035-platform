import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EmployeeImport() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [fileName, setFileName] = useState("");

  const token = localStorage.getItem("company_token");
  const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  // Descargar plantilla
  const downloadTemplate = async (format: "excel" | "csv") => {
    const res = await fetch(`/api/employees/template/${format}`, { headers });
    if (!res.ok) { toast({ title: "Error al descargar plantilla", variant: "destructive" }); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plantilla-empleados.${format === "excel" ? "xlsx" : "csv"}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Parsear CSV en el navegador
  const parseCSV = (text: string) => {
    const lines = text.split("\n").filter(l => l.trim() && !l.startsWith("#"));
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/\s+/g, "_"));
    return lines.slice(1).map(line => {
      const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
      const obj: any = {};
      headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
      return obj;
    }).filter(r => r.nombre);
  };

  // Leer archivo seleccionado
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    if (file.name.endsWith(".csv")) {
      const text = await file.text();
      setPreview(parseCSV(text).slice(0, 5));
    } else if (file.name.endsWith(".xlsx")) {
      // Para xlsx usamos el endpoint del servidor para parsear
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/employees/preview-import", { method: "POST", headers, body: fd });
      if (res.ok) {
        const data = await res.json();
        setPreview((data.preview || []).slice(0, 5));
      } else {
        toast({ title: "No se pudo leer el archivo Excel", description: "Usa la plantilla CSV", variant: "destructive" });
      }
    }
  };

  // Importar empleados
  const importMutation = useMutation({
    mutationFn: async () => {
      const file = fileRef.current?.files?.[0];
      if (!file) throw new Error("Selecciona un archivo primero");

      if (file.name.endsWith(".csv")) {
        const text = await file.text();
        const employees = parseCSV(text);
        if (!employees.length) throw new Error("El archivo no contiene empleados válidos");

        const res = await fetch("/api/employees/import", {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ employees }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Error al importar");
        return json;
      } else {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/employees/import-excel", { method: "POST", headers, body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Error al importar");
        return json;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setPreview([]);
      setFileName("");
      if (fileRef.current) fileRef.current.value = "";
      toast({
        title: "Importación exitosa",
        description: `${data.imported || 0} empleados importados${data.errors > 0 ? `, ${data.errors} con errores` : ""}.`,
      });
    },
    onError: (e: Error) => {
      toast({ title: "Error al importar", description: e.message, variant: "destructive" });
    },
  });

  const COL_LABELS: Record<string, string> = {
    nombre: "Nombre", apellido_paterno: "Ap. Paterno", apellido_materno: "Ap. Materno",
    apellidos: "Apellidos", numero_empleado: "No. Empleado", puesto: "Puesto",
    area: "Área", fecha_ingreso: "Fecha Ingreso", email: "Email",
    rfc: "RFC", curp: "CURP", genero: "Género", generacion: "Generación",
  };

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center gap-3">
        <div style={{ width: 3, height: "2.5rem", background: "#84CC16", borderRadius: 2 }} />
        <div>
          <h1 className="page-title">Importar Empleados</h1>
          <p className="page-subtitle">Carga masiva desde archivo Excel o CSV</p>
        </div>
      </div>

      {/* Paso 1 — Descargar plantilla */}
      <div className="section-card">
        <div className="section-header"><div className="lime-dot" /><h3>Paso 1 — Descarga la plantilla</h3></div>
        <div className="p-5">
          <p className="text-sm text-slate-600 mb-4">
            Usa nuestra plantilla para asegurarte de que los datos están en el formato correcto.
            Incluye ejemplos y validaciones de formato.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Button onClick={() => downloadTemplate("excel")} className="btn-primary gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
              Plantilla Excel (.xlsx)
            </Button>
            <Button variant="outline" onClick={() => downloadTemplate("csv")} className="gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
              Plantilla CSV
            </Button>
          </div>
          <div className="mt-4 p-3 rounded-lg text-sm" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
            <strong>Columnas requeridas:</strong> nombre, apellido_paterno, puesto, area, fecha_ingreso (DD/MM/AAAA)<br/>
            <strong>Columnas opcionales:</strong> apellido_materno, numero_empleado, email, rfc, curp, genero, generacion
          </div>
        </div>
      </div>

      {/* Paso 2 — Seleccionar archivo */}
      <div className="section-card">
        <div className="section-header"><div className="lime-dot" /><h3>Paso 2 — Selecciona tu archivo</h3></div>
        <div className="p-5">
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors"
            style={{ borderColor: "#CBD5E1" }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "#84CC16")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "#CBD5E1")}
          >
            <svg className="mx-auto mb-3" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            {fileName
              ? <p className="font-semibold text-slate-700">{fileName}</p>
              : <><p className="font-medium text-slate-600">Haz clic para seleccionar o arrastra el archivo aquí</p>
                <p className="text-sm text-slate-400 mt-1">Formatos: .xlsx, .csv</p></>
            }
          </div>
          <input ref={fileRef} type="file" accept=".xlsx,.csv" className="hidden" onChange={handleFile} />
        </div>
      </div>

      {/* Vista previa */}
      {preview.length > 0 && (
        <div className="section-card">
          <div className="section-header"><div className="lime-dot" /><h3>Vista previa (primeros {preview.length} registros)</h3></div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>{Object.keys(preview[0]).map(k => (
                  <th key={k}>{COL_LABELS[k] || k}</th>
                ))}</tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i}>{Object.values(row).map((v: any, j) => (
                    <td key={j} className="text-sm">{v || "—"}</td>
                  ))}</tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-5">
            <Button onClick={() => importMutation.mutate()} disabled={importMutation.isPending} className="btn-lime gap-2">
              {importMutation.isPending ? "Importando..." : "Confirmar e Importar"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
