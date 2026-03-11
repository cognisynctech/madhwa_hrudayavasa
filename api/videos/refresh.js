/**
 * GET /api/videos/refresh — force cache bust
 * Vercel Serverless Function
 */
import { fetchVideos, setCors } from '../_lib/youtube.js'

export default async function handler(req, res) {
  if (setCors(req, res)) return

  try {
    const videos = await fetchVideos(true)
    res.status(200).json({ ok: true, count: videos.length })
  } catch (err) {
    console.error('[api/refresh]', err.message)
    res.status(500).json({ error: 'Internal server error' })
  }
}
