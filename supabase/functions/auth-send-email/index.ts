import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const SUPABASE_URL = 'https://pemgwyymodlwabaexxrb.supabase.co';

interface AuthEmailPayload {
  user: {
    id: string;
    email: string;
    user_metadata?: {
      first_name?: string;
      name?: string;
    };
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
    token_new?: string;
    token_hash_new?: string;
  };
}

const subjects: Record<string, string> = {
  signup: 'Tu código de verificación - TREFA',
  recovery: 'Recupera tu contraseña - TREFA',
  invite: 'Has sido invitado a TREFA',
  magiclink: 'Tu código de acceso - TREFA',
  email: 'Tu código de acceso - TREFA',
  email_change: 'Confirma el cambio de correo - TREFA',
  reauthentication: 'Confirma tu identidad - TREFA',
};

const getEmailTemplate = (token: string, confirmationUrl: string, userName: string): string => {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Tu Código de Acceso</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; }
  </style>
</head>
<body style="margin: 0; padding: 20px; background-color: #f3f4f6;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; max-width: 600px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <!-- Header -->
          <tr>
            <td align="left" style="padding: 20px 15px;">
              <img src="https://autos.trefa.mx/images/trefalogo.png" alt="TREFA Logo" style="height: 20px; width: auto;">
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 20px 30px;">
              <h3 style="font-size: 20px; color: #1f2937; margin-top: 0; font-weight: bold;">Tu código de acceso</h3>
              <p style="color: #374151; line-height: 1.6;">Hola${userName ? ` ${userName}` : ''}, para iniciar sesión de forma segura en el portal de financiamiento, usa el siguiente código:</p>
            </td>
          </tr>
          <!-- OTP Block -->
          <tr>
            <td align="center" style="padding: 20px 30px 30px;">
              <p style="font-size: 18px; font-weight: bold; color: #1f2937; margin: 0;">
                Tu código de acceso es:
              </p>
              <p style="font-size: 28px; font-weight: bold; letter-spacing: 3px; color: #FF6801; margin: 16px 0;">
                ${token}
              </p>
              <p style="color: #4b5563; font-size: 12px; margin: 0;">
                Este código expirará pronto. Úsalo para iniciar sesión en el portal de financiamiento.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <p style="color: #4b5563; font-size: 12px; line-height: 1.6;">Este enlace es de un solo uso y expirará pronto. Si tienes problemas con el código, copia y pega manualmente esta URL en tu navegador:<br><a href="${confirmationUrl}" style="color: #FF6801; text-decoration: none; word-break: break-all;">${confirmationUrl}</a></p>
              <p style="color: #4b5563; font-size: 12px; line-height: 1.6;">Si no solicitaste este acceso, puedes ignorar este correo de forma segura.</p>
            </td>
          </tr>
          <!-- Signature -->
          <tr>
            <td style="padding: 20px 40px; border-top: 1px solid #e5e7eb;">
              <p style="color: #374151; margin: 0;">Gracias,</p>
              <p style="color: #1f2937; font-weight: bold; margin: 0;">El equipo de TREFA</p>
              <img src="https://autos.trefa.mx/images/trefalogo.png" alt="TREFA Logo" style="height: 24px; width: auto; margin-top: 16px;">
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Meta info -->
    <tr>
      <td align="center" style="padding: 20px 0;">
        <p style="font-size: 12px; color: #6b7280;">TREFA.mx | Aarón Sáenz Garza 1902, Monterrey, NL</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

serve(async (req) => {
  console.log('=== Auth Send Email Hook v10 ===');
  console.log('Method:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const payload = await req.text();
    console.log('Payload received, length:', payload.length);
    
    // Parse the payload directly (skip signature verification for now)
    const data = JSON.parse(payload) as AuthEmailPayload;
    console.log('Parsed successfully');
    console.log('User email:', data.user?.email);
    console.log('Action type:', data.email_data?.email_action_type);
    console.log('Has token:', !!data.email_data?.token);
    
    const { user, email_data } = data;

    if (!user?.email || !email_data?.token) {
      console.error('Missing required fields');
      return new Response(JSON.stringify({ error: { http_code: 400, message: 'Missing user email or token' } }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userName = user.user_metadata?.first_name || user.user_metadata?.name || '';
    const confirmationUrl = `${SUPABASE_URL}/auth/v1/verify?token=${email_data.token_hash}&type=${email_data.email_action_type}&redirect_to=${encodeURIComponent(email_data.redirect_to || 'https://autostrefa.mx')}`;
    
    const htmlContent = getEmailTemplate(email_data.token, confirmationUrl, userName);
    const subject = subjects[email_data.email_action_type] || 'Tu código de acceso - TREFA';

    console.log('Sending email via Brevo...');
    console.log('To:', user.email);
    console.log('Subject:', subject);
    console.log('BREVO_API_KEY exists:', !!BREVO_API_KEY);

    if (!BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY not configured');
    }

    const brevoResponse = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'TREFA', email: 'hola@autostrefa.mx' },
        to: [{ email: user.email }],
        subject: subject,
        htmlContent: htmlContent,
      }),
    });

    const brevoText = await brevoResponse.text();
    console.log('Brevo response status:', brevoResponse.status);
    console.log('Brevo response:', brevoText);

    if (!brevoResponse.ok) {
      throw new Error(`Brevo error: ${brevoResponse.status} - ${brevoText}`);
    }

    console.log('Email sent successfully!');
    
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('ERROR:', errorMessage);
    
    return new Response(
      JSON.stringify({ error: { http_code: 500, message: errorMessage } }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
