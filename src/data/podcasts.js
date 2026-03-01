/**
 * Podcast / Video data.
 *
 * Each entry needs a `videoId` (YouTube ID) — thumbnails and embeds
 * are auto-generated from it.  To populate with real videos, replace
 * these placeholder IDs with actual ones from the channel:
 * https://www.youtube.com/@Madhwahrudayavasa/videos
 *
 * The Library page uses these to build the grid + featured hero.
 * The Home page episode ticker also uses this data.
 */

export const CHANNEL_URL = 'https://www.youtube.com/@Madhwahrudayavasa'

export const podcasts = [
    {
        id: 1,
        videoId: 'dQw4w9WgXcQ',
        title: '\u0CA6\u0CCD\u0CB5\u0CC8\u0CA4 \u0CB8\u0CBF\u0CA6\u0CCD\u0CA7\u0CBE\u0C82\u0CA4 \u2014 \u0C92\u0C82\u0CA6\u0CC1 \u0CAA\u0CB0\u0CBF\u0C9A\u0CAF',
        titleEn: 'Dwaita Siddhanta — An Introduction',
        description: 'A foundational conversation exploring the core tenets of Madhvacharya\'s Dwaita philosophy with Sri Pejawar Swamiji.',
        duration: '1h 24m',
        episode: 'EP 01',
        category: 'Philosophy',
    },
    {
        id: 2,
        videoId: '3JZ_D3ELwOQ',
        title: '\u0C85\u0CB7\u0CCD\u0C9F \u0CAE\u0CA0\u0C97\u0CB3 \u0C87\u0CA4\u0CBF\u0CB9\u0CBE\u0CB8',
        titleEn: 'The History of Ashta Mathas',
        description: 'An in-depth discussion on the eight Udupi mutts established by Madhvacharya and their significance in Vaishnava tradition.',
        duration: '58m',
        episode: 'EP 02',
        category: 'History',
    },
    {
        id: 3,
        videoId: 'XqZsoesa55w',
        title: '\u0CAD\u0C95\u0CCD\u0CA4\u0CBF \u0CAE\u0CA4\u0CCD\u0CA4\u0CC1 \u0C9C\u0CCD\u0C9E\u0CBE\u0CA8',
        titleEn: 'Bhakti and Jnana — The Twin Pillars',
        description: 'How devotion and knowledge interweave in the Madhwa tradition.',
        duration: '1h 05m',
        episode: 'EP 03',
        category: 'Spirituality',
    },
    {
        id: 4,
        videoId: 'L_jWHffIx5E',
        title: '\u0CB6\u0CCD\u0CB0\u0CC0 \u0C95\u0CC3\u0CB7\u0CCD\u0CA3 \u0CAE\u0CA4\u0CCD\u0CA4\u0CC1 \u0C89\u0CA1\u0CC1\u0CAA\u0CBF',
        titleEn: 'Sri Krishna & Udupi — A Sacred Connection',
        description: 'The story of the Udupi Sri Krishna temple and its cosmic significance in Madhva theology.',
        duration: '1h 12m',
        episode: 'EP 04',
        category: 'Temples',
    },
    {
        id: 5,
        videoId: 'fHsa9DqmId8',
        title: '\u0CAA\u0CCD\u0CB0\u0CAE\u0CBE\u0CA3 \u0CAE\u0CC0\u0CAE\u0CBE\u0C82\u0CB8\u0CC6',
        titleEn: 'Pramana Mimamsa — Theory of Valid Knowledge',
        description: 'Breaking down Madhvacharya\'s unique epistemological contributions.',
        duration: '47m',
        episode: 'EP 05',
        category: 'Philosophy',
    },
    {
        id: 6,
        videoId: 'OPf0YbXqDm0',
        title: '\u0CB9\u0CB0\u0CBF\u0CA6\u0CBE\u0CB8 \u0CB8\u0CBE\u0CB9\u0CBF\u0CA4\u0CCD\u0CAF',
        titleEn: 'Haridasa Literature — Songs of Devotion',
        description: 'Exploring the rich tradition of Haridasa saint-poets like Purandaradasa and Kanakadasa.',
        duration: '1h 31m',
        episode: 'EP 06',
        category: 'Music & Poetry',
    },
    {
        id: 7,
        videoId: '2Vv-BfVoq4g',
        title: '\u0CAE\u0CBE\u0CAF\u0CBE\u0CB5\u0CBE\u0CA6 \u0C96\u0C82\u0CA1\u0CA8',
        titleEn: 'Refuting Mayavada — Madhva\'s Critique',
        description: 'A scholarly discussion on Madhvacharya\'s arguments against Advaita Vedanta.',
        duration: '1h 18m',
        episode: 'EP 07',
        category: 'Philosophy',
    },
    {
        id: 8,
        videoId: 'ysz5S6PUM-M',
        title: '\u0CAA\u0CB0\u0CCD\u0CAF\u0CBE\u0CAF \u0C89\u0CA4\u0CCD\u0CB8\u0CB5',
        titleEn: 'The Paryaya Festival — A Living Tradition',
        description: 'The bi-annual transfer of the Udupi mutt administration explained.',
        duration: '52m',
        episode: 'EP 08',
        category: 'Traditions',
    },
    {
        id: 9,
        videoId: '6Ejga4kJUts',
        title: '\u0CAE\u0CA7\u0CCD\u0CB5\u0CBE\u0C9A\u0CBE\u0CB0\u0CCD\u0CAF\u0CB0 \u0C9C\u0CC0\u0CB5\u0CA8',
        titleEn: 'Life of Madhvacharya — The Purna Prajna',
        description: 'A biographical deep-dive into the life of Anandatirtha Madhvacharya.',
        duration: '2h 03m',
        episode: 'EP 09',
        category: 'Biography',
    },
]

/** Helper: get YouTube URL from videoId */
export function getYoutubeUrl(videoId) {
    return `https://www.youtube.com/watch?v=${videoId}`
}

/** Helper: get high-quality thumbnail from videoId */
export function getThumb(videoId, quality = 'mqdefault') {
    return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`
}

/** Helper: get YouTube embed URL (for hover preview) */
export function getEmbedUrl(videoId) {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&modestbranding=1&loop=1&playlist=${videoId}`
}

/**
 * Helper: get YouTube storyboard frame thumbnails.
 * YouTube auto-generates frames at ~25%, 50%, 75% of the video:
 *   /1.jpg  /2.jpg  /3.jpg
 * Cycling through these on hover gives the "highlights" preview effect.
 */
export function getFrameThumbs(videoId) {
    return [
        `https://img.youtube.com/vi/${videoId}/1.jpg`,
        `https://img.youtube.com/vi/${videoId}/2.jpg`,
        `https://img.youtube.com/vi/${videoId}/3.jpg`,
    ]
}

export const categories = ['All', ...new Set(podcasts.map((p) => p.category))]
