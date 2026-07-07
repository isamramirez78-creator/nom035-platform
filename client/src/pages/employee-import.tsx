import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const token = () => localStorage.getItem("company_token");
const h = () => ({ Authorization: `Bearer ${token()}` });

export default function EmployeeImport() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);

  const downloadTemplate = async (format: "excel" | "csv") => {
    const res = await fetch(`/api/employees/template/${format}`, { headers: h() });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = format === "excel" ? "plantilla-empleados.xlsx" : "plantilla-empleados.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/employees/import", {
        method: "POST",
        headers: h(),
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Error al importar");
      return json;
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (e: Error) => {
      toast({ title: "Error al importar", description: e.message, variant: "destructive" });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const valid = file.name.endsWith(".xlsx") || file.name.endsWith(".xls") || file.name.endsWith(".csv");
    if (!valid) {
      toast({ title: "Formato no válido", description: "Solo .xlsx, .xls o .csv", variant: "destructive" });
      return;
    }
    setSelectedFile(file);
    setResult(null);
  };

  return (
    <div style={{ padding: "2rem", maxWidth: 800, margin: "0 auto", fontFamily: "Inter,sans-serif" }}>
      <h1 style={{ color: "#1E3A5F", fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Importación Masiva de Empleados</h1>
      <p style={{ color: "#64748B", fontSize: 14, marginBottom: 32 }}>
        Descarga la plantilla, llénala con los datos de tus empleados y súbela para importarlos todos a la vez.
      </p>

      {/* PASO 1 */}
      <div style={{ background: "white", borderRadius: 16, padding: "1.5rem", border: "0.5px solid #E2E8F0", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ width: 32, height: 32, background: "#1E3A5F", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>1</span>
          </div>
          <div>
            <h2 style={{ color: "#1E3A5F", fontSize: 16, fontWeight: 700, margin: 0 }}>Descarga la plantilla</h2>
            <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>Elige el formato que prefieras</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => downloadTemplate("excel")}
            style={{ flex: 1, padding: "12px", borderRadius: 10, border: "1.5px solid #1E3A5F", background: "#1E3A5F", color: "white", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
            📥 Descargar plantilla Excel (.xlsx)
          </button>
          <button
            onClick={() => downloadTemplate("csv")}
            style={{ flex: 1, padding: "12px", borderRadius: 10, border: "1.5px solid #E2E8F0", background: "white", color: "#1E3A5F", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
            📥 Descargar plantilla CSV
          </button>
        </div>
      </div>

      {/* PASO 2 */}
      <div style={{ background: "white", borderRadius: 16, padding: "1.5rem", border: "0.5px solid #E2E8F0", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ width: 32, height: 32, background: "#84CC16", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: "#1E3A5F", fontWeight: 700, fontSize: 14 }}>2</span>
          </div>
          <div>
            <h2 style={{ color: "#1E3A5F", fontSize: 16, fontWeight: 700, margin: 0 }}>Llena la plantilla</h2>
            <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>Agrega los datos de cada empleado en una fila</p>
          </div>
        </div>
        <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "1rem", border: "0.5px solid #E2E8F0" }}>
          <p style={{ color: "#64748B", fontSize: 13, margin: 0, lineHeight: 1.6 }}>
            ✅ Columnas <strong>obligatorias</strong>: Nombre, Apellido Paterno, Puesto, Área, Fecha Ingreso<br/>
            ☑️ Columnas <strong>opcionales</strong>: Apellido Materno, No. Empleado, Email, RFC, CURP, Género, Generación<br/>
            📅 Formato de fecha: <strong>DD/MM/AAAA</strong> — Ej: 15/03/2024
          </p>
        </div>
      </div>

      {/* PASO 3 */}
      <div style={{ background: "white", borderRadius: 16, padding: "1.5rem", border: "0.5px solid #E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ width: 32, height: 32, background: "#84CC16", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: "#1E3A5F", fontWeight: 700, fontSize: 14 }}>3</span>
          </div>
          <div>
            <h2 style={{ color: "#1E3A5F", fontSize: 16, fontWeight: 700, margin: 0 }}>Sube el archivo e importa</h2>
            <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>Selecciona el archivo llenado y haz clic en "Importar"</p>
          </div>
        </div>

        <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv"
          onChange={handleFileChange} style={{ display: "none" }} />

        {!selectedFile ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{ border: "2px dashed #CBD5E1", borderRadius: 12, padding: "2rem", textAlign: "center", cursor: "pointer", transition: "border-color 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "#84CC16")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "#CBD5E1")}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
            <p style={{ color: "#1E3A5F", fontWeight: 600, margin: "0 0 4px" }}>Haz clic para seleccionar el archivo</p>
            <p style={{ color: "#94A3B8", fontSize: 13, margin: 0 }}>O arrastra el archivo aquí — .xlsx, .xls, .csv</p>
          </div>
        ) : (
          <div>
            <div style={{ background: "#EFF6FF", borderRadius: 10, padding: "1rem", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ color: "#1E3A5F", fontWeight: 600, margin: "0 0 2px", fontSize: 14 }}>📄 {selectedFile.name}</p>
                <p style={{ color: "#3B82F6", fontSize: 12, margin: 0 }}>{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={() => { setSelectedFile(null); setResult(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                style={{ background: "none", border: "1px solid #CBD5E1", borderRadius: 8, padding: "4px 12px", cursor: "pointer", color: "#64748B", fontSize: 13 }}>
                Cambiar
              </button>
            </div>

            <Button
              onClick={() => importMutation.mutate(selectedFile)}
              disabled={importMutation.isPending}
              style={{ width: "100%", height: 48, fontSize: 16, fontWeight: 600, background: "#1E3A5F", color: "white", borderRadius: 10 }}>
              {importMutation.isPending ? "⏳ Importando empleados..." : "⬆️ Importar Empleados"}
            </Button>
          </div>
        )}

        {/* Resultado */}
        {result && (
          <div style={{ marginTop: 16, padding: "1rem", borderRadius: 10, background: result.errors?.length > 0 ? "#FFF7ED" : "#F0FDF4", border: `1px solid ${result.errors?.length > 0 ? "#FED7AA" : "#BBF7D0"}` }}>
            <p style={{ color: result.errors?.length > 0 ? "#9A3412" : "#15803D", fontWeight: 700, margin: "0 0 8px", fontSize: 15 }}>
              {result.errors?.length > 0 ? "⚠️ Importación con errores" : "✅ Importación exitosa"}
            </p>
            <p style={{ color: "#374151", fontSize: 14, margin: "0 0 4px" }}>
              ✅ Importados correctamente: <strong>{result.successful || 0}</strong>
            </p>
            {result.errors?.length > 0 && (
              <p style={{ color: "#374151", fontSize: 14, margin: "0 0 8px" }}>
                ❌ Con errores: <strong>{result.errors.length}</strong>
              </p>
            )}
            {result.errors?.slice(0, 5).map((err: any, i: number) => (
              <p key={i} style={{ color: "#9A3412", fontSize: 12, margin: "2px 0" }}>
                Fila {err.row}: {err.error}
              </p>
            ))}
            <button onClick={() => { setSelectedFile(null); setResult(null); }}
              style={{ marginTop: 12, background: "#1E3A5F", color: "white", border: "none", borderRadius: 8, padding: "8px 20px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
              Importar otro archivo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
