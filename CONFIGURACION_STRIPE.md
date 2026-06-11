# Configuración de Stripe para Pagos

## Pasos para configurar las claves de Stripe:

### 1. Obtener las claves de Stripe

1. **Crear cuenta en Stripe** (si no tienes una):
   - Ve a https://stripe.com
   - Registra tu empresa mexicana
   - Completa la verificación de identidad

2. **Obtener las claves API**:
   - Ve a https://dashboard.stripe.com/apikeys
   - Copia la **Publishable key** (comienza con `pk_`)
   - Copia la **Secret key** (comienza con `sk_`)

### 2. Configurar en Replit

**Opción A: A través de la interfaz de Replit**
1. En tu proyecto de Replit, ve a la pestaña "Secrets" (🔐)
2. Haz clic en "New Secret"
3. Agrega estas dos variables:

```
Key: STRIPE_SECRET_KEY
Value: sk_test_... (tu clave secreta de Stripe)

Key: VITE_STRIPE_PUBLIC_KEY  
Value: pk_test_... (tu clave pública de Stripe)
```

**Opción B: Desde el Shell**
```bash
# En el shell de Replit, ejecuta:
echo 'export STRIPE_SECRET_KEY="sk_test_tu_clave_aqui"' >> ~/.bashrc
echo 'export VITE_STRIPE_PUBLIC_KEY="pk_test_tu_clave_aqui"' >> ~/.bashrc
source ~/.bashrc
```

### 3. Reiniciar la aplicación

Después de configurar las variables:
1. Para la aplicación (Ctrl+C si está corriendo)
2. Reinicia con `npm run dev`
3. Verifica que no aparezcan los mensajes de "STRIPE_SECRET_KEY not found"

### 4. Configurar Webhooks (Opcional pero recomendado)

1. En tu dashboard de Stripe, ve a "Developers" > "Webhooks"
2. Agrega un endpoint: `https://tu-repl-url.replit.app/api/webhooks/stripe`
3. Selecciona estos eventos:
   - `subscription.updated`
   - `subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copia el "Signing secret" y agrégalo como `STRIPE_WEBHOOK_SECRET`

### 5. Configuración para Producción

Para usar en producción con dinero real:
1. Cambia las claves de `test` a `live` en Stripe
2. Configura tu cuenta bancaria en Stripe para recibir pagos
3. Completa la verificación de negocio en Stripe

## Notas Importantes

- Las claves `test` (pk_test_, sk_test_) son para pruebas
- Las claves `live` (pk_live_, sk_live_) procesan dinero real
- Nunca compartas tu clave secreta (sk_)
- La clave pública (pk_) es segura para usar en el frontend

## Verificación

Una vez configurado, deberías ver:
- ✅ "Stripe configured successfully" en los logs del servidor
- ✅ Los botones de pago funcionan en `/plans`
- ✅ La página de checkout carga correctamente en `/checkout`