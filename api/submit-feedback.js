// Vercel serverless function — receives feedback/support submissions and
// forwards them to the owner's email via nodemailer + Gmail.
// Set FEEDBACK_EMAIL and FEEDBACK_EMAIL_PASSWORD in Vercel env vars.

import nodemailer from 'nodemailer'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { type, title, message, category, email, name } = req.body || {}

  if (!type || !title?.trim() || !message?.trim()) {
    return res.status(400).json({ error: 'Missing required fields.' })
  }

  const ownerEmail    = process.env.FEEDBACK_EMAIL
  const ownerPassword = process.env.FEEDBACK_EMAIL_PASSWORD

  if (!ownerEmail || !ownerPassword) {
    console.error('FEEDBACK_EMAIL or FEEDBACK_EMAIL_PASSWORD not set')
    return res.status(500).json({ error: 'Email not configured on server.' })
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: ownerEmail, pass: ownerPassword },
  })

  const typeLabel     = type === 'feature_request' ? 'Feature Request' : 'Support Message'
  const categoryLine  = category ? `\nCategory: ${category}` : ''
  const fromLine      = email ? `\nFrom: ${name ? `${name} <${email}>` : email}` : name ? `\nFrom: ${name}` : ''
  const replyTo       = email || ownerEmail

  await transporter.sendMail({
    from:    `"YOW Feedback" <${ownerEmail}>`,
    to:      ownerEmail,
    replyTo,
    subject: `[YOW ${typeLabel}] ${title.trim()}`,
    text: [
      `Type: ${typeLabel}${categoryLine}${fromLine}`,
      '',
      title.trim(),
      '',
      message.trim(),
    ].join('\n'),
  })

  return res.status(200).json({ ok: true })
}
