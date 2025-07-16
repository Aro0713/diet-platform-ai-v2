// pages/api/send-access-request-email.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { to, subject, text } = req.body

  if (!to || !subject || !text) {
    return res.status(400).json({ error: 'Missing fields' })
  }

  try {
    const result = await resend.emails.send({
      from: 'DCP <no-reply@dcp.care>',
      to: [to],
      subject,
      text
    })

    return res.status(200).json({ success: true, result })
  } catch (error: any) {
    return res.status(500).json({ error: 'Email sending failed', details: error.message })
  }
}
