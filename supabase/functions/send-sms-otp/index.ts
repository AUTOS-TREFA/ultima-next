import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_VERIFY_SERVICE_SID = Deno.env.get("TWILIO_VERIFY_SERVICE_SID") || "VA6d44c2df0a37c44bcc5f087b3868e12d";

interface RequestBody {
  phone: string;
  email?: string; // Optional: if provided, check if email exists in auth.users before sending SMS
}

Deno.serve(async (req: Request) => {
  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validar que las credenciales de Twilio estén configuradas
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      console.error("❌ Credenciales de Twilio no configuradas");
      return new Response(
        JSON.stringify({
          error: "Configuración de SMS no disponible",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const { phone, email }: RequestBody = await req.json();

    // Validar entrada
    if (!phone) {
      return new Response(
        JSON.stringify({
          error: "Teléfono es requerido",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client early for email check
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // If email is provided, check if it exists in auth.users BEFORE sending SMS
    if (email) {
      console.log(`📧 Verificando si el email existe en auth.users: ${email}`);

      try {
        // Use getUserByEmail to check if user exists (more reliable than listUsers filter)
        const { data: existingUser, error: getUserError } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('email', email.toLowerCase())
          .maybeSingle();

        if (getUserError) {
          console.error("❌ Error verificando email en profiles:", getUserError);
          // Don't block on error, continue with SMS
        } else if (existingUser) {
          console.log(`⚠️ Email ya registrado en profiles: ${email}`);
          return new Response(
            JSON.stringify({
              success: false,
              error: "email_exists",
              message: "Este correo electrónico ya está registrado",
            }),
            {
              status: 409, // Conflict
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        console.log(`✅ Email disponible: ${email}`);
      } catch (emailCheckError) {
        console.error("❌ Error al verificar email:", emailCheckError);
        // Don't block on error, continue with SMS
      }
    }

    // Formatear número de teléfono (asegurar que tenga +52 para México)
    let formattedPhone = phone.replace(/\D/g, ""); // Remover caracteres no numéricos
    if (formattedPhone.length === 10) {
      formattedPhone = `+52${formattedPhone}`;
    } else if (!formattedPhone.startsWith("+")) {
      formattedPhone = `+${formattedPhone}`;
    }

    console.log(`📱 Enviando código de verificación a: ${formattedPhone}`);

    // Usar Twilio Verify API para enviar el código
    const twilioUrl = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/Verifications`;

    const formData = new URLSearchParams();
    formData.append("To", formattedPhone);
    formData.append("Channel", "sms");

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("❌ Error de Twilio Verify:", errorData);
      return new Response(
        JSON.stringify({
          error: "No se pudo enviar el código de verificación",
          details: errorData,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    console.log("✅ Código de verificación enviado:", data.sid);

    // Guardar el envío en la base de datos (using supabase client created earlier)
    const { error: dbError } = await supabase
      .from("sms_otp_codes")
      .insert({
        phone: formattedPhone,
        otp_code: null, // Twilio Verify maneja el código
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutos
        twilio_message_sid: data.sid,
        verification_status: data.status,
      });

    if (dbError) {
      console.error("⚠️ Error guardando verificación en DB:", dbError);
      // No fallar el request si no se pudo guardar en DB
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Código de verificación enviado exitosamente",
        verificationSid: data.sid,
        status: data.status,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Error general:", error);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
