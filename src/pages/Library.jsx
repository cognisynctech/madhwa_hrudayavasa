import { useState, useEffect, useRef, useMemo } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
    podcasts, CHANNEL_URL,
    getThumb, getYoutubeUrl,
} from '../data/podcasts'
import { fetchVideos } from '../api/videos'
import './Library.css'

gsap.registerPlugin(ScrollTrigger)

export default function Library() {
    const [activeCategory, setActiveCategory] = useState('All')
    const [searchQuery, setSearchQuery]       = useState('')
    const [videos, setVideos]                 = useState(null)        // null = loading
    const [apiStatus, setApiStatus]           = useState('loading')   // 'loading'|'live'|'offline'
    const [page, setPage]                     = useState(1)
    const ITEMS_PER_PAGE = 12
    const pageRef = useRef(null)

    /* ── Fetch latest videos from backend, fall back to static ─ */
    useEffect(() => {
        fetchVideos()
            .then((data) => {
                if (data && data.length > 0) {
                    setVideos(data)
                    setApiStatus('live')
                } else {
                    setVideos(podcasts)
                    setApiStatus('offline')
                }
            })
            .catch(() => {
                setVideos(podcasts)
                setApiStatus('offline')
            })
    }, [])

    /* ── Derived: categories from whichever data source we have ─ */
    const categories = useMemo(
        () => videos ? ['All', ...new Set(videos.map((v) => v.category))] : ['All'],
        [videos]
    )

    const featured = videos?.[0] ?? null

    const filtered = (videos ?? []).filter((p) => {
        const matchCat    = activeCategory === 'All' || p.category === activeCategory
        const q           = searchQuery.toLowerCase()
        const matchSearch = !q ||
            (p.titleEn || p.title || '').toLowerCase().includes(q) ||
            (p.description || '').toLowerCase().includes(q)
        return matchCat && matchSearch
    })

    // Reset to page 1 whenever category changes
    useEffect(() => { setPage(1) }, [searchQuery, activeCategory])

    // When a search query is active, show ALL matching results (no pagination)
    const isSearching = searchQuery.trim().length > 0
    const pageCount  = isSearching ? 1 : Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
    const pagedItems = isSearching ? filtered : filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

    /* ── Scroll-reveal ────────────────────────────────── */
    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.utils.toArray('[data-reveal]').forEach((el) => {
                gsap.fromTo(el,
                    { opacity: 0, y: 40 },
                    {
                        opacity : 1, y: 0, duration: 0.9, ease: 'power3.out',
                        scrollTrigger: { trigger: el, start: 'top 88%' },
                    }
                )
            })
        }, pageRef)
        // Refresh triggers after navigation so they fire correctly
        const t = setTimeout(() => ScrollTrigger.refresh(), 120)
        return () => { clearTimeout(t); ctx.revert() }
    }, [])

    return (
        <main className="lib" ref={pageRef}>

            {/* ── Hero — split layout, full-bleed from top ──────── */}
            <section className="lib-hero">
                {!featured ? (
                    /* Skeleton — shown while API is in flight */
                    <div className="lib-hero-card lib-hero-skeleton">
                        <div className="lib-hero-body">
                            <div className="lib-skel lib-skel--tags" />
                            <div className="lib-skel lib-skel--title" />
                            <div className="lib-skel lib-skel--title lib-skel--title2" />
                            <div className="lib-skel lib-skel--desc" />
                            <div className="lib-skel lib-skel--footer" />
                        </div>
                        <div className="lib-hero-media lib-skel--media" />
                    </div>
                ) : (
                <a
                    className="lib-hero-card"
                    href={getYoutubeUrl(featured.videoId)}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {/* Left — dark typography panel */}
                    <div className="lib-hero-body">
                        <div className="lib-hero-tags">
                            <span className="lib-hero-pill">Latest</span>
                            {apiStatus === 'live' && (
                                <span className="lib-hero-live-dot" title="Auto-synced from YouTube" />
                            )}
                            <span className="lib-hero-ep">{featured.episode}</span>
                            <span className="lib-hero-sep">·</span>
                            <span className="lib-hero-cat">{featured.category}</span>
                        </div>
                        <h2 className="lib-hero-title">{featured.titleEn || featured.title}</h2>
                        {featured.title && featured.title !== featured.titleEn && (
                            <p className="lib-hero-kn">{featured.title}</p>
                        )}
                        <p className="lib-hero-desc">{featured.description}</p>
                        <div className="lib-hero-footer">
                            <span className="lib-hero-dur">{featured.duration}</span>
                            <span className="lib-hero-cta">
                                Watch Episode
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2.5">
                                    <path d="M7 17L17 7M7 7h10v10" />
                                </svg>
                            </span>
                        </div>
                    </div>

                    {/* Right — image, bleeds to top edge behind navbar */}
                    <div className="lib-hero-media">
                        <img
                            className="lib-hero-img"
                            src={featured.thumbnail || getThumb(featured.videoId, 'maxresdefault')}
                            alt={featured.titleEn || featured.title}
                        />
                        <div className="lib-hero-play" aria-hidden="true">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </div>
                    </div>
                </a>
                )}
            </section>
            <div className="container"><div className="rule" /></div>
            {/* ── Discovery: Search + Filters ──────────────────── */}
            <section className="lib-discovery">
                <div className="container">
                    <p className="lib-discovery-label">Browse Episodes</p>

                    <div className="lib-search-field">
                        <svg className="lib-search-icon" width="28" height="28" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" strokeWidth="1.8">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                        <input
                            type="text"
                            className="lib-main-search"
                            placeholder="Search episodes, topics, guests…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            aria-label="Search episodes"
                        />
                        {searchQuery && (
                            <button className="lib-clear-btn" onClick={() => setSearchQuery('')}
                                aria-label="Clear search">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2.5">
                                    <path d="M18 6 6 18M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>

                    <div className="lib-discovery-footer">
                        <div className="lib-result-count">
                            <span className="lib-result-num">
                                {isSearching
                                    ? filtered.length
                                    : filtered.length === 0 ? 0 : `${(page - 1) * ITEMS_PER_PAGE + 1}–${Math.min(page * ITEMS_PER_PAGE, filtered.length)}`
                                }
                            </span>
                            <span className="lib-result-txt">
                                {isSearching ? '' : `of ${filtered.length} `}episode{filtered.length === 1 ? '' : 's'}
                            </span>
                            {searchQuery && (
                                <span className="lib-result-query">
                                    for &ldquo;{searchQuery}&rdquo;
                                </span>
                            )}
                        </div>

                        <div className="lib-filters">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    className={`lib-filter${activeCategory === cat ? ' active' : ''}`}
                                    onClick={() => setActiveCategory(cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <div className="container"><div className="rule" /></div>

            {/* ── Episode grid ─────────────────────────────────── */}
            <section className="lib-grid-section">
                {filtered.length === 0 ? (
                    <div className="container">
                        <div className="lib-empty" data-reveal>
                            <p>No episodes match your search.</p>
                            <button onClick={() => { setSearchQuery(''); setActiveCategory('All') }}>
                                Reset filters
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                    <div className="ep-grid container">
                        {pagedItems.map((p, i) => (
                            <a
                                key={p.id}
                                className="ep-card"
                                href={getYoutubeUrl(p.videoId)}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ '--i': i }}
                            >
                                {/* Thumbnail with play overlay */}
                                <div className="ep-card-thumb">
                                    <img
                                        src={p.thumbnail || getThumb(p.videoId, 'hqdefault')}
                                        alt={p.titleEn || p.title}
                                        loading="lazy"
                                        onError={(e) => { e.target.onerror = null; e.target.src = getThumb(p.videoId, 'default') }}
                                    />
                                    <div className="ep-card-play" aria-hidden="true">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Metadata below thumbnail */}
                                <div className="ep-card-body">
                                    <div className="ep-card-meta-row">
                                        <span className="ep-card-ep">{p.episode}</span>
                                        <span className="ep-card-dur">{p.duration}</span>
                                    </div>
                                    <h3 className="ep-card-title">{p.titleEn}</h3>
                                    <p className="ep-card-kn">{p.title}</p>
                                </div>
                            </a>
                        ))}
                    </div>

                    {/* ── Pagination controls — hidden during active search ── */}
                    {pageCount > 1 && !isSearching && (
                        <div className="lib-pagination container">
                            <button
                                className="lib-page-btn lib-page-btn--prev"
                                onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                                disabled={page === 1}
                                aria-label="Previous page"
                            >
                                ← Prev
                            </button>

                            <div className="lib-page-nums">
                                {Array.from({ length: pageCount }, (_, i) => i + 1).map(n => (
                                    <button
                                        key={n}
                                        className={`lib-page-num${page === n ? ' active' : ''}`}
                                        onClick={() => { setPage(n); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                                        aria-label={`Page ${n}`}
                                        aria-current={page === n ? 'page' : undefined}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>

                            <button
                                className="lib-page-btn lib-page-btn--next"
                                onClick={() => { setPage(p => Math.min(pageCount, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                                disabled={page === pageCount}
                                aria-label="Next page"
                            >
                                Next →
                            </button>
                        </div>
                    )}
                    </>
                )}
            </section>

            {/* ── Channel CTA ─────────────────────────────── */}
            <section className="lib-cta">
                <div className="container">
                    <div className="rule" />
                    <div className="lib-cta-row" data-reveal>
                        <p className="lib-cta-text">Watch all episodes on</p>
                        <a className="lib-cta-link" href={CHANNEL_URL}
                            target="_blank" rel="noopener noreferrer">
                            YouTube ↗
                        </a>
                    </div>
                    <div className="rule" />
                </div>
            </section>
        </main>
    )
}
