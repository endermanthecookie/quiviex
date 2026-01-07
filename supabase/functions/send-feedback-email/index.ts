
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Quiviex Master Feedback Processor
 * Hardened for reliability and deliverability.
 */

const getEnv = (name: string) => (globalThis as any).Deno.env.get(name)

const RESEND_API_KEY = getEnv('RESEND_API_KEY')
const SUPABASE_URL = getEnv('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set in Supabase secrets.')

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
    const payload = await req.json()
    
    const { record, old_record, type: opType } = payload
    const activeRecord = record || old_record
    
    if (!activeRecord) throw new Error('No record found in payload.')

    const { id, type, username, content, user_id, admin_reply, status } = activeRecord
    
    // Explicitly target your gmail accounts
    const adminEmails = ['endermanlolbruh@gmail.com', 'endermanthecookie@gmail.com']

    // 1. OPERATION: INSERT (New Feedback) - ALERT ADMINS
    if (opType === 'INSERT') {
      const typeLabel = (type || 'Feedback').charAt(0).toUpperCase() + (type || 'Feedback').slice(1)
      const typeColor = type === 'bug' ? '#ef4444' : '#3b82f6'

      console.log(`Processing INSERT from ${username}. Sending to ${adminEmails.join(', ')}`);

      const emailResponse = await sendEmail({
        to: adminEmails,
        subject: `[QX INTEL] NEW ${typeLabel.toUpperCase()} REPORT: @${username}`,
        html: `
          <div style="font-family: sans-serif; background: #f8fafc; padding: 40px; border-radius: 24px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
              <div style="background: #0f172a; padding: 32px; text-align: center; color: white;">
                <h1 style="margin:0; font-size: 24px; letter-spacing: -0.02em;">Intel Received</h1>
                <p style="opacity: 0.6; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-top: 8px;">Quiviex Ecosystem Alert</p>
              </div>
              <div style="padding: 32px;">
                <div style="margin-bottom: 24px;">
                  <span style="background: ${typeColor}; color: white; padding: 6px 16px; border-radius: 100px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em;">${typeLabel}</span>
                </div>
                <div style="background: #f1f5f9; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
                    <p style="font-size: 18px; color: #1e293b; line-height: 1.6; margin: 0; font-weight: 500;">"${content}"</p>
                </div>
                <div style="border-top: 1px solid #f1f5f9; padding-top: 24px;">
                    <p style="font-size: 14px; color: #64748b; margin-bottom: 4px;">Reporter: <strong style="color: #0f172a;">@${username}</strong></p>
                    <p style="font-size: 12px; color: #94a3b8; font-family: monospace;">UUID: ${user_id}</p>
                </div>
                <div style="margin-top: 32px; text-align: center;">
                    <a href="https://quiviex.vercel.app" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 14px;">Open Dashboard</a>
                </div>
              </div>
            </div>
          </div>
        `
      })
      
      if (!emailResponse.ok) {
        const errorText = await emailResponse.text()
        console.error(`Resend API Error during INSERT: ${errorText}`);
        throw new Error(`Resend API Error: ${errorText}`)
      }
      console.log("Admin alert sent successfully.");
    }

    // 2. OPERATION: UPDATE or DELETE (Notify User)
    if (opType === 'UPDATE' || opType === 'DELETE') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('user_id', user_id)
        .single()

      if (profile?.email) {
        let subject = `Update on your Quiviex Feedback`
        let bodyTitle = `We've processed your feedback`
        let bodyContent = `Hello @${username},<br><br>We wanted to let you know that your recent feedback has been reviewed by the Quiviex team.`
        
        let shouldSend = false;

        if (opType === 'DELETE') {
          subject = `Feedback Case Closed: #${id.slice(0, 8)}`
          bodyTitle = `Feedback Processed`
          bodyContent += `<br><br>This case has been successfully resolved and archived. Thank you for helping us improve!`
          shouldSend = true;
        } else if (admin_reply && admin_reply !== old_record?.admin_reply) {
          subject = `New Reply from Quiviex Sudo`
          bodyTitle = `Sudo User Responded`
          bodyContent += `<br><br><div style="background: #f1f5f9; padding: 20px; border-radius: 12px; font-style: italic; border-left: 4px solid #6366f1;">"${admin_reply}"</div>`
          shouldSend = true;
        } else if (status === 'resolved' && old_record?.status !== 'resolved') {
          subject = `Success! Your feedback was implemented`
          bodyTitle = `Case Resolved`
          bodyContent += `<br><br>Great news! Your suggestion or bug report has been officially marked as <strong>Resolved</strong>.`
          shouldSend = true;
        }

        if (shouldSend) {
          console.log(`Sending update to user: ${profile.email}`);
          const userMailResponse = await sendEmail({
            to: [profile.email],
            subject: subject,
            html: `
              <div style="font-family: sans-serif; background: #f4f7fa; padding: 40px;">
                <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                  <div style="background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); padding: 40px; text-align: center; color: white;">
                    <h1 style="margin:0; font-size: 28px; font-weight: 900;">${bodyTitle}</h1>
                  </div>
                  <div style="padding: 40px; color: #1e293b; line-height: 1.6;">
                    ${bodyContent}
                    <div style="margin-top: 40px; text-align: center;">
                      <a href="https://quiviex.vercel.app" style="background: #0f172a; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px;">Return to Quiviex</a>
                    </div>
                  </div>
                </div>
              </div>
            `
          })
          if (!userMailResponse.ok) {
            console.error(`Resend API Error during user notification: ${await userMailResponse.text()}`);
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error("Function Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

async function sendEmail({ to, subject, html }: { to: string[], subject: string, html: string }) {
  // Free tier Resend limit: Can only send to the email address associated with the account 
  // unless you use a verified domain. Ensure 'to' addresses are what you expect.
  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'Quiviex System <onboarding@resend.dev>',
      to: to,
      subject: subject,
      html: html,
    }),
  })
}
