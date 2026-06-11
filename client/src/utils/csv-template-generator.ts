export interface EmployeeCSVTemplate {
  nombre: string;
  apellidos: string;
  puesto: string;
  area: string;
  fecha_ingreso: string;
  email: string;
}

export function generateEmployeeCSVTemplate(): string {
  const headers = [
    'nombre',
    'apellidos', 
    'puesto',
    'area',
    'fecha_ingreso',
    'email'
  ];

  const exampleData: EmployeeCSVTemplate[] = [
    {
      nombre: 'Juan',
      apellidos: 'Pérez García',
      puesto: 'Analista de Sistemas',
      area: 'Tecnología',
      fecha_ingreso: '2024-01-15',
      email: 'juan.perez@empresa.com'
    },
    {
      nombre: 'María',
      apellidos: 'López Martínez',
      puesto: 'Coordinadora de Ventas',
      area: 'Comercial',
      fecha_ingreso: '2023-08-20',
      email: 'maria.lopez@empresa.com'
    },
    {
      nombre: 'Carlos',
      apellidos: 'Rodríguez Sánchez',
      puesto: 'Contador',
      area: 'Finanzas',
      fecha_ingreso: '2022-03-10',
      email: 'carlos.rodriguez@empresa.com'
    }
  ];

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...exampleData.map(employee => 
      headers.map(header => {
        const value = employee[header as keyof EmployeeCSVTemplate];
        // Escape commas and quotes in CSV values
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  return csvContent;
}

export function downloadCSVTemplate(filename: string = 'plantilla_empleados.csv'): void {
  const csvContent = generateEmployeeCSVTemplate();
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function getCSVInstructions(): string {
  return `
INSTRUCCIONES PARA IMPORTACIÓN MASIVA DE EMPLEADOS

1. FORMATO DE ARCHIVO:
   - El archivo debe estar en formato CSV (valores separados por comas)
   - Usar codificación UTF-8 para caracteres especiales
   - La primera fila debe contener los encabezados exactos

2. CAMPOS REQUERIDOS:
   • nombre: Nombre(s) del empleado
   • apellidos: Apellidos completos
   • puesto: Cargo o posición laboral
   • area: Departamento o área de trabajo
   • fecha_ingreso: Fecha de contratación (formato: YYYY-MM-DD)
   • email: Dirección de correo electrónico (opcional)

3. FORMATO DE FECHAS:
   - Usar formato ISO: YYYY-MM-DD
   - Ejemplo: 2024-01-15 para 15 de enero de 2024

4. VALIDACIONES:
   - Nombre y apellidos son obligatorios
   - El email debe tener formato válido si se proporciona
   - No se permiten registros duplicados por email

5. RECOMENDACIONES:
   - Revisar los datos antes de importar
   - Hacer una prueba con pocos registros primero
   - Mantener una copia de respaldo de los datos

6. LÍMITES:
   - Máximo 1000 empleados por importación
   - Cada campo puede tener hasta 255 caracteres
`;
}