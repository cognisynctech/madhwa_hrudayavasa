/**
 * GET /api/videos/featured — single latest video
 * Vercel Serverless Function
 */
import { fetchVideos, setCors } from '../_lib/youtube.js'

export default async function handler(req, res) {
  if (setCors(req, res)) return

  try {
    const videos = await fetchVideos()
    res.status(200).json(videos[0] ?? null)
  } catch (err) {
    console.error('[api/featured]', err.message)
    res.status(500).json({ error: 'Internal server error' })
  }
}
