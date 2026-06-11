import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, ExternalLink, CheckCircle, AlertTriangle, Key, CreditCard, Shield } from "lucide-react";

export default function StripeSetupGuide() {
  const [copiedKey, setCopiedKey] = useState<string>("");

  const copyToClipboard = (text: string, keyType: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyType);
    setTimeout(() => setCopiedKey(""), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Configuración de Pagos con Stripe</h1>
        <p className="text-gray-600">
          Configura tu cuenta de Stripe para comenzar a recibir pagos de suscripciones
        </p>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> Necesitas configurar las claves de Stripe para que el sistema de pagos funcione.
          Sin estas claves, los usuarios no podrán suscribirse a los planes de pago.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="obtain" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="obtain">1. Obtener Claves</TabsTrigger>
          <TabsTrigger value="configure">2. Configurar</TabsTrigger>
          <TabsTrigger value="verify">3. Verificar</TabsTrigger>
        </TabsList>

        {/* Step 1: Obtain Keys */}
        <TabsContent value="obtain" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="w-5 h-5 mr-2" />
                Obtener las Claves API de Stripe
              </CardTitle>
              <CardDescription>
                Primero necesitas crear una cuenta en Stripe y obtener tus claves API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Paso 1: Crear Cuenta en Stripe</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Ve a <a href="https://stripe.com" target="_blank" className="text-blue-600 hover:underline">stripe.com</a></li>
                    <li>Haz clic en "Crear cuenta"</li>
                    <li>Completa el registro con datos de tu empresa</li>
                    <li>Verifica tu identidad (requerido para recibir pagos)</li>
                  </ol>
                  <Button asChild variant="outline" className="w-full">
                    <a href="https://stripe.com" target="_blank">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Ir a Stripe
                    </a>
                  </Button>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Paso 2: Obtener Claves API</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Inicia sesión en tu dashboard de Stripe</li>
                    <li>Ve a "Developers" → "API keys"</li>
                    <li>Copia la "Publishable key" (pk_test_...)</li>
                    <li>Copia la "Secret key" (sk_test_...)</li>
                  </ol>
                  <Button asChild variant="outline" className="w-full">
                    <a href="https://dashboard.stripe.com/apikeys" target="_blank">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Ver API Keys
                    </a>
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Nota:</strong> Las claves que terminan en "test" son para pruebas. Para recibir dinero real,
                  necesitarás las claves "live" después de verificar tu cuenta.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 2: Configure */}
        <TabsContent value="configure" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Configurar en Replit
              </CardTitle>
              <CardDescription>
                Agrega las claves de Stripe como variables de entorno seguras
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-4">
                  <h3 className="font-semibold mb-4">Opción A: Interfaz de Replit</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Ve a la pestaña "Secrets" 🔐 en tu proyecto</li>
                    <li>Haz clic en "New Secret"</li>
                    <li>Agrega las dos variables:</li>
                  </ol>
                  
                  <div className="mt-4 space-y-3">
                    <div className="bg-gray-50 p-3 rounded border">
                      <div className="flex items-center justify-between">
                        <div>
                          <code className="text-sm font-mono">STRIPE_SECRET_KEY</code>
                          <p className="text-xs text-gray-600">Tu clave secreta (sk_test_...)</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard("STRIPE_SECRET_KEY", "secret")}
                        >
                          {copiedKey === "secret" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded border">
                      <div className="flex items-center justify-between">
                        <div>
                          <code className="text-sm font-mono">VITE_STRIPE_PUBLIC_KEY</code>
                          <p className="text-xs text-gray-600">Tu clave pública (pk_test_...)</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard("VITE_STRIPE_PUBLIC_KEY", "public")}
                        >
                          {copiedKey === "public" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-4">Opción B: Shell de Replit</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Abre el Shell y ejecuta estos comandos:
                  </p>
                  
                  <div className="space-y-2">
                    <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm">
                      <div className="flex items-center justify-between">
                        <span>echo 'export STRIPE_SECRET_KEY="sk_test_..."' &gt;&gt; ~/.bashrc</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard('echo \'export STRIPE_SECRET_KEY="sk_test_tu_clave_aqui"\' >> ~/.bashrc', "cmd1")}
                        >
                          <Copy className="w-4 h-4 text-white" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm">
                      <div className="flex items-center justify-between">
                        <span>echo 'export VITE_STRIPE_PUBLIC_KEY="pk_test_..."' &gt;&gt; ~/.bashrc</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard('echo \'export VITE_STRIPE_PUBLIC_KEY="pk_test_tu_clave_aqui"\' >> ~/.bashrc', "cmd2")}
                        >
                          <Copy className="w-4 h-4 text-white" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Después de configurar:</strong> Reinicia la aplicación para que las variables tomen efecto.
                  Para la aplicación con Ctrl+C y vuelve a ejecutar "npm run dev".
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 3: Verify */}
        <TabsContent value="verify" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Verificar Configuración
              </CardTitle>
              <CardDescription>
                Confirma que todo está funcionando correctamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Verificaciones en el Servidor</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">✅</Badge>
                      <span className="text-sm">No aparece "STRIPE_SECRET_KEY not found" en logs</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">✅</Badge>
                      <span className="text-sm">El servidor inicia sin errores de Stripe</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">✅</Badge>
                      <span className="text-sm">Las rutas de pago responden correctamente</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Verificaciones en el Frontend</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">✅</Badge>
                      <span className="text-sm">La página de planes carga correctamente</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">✅</Badge>
                      <span className="text-sm">Los botones de "Seleccionar Plan" funcionan</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">✅</Badge>
                      <span className="text-sm">La página de checkout se carga sin errores</span>
                    </div>
                  </div>
                </div>
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Prueba completa:</strong> Ve a /plans, selecciona un plan y verifica que la página 
                  de checkout carga con el formulario de pago de Stripe.
                </AlertDescription>
              </Alert>

              <div className="flex gap-4">
                <Button asChild>
                  <a href="/plans">
                    Probar Planes de Suscripción
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <a href="https://dashboard.stripe.com/test/logs" target="_blank">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ver Logs de Stripe
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}