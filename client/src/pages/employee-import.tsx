import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Users,
  FileSpreadsheet,
  Info
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ImportResult {
  total: number;
  successful: number;
  errors: Array<{
    row: number;
    error: string;
    data: any;
  }>;
}

export default function EmployeeImport() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const downloadTemplateMutation = useMutation({
    mutationFn: async (format: 'excel' | 'csv') => {
      const token = localStorage.getItem('company_token');
      const response = await fetch(`/api/employees/template/${format}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Error al descargar' }));
        throw new Error(err.message || 'Error al descargar la plantilla');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `plantilla-empleados.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Descarga iniciada",
        description: "La plantilla se está descargando.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al descargar",
        description: error?.message || "No se pudo descargar la plantilla. Intenta de nuevo.",
        variant: "destructive",
      });
    },
  });

  const uploadEmployeesMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/employees/import', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error uploading file');
      }
      
      return response.json();
    },
    onSuccess: (result: ImportResult) => {
      setImportResult(result);
      setUploadProgress(100);
      
      if (result.errors.length === 0) {
        toast({
          title: "Importación exitosa",
          description: `Se importaron ${result.successful} empleados correctamente.`,
        });
      } else {
        toast({
          title: "Importación parcial",
          description: `${result.successful} empleados importados, ${result.errors.length} errores encontrados.`,
          variant: "destructive",
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error en la importación",
        description: error.message || "No se pudo procesar el archivo",
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv' // .csv
      ];
      
      if (allowedTypes.includes(file.type) || file.name.endsWith('.csv')) {
        setSelectedFile(file);
        setImportResult(null);
        setUploadProgress(0);
      } else {
        toast({
          title: "Formato no válido",
          description: "Solo se permiten archivos Excel (.xlsx, .xls) o CSV (.csv)",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    
    setUploadProgress(10);
    uploadEmployeesMutation.mutate(selectedFile);
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setImportResult(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Importación de Empleados</h1>
        <p className="text-gray-600 mt-1">
          Descarga plantillas y carga empleados en lote usando Excel o CSV
        </p>
      </div>

      <Tabs defaultValue="download" className="space-y-6">
        <TabsList>
          <TabsTrigger value="download">Descargar Plantillas</TabsTrigger>
          <TabsTrigger value="upload">Cargar Empleados</TabsTrigger>
          <TabsTrigger value="instructions">Instrucciones</TabsTrigger>
        </TabsList>

        {/* Download Templates Tab */}
        <TabsContent value="download" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileSpreadsheet className="w-5 h-5 mr-2 text-green-600" />
                  Plantilla Excel
                </CardTitle>
                <CardDescription>
                  Archivo .xlsx con formato y validaciones incluidas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Características:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Columnas pre-configuradas</li>
                    <li>• Validación de datos automática</li>
                    <li>• Lista desplegable para áreas</li>
                    <li>• Formato de fecha establecido</li>
                    <li>• Instrucciones incluidas</li>
                  </ul>
                </div>
                
                <Button
                  onClick={() => downloadTemplateMutation.mutate('excel')}
                  disabled={downloadTemplateMutation.isPending}
                  className="w-full"
                >
                  {downloadTemplateMutation.isPending ? (
                    <>
                      <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                      Descargando...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Descargar Excel
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  Plantilla CSV
                </CardTitle>
                <CardDescription>
                  Archivo .csv compatible con cualquier hoja de cálculo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Características:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Formato estándar CSV</li>
                    <li>• Compatible con Google Sheets</li>
                    <li>• Codificación UTF-8</li>
                    <li>• Separador de comas</li>
                    <li>• Fácil de editar</li>
                  </ul>
                </div>
                
                <Button
                  onClick={() => downloadTemplateMutation.mutate('csv')}
                  disabled={downloadTemplateMutation.isPending}
                  variant="outline"
                  className="w-full"
                >
                  {downloadTemplateMutation.isPending ? (
                    <>
                      <div className="animate-spin w-4 h-4 mr-2 border-2 border-blue-600 border-t-transparent rounded-full" />
                      Descargando...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Descargar CSV
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Recomendación:</strong> Usa la plantilla Excel si necesitas validación automática de datos.
              Usa CSV si prefieres un formato más simple o trabajas con Google Sheets.
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* Upload Employees Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Cargar Archivo de Empleados
              </CardTitle>
              <CardDescription>
                Sube tu archivo Excel o CSV con los datos de empleados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!importResult ? (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="file">Seleccionar Archivo</Label>
                      <Input
                        ref={fileInputRef}
                        id="file"
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileSelect}
                        className="cursor-pointer"
                      />
                    </div>

                    {selectedFile && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-blue-900">{selectedFile.name}</h4>
                            <p className="text-sm text-blue-700">
                              Tamaño: {(selectedFile.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <Button variant="outline" size="sm" onClick={resetUpload}>
                            Cambiar
                          </Button>
                        </div>
                      </div>
                    )}

                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Procesando archivo...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <Button
                      onClick={handleUpload}
                      disabled={!selectedFile || uploadEmployeesMutation.isPending}
                      className="flex-1"
                    >
                      {uploadEmployeesMutation.isPending ? (
                        <>
                          <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Importar Empleados
                        </>
                      )}
                    </Button>
                    
                    {selectedFile && (
                      <Button variant="outline" onClick={resetUpload}>
                        Cancelar
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  {/* Import Results */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Resultados de la Importación</h3>
                      <Button onClick={resetUpload} variant="outline">
                        Nueva Importación
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{importResult.total}</div>
                        <div className="text-sm text-gray-600">Total Registros</div>
                      </div>
                      
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{importResult.successful}</div>
                        <div className="text-sm text-gray-600">Importados</div>
                      </div>
                      
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{importResult.errors.length}</div>
                        <div className="text-sm text-gray-600">Errores</div>
                      </div>
                    </div>

                    {importResult.successful > 0 && (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Éxito:</strong> {importResult.successful} empleados fueron importados correctamente.
                        </AlertDescription>
                      </Alert>
                    )}

                    {importResult.errors.length > 0 && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Errores encontrados:</strong> {importResult.errors.length} registros no pudieron ser procesados.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {/* Error Details */}
                  {importResult.errors.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                          Detalles de Errores
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                          {importResult.errors.map((error, index) => (
                            <div key={index} className="border-l-4 border-red-500 bg-red-50 p-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <Badge variant="destructive" className="mb-2">
                                    Fila {error.row}
                                  </Badge>
                                  <p className="text-sm text-red-800">{error.error}</p>
                                  {error.data && (
                                    <p className="text-xs text-red-600 mt-1">
                                      Datos: {JSON.stringify(error.data)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Instructions Tab */}
        <TabsContent value="instructions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Instrucciones de Uso</CardTitle>
              <CardDescription>
                Guía paso a paso para importar empleados correctamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Paso 1: Descargar Plantilla</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 ml-4">
                  <li>Ve a la pestaña "Descargar Plantillas"</li>
                  <li>Descarga la plantilla Excel o CSV según tu preferencia</li>
                  <li>Abre el archivo en tu programa de hojas de cálculo favorito</li>
                </ol>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Paso 2: Completar Datos</h3>
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">Completa las siguientes columnas obligatorias:</p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                      <li><strong>nombre:</strong> Nombre(s) del empleado (ej: Juan Carlos)</li>
                      <li><strong>apellidos:</strong> Apellidos completos (ej: Pérez García)</li>
                      <li><strong>email:</strong> Correo electrónico válido y único (ej: juan.perez@empresa.com)</li>
                      <li><strong>puesto:</strong> Cargo o posición específica (ej: Analista de Sistemas)</li>
                      <li><strong>area:</strong> Departamento exacto del empleado</li>
                      <li><strong>fechaIngreso:</strong> Fecha de contratación en formato DD/MM/AAAA (ej: 15/01/2024)</li>
                    </ul>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Áreas válidas disponibles:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                      <div>• administracion</div>
                      <div>• operaciones</div>
                      <div>• ventas</div>
                      <div>• recursos-humanos</div>
                      <div>• finanzas</div>
                      <div>• tecnologia</div>
                      <div>• produccion</div>
                    </div>
                    <p className="text-xs text-blue-700 mt-2">
                      Las áreas deben escribirse exactamente como se muestran arriba (en minúsculas, con guiones)
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Paso 3: Cargar Archivo</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 ml-4">
                  <li>Ve a la pestaña "Cargar Empleados"</li>
                  <li>Selecciona tu archivo completado</li>
                  <li>Haz clic en "Importar Empleados"</li>
                  <li>Espera a que se procese el archivo</li>
                  <li>Revisa los resultados y errores si los hay</li>
                </ol>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="space-y-2">
                  <strong>Consejos importantes:</strong>
                  <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                    <li>No modifiques los nombres de las columnas</li>
                    <li>No dejes filas vacías entre los datos</li>
                    <li>Verifica que las fechas estén en formato correcto</li>
                    <li>Los emails deben ser únicos para cada empleado</li>
                    <li>Las áreas deben coincidir exactamente con las opciones válidas</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}