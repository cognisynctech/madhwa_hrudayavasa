/**
 * Madhwa Hrudaya Vaasa — Video Backend Server
 *
 * Fetches the latest videos from the YouTube channel, auto-classifies
 * them into categories, and serves them via a simple REST API.
 *
 * Usage:
 *   cd server && npm install && npm run dev
 *
 * Required: YOUTUBE_API_KEY in server/.env
 *   Get a key at https://console.cloud.google.com/
 *   Enable "YouTube Data API v3"
 */

require('dotenv').config({ path: require('node:path').join(__dirname, '.env') })
const express    = require('express')
const cors       = require('cors')
const helmet     = require('helmet')
const rateLimit  = require('express-rate-limit')
const https      = require('node:https')

const app  = express()
const PORT = process.env.PORT || 3001

// ── Security headers (helmet) ─────────────────────────────────────────
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc:  ["'self'"],
            scriptSrc:   ["'self'"],
            styleSrc:    ["'self'", "'unsafe-inline'"],
            imgSrc:      ["'self'", 'data:', 'https://i.ytimg.com', 'https://*.ytimg.com'],
            mediaSrc:    ["'self'", 'blob:'],
            connectSrc:  ["'self'", 'https://www.googleapis.com'],
            fontSrc:     ["'self'"],
            objectSrc:   ["'none'"],
            frameSrc:    ["'none'"],
            baseUri:     ["'self'"],
            formAction:  ["'self'"],
        },
    },
    crossOriginEmbedderPolicy: false,   // needed for cross-origin images (YouTube thumbnails)
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

// ── Rate limiting — prevent API abuse ─────────────────────────────────
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,       // 15-minute window
    max: 100,                        // max 100 requests per window per IP
    standardHeaders: true,           // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
})
app.use('/api/', apiLimiter)

// Stricter limit for the refresh endpoint (cache bust)
const refreshLimiter = rateLimit({
    windowMs: 60 * 1000,             // 1-minute window
    max: 3,                          // max 3 refreshes per minute
    message: { error: 'Refresh rate limited. Try again in a minute.' },
})
app.use('/api/videos/refresh', refreshLimiter)

// ── CORS — restrict origins ───────────────────────────────────────────
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        /\.vercel\.app$/,               // Vercel preview deployments
        /^https?:\/\/madhwa/,           // any madhwa* production domain
    ],
    methods: ['GET'],                   // only GET needed — no POST/PUT/DELETE
    allowedHeaders: ['Content-Type'],
}))

// ── Body parsing with size limit ──────────────────────────────────────
app.use(express.json({ limit: '1kb' }))  // tiny limit — API only receives GET requests

// ── Disable X-Powered-By (also done by helmet, but explicit) ─────────
app.disable('x-powered-by')

// ── Config ────────────────────────────────────────────────────────────
const API_KEY       = process.env.YOUTUBE_API_KEY || ''
const CHANNEL_HANDLE = process.env.CHANNEL_HANDLE || 'Madhwahrudayavasa'
const CACHE_TTL     = 15 * 60 * 1000   // refresh cache every 15 min

// ── In-memory cache ───────────────────────────────────────────────────
let cache            = { videos: null, ts: 0 }
let uploadsPlaylistId = null

// ── YouTube helper ────────────────────────────────────────────────────
function ytFetch(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let body = ''
            res.on('data', chunk => (body += chunk))
            res.on('end', () => {
                try { resolve(JSON.parse(body)) }
                catch (e) { reject(new Error(`JSON parse error from YouTube: ${e.message}`)) }
            })
        }).on('error', reject)
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
    console.log(`[yt] Uploads playlist: ${uploadsPlaylistId}`)
    return uploadsPlaylistId
}

// ── Main fetch logic — paginated through entire catalog ──────────────
async function fetchVideos(forceRefresh = false) {
    if (!forceRefresh && cache.videos && Date.now() - cache.ts < CACHE_TTL) {
        return cache.videos
    }

    if (!API_KEY) {
        console.warn('[server] ⚠  YOUTUBE_API_KEY not set — returning empty list')
        return []
    }

    try {
        const playlistId = await resolveUploadsPlaylist()

        // ── Step 1: Paginate through ALL uploads (50 per page, loop nextPageToken) ──
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
                i => i.snippet.title !== 'Private video' && i.snippet.title !== 'Deleted video'
            )
            allSnippets.push(...items)

            pageToken = page.nextPageToken   // undefined when on last page
            if (pageToken) console.log(`[yt] Paginating… ${allSnippets.length} videos so far`)
        } while (pageToken)

        if (!allSnippets.length) return []
        console.log(`[yt] Total videos in catalog: ${allSnippets.length}`)

        // ── Step 2: Bulk-fetch durations (max 50 IDs per request — two-step requirement) ──
        const durationMap = {}

        // Chunk IDs into groups of 50 (API limit for videos?part=contentDetails)
        const allIds = allSnippets.map(i => i.snippet.resourceId.videoId)
        for (let i = 0; i < allIds.length; i += 50) {
            const chunk   = allIds.slice(i, i + 50).join(',')
            const details = await ytFetch(
                `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${chunk}&key=${API_KEY}`
            )
            for (const v of details.items || []) {
                durationMap[v.id] = parseDuration(v.contentDetails?.duration)
            }
        }

        // ── Step 3: Build normalised video objects ──────────────────────────────
        const totalCount = allSnippets.length
        const videos = allSnippets.map((item, idx) => {
            const s       = item.snippet
            const videoId = s.resourceId.videoId
            const epNum   = totalCount - idx   // latest = highest ep number

            // Many titles follow: "ಕನ್ನಡ ಶೀರ್ಷಿಕೆ | English Title | Subtitle"
            // Split on | so the hero shows clean distinct Kannada vs English text
            const rawTitle = s.title
            const parts    = rawTitle.split(/\s*\|\s*/)
            const titleKn  = parts[0]?.trim() || rawTitle          // Kannada (first segment)
            const titleEn  = parts.slice(1).join(' | ').trim() || rawTitle  // English remainder

            return {
                id:          videoId,
                videoId,
                title:       titleKn,
                titleEn:     titleEn,
                description: (s.description || '').slice(0, 300),
                duration:    durationMap[videoId] || '',
                episode:     `EP ${String(epNum).padStart(2, '0')}`,
                category:    autoCategory(s.title, s.description),
                publishedAt: s.publishedAt,
                thumbnail:   s.thumbnails?.maxres?.url
                          || s.thumbnails?.high?.url
                          || s.thumbnails?.medium?.url
                          || '',
            }
        })

        cache = { videos, ts: Date.now() }
        console.log(`[yt] Cached ${videos.length} videos (${new Date().toLocaleTimeString()})`)
        return videos
    } catch (err) {
        console.error('[server] YouTube fetch error:', err.message)
        // Return stale cache rather than empty if available
        return cache.videos || []
    }
}

// ── Routes ────────────────────────────────────────────────────────────

/** GET /api/videos — all videos (latest first) */
app.get('/api/videos', async (_req, res) => {
    try {
        const videos = await fetchVideos()
        res.json({
            videos,
            count:  videos.length,
            cached: cache.ts > 0,
            cacheAge: cache.ts ? Math.round((Date.now() - cache.ts) / 1000) + 's' : null,
        })
    } catch (err) {
        console.error('[api/videos]', err.message)
        res.status(500).json({ error: 'Internal server error' })
    }
})

/** GET /api/videos/featured — single latest video */
app.get('/api/videos/featured', async (_req, res) => {
    try {
        const videos = await fetchVideos()
        res.json(videos[0] ?? null)
    } catch (err) {
        console.error('[api/featured]', err.message)
        res.status(500).json({ error: 'Internal server error' })
    }
})

/** GET /api/videos/refresh — force a cache bust (useful after uploading) */
app.get('/api/videos/refresh', async (_req, res) => {
    try {
        const videos = await fetchVideos(true)
        res.json({ ok: true, count: videos.length })
    } catch (err) {
        console.error('[api/refresh]', err.message)
        res.status(500).json({ error: 'Internal server error' })
    }
})

/** GET /api/health — only expose safe info, never secrets */
app.get('/api/health', (_req, res) => {
    res.json({
        ok:         true,
        cached:     !!cache.videos,
        videoCount: cache.videos?.length ?? 0,
    })
})

// ── Catch-all 404 for unknown API routes ──────────────────────────────
app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' })
})

// ── Global error handler — never leak stack traces ────────────────────
app.use((err, _req, res, _next) => {
    console.error('[unhandled]', err)
    res.status(500).json({ error: 'Internal server error' })
})

// ── Start ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log('\n\x1b[36m🎙  Madhwa video server\x1b[0m')
    console.log(`   URL:     http://localhost:${PORT}`)
    console.log(`   API key: ${API_KEY ? '\x1b[32m✓ set\x1b[0m' : '\x1b[31m✗ missing — add to server/.env\x1b[0m'}`)
    console.log(`   Channel: @${CHANNEL_HANDLE}\n`)

    // Warm the cache in the background
    if (API_KEY) fetchVideos().catch(err => console.error('[startup warmup]', err.message))
})
