import nodemailer from 'nodemailer'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { type, title, message, category, email, name } = req.body || {}
  if (!type || !title?.trim() || !message?.trim()) {
    return res.status(400).json({ error: 'Missing required fields.' })
  }

  const ownerEmail = process.env.FEEDBACK_EMAIL
  const ownerPass  = process.env.FEEDBACK_EMAIL_PASSWORD
  if (!ownerEmail || !ownerPass) {
    console.error('FEEDBACK_EMAIL or FEEDBACK_EMAIL_PASSWORD not set')
    return res.status(500).json({ error: 'Email not configured.' })
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: ownerEmail, pass: ownerPass },
  })

  const typeLabel    = type === 'feature_request' ? 'Feature Request' : 'Support'
  const categoryLine = category ? `\nCategory: ${category}` : ''
  const fromLine     = email ? `\nFrom: ${name ? `${name} <${email}>` : email}` : name ? `\nFrom: ${name}` : ''

  try {
    await transporter.sendMail({
      from:    `"YOW Feedback" <${ownerEmail}>`,
      to:      ownerEmail,
      replyTo: email || ownerEmail,
      subject: `[YOW ${typeLabel}] ${title.trim()}`,
      text: `Type: ${typeLabel}${categoryLine}${fromLine}\n\n${title.trim()}\n\n${message.trim()}`,
    })
  } catch (err) {
    console.error('nodemailer error:', err)
    return res.status(500).json({ error: `Failed to send email: ${err.message}` })
  }

  return res.status(200).json({ ok: true })
}
