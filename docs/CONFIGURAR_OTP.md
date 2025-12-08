# Configuración de OTP (Email y SMS)

Este documento explica cómo configurar el sistema de autenticación con OTP por Email y SMS en el proyecto.

## 📧 Email OTP (YA FUNCIONA)

El OTP por email está **completamente funcional** desde el primer momento gracias a Supabase Auth.

### Flujo:
1. Usuario ingresa su email en `/acceder`
2. Supabase envía código de 6 dígitos al email
3. Usuario ingresa el código
4. Sistema valida y crea sesión

### Configuración:
✅ **No requiere configuración adicional** - Funciona out-of-the-box.

**Opcional:** Personalizar template de email en:
```
Supabase Dashboard > Authentication > Email Templates > Magic Link
```

---

## 📱 SMS OTP (Requiere configuración Twilio)

El sistema está **100% implementado** pero requiere credenciales de Twilio para funcionar.

### Requisitos:
1. Cuenta de Twilio ([console.twilio.com](https://console.twilio.com))
2. Twilio Verify Service configurado
3. Crédito en cuenta Twilio para envío de SMS

### Paso 1: Obtener Credenciales de Twilio

1. **Regístrate en Twilio:**
   - Ve a [twilio.com/try-twilio](https://www.twilio.com/try-twilio)
   - Crea cuenta (te dan $15 USD de crédito gratis)

2. **Obtén tus credenciales:**
   - Ve a [console.twilio.com](https://console.twilio.com/)
   - Dashboard principal muestra:
     - **Account SID**: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
     - **Auth Token**: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (click "Show" para ver)

3. **Crea un Verify Service:**
   - Ve a [console.twilio.com/us1/develop/verify/services](https://console.twilio.com/us1/develop/verify/services)
   - Click "Create new Service"
   - Nombre: "Trefa Auto OTP"
   - Click "Create"
   - Copia el **Service SID**: VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

### Paso 2: Configurar Secrets en Supabase

Las credenciales de Twilio deben configurarse como **Secrets** en Supabase (NO en .env local):

1. **Ve a Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/pemgwyymodlwabaexxrb/settings/functions
   ```

2. **Agregar Secrets:**
   - Click en "Manage secrets"
   - Agrega los siguientes secrets:

   ```
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

3. **Guardar:**
   - Click "Save" después de cada secret

### Paso 3: Desplegar Edge Functions

Las Edge Functions ya están en el código, solo falta desplegarlas:

```bash
# Desde la raíz del proyecto:

# 1. Asegúrate de estar loggeado en Supabase CLI
npx supabase login

# 2. Vincular al proyecto
npx supabase link --project-ref pemgwyymodlwabaexxrb

# 3. Desplegar función de envío de SMS
npx supabase functions deploy send-sms-otp

# 4. Desplegar función de verificación de SMS
npx supabase functions deploy verify-sms-otp
```

### Paso 4: Verificar Configuración

1. **Test de envío de SMS:**
   ```bash
   # Enviar SMS de prueba
   curl -X POST https://pemgwyymodlwabaexxrb.supabase.co/functions/v1/send-sms-otp \
     -H "Authorization: Bearer TU_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"phone": "+525512345678"}'
   ```

2. **Respuesta esperada:**
   ```json
   {
     "success": true,
     "verificationSid": "VExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
     "status": "pending"
   }
   ```

3. **Test de verificación:**
   ```bash
   # Verificar código recibido por SMS
   curl -X POST https://pemgwyymodlwabaexxrb.supabase.co/functions/v1/verify-sms-otp \
     -H "Authorization: Bearer TU_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"phone": "+525512345678", "code": "123456"}'
   ```

---

## 🔐 Google OAuth (YA FUNCIONA)

Google OAuth está configurado y funcional.

### Configuración actual:
✅ Autorizado en Google Cloud Console
✅ URLs de callback configuradas en Supabase
✅ Botón "Continuar con Google" funcional en `/acceder`

**No requiere cambios adicionales.**

---

## 🚀 Flujos Completos

### 1. Login con Email OTP (Usuarios existentes)

```
Usuario → /acceder
  ↓
Ingresa email
  ↓
Supabase envía código por email ✅ (YA FUNCIONA)
  ↓
Usuario ingresa código
  ↓
verifyOtp() valida código
  ↓
Sesión creada → Redirect según rol
```

### 2. Registro con SMS OTP (Nuevos usuarios)

```
Usuario → /registro
  ↓
Completa formulario (nombre, teléfono, email)
  ↓
Edge Function send-sms-otp ⚠️ (REQUIERE TWILIO)
  ↓
Twilio Verify envía SMS
  ↓
Usuario ingresa código de 6 dígitos
  ↓
Edge Function verify-sms-otp valida código
  ↓
createUserAccount() crea usuario en Supabase
  ↓
Perfil creado → Redirect a /escritorio/profile
```

### 3. Login con Google OAuth

```
Usuario → /acceder
  ↓
Click "Continuar con Google"
  ↓
Supabase Auth maneja OAuth flow ✅ (YA FUNCIONA)
  ↓
Sesión creada → Redirect según rol
```

---

## 📊 Estado del Sistema

| Método | Estado | Requiere Config |
|--------|--------|-----------------|
| **Email OTP** | ✅ Funcional | ❌ No |
| **SMS OTP** | ⚠️ Implementado | ✅ Twilio Secrets + Deploy |
| **Google OAuth** | ✅ Funcional | ❌ No |

---

## ⚠️ Importante

### Costos de SMS:
- Twilio Verify: ~$0.05 USD por SMS verificado
- Incluye envío + verificación
- Cuenta de prueba: $15 USD de crédito gratis (~300 verificaciones)

### Seguridad:
- **NUNCA** subir credenciales de Twilio a Git
- Usar SOLO Supabase Secrets para credenciales
- `.env.local` está en `.gitignore` ✅
- Secrets están protegidos en Supabase Dashboard ✅

### Limitaciones de Prueba:
Durante desarrollo con cuenta de prueba de Twilio:
- SMS solo se envían a números verificados en Twilio Console
- Agregar números de prueba en: [console.twilio.com/us1/develop/phone-numbers/manage/verified](https://console.twilio.com/us1/develop/phone-numbers/manage/verified)

---

## 🔍 Troubleshooting

### Email OTP no llega:
1. Revisar carpeta de spam
2. Verificar configuración de email en Supabase Dashboard > Auth > Providers > Email
3. Comprobar que el email sea válido

### SMS OTP no llega:
1. Verificar que los Secrets están configurados correctamente
2. Verificar que las Edge Functions están desplegadas:
   ```bash
   npx supabase functions list
   ```
3. Ver logs de Edge Functions:
   ```bash
   npx supabase functions logs send-sms-otp --tail
   npx supabase functions logs verify-sms-otp --tail
   ```
4. Verificar crédito en cuenta de Twilio
5. Verificar que el teléfono está en formato correcto (+52...)

### Google OAuth no funciona:
1. Verificar que la URL de callback está autorizada en Google Cloud Console
2. Verificar configuración en Supabase Dashboard > Auth > Providers > Google
3. Revisar que NEXT_PUBLIC_SUPABASE_URL esté correcta

---

## 📚 Referencias

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Twilio Verify API](https://www.twilio.com/docs/verify/api)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Secrets Management](https://supabase.com/docs/guides/functions/secrets)

---

**Última actualización:** 6 de diciembre de 2025
**Commit:** 24cbdfe
