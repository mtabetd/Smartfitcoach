/**
 * daily-events — Supabase Edge Function (Deno)
 *
 * Cron: runs every day at 08:00 UTC+1 (Morocco time)
 * Schedule in Supabase Dashboard → Edge Functions → Cron:
 *   0 7 * * *   (7 UTC = 8h Morocco)
 *
 * Events handled:
 *   1. Birthday emails
 *   2. Inactivity reminders (7 days without login)
 *   3. Account anniversary emails
 *
 * Requires environment variables:
 *   RESEND_API_KEY    — API key from resend.com
 *   SUPABASE_URL      — auto-injected by Supabase
 *   SUPABASE_SERVICE_ROLE_KEY — auto-injected by Supabase
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const FROM_EMAIL = 'SmartFitCoach <noreply@smartfitcoach.app>'

interface EmailPayload {
  from: string
  to: string
  subject: string
  html: string
}

async function sendEmail(payload: EmailPayload): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn('[daily-events] RESEND_API_KEY not set, skipping email')
    return false
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.text()
      console.error('[daily-events] Resend error:', err)
      return false
    }
    return true
  } catch (e) {
    console.error('[daily-events] Email send failed:', e)
    return false
  }
}

function emailTemplate(title: string, body: string, ctaText?: string, ctaUrl?: string): string {
  const cta = ctaText && ctaUrl
    ? `<a href="${ctaUrl}" style="display:inline-block;background:#0A0A09;color:#FAF9F6;text-decoration:none;padding:14px 32px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin-top:20px">${ctaText}</a>`
    : ''
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAF9F6;font-family:'Helvetica Neue',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF9F6;padding:40px 20px">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #D8D8D0">
<tr><td style="padding:32px 40px;text-align:center;border-bottom:1px solid #D8D8D0">
  <div style="font-family:Georgia,serif;font-size:11px;letter-spacing:8px;text-transform:uppercase;color:#0A0A09">SMARTFITCOACH</div>
</td></tr>
<tr><td style="padding:40px 40px 20px;text-align:center">
  <h1 style="font-family:Georgia,serif;font-size:24px;color:#0A0A09;margin:0 0 16px">${title}</h1>
  <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#333;line-height:1.6">${body}</div>
  ${cta}
</td></tr>
<tr><td style="padding:24px 40px;text-align:center;border-top:1px solid #D8D8D0">
  <div style="font-size:10px;color:#999;line-height:1.5">
    Vous recevez cet email car vous \u00eates inscrit(e) sur SmartFitCoach.<br>
    <a href="https://smartfitcoach.app/unsubscribe" style="color:#999">Se d\u00e9sinscrire</a>
  </div>
</td></tr>
</table>
</td></tr></table>
</body></html>`
}

Deno.serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const month = now.getMonth() + 1
    const day = now.getDate()

    const results = { birthdays: 0, inactivity: 0, anniversaries: 0, errors: 0 }

    // ═══ 1. BIRTHDAY EMAILS ═══
    const { data: birthdayUsers, error: bdErr } = await supabase
      .from('profiles')
      .select('id, email, name, birth_date, data')
      .eq('email_optin', true)
      .not('birth_date', 'is', null)
      .not('email', 'is', null)

    if (bdErr) {
      console.error('[daily-events] Birthday query error:', bdErr.message)
      results.errors++
    } else if (birthdayUsers) {
      for (const u of birthdayUsers) {
        if (!u.birth_date || !u.email) continue
        const bd = new Date(u.birth_date)
        if (bd.getMonth() + 1 !== month || bd.getDate() !== day) continue

        const age = now.getFullYear() - bd.getFullYear()
        const firstName = (u.name || '').split(' ')[0] || 'Champion'

        const sent = await sendEmail({
          from: FROM_EMAIL,
          to: u.email,
          subject: `\uD83C\uDF82 Joyeux anniversaire ${firstName} !`,
          html: emailTemplate(
            `\uD83C\uDF82 Joyeux anniversaire !`,
            `<p>Cher(e) <strong>${firstName}</strong>,</p>
             <p>Toute l'\u00e9quipe SmartFitCoach vous souhaite un merveilleux <strong>${age}\u00e8me anniversaire</strong> !</p>
             <p>Continuez \u00e0 prendre soin de vous — votre corps vous remerciera. \uD83D\uDCAA</p>`,
            'Ouvrir SmartFitCoach',
            'https://smartfitcoach.app'
          ),
        })
        if (sent) results.birthdays++
        else results.errors++
      }
    }

    // ═══ 2. INACTIVITY REMINDERS (7+ days without sync) ═══
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: inactiveUsers, error: inErr } = await supabase
      .from('profiles')
      .select('id, email, name, updated_at')
      .eq('email_optin', true)
      .not('email', 'is', null)
      .lt('updated_at', sevenDaysAgo)

    if (inErr) {
      console.error('[daily-events] Inactivity query error:', inErr.message)
      results.errors++
    } else if (inactiveUsers) {
      // Only send once per week: check if updated_at is between 7-8 days ago
      const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString()
      for (const u of inactiveUsers) {
        if (!u.email || !u.updated_at) continue
        // Only trigger on exactly 7 days inactive (not every day after)
        if (u.updated_at < eightDaysAgo) continue

        const firstName = (u.name || '').split(' ')[0] || ''
        const greeting = firstName ? `${firstName}, vous` : 'Vous'

        const sent = await sendEmail({
          from: FROM_EMAIL,
          to: u.email,
          subject: `${greeting} nous manquez ! \uD83D\uDCAA`,
          html: emailTemplate(
            'Votre programme vous attend',
            `<p>${greeting} n'avez pas ouvert SmartFitCoach depuis 7 jours.</p>
             <p>Votre programme sportif et nutritionnel est toujours l\u00e0, pr\u00eat \u00e0 reprendre exactement o\u00f9 vous en \u00e9tiez.</p>
             <p>Chaque jour compte dans votre progression \u2014 m\u00eame une courte s\u00e9ance fait la diff\u00e9rence !</p>`,
            'Reprendre mon programme',
            'https://smartfitcoach.app'
          ),
        })
        if (sent) results.inactivity++
        else results.errors++
      }
    }

    // ═══ 3. ACCOUNT ANNIVERSARY (1 year since created_at) ═══
    // Check auth.users for created_at matching today's month/day (minus 1+ years)
    const { data: allUsers, error: auErr } = await supabase.auth.admin.listUsers()

    if (auErr) {
      console.error('[daily-events] Anniversary query error:', auErr.message)
      results.errors++
    } else if (allUsers && allUsers.users) {
      for (const u of allUsers.users) {
        if (!u.created_at || !u.email) continue
        const created = new Date(u.created_at)
        if (created.getMonth() + 1 !== month || created.getDate() !== day) continue
        // Must be at least 1 year old
        const years = now.getFullYear() - created.getFullYear()
        if (years < 1) continue

        // Check email_optin from profiles
        const { data: prof } = await supabase
          .from('profiles')
          .select('email_optin, name')
          .eq('id', u.id)
          .single()

        if (!prof || prof.email_optin === false) continue

        const firstName = ((prof.name || u.user_metadata?.name || '') as string).split(' ')[0] || 'Champion'

        const sent = await sendEmail({
          from: FROM_EMAIL,
          to: u.email,
          subject: `\uD83C\uDF89 ${years} an${years > 1 ? 's' : ''} avec SmartFitCoach !`,
          html: emailTemplate(
            `\uD83C\uDF89 ${years} an${years > 1 ? 's' : ''} ensemble !`,
            `<p>Cher(e) <strong>${firstName}</strong>,</p>
             <p>Il y a exactement <strong>${years} an${years > 1 ? 's' : ''}</strong> que vous avez rejoint SmartFitCoach.</p>
             <p>Merci pour votre confiance et votre engagement envers votre sant\u00e9. Continuez comme \u00e7a ! \uD83D\uDE80</p>`,
            'Voir ma progression',
            'https://smartfitcoach.app'
          ),
        })
        if (sent) results.anniversaries++
        else results.errors++
      }
    }

    console.log('[daily-events] Results:', JSON.stringify(results))

    return new Response(JSON.stringify({
      ok: true,
      date: today,
      ...results,
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    console.error('[daily-events] Fatal error:', err)
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
