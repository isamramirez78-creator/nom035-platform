import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  CheckCircle, 
  Building2, 
  Users, 
  FileText, 
  Shield, 
  Award,
  Clock,
  Zap,
  Crown,
  ArrowLeft
} from "lucide-react";

const plans = {
  monthly: [
    {
      id: "starter-monthly",
      name: "Plan Básico",
      description: "Ideal para microempresas (1-15 empleados)",
      price: 899,
      billingPeriod: "mes",
      maxEmployees: 15,
      maxEvaluations: 50,
      popular: false,
      features: [
        "Política de prevención NOM-035",
        "Hasta 15 empleados",
        "50 evaluaciones por mes", 
        "Reportes básicos en PDF",
        "Soporte por email",
        "Cumplimiento microempresas"
      ],
      limitations: [
        "Sin cuestionarios psicosociales",
        "Sin dashboard avanzado",
        "Sin alertas automáticas"
      ]
    },
    {
      id: "professional-monthly", 
      name: "Plan Profesional",
      description: "Para pequeñas empresas (16-50 empleados)",
      price: 1899,
      billingPeriod: "mes",
      maxEmployees: 50,
      maxEvaluations: 200,
      popular: true,
      features: [
        "Todo lo del Plan Básico",
        "Hasta 50 empleados",
        "200 evaluaciones por mes",
        "Cuestionarios Guía II completos",
        "Dashboard ejecutivo",
        "Reportes avanzados",
        "Gestión de intervenciones",
        "Alertas automáticas",
        "Soporte telefónico",
        "Cumplimiento pequeñas empresas"
      ],
      limitations: [
        "Sin Guía III (entorno organizacional)"
      ]
    },
    {
      id: "enterprise-monthly",
      name: "Plan Empresarial", 
      description: "Para medianas y grandes empresas (50+ empleados)",
      price: 3499,
      billingPeriod: "mes",
      maxEmployees: 500,
      maxEvaluations: 1000,
      popular: false,
      features: [
        "Todo lo del Plan Profesional",
        "Hasta 500 empleados",
        "1000 evaluaciones por mes",
        "Cuestionarios Guía II y III completos",
        "Evaluación entorno organizacional",
        "Analytics avanzados",
        "API personalizada",
        "Integraciones HRIS",
        "Soporte prioritario 24/7",
        "Gerente de cuenta dedicado",
        "Cumplimiento completo NOM-035"
      ],
      limitations: []
    }
  ],
  yearly: [
    {
      id: "starter-yearly",
      name: "Plan Básico",
      description: "Ideal para microempresas (1-15 empleados)",
      price: 8099,
      originalPrice: 10788,
      billingPeriod: "año",
      savings: "25%",
      maxEmployees: 15,
      maxEvaluations: 600,
      popular: false,
      features: [
        "Política de prevención NOM-035",
        "Hasta 15 empleados",
        "600 evaluaciones por año", 
        "Reportes básicos en PDF",
        "Soporte por email",
        "Cumplimiento microempresas"
      ],
      limitations: [
        "Sin cuestionarios psicosociales",
        "Sin dashboard avanzado", 
        "Sin alertas automáticas"
      ]
    },
    {
      id: "professional-yearly",
      name: "Plan Profesional",
      description: "Para pequeñas empresas (16-50 empleados)", 
      price: 17099,
      originalPrice: 22788,
      billingPeriod: "año",
      savings: "25%",
      maxEmployees: 50,
      maxEvaluations: 2400,
      popular: true,
      features: [
        "Todo lo del Plan Básico",
        "Hasta 50 empleados",
        "2400 evaluaciones por año",
        "Cuestionarios Guía II completos",
        "Dashboard ejecutivo",
        "Reportes avanzados",
        "Gestión de intervenciones",
        "Alertas automáticas",
        "Soporte telefónico",
        "Cumplimiento pequeñas empresas"
      ],
      limitations: [
        "Sin Guía III (entorno organizacional)"
      ]
    },
    {
      id: "enterprise-yearly",
      name: "Plan Empresarial",
      description: "Para medianas y grandes empresas (50+ empleados)",
      price: 31499,
      originalPrice: 41988,
      billingPeriod: "año", 
      savings: "25%",
      maxEmployees: 500,
      maxEvaluations: 12000,
      popular: false,
      features: [
        "Todo lo del Plan Profesional",
        "Hasta 500 empleados",
        "12000 evaluaciones por año",
        "Cuestionarios Guía II y III completos",
        "Evaluación entorno organizacional",
        "Analytics avanzados",
        "API personalizada",
        "Integraciones HRIS",
        "Soporte prioritario 24/7",
        "Gerente de cuenta dedicado",
        "Cumplimiento completo NOM-035"
      ],
      limitations: []
    }
  ]
};

export default function SubscriptionPlans() {
  const [isYearly, setIsYearly] = useState(false);
  const currentPlans = isYearly ? plans.yearly : plans.monthly;
  const { toast } = useToast();

  const subscribeMutation = useMutation({
    mutationFn: async (planId: string) => {
      const res = await apiRequest("POST", "/api/mercadopago/create-subscription", { planId });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        // Redirige a Mercado Pago para autorizar el cobro recurrente
        window.location.href = data.checkoutUrl;
      } else {
        toast({
          title: "No se pudo iniciar el pago",
          description: "Intenta de nuevo en unos momentos.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error al procesar el plan",
        description: error?.message || "Verifica tu sesión e intenta de nuevo.",
        variant: "destructive",
      });
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link href="/landing">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <div className="flex items-center">
                <div className="bg-slate-900 rounded-lg p-2 mr-4">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Planes Empresariales</h1>
                  <p className="text-sm text-slate-600">Elija el plan perfecto para su organización</p>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <Link href="/company-login">
                <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50">
                  Iniciar Sesión
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Plans Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Planes de Suscripción
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
              Seleccione el plan que mejor se adapte al tamaño y necesidades de cumplimiento de su empresa
            </p>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center space-x-4 mb-8">
              <span className={`text-sm font-medium ${!isYearly ? 'text-slate-900' : 'text-slate-500'}`}>
                Mensual
              </span>
              <Switch
                checked={isYearly}
                onCheckedChange={setIsYearly}
                className="data-[state=checked]:bg-slate-900"
              />
              <span className={`text-sm font-medium ${isYearly ? 'text-slate-900' : 'text-slate-500'}`}>
                Anual
              </span>
              {isYearly && (
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  Ahorra 25%
                </Badge>
              )}
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {currentPlans.map((plan, index) => (
              <Card 
                key={plan.id} 
                className={`relative ${plan.popular ? 'ring-2 ring-slate-900 shadow-lg' : 'border-slate-200'} hover:shadow-lg transition-shadow`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-slate-900 text-white">
                      <Crown className="h-3 w-3 mr-1" />
                      Más Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-6">
                  <div className="mb-4">
                    {index === 0 && <Building2 className="h-8 w-8 text-slate-600 mx-auto" />}
                    {index === 1 && <Users className="h-8 w-8 text-slate-600 mx-auto" />}
                    {index === 2 && <Award className="h-8 w-8 text-slate-600 mx-auto" />}
                  </div>
                  <CardTitle className="text-2xl font-bold text-slate-900">{plan.name}</CardTitle>
                  <CardDescription className="text-slate-600">{plan.description}</CardDescription>
                  
                  <div className="mt-6">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-slate-900">
                        {formatPrice(plan.price)}
                      </span>
                      <span className="text-slate-600 ml-2">/{plan.billingPeriod}</span>
                    </div>
                    {plan.originalPrice && (
                      <div className="mt-2">
                        <span className="text-sm text-slate-500 line-through">
                          {formatPrice(plan.originalPrice)}
                        </span>
                        <Badge variant="secondary" className="bg-green-100 text-green-700 ml-2">
                          {plan.savings} descuento
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center text-sm">
                      <Users className="h-4 w-4 text-slate-500 mr-2" />
                      Hasta {plan.maxEmployees} empleados
                    </div>
                    <div className="flex items-center text-sm">
                      <FileText className="h-4 w-4 text-slate-500 mr-2" />
                      {plan.maxEvaluations} evaluaciones por {plan.billingPeriod}
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <h4 className="font-semibold text-slate-900">Características incluidas:</h4>
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                        <span className="text-sm text-slate-600">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {plan.limitations.length > 0 && (
                    <div className="space-y-2 mb-6 p-3 bg-slate-50 rounded-lg">
                      <h4 className="font-semibold text-slate-700 text-sm">Limitaciones:</h4>
                      {plan.limitations.map((limitation, idx) => (
                        <div key={idx} className="flex items-start">
                          <div className="w-2 h-2 bg-slate-400 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                          <span className="text-xs text-slate-600">{limitation}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button
                    onClick={() => subscribeMutation.mutate(plan.id)}
                    disabled={subscribeMutation.isPending}
                    className={`w-full ${plan.popular ? 'bg-slate-900 hover:bg-slate-800' : 'bg-slate-700 hover:bg-slate-600'} text-white`}
                  >
                    {index === 0 && <Building2 className="h-4 w-4 mr-2" />}
                    {index === 1 && <Zap className="h-4 w-4 mr-2" />}
                    {index === 2 && <Crown className="h-4 w-4 mr-2" />}
                    {subscribeMutation.isPending ? "Redirigiendo..." : "Seleccionar Plan"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Enterprise Contact */}
          <div className="mt-16 text-center">
            <Card className="max-w-4xl mx-auto bg-slate-900 text-white border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  <Building2 className="h-12 w-12 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold">¿Necesita más de 500 empleados?</CardTitle>
                <CardDescription className="text-slate-300 text-lg">
                  Ofrecemos planes personalizados para grandes corporaciones y grupos empresariales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center">
                    <Users className="h-8 w-8 text-white mx-auto mb-2" />
                    <h4 className="font-semibold">Empleados Ilimitados</h4>
                    <p className="text-sm text-slate-300">Sin límites en su organización</p>
                  </div>
                  <div className="text-center">
                    <FileText className="h-8 w-8 text-white mx-auto mb-2" />
                    <h4 className="font-semibold">Evaluaciones Ilimitadas</h4>
                    <p className="text-sm text-slate-300">Todas las que necesite</p>
                  </div>
                  <div className="text-center">
                    <Clock className="h-8 w-8 text-white mx-auto mb-2" />
                    <h4 className="font-semibold">Soporte Dedicado</h4>
                    <p className="text-sm text-slate-300">Equipo exclusivo 24/7</p>
                  </div>
                </div>
                <Link href="/company-register">
                  <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
                    Contactar Ventas Corporativas
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}