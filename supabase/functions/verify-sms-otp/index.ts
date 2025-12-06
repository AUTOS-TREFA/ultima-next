import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_VERIFY_SERVICE_SID = Deno.env.get("TWILIO_VERIFY_SERVICE_SID") || "VA6d44c2df0a37c44bcc5f087b3868e12d";

interface RequestBody {
  phone: string;
  code: string;
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
    const { phone, code }: RequestBody = await req.json();

    // Validar entrada
    if (!phone || !code) {
      return new Response(
        JSON.stringify({
          error: "Teléfono y código son requeridos",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Formatear número de teléfono (asegurar que tenga +52 para México)
    let formattedPhone = phone.replace(/\D/g, ""); // Remover caracteres no numéricos
    if (formattedPhone.length === 10) {
      formattedPhone = `+52${formattedPhone}`;
    } else if (!formattedPhone.startsWith("+")) {
      formattedPhone = `+${formattedPhone}`;
    }

    console.log(`🔐 Verificando código para: ${formattedPhone}`);

    // Usar Twilio Verify API para verificar el código
    const twilioUrl = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`;

    const formData = new URLSearchParams();
    formData.append("To", formattedPhone);
    formData.append("Code", code);

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
          error: "Error al verificar el código",
          details: errorData,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    console.log("✅ Verificación completada:", data.status);

    // Verificar si el código es válido y proporcionar mensajes específicos
    if (data.status !== "approved") {
      let errorMessage = "Código inválido o expirado";

      // Proporcionar mensajes más específicos basados en el estado de Twilio
      switch (data.status) {
        case "pending":
          errorMessage = "Código pendiente de verificación. Por favor intenta nuevamente.";
          break;
        case "canceled":
          errorMessage = "La verificación fue cancelada. Por favor solicita un nuevo código.";
          break;
        case "max_attempts_reached":
          errorMessage = "Has alcanzado el número máximo de intentos. Por favor solicita un nuevo código.";
          break;
        case "expired":
          errorMessage = "El código ha expirado. Por favor solicita un nuevo código.";
          break;
        case "failed":
        default:
          // Check if it's specifically an incorrect code
          if (data.valid === false) {
            errorMessage = "El código ingresado es incorrecto. Por favor verifica e intenta de nuevo.";
          } else {
            errorMessage = "Código inválido o expirado. Por favor solicita un nuevo código.";
          }
          break;
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          status: data.status,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Código verificado exitosamente",
        status: data.status,
        valid: data.valid,
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
