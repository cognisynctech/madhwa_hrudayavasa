/**
 * GET /api/videos — all videos (latest first)
 * Vercel Serverless Function
 */
import { fetchVideos, setCors } from './_lib/youtube.js'

export default async function handler(req, res) {
  if (setCors(req, res)) return // preflight handled

  try {
    const videos   = await fetchVideos()
    res.status(200).json({
      videos,
      count: videos.length,
    })
  } catch (err) {
    console.error('[api/videos]', err.message)
    res.status(500).json({ error: 'Internal server error' })
  }
}
