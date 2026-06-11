// Componente para la Política de Prevención de Riesgos Psicosociales
// Según Guía de Referencia IV del documento oficial NOM-035-STPS-2018

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface CompanyInfo {
  razonSocial: string;
  rfc: string;
  direccion: string;
  representanteLegal: string;
  fechaVigencia: string;
}

interface PolicyComponentProps {
  companyInfo?: CompanyInfo;
  onSave?: (policy: string) => void;
  editable?: boolean;
}

export default function NOM035Policy({ companyInfo, onSave, editable = false }: PolicyComponentProps) {
  const [editableCompanyInfo, setEditableCompanyInfo] = useState<CompanyInfo>(
    companyInfo || {
      razonSocial: "",
      rfc: "",
      direccion: "",
      representanteLegal: "",
      fechaVigencia: new Date().toISOString().split('T')[0]
    }
  );

  const [customPolicy, setCustomPolicy] = useState("");

  // Política oficial basada en la Guía de Referencia IV de NOM-035-STPS-2018
  const generateOfficialPolicy = (info: CompanyInfo) => {
    return `POLÍTICA DE PREVENCIÓN DE RIESGOS PSICOSOCIALES

En ${info.razonSocial || '[RAZÓN SOCIAL]'}, en relación con la prevención de los factores de riesgo psicosocial, la prevención de la violencia laboral y la promoción de un entorno organizacional favorable, nos comprometemos a:

I. OBJETIVO

Establecer los lineamientos para identificar, prevenir y controlar los factores de riesgo psicosocial; promover un entorno organizacional favorable; y prevenir actos de violencia laboral, con el fin de propiciar un trabajo digno y decente, y mejorar continuamente las condiciones de trabajo de nuestros empleados.

II. ALCANCE

La presente política aplica a todos los trabajadores, independientemente de su tipo de contratación, nivel jerárquico, turno de trabajo o ubicación, así como a todas las instalaciones y centros de trabajo de ${info.razonSocial || '[RAZÓN SOCIAL]'}.

III. COMPROMISOS DE LA EMPRESA

1. PREVENCIÓN DE FACTORES DE RIESGO PSICOSOCIAL
• Identificar, evaluar y controlar los factores de riesgo psicosocial presentes en el ambiente de trabajo
• Adoptar medidas preventivas cuando se identifiquen condiciones que puedan afectar la salud mental de los trabajadores
• Proporcionar información y capacitación sobre factores de riesgo psicosocial y sus efectos en la salud
• Realizar evaluaciones periódicas según los lineamientos establecidos en la NOM-035-STPS-2018

2. PREVENCIÓN DE LA VIOLENCIA LABORAL
• Prohibir expresamente cualquier forma de violencia laboral, incluyendo hostigamiento, acoso y malos tratos
• Establecer mecanismos de denuncia confidenciales y efectivos
• Investigar de manera imparcial y oportuna cualquier denuncia de violencia laboral
• Aplicar medidas disciplinarias apropiadas contra quienes incurran en actos de violencia
• Garantizar que no habrá represalias contra quienes denuncien en buena fe

3. PROMOCIÓN DEL ENTORNO ORGANIZACIONAL FAVORABLE
• Fomentar el sentido de pertenencia a la organización
• Proporcionar formación adecuada para el desempeño de las tareas asignadas
• Definir claramente responsabilidades y funciones de cada puesto
• Promover la participación proactiva y comunicación efectiva entre trabajadores
• Distribuir equitativamente las cargas de trabajo
• Respetar las jornadas de trabajo conforme a la legislación aplicable
• Evaluar y reconocer el desempeño de manera justa y objetiva

IV. RESPONSABILIDADES

1. DE LA ALTA DIRECCIÓN
• Liderar con el ejemplo en la implementación de esta política
• Asegurar los recursos necesarios para su cumplimiento
• Revisar periódicamente la efectividad de las medidas implementadas

2. DE LOS MANDOS MEDIOS Y SUPERVISORES
• Aplicar esta política en sus áreas de responsabilidad
• Detectar y reportar factores de riesgo psicosocial
• Tratar con respeto y dignidad a todos los trabajadores
• Promover un ambiente de trabajo positivo y colaborativo

3. DE TODOS LOS TRABAJADORES
• Conocer y cumplir las disposiciones de esta política
• Reportar situaciones que consideren factores de riesgo psicosocial
• Colaborar en las evaluaciones y programas de prevención
• Tratar con respeto a compañeros, superiores y subordinados
• Participar en actividades de capacitación y formación

V. MECANISMOS DE DENUNCIA

Los trabajadores pueden reportar factores de riesgo psicosocial o actos de violencia laboral a través de los siguientes medios:

• Recursos Humanos: [Especificar contacto]
• Línea de denuncia confidencial: [Especificar número]
• Correo electrónico: [Especificar email]
• Buzón de denuncias: [Especificar ubicación]

Todas las denuncias serán tratadas con estricta confidencialidad y se garantiza que no habrá represalias contra quienes denuncien de buena fe.

VI. MEDIDAS Y ACCIONES

Cuando se identifiquen factores de riesgo psicosocial o situaciones de violencia laboral, se implementarán las medidas correctivas necesarias, que pueden incluir:

• Modificaciones en la organización del trabajo
• Programas de capacitación específicos
• Intervenciones individuales o grupales
• Reubicación temporal o permanente de trabajadores
• Medidas disciplinarias según corresponda
• Canalización a servicios médicos o psicológicos especializados

VII. EVALUACIÓN Y SEGUIMIENTO

• Se realizarán evaluaciones periódicas conforme a los lineamientos de la NOM-035-STPS-2018
• Los resultados de las evaluaciones serán comunicados a los trabajadores
• Se implementarán programas de mejora continua basados en los resultados obtenidos
• Se llevará registro de todas las acciones implementadas

VIII. VIGENCIA

Esta política entra en vigor a partir del ${info.fechaVigencia || '[FECHA]'} y será revisada anualmente o cuando las circunstancias lo requieran.

IX. COMPROMISO DE LA DIRECCIÓN

${info.razonSocial || '[RAZÓN SOCIAL]'} se compromete a cumplir cabalmente con las disposiciones establecidas en esta política y en la NOM-035-STPS-2018, destinando los recursos humanos, técnicos y económicos necesarios para su implementación efectiva.

La presente política ha sido autorizada por:

_________________________________
${info.representanteLegal || '[REPRESENTANTE LEGAL]'}
Representante Legal
${info.razonSocial || '[RAZÓN SOCIAL]'}

Fecha de autorización: ${info.fechaVigencia || '[FECHA]'}

---

NOTA: Esta política se encuentra disponible para consulta de todos los trabajadores en:
• Tableros de información
• Portal interno de la empresa
• Recursos Humanos
• [Otros medios de difusión]

Para dudas o aclaraciones sobre esta política, dirigirse al área de Recursos Humanos o al responsable del programa de factores de riesgo psicosocial.`;
  };

  const handleSavePolicy = () => {
    const policy = customPolicy || generateOfficialPolicy(editableCompanyInfo);
    if (onSave) {
      onSave(policy);
    }
  };

  const handleDownloadPolicy = () => {
    const policy = customPolicy || generateOfficialPolicy(editableCompanyInfo);
    const blob = new Blob([policy], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `politica-nom035-${editableCompanyInfo.razonSocial?.replace(/\s+/g, '-') || 'empresa'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información de la Empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {editable ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="razonSocial">Razón Social</Label>
                <Input
                  id="razonSocial"
                  value={editableCompanyInfo.razonSocial}
                  onChange={(e) => setEditableCompanyInfo({
                    ...editableCompanyInfo,
                    razonSocial: e.target.value
                  })}
                />
              </div>
              <div>
                <Label htmlFor="rfc">RFC</Label>
                <Input
                  id="rfc"
                  value={editableCompanyInfo.rfc}
                  onChange={(e) => setEditableCompanyInfo({
                    ...editableCompanyInfo,
                    rfc: e.target.value
                  })}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={editableCompanyInfo.direccion}
                  onChange={(e) => setEditableCompanyInfo({
                    ...editableCompanyInfo,
                    direccion: e.target.value
                  })}
                />
              </div>
              <div>
                <Label htmlFor="representanteLegal">Representante Legal</Label>
                <Input
                  id="representanteLegal"
                  value={editableCompanyInfo.representanteLegal}
                  onChange={(e) => setEditableCompanyInfo({
                    ...editableCompanyInfo,
                    representanteLegal: e.target.value
                  })}
                />
              </div>
              <div>
                <Label htmlFor="fechaVigencia">Fecha de Vigencia</Label>
                <Input
                  id="fechaVigencia"
                  type="date"
                  value={editableCompanyInfo.fechaVigencia}
                  onChange={(e) => setEditableCompanyInfo({
                    ...editableCompanyInfo,
                    fechaVigencia: e.target.value
                  })}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><strong>Razón Social:</strong> {companyInfo?.razonSocial || 'No especificada'}</div>
              <div><strong>RFC:</strong> {companyInfo?.rfc || 'No especificado'}</div>
              <div className="md:col-span-2"><strong>Dirección:</strong> {companyInfo?.direccion || 'No especificada'}</div>
              <div><strong>Representante Legal:</strong> {companyInfo?.representanteLegal || 'No especificado'}</div>
              <div><strong>Fecha de Vigencia:</strong> {companyInfo?.fechaVigencia || 'No especificada'}</div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Política de Prevención de Riesgos Psicosociales NOM-035-STPS-2018</CardTitle>
          <p className="text-sm text-slate-600">
            Política basada en la Guía de Referencia IV del documento oficial NOM-035-STPS-2018
          </p>
        </CardHeader>
        <CardContent>
          {editable ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="customPolicy">Personalizar Política (Opcional)</Label>
                <Textarea
                  id="customPolicy"
                  value={customPolicy}
                  onChange={(e) => setCustomPolicy(e.target.value)}
                  placeholder="Deje en blanco para usar la política oficial generada automáticamente"
                  className="h-32"
                />
              </div>
              <div>
                <h4 className="font-medium mb-2">Vista Previa de la Política</h4>
                <div className="bg-slate-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-xs">
                    {customPolicy || generateOfficialPolicy(editableCompanyInfo)}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 p-4 rounded-lg max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-xs">
                {generateOfficialPolicy(editableCompanyInfo)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button onClick={handleDownloadPolicy}>
          <i className="fas fa-download mr-2"></i>
          Descargar Política
        </Button>
        {editable && onSave && (
          <Button onClick={handleSavePolicy} variant="outline">
            <i className="fas fa-save mr-2"></i>
            Guardar Política
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información Legal</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600 space-y-2">
          <p><strong>Marco Legal:</strong> NOM-035-STPS-2018, Factores de riesgo psicosocial en el trabajo-Identificación, análisis y prevención.</p>
          <p><strong>Vigencia:</strong> Obligatorio desde el 23 de octubre de 2019.</p>
          <p><strong>Aplicación:</strong> Todos los centros de trabajo en territorio nacional mexicano.</p>
          <p><strong>Responsabilidad:</strong> El patrón debe establecer, implementar, mantener y difundir esta política por escrito.</p>
          <p><strong>Actualización:</strong> Se recomienda revisar y actualizar anualmente o cuando las circunstancias lo requieran.</p>
        </CardContent>
      </Card>
    </div>
  );
}