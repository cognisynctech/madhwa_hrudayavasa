import './VideoCard.css'

export default function VideoCard({ podcast }) {
    const handleClick = () => {
        window.open(podcast.youtubeUrl, '_blank', 'noopener,noreferrer')
    }

    return (
        <article
            className="vcard"
            onClick={handleClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        >
            {/* Thumbnail */}
            <div className="vcard-thumb">
                <img
                    src={podcast.thumbnail}
                    alt={podcast.titleEn}
                    loading="lazy"
                    onError={(e) => {
                        e.target.src = `https://picsum.photos/seed/${podcast.id + 10}/640/360`
                    }}
                />
                <div className="vcard-play">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                </div>
                <span className="vcard-duration">{podcast.duration}</span>
            </div>

            {/* Info */}
            <div className="vcard-info">
                <div className="vcard-meta">
                    <span className="vcard-ep">{podcast.episode}</span>
                    <span className="vcard-cat">{podcast.category}</span>
                </div>
                <h3 className="vcard-title-kn">{podcast.title}</h3>
                <p className="vcard-title-en">{podcast.titleEn}</p>
            </div>
        </article>
    )
}
