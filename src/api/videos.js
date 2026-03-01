/**
 * videos.js — Frontend API client for video data
 *
 * Fetches from the Express backend (/api/videos).
 * Falls back to the static podcasts.js data if the server
 * is unavailable (e.g. during a pure static deployment).
 */

import { podcasts } from '../data/podcasts'

const BASE = '/api'

/**
 * Fetch all videos (latest first) from the backend.
 * @returns {Promise<Array>}
 */
export async function fetchVideos() {
    const res = await fetch(`${BASE}/videos`, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    return json.videos || []
}

/**
 * Fetch only the single latest video.
 * @returns {Promise<Object|null>}
 */
export async function fetchFeatured() {
    const res = await fetch(`${BASE}/videos/featured`, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
}

/**
 * Force a cache refresh on the server (call after uploading a new video).
 */
export async function refreshCache() {
    const res = await fetch(`${BASE}/videos/refresh`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
}

/** Static fallback — used when backend is unreachable */
export { podcasts as staticVideos }
