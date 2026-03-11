/**
 * Shared YouTube API logic for Vercel serverless functions.
 *
 * Caches videos in-memory (persists only while the function instance is warm).
 * On cold starts it re-fetches from YouTube — takes ~1-2 s for small channels.
 */

import https from 'node:https'

// ── Config (from Vercel env vars) ─────────────────────────────────────
const API_KEY        = process.env.YOUTUBE_API_KEY || ''
const CHANNEL_HANDLE = process.env.CHANNEL_HANDLE || 'Madhwahrudayavasa'
const CACHE_TTL      = 15 * 60 * 1000 // 15 min

// ── In-memory cache (warm-instance only) ──────────────────────────────
let cache             = { videos: null, ts: 0 }
let uploadsPlaylistId = null

// ── CORS helper ───────────────────────────────────────────────────────
export function setCors(req, res) {
  const origin = req.headers.origin || ''
  const allowed = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
  ]
  // Allow any *.vercel.app preview URL + your production domain
  const isAllowed =
    allowed.includes(origin) ||
    /\.vercel\.app$/.test(origin) ||
    /^https?:\/\/madhwa/.test(origin)

  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return true // signal caller to stop
  }
  return false
}

// ── YouTube helper ────────────────────────────────────────────────────
function ytFetch(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let body = ''
        res.on('data', (chunk) => (body += chunk))
        res.on('end', () => {
          try {
            resolve(JSON.parse(body))
          } catch (e) {
            reject(new Error(`JSON parse error from YouTube: ${e.message}`))
          }
        })
      })
      .on('error', reject)
  })
}

// ── Auto-categorisation ───────────────────────────────────────────────
function autoCategory(title = '', description = '') {
  const text = (title + ' ' + description).toLowerCase()
  if (/dwaita|vedanta|siddhant|advaita|mayavad|pramana|epistemol|tattvavada/i.test(text))
    return 'Philosophy'
  if (/\bmatha\b|\bmutt\b|udupi|temple|krishna|shrine|mandir/i.test(text))
    return 'Temples'
  if (/haridasa|bhajan|\bmusic\b|\bsong\b|\bpoem\b|kanakadasa|purandaradasa|carnatic/i.test(text))
    return 'Music & Poetry'
  if (/biography|life of|madhvacharya|anandatirtha|purna prajna/i.test(text))
    return 'Biography'
  if (/ashta matha|eight mutt|history of/i.test(text))
    return 'History'
  if (/paryaya|festival|ritual|ceremony|utsava|tradition/i.test(text))
    return 'Traditions'
  if (/bhakti|devotion|prayer|worship|spiritual/i.test(text))
    return 'Spirituality'
  return 'General'
}

// ── Duration formatter (ISO 8601 → "1h 24m" / "47m") ─────────────────
function parseDuration(iso) {
  if (!iso) return ''
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return ''
  const h   = Number.parseInt(m[1] || 0)
  const min = Number.parseInt(m[2] || 0)
  const minPart = min > 0 ? ` ${min}m` : ''
  return h > 0 ? `${h}h${minPart}` : `${min}m`
}

// ── Resolve uploads playlist once ────────────────────────────────────
async function resolveUploadsPlaylist() {
  if (uploadsPlaylistId) return uploadsPlaylistId
  const url  = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&forHandle=${CHANNEL_HANDLE}&key=${API_KEY}`
  const data = await ytFetch(url)
  if (!data.items?.length) throw new Error('Channel not found — check CHANNEL_HANDLE')
  uploadsPlaylistId = data.items[0].contentDetails.relatedPlaylists.uploads
  return uploadsPlaylistId
}

// ── Main fetch — paginated ───────────────────────────────────────────
export async function fetchVideos(forceRefresh = false) {
  if (!forceRefresh && cache.videos && Date.now() - cache.ts < CACHE_TTL) {
    return cache.videos
  }

  if (!API_KEY) {
    console.warn('[yt] YOUTUBE_API_KEY not set — returning empty list')
    return []
  }

  try {
    const playlistId = await resolveUploadsPlaylist()

    // Paginate all uploads (50 per page)
    const allSnippets = []
    let pageToken

    do {
      const params = new URLSearchParams({
        part:       'snippet',
        playlistId,
        maxResults: 50,
        key:        API_KEY,
      })
      if (pageToken) params.set('pageToken', pageToken)

      const page = await ytFetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?${params}`
      )

      const items = (page.items || []).filter(
        (i) =>
          i.snippet.title !== 'Private video' &&
          i.snippet.title !== 'Deleted video'
      )
      allSnippets.push(...items)
      pageToken = page.nextPageToken
    } while (pageToken)

    if (!allSnippets.length) return []

    // Bulk-fetch durations (50 IDs per request)
    const durationMap = {}
    const allIds = allSnippets.map((i) => i.snippet.resourceId.videoId)
    for (let i = 0; i < allIds.length; i += 50) {
      const chunk   = allIds.slice(i, i + 50).join(',')
      const details = await ytFetch(
        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${chunk}&key=${API_KEY}`
      )
      for (const v of details.items || []) {
        durationMap[v.id] = parseDuration(v.contentDetails?.duration)
      }
    }

    // Build normalised video objects
    const totalCount = allSnippets.length
    const videos = allSnippets.map((item, idx) => {
      const s       = item.snippet
      const videoId = s.resourceId.videoId
      const epNum   = totalCount - idx

      const rawTitle = s.title
      const parts    = rawTitle.split(/\s*\|\s*/)
      const titleKn  = parts[0]?.trim() || rawTitle
      const titleEn  = parts.slice(1).join(' | ').trim() || rawTitle

      return {
        id:          videoId,
        videoId,
        title:       titleKn,
        titleEn,
        description: (s.description || '').slice(0, 300),
        duration:    durationMap[videoId] || '',
        episode:     `EP ${String(epNum).padStart(2, '0')}`,
        category:    autoCategory(s.title, s.description),
        publishedAt: s.publishedAt,
        thumbnail:
          s.thumbnails?.maxres?.url ||
          s.thumbnails?.high?.url ||
          s.thumbnails?.medium?.url ||
          '',
      }
    })

    cache = { videos, ts: Date.now() }
    return videos
  } catch (err) {
    console.error('[yt] YouTube fetch error:', err.message)
    return cache.videos || []
  }
}
