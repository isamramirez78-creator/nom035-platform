import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Shield, CheckCircle, CreditCard, FileText, Calculator } from "lucide-react";
import { Link } from "wouter";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

const CheckoutForm = ({ planDetails }: { planDetails: any }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [requiresInvoice, setRequiresInvoice] = useState(true);
  const [invoiceData, setInvoiceData] = useState({
    razonSocial: '',
    rfc: '',
    codigoPostal: '',
    regimenFiscal: '',
    usoCfdi: 'G03',
    email: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!stripe || !elements) {
      setIsLoading(false);
      return;
    }

    // Validate invoice data if required
    if (requiresInvoice) {
      const missingFields = [];
      if (!invoiceData.razonSocial) missingFields.push('Razón Social');
      if (!invoiceData.rfc) missingFields.push('RFC');
      if (!invoiceData.codigoPostal) missingFields.push('Código Postal');
      if (!invoiceData.regimenFiscal) missingFields.push('Régimen Fiscal');
      if (!invoiceData.email) missingFields.push('Email');

      if (missingFields.length > 0) {
        toast({
          title: "Datos de facturación incompletos",
          description: `Faltan los siguientes campos: ${missingFields.join(', ')}`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard?subscription_success=true`,
      },
    });

    if (error) {
      toast({
        title: "Error en el Pago",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Save invoice data if required
      if (requiresInvoice) {
        try {
          await apiRequest("POST", "/api/billing/invoice-data", {
            planId: planDetails.id,
            invoiceData
          });
        } catch (error) {
          console.error("Error saving invoice data:", error);
        }
      }

      toast({
        title: "Suscripción Exitosa",
        description: requiresInvoice 
          ? "¡Bienvenido! Su suscripción ha sido activada. Su factura será enviada por email."
          : "¡Bienvenido! Su suscripción ha sido activada.",
      });
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Plan Summary */}
      <Card className="border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-slate-900">Resumen del Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-semibold text-slate-900">{planDetails.name}</h3>
              <p className="text-sm text-slate-600">{planDetails.description}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-900">
                ${planDetails.price.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-slate-600">
                MXN/{planDetails.billingPeriod}
              </div>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <div className="flex items-center text-sm text-slate-600 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              Hasta {planDetails.maxEmployees} empleados
            </div>
            <div className="flex items-center text-sm text-slate-600">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              {planDetails.maxEvaluations} evaluaciones por {planDetails.billingPeriod}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Data Form */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center text-lg text-slate-900">
            <FileText className="h-5 w-5 mr-2" />
            Datos Fiscales
          </CardTitle>
          <CardDescription>
            Información necesaria para la elaboración de su factura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Invoice Toggle */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Calculator className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-slate-900">¿Requiere factura?</p>
                  <p className="text-sm text-slate-600">Necesaria para deducir gastos empresariales</p>
                </div>
              </div>
              <Switch
                checked={requiresInvoice}
                onCheckedChange={setRequiresInvoice}
              />
            </div>

            {requiresInvoice && (
              <div className="space-y-4 border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="razonSocial">Razón Social *</Label>
                    <Input
                      id="razonSocial"
                      placeholder="Constructora del Valle SA de CV"
                      value={invoiceData.razonSocial}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, razonSocial: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="rfc">RFC *</Label>
                    <Input
                      id="rfc"
                      placeholder="ABC123456DEF"
                      value={invoiceData.rfc}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, rfc: e.target.value.toUpperCase() }))}
                      className="mt-1"
                      maxLength={13}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="codigoPostal">Código Postal *</Label>
                    <Input
                      id="codigoPostal"
                      placeholder="01234"
                      value={invoiceData.codigoPostal}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, codigoPostal: e.target.value }))}
                      className="mt-1"
                      maxLength={5}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="regimenFiscal">Régimen Fiscal *</Label>
                    <Select
                      value={invoiceData.regimenFiscal}
                      onValueChange={(value) => setInvoiceData(prev => ({ ...prev, regimenFiscal: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Seleccione su régimen fiscal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="601">601 - General de Ley Personas Morales</SelectItem>
                        <SelectItem value="603">603 - Personas Morales con Fines no Lucrativos</SelectItem>
                        <SelectItem value="605">605 - Sueldos y Salarios e Ingresos Asimilados a Salarios</SelectItem>
                        <SelectItem value="606">606 - Arrendamiento</SelectItem>
                        <SelectItem value="608">608 - Demás ingresos</SelectItem>
                        <SelectItem value="610">610 - Residentes en el Extranjero sin Establecimiento Permanente en México</SelectItem>
                        <SelectItem value="611">611 - Ingresos por Dividendos (socios y accionistas)</SelectItem>
                        <SelectItem value="612">612 - Personas Físicas con Actividades Empresariales y Profesionales</SelectItem>
                        <SelectItem value="614">614 - Ingresos por intereses</SelectItem>
                        <SelectItem value="616">616 - Sin obligaciones fiscales</SelectItem>
                        <SelectItem value="620">620 - Sociedades Cooperativas de Producción que optan por diferir sus ingresos</SelectItem>
                        <SelectItem value="621">621 - Incorporación Fiscal</SelectItem>
                        <SelectItem value="622">622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras</SelectItem>
                        <SelectItem value="623">623 - Optativo para Grupos de Sociedades</SelectItem>
                        <SelectItem value="624">624 - Coordinados</SelectItem>
                        <SelectItem value="628">628 - Hidrocarburos</SelectItem>
                        <SelectItem value="629">629 - De los Regímenes Fiscales Preferentes y de las Empresas Multinacionales</SelectItem>
                        <SelectItem value="630">630 - Enajenación de acciones en bolsa de valores</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="usoCfdi">Uso del CFDI *</Label>
                    <Select
                      value={invoiceData.usoCfdi}
                      onValueChange={(value) => setInvoiceData(prev => ({ ...prev, usoCfdi: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Seleccione el uso del CFDI" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="G01">G01 - Adquisición de mercancías</SelectItem>
                        <SelectItem value="G02">G02 - Devoluciones, descuentos o bonificaciones</SelectItem>
                        <SelectItem value="G03">G03 - Gastos en general</SelectItem>
                        <SelectItem value="I01">I01 - Construcciones</SelectItem>
                        <SelectItem value="I02">I02 - Mobilario y equipo de oficina por inversiones</SelectItem>
                        <SelectItem value="I03">I03 - Equipo de transporte</SelectItem>
                        <SelectItem value="I04">I04 - Equipo de computo y accesorios</SelectItem>
                        <SelectItem value="I05">I05 - Dados, troqueles, moldes, matrices y herramental</SelectItem>
                        <SelectItem value="I06">I06 - Comunicaciones telefónicas</SelectItem>
                        <SelectItem value="I07">I07 - Comunicaciones satelitales</SelectItem>
                        <SelectItem value="I08">I08 - Otra maquinaria y equipo</SelectItem>
                        <SelectItem value="D01">D01 - Honorarios médicos, dentales y gastos hospitalarios</SelectItem>
                        <SelectItem value="D02">D02 - Gastos médicos por incapacidad o discapacidad</SelectItem>
                        <SelectItem value="D03">D03 - Gastos funerales</SelectItem>
                        <SelectItem value="D04">D04 - Donativos</SelectItem>
                        <SelectItem value="D05">D05 - Intereses reales efectivamente pagados por créditos hipotecarios (casa habitación)</SelectItem>
                        <SelectItem value="D06">D06 - Aportaciones voluntarias al SAR</SelectItem>
                        <SelectItem value="D07">D07 - Primas por seguros de gastos médicos</SelectItem>
                        <SelectItem value="D08">D08 - Gastos de transportación escolar obligatoria</SelectItem>
                        <SelectItem value="D09">D09 - Depósitos en cuentas para el ahorro, primas que tengan como base planes de pensiones</SelectItem>
                        <SelectItem value="D10">D10 - Pagos por servicios educativos (colegiaturas)</SelectItem>
                        <SelectItem value="P01">P01 - Por definir</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="email">Email para facturación *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="facturacion@empresa.com.mx"
                      value={invoiceData.email}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, email: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800">Importante sobre facturación</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Su factura será generada automáticamente y enviada a su email en un plazo máximo de 72 horas. 
                        Asegúrese de que todos los datos fiscales sean correctos ya que no podrán modificarse después del pago.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center text-lg text-slate-900">
            <CreditCard className="h-5 w-5 mr-2" />
            Información de Pago
          </CardTitle>
          <CardDescription>
            Complete los datos de su tarjeta para activar su suscripción
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentElement 
            options={{
              layout: "tabs"
            }}
          />
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button 
        type="submit" 
        className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 text-lg font-semibold"
        disabled={!stripe || isLoading}
      >
        {isLoading ? (
          <div className="flex items-center">
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
            Procesando...
          </div>
        ) : (
          `Confirmar Suscripción - $${planDetails.price.toLocaleString('es-MX')} MXN/${planDetails.billingPeriod}`
        )}
      </Button>

      <p className="text-xs text-slate-500 text-center">
        Al confirmar, acepta nuestros términos y condiciones. Su suscripción se renovará automáticamente.
      </p>
    </form>
  );
};

export default function Checkout() {
  const [location] = useLocation();
  const [clientSecret, setClientSecret] = useState("");
  const [planDetails, setPlanDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Extract plan ID from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const planId = urlParams.get('plan');

  // Plan data - should match the plans from subscription-plans.tsx
  const plans = {
    'starter-monthly': {
      name: 'Plan Básico',
      description: 'Ideal para microempresas (1-15 empleados)',
      price: 899,
      billingPeriod: 'mes',
      maxEmployees: 15,
      maxEvaluations: 50,
      stripePrice: 'price_starter_monthly'
    },
    'professional-monthly': {
      name: 'Plan Profesional',
      description: 'Para pequeñas empresas (16-50 empleados)',
      price: 1899,
      billingPeriod: 'mes',
      maxEmployees: 50,
      maxEvaluations: 200,
      stripePrice: 'price_professional_monthly'
    },
    'enterprise-monthly': {
      name: 'Plan Empresarial',
      description: 'Para medianas y grandes empresas (50+ empleados)',
      price: 3499,
      billingPeriod: 'mes',
      maxEmployees: 500,
      maxEvaluations: 1000,
      stripePrice: 'price_enterprise_monthly'
    },
    'starter-yearly': {
      name: 'Plan Básico',
      description: 'Ideal para microempresas (1-15 empleados)',
      price: 8099,
      billingPeriod: 'año',
      maxEmployees: 15,
      maxEvaluations: 600,
      stripePrice: 'price_starter_yearly'
    },
    'professional-yearly': {
      name: 'Plan Profesional',
      description: 'Para pequeñas empresas (16-50 empleados)',
      price: 17099,
      billingPeriod: 'año',
      maxEmployees: 50,
      maxEvaluations: 2400,
      stripePrice: 'price_professional_yearly'
    },
    'enterprise-yearly': {
      name: 'Plan Empresarial',
      description: 'Para medianas y grandes empresas (50+ empleados)',
      price: 31499,
      billingPeriod: 'año',
      maxEmployees: 500,
      maxEvaluations: 12000,
      stripePrice: 'price_enterprise_yearly'
    }
  };

  useEffect(() => {
    if (!planId || !plans[planId as keyof typeof plans]) {
      setIsLoading(false);
      return;
    }

    const selectedPlan = plans[planId as keyof typeof plans];
    setPlanDetails(selectedPlan);

    // Create subscription with Stripe
    apiRequest("POST", "/api/create-subscription", { 
      planId: selectedPlan.stripePrice,
      billingCycle: selectedPlan.billingPeriod === 'año' ? 'yearly' : 'monthly'
    })
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error creating subscription:', error);
        setIsLoading(false);
      });
  }, [planId]);

  if (!planId || !plans[planId as keyof typeof plans]) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Plan No Válido</CardTitle>
            <CardDescription>
              El plan seleccionado no existe o no es válido.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/plans">
              <Button className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Planes
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !clientSecret) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <Link href="/plans">
                  <Button variant="ghost" size="sm" className="mr-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver a Planes
                  </Button>
                </Link>
                <div className="flex items-center">
                  <div className="bg-slate-900 rounded-lg p-2 mr-4">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900">Checkout Seguro</h1>
                    <p className="text-sm text-slate-600">Procesado por Stripe</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slate-600">Preparando el pago seguro...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link href="/plans">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver a Planes
                </Button>
              </Link>
              <div className="flex items-center">
                <div className="bg-slate-900 rounded-lg p-2 mr-4">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Checkout Seguro</h1>
                  <p className="text-sm text-slate-600">Procesado por Stripe</p>
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              <Shield className="h-3 w-3 mr-1" />
              Pago Seguro
            </Badge>
          </div>
        </div>
      </header>

      {/* Checkout Form */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm planDetails={planDetails} />
        </Elements>
      </div>
    </div>
  );
}