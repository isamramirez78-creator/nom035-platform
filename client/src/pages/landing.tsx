import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Building2, 
  Shield, 
  CheckCircle, 
  BarChart, 
  Users, 
  FileText,
  AlertTriangle,
  Zap,
  Clock,
  Award
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="bg-slate-900 rounded-lg p-2 mr-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">NOM-035 STPS</h1>
                <p className="text-sm text-slate-600 font-medium">Sistema Empresarial de Evaluación Psicosocial</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Link href="/company-login">
                <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50">
                  Acceso Empresarial
                </Button>
              </Link>
              <Link href="/company-register">
                <Button className="bg-slate-900 hover:bg-slate-800 text-white">
                  Registro Corporativo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center bg-slate-100 text-slate-700 text-sm font-medium px-3 py-1 rounded-full mb-8">
                <Award className="h-4 w-4 mr-2" />
                Certificado NOM-035-STPS-2018
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mb-6">
                Plataforma Empresarial de
                <span className="text-slate-700"> Evaluación Psicosocial</span>
              </h1>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                Solución integral para el cumplimiento normativo de la NOM-035-STPS-2018. 
                Gestione evaluaciones psicosociales, genere reportes oficiales y mantenga 
                el compliance de su organización con la más alta precisión.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/plans">
                  <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 text-lg font-semibold">
                    Ver Planes y Precios
                  </Button>
                </Link>
                <Link href="/company-login">
                  <Button variant="outline" size="lg" className="border-slate-300 text-slate-700 hover:bg-slate-50 px-8 py-3 text-lg font-semibold">
                    Portal Corporativo
                  </Button>
                </Link>
              </div>
            </div>
            <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl p-8 lg:p-12">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-green-100 rounded-lg p-2 mr-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Cumplimiento Garantizado</h3>
                    <p className="text-sm text-slate-600">100% conforme a normativa oficial</p>
                  </div>
                </div>
                <div className="space-y-3 text-sm text-slate-600">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-slate-400 rounded-full mr-3"></div>
                    Evaluaciones psicosociales automatizadas
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-slate-400 rounded-full mr-3"></div>
                    Reportes oficiales y documentación completa
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-slate-400 rounded-full mr-3"></div>
                    Gestión integral de intervenciones
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-slate-400 rounded-full mr-3"></div>
                    Dashboard ejecutivo con métricas clave
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Solución Integral para su Organización
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Herramientas empresariales avanzadas diseñadas para garantizar el cumplimiento 
              normativo y optimizar la gestión de riesgos psicosociales
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 hover:shadow-md transition-shadow">
              <div className="bg-slate-100 rounded-lg p-3 w-fit mb-6">
                <BarChart className="h-8 w-8 text-slate-700" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Evaluaciones Certificadas</h3>
              <p className="text-slate-600 leading-relaxed">
                Cuestionarios oficiales implementados según las Guías de Referencia I, II y III. 
                Cálculo automático de niveles de riesgo con algoritmos certificados.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 hover:shadow-md transition-shadow">
              <div className="bg-slate-100 rounded-lg p-3 w-fit mb-6">
                <Users className="h-8 w-8 text-slate-700" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Gestión Centralizada</h3>
              <p className="text-slate-600 leading-relaxed">
                Administración completa de colaboradores, invitaciones automatizadas y 
                seguimiento detallado del progreso de evaluaciones por departamento.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 hover:shadow-md transition-shadow">
              <div className="bg-slate-100 rounded-lg p-3 w-fit mb-6">
                <FileText className="h-8 w-8 text-slate-700" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Reportes Ejecutivos</h3>
              <p className="text-slate-600 leading-relaxed">
                Generación automática de reportes oficiales, análisis estadísticos avanzados 
                y documentación completa para auditorías gubernamentales.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 hover:shadow-md transition-shadow">
              <div className="bg-slate-100 rounded-lg p-3 w-fit mb-6">
                <AlertTriangle className="h-8 w-8 text-slate-700" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Alertas Inteligentes</h3>
              <p className="text-slate-600 leading-relaxed">
                Sistema de detección temprana de riesgos altos. Notificaciones automáticas 
                y escalamiento para intervención inmediata del equipo directivo.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 hover:shadow-md transition-shadow">
              <div className="bg-slate-100 rounded-lg p-3 w-fit mb-6">
                <Zap className="h-8 w-8 text-slate-700" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Plan de Intervención</h3>
              <p className="text-slate-600 leading-relaxed">
                Diseño y seguimiento de medidas correctivas personalizadas. Cronogramas 
                de implementación y documentación integral de acciones realizadas.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 hover:shadow-md transition-shadow">
              <div className="bg-slate-100 rounded-lg p-3 w-fit mb-6">
                <Clock className="h-8 w-8 text-slate-700" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Control de Cumplimiento</h3>
              <p className="text-slate-600 leading-relaxed">
                Calendario automático de evaluaciones, recordatorios programados y 
                seguimiento de plazos normativos para mantener el compliance continuo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center bg-green-50 text-green-700 text-sm font-medium px-4 py-2 rounded-full mb-8">
                <Award className="h-4 w-4 mr-2" />
                Certificación Oficial NOM-035-STPS-2018
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
                Compliance Empresarial Garantizado
              </h2>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                Nuestra plataforma implementa exactamente todos los requerimientos establecidos 
                por la Secretaría del Trabajo y Previsión Social, garantizando protección 
                completa ante auditorías gubernamentales.
              </p>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-green-100 rounded-lg p-2 mr-4 mt-1">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Metodología Oficial</h4>
                    <p className="text-slate-600">Implementación exacta de las Guías de Referencia I, II y III</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-green-100 rounded-lg p-2 mr-4 mt-1">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Algoritmos Certificados</h4>
                    <p className="text-slate-600">Cálculos de riesgo según especificaciones técnicas oficiales</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-green-100 rounded-lg p-2 mr-4 mt-1">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Documentación Integral</h4>
                    <p className="text-slate-600">Registros completos y trazabilidad total para auditorías</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 p-8 lg:p-10 rounded-2xl border border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900 mb-8">Matriz de Cumplimiento</h3>
              <div className="space-y-6">
                <div className="bg-white rounded-xl p-6 border-l-4 border-green-500">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-slate-900">Microempresas (1-15)</h4>
                    <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded">Básico</span>
                  </div>
                  <p className="text-sm text-slate-600">Política de prevención, identificación y análisis de factores de riesgo psicosocial</p>
                </div>
                <div className="bg-white rounded-xl p-6 border-l-4 border-yellow-500">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-slate-900">Pequeñas (16-50)</h4>
                    <span className="bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-1 rounded">Intermedio</span>
                  </div>
                  <p className="text-sm text-slate-600">+ Cuestionarios para identificar factores de riesgo psicosocial en el trabajo</p>
                </div>
                <div className="bg-white rounded-xl p-6 border-l-4 border-red-500">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-slate-900">Medianas y Grandes (50+)</h4>
                    <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-1 rounded">Completo</span>
                  </div>
                  <p className="text-sm text-slate-600">+ Entorno organizacional favorable + Evaluaciones clínicas especializadas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Transforme su Gestión de Compliance
            </h2>
            <p className="text-xl text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed">
              Implemente una solución empresarial integral que garantice el cumplimiento 
              normativo y proteja su organización ante auditorías gubernamentales
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/company-register">
                <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 px-8 py-3 text-lg font-semibold">
                  Solicitar Demostración Ejecutiva
                </Button>
              </Link>
              <Link href="/company-login">
                <Button size="lg" variant="outline" className="border-slate-400 text-white hover:bg-slate-800 px-8 py-3 text-lg font-semibold">
                  Acceso Corporativo
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-8 pt-8 border-t border-slate-700">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">100%</div>
                <div className="text-sm text-slate-400">Compliance</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">24/7</div>
                <div className="text-sm text-slate-400">Monitoreo</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">Enterprise</div>
                <div className="text-sm text-slate-400">Security</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">Certified</div>
                <div className="text-sm text-slate-400">Platform</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Planes Empresariales
          </h2>
          <p className="text-xl text-slate-600 mb-12">
            Soluciones escalables para organizaciones de todos los tamaños
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-xl p-8 border border-slate-200 hover:border-slate-300 transition-colors">
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Plan Básico</h3>
              <div className="text-3xl font-bold text-slate-900 mb-4">$899<span className="text-base font-normal text-slate-600">/mes</span></div>
              <p className="text-slate-600 mb-6">Ideal para microempresas (1-15 empleados)</p>
              <Link href="/plans">
                <Button className="w-full bg-slate-900 hover:bg-slate-800">Ver Detalles</Button>
              </Link>
            </div>
            
            <div className="bg-white rounded-xl p-8 border-2 border-slate-900 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-slate-900 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Más Popular
                </span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Plan Profesional</h3>
              <div className="text-3xl font-bold text-slate-900 mb-4">$1,899<span className="text-base font-normal text-slate-600">/mes</span></div>
              <p className="text-slate-600 mb-6">Para pequeñas empresas (16-50 empleados)</p>
              <Link href="/plans">
                <Button className="w-full bg-slate-900 hover:bg-slate-800">Ver Detalles</Button>
              </Link>
            </div>
            
            <div className="bg-white rounded-xl p-8 border border-slate-200 hover:border-slate-300 transition-colors">
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Plan Empresarial</h3>
              <div className="text-3xl font-bold text-slate-900 mb-4">$3,499<span className="text-base font-normal text-slate-600">/mes</span></div>
              <p className="text-slate-600 mb-6">Para medianas y grandes empresas (50+ empleados)</p>
              <Link href="/plans">
                <Button className="w-full bg-slate-900 hover:bg-slate-800">Ver Detalles</Button>
              </Link>
            </div>
          </div>
          
          <div className="text-center">
            <Link href="/plans">
              <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 text-lg font-semibold">
                Ver Todos los Planes y Características
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center mb-6">
                <div className="bg-white rounded-lg p-2 mr-4">
                  <Shield className="h-8 w-8 text-slate-900" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">NOM-035 STPS</h3>
                  <p className="text-slate-300">Sistema Empresarial de Evaluación Psicosocial</p>
                </div>
              </div>
              <p className="text-slate-300 mb-6 max-w-md leading-relaxed">
                Plataforma empresarial certificada diseñada para garantizar el cumplimiento 
                integral de la NOM-035-STPS-2018 en organizaciones de todos los tamaños.
              </p>
              <div className="inline-flex items-center bg-slate-700 text-slate-200 text-sm px-3 py-1 rounded-full">
                <Award className="h-4 w-4 mr-2" />
                Certificación Oficial STPS
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-6 text-white">Soluciones</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-slate-300 hover:text-white transition-colors">Evaluaciones Psicosociales</a></li>
                <li><a href="#" className="text-slate-300 hover:text-white transition-colors">Dashboard Ejecutivo</a></li>
                <li><a href="#" className="text-slate-300 hover:text-white transition-colors">Reportes de Compliance</a></li>
                <li><a href="#" className="text-slate-300 hover:text-white transition-colors">Gestión de Intervenciones</a></li>
                <li><a href="#" className="text-slate-300 hover:text-white transition-colors">Alertas Automáticas</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-6 text-white">Cumplimiento</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-slate-300 hover:text-white transition-colors">NOM-035-STPS-2018</a></li>
                <li><a href="#" className="text-slate-300 hover:text-white transition-colors">Guía de Referencia I</a></li>
                <li><a href="#" className="text-slate-300 hover:text-white transition-colors">Guía de Referencia II</a></li>
                <li><a href="#" className="text-slate-300 hover:text-white transition-colors">Guía de Referencia III</a></li>
                <li><a href="#" className="text-slate-300 hover:text-white transition-colors">Auditorías STPS</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-slate-400 text-sm mb-4 md:mb-0">
              &copy; 2024 Sistema NOM-035-STPS. Todos los derechos reservados. Cumplimiento certificado de la normativa mexicana.
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">Términos de Servicio</a>
              <a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">Política de Privacidad</a>
              <a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">Soporte Técnico</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}