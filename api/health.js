/**
 * GET /api/health — health check
 * Vercel Serverless Function
 */
import { setCors } from './_lib/youtube.js'

export default function handler(req, res) {
  if (setCors(req, res)) return
  res.status(200).json({ ok: true })
}
