// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

/**
 * Quiviex Infrastructure Notification System
 * Redirects all operational feedback alerts to specific admin endpoints.
 */

const getEnv = (name: string) => (globalThis as any).Deno.env.get(name)

const RESEND_API_KEY = getEnv('RESEND_API_KEY')
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set.')

    const payload = await req.json()
    const { record, old_record, type: opType } = payload
    const activeRecord = record || old_record
    
    if (!activeRecord) throw new Error('No record found in payload.')

    const { type, username, content, admin_reply, status } = activeRecord
    
    // Explicit Admin Recipients
    const adminEmails = ['endermanlolbruh@gmail.com', 'endermanthecookie@gmail.com']

    let subject = `[QX] General Notification`
    let title = `System Alert`
    let body = `An event occurred on the Quiviex feedback system.`

    if (opType === 'INSERT') {
        subject = `[QX INTEL] NEW ${type?.toUpperCase() || 'FEEDBACK'} REPORT: @${username}`
        title = `New Intel Received`
        body = `<b>Reporter:</b> @${username}<br><b>Content:</b> "${content}"`
    } else if (opType === 'UPDATE') {
        const replyChanged = admin_reply && admin_reply !== old_record?.admin_reply
        const statusResolved = status === 'resolved' && old_record?.status !== 'resolved'
        
        if (!replyChanged && !statusResolved) {
             return new Response(JSON.stringify({ skipped: true }), { headers: corsHeaders })
        }
        
        subject = `[QX UPDATE] FEEDBACK MODIFIED: @${username}`
        title = `Case State Transition`
        body = `The feedback case for <b>@${username}</b> was updated.<br><br>
               <b>New Status:</b> ${status}<br>
               <b>Admin Reply:</b> ${admin_reply || 'None'}`
    } else if (opType === 'DELETE') {
        subject = `[QX PURGE] CASE DECOMMISSIONED: @${username}`
        title = `Case Archived`
        body = `A feedback case submitted by @${username} was purged from the active registry.`
    }

    // Send the email to the ADMINS ONLY
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Quiviex Intel <onboarding@resend.dev>',
        to: adminEmails,
        subject: subject,
        html: `
          <div style="font-family: sans-serif; background: #0f172a; padding: 40px; border-radius: 24px; color: white;">
            <div style="max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155;">
              <div style="background: #6366f1; padding: 32px; text-align: center;">
                <h1 style="margin:0; font-size: 24px; color: white;">${title}</h1>
              </div>
              <div style="padding: 32px; color: #cbd5e1;">
                <p style="font-size: 16px; line-height: 1.6;">${body}</p>
                <div style="margin-top: 32px; border-top: 1px solid #334155; padding-top: 24px; text-align: center;">
                    <a href="https://quiviex.vercel.app" style="color: #818cf8; text-decoration: none; font-weight: bold; font-size: 14px;">Open Sudo Dashboard</a>
                </div>
              </div>
            </div>
          </div>
        `
      })
    })

    if (!emailResponse.ok) {
        throw new Error(`Resend Error: ${await emailResponse.text()}`)
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