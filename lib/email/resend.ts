/**
 * Resend Email Client
 * Reemplaza nodemailer/Gmail con Resend para producción
 */

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Si no tienes dominio verificado en Resend, usa 'onboarding@resend.dev'
// Una vez verificado tikin.is en Resend, cambia a 'Tikin <noreply@tikin.is>'
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Tikin <noreply@update.tikin.is>'

/**
 * Enviar invitación a comercial
 */
export async function sendComercialInvitation(params: {
  to: string
  full_name: string
  invitationId: string
}) {
  const { to, full_name, invitationId } = params

  if (!process.env.RESEND_API_KEY) {
    return { success: true, warning: 'Email no configurado (RESEND_API_KEY missing)' }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const invitationUrl = `${appUrl}/auth/accept-invitation?token=${invitationId}`

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Invitación a Tikin - Simulador de Bonos',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
              .button { display: inline-block; background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Bienvenido a Tikin</h1>
              </div>
              <div class="content">
                <p>Hola <strong>${full_name}</strong>,</p>

                <p>Has sido invitado a unirte al equipo de Tikin como Comercial en nuestro Simulador de Bonos Parafiscales.</p>

                <p>Con esta herramienta podrás:</p>
                <ul>
                  <li>Crear cotizaciones profesionales para clientes</li>
                  <li>Calcular ahorros en parafiscales</li>
                  <li>Generar reportes y seguimiento</li>
                </ul>

                <p style="text-align: center;">
                  <a href="${invitationUrl}" class="button">Aceptar Invitación</a>
                </p>

                <p style="color: #6b7280; font-size: 14px;">
                  Esta invitación expira en 7 días. Si no fuiste tú quien solicitó esta invitación, puedes ignorar este correo.
                </p>

                <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                  Si el botón no funciona, copia y pega esta URL en tu navegador:<br>
                  <a href="${invitationUrl}" style="color: #DC2626;">${invitationUrl}</a>
                </p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Tikin. Todos los derechos reservados.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error('[Resend] Error sending email:', error)
      return { success: false, error: error.message }
    }

    console.log('[Resend] Email sent successfully:', data?.id)
    return { success: true, messageId: data?.id }
  } catch (error: any) {
    console.error('[Resend] Exception sending email:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Enviar Magic Link para login
 */
export async function sendMagicLinkEmail(params: {
  to: string
  full_name: string
  loginToken: string
}) {
  const { to, full_name, loginToken } = params

  if (!process.env.RESEND_API_KEY) {
    return { success: true, warning: 'Email no configurado (RESEND_API_KEY missing)' }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const magicLinkUrl = `${appUrl}/auth/magic-login?token=${loginToken}`

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Tu link de acceso a Tikin',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
              .button { display: inline-block; background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Acceso a Tikin</h1>
              </div>
              <div class="content">
                <p>Hola <strong>${full_name}</strong>,</p>

                <p>Haz clic en el botón de abajo para acceder a tu cuenta de Tikin:</p>

                <p style="text-align: center;">
                  <a href="${magicLinkUrl}" class="button">Ingresar a Tikin</a>
                </p>

                <p style="color: #6b7280; font-size: 14px;">
                  Este link expira en 15 minutos. Si no solicitaste este acceso, puedes ignorar este correo.
                </p>

                <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                  Si el botón no funciona, copia y pega esta URL en tu navegador:<br>
                  <a href="${magicLinkUrl}" style="color: #DC2626;">${magicLinkUrl}</a>
                </p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Tikin. Todos los derechos reservados.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error('[Resend] Error sending email:', error)
      return { success: false, error: error.message }
    }

    console.log('[Resend] Email sent successfully:', data?.id)
    return { success: true, messageId: data?.id }
  } catch (error: any) {
    console.error('[Resend] Exception sending email:', error)
    return { success: false, error: error.message }
  }
}
