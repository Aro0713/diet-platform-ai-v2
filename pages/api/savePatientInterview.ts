import type { NextApiRequest, NextApiResponse } from 'next'

type RequestData = {
  interview: string
  recommendations?: string
}

type ResponseData = {
  success: boolean
  data?: {
    interview: string
    recommendations?: string
    summary: string
  }
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' })
  }

try {
  const { interview, recommendations }: RequestData = req.body

  if (!interview || typeof interview !== 'string') {
    return res.status(400).json({ success: false, error: 'Missing or invalid "interview" field' })
  }

  const summary = `🔎 Analiza wywiadu: ${interview.slice(0, 100)}...` +
                  (recommendations ? `\n🩺 Zalecenia lekarza: ${recommendations}` : '')

  return res.status(200).json({
    success: true,
    data: {
      interview,
      recommendations,
      summary
    }
  })
} catch (error: any) {
  return res.status(500).json({ success: false, error: error.message || 'Unexpected error' })
}
}
