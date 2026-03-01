import { useState, useRef, useCallback } from 'react'
import { getThumb, getEmbedUrl, getYoutubeUrl } from '../data/podcasts'
import './VideoCard.css'

export default function VideoCard({ podcast, featured = false }) {
    const [hovered, setHovered] = useState(false)
    const timerRef = useRef(null)

    /* Delay iframe load slightly so quick mouse-overs don't spam embeds */
    const onEnter = useCallback(() => {
        timerRef.current = setTimeout(() => setHovered(true), 400)
    }, [])
    const onLeave = useCallback(() => {
        clearTimeout(timerRef.current)
        setHovered(false)
    }, [])

    const open = () =>
        window.open(getYoutubeUrl(podcast.videoId), '_blank', 'noopener,noreferrer')

    return (
        <article
            className={`vcard${featured ? ' vcard--featured' : ''}`}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
            onClick={open}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && open()}
        >
            {/* Thumbnail / Preview */}
            <div className="vcard-thumb">
                <img
                    src={getThumb(podcast.videoId, featured ? 'maxresdefault' : 'mqdefault')}
                    alt={podcast.titleEn}
                    loading="lazy"
                />

                {/* YouTube iframe preview on hover */}
                {hovered && (
                    <iframe
                        className="vcard-preview"
                        src={getEmbedUrl(podcast.videoId)}
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                        title="preview"
                    />
                )}

                {/* Play overlay */}
                {!hovered && (
                    <div className="vcard-play">
                        <svg width={featured ? 36 : 18} height={featured ? 36 : 18}
                            viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>
                )}

                <span className="vcard-duration">{podcast.duration}</span>
            </div>

            {/* Info */}
            <div className="vcard-info">
                <div className="vcard-meta">
                    <span className="vcard-ep">{podcast.episode}</span>
                    <span className="vcard-cat">{podcast.category}</span>
                </div>
                <h3 className="vcard-title-en">{podcast.titleEn}</h3>
                <p className="vcard-title-kn">{podcast.title}</p>
                {featured && <p className="vcard-desc">{podcast.description}</p>}
            </div>
        </article>
    )
}
