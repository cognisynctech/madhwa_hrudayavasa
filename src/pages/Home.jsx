import { useEffect, useRef, useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import video1 from '../assets/videos/1.mp4'
import video2 from '../assets/videos/2.mp4'
import video4 from '../assets/videos/4.mp4'
import daasaVideo from '../assets/videos/daasa.mp4'
import mulaImg from '../assets/pics/mula.jpeg'
import hlImg1 from '../assets/pics/1.png'
import hlImg2 from '../assets/pics/2.jpeg'
import hlImg3 from '../assets/pics/3.jpeg'
import { podcasts } from '../data/podcasts'
import { fetchVideos } from '../api/videos'
import KrishnaShader from '../components/KrishnaShader'
import VideoModal from '../components/VideoModal'
import './Home.css'

gsap.registerPlugin(ScrollTrigger)

/* ─── Team photos (same loader as Contact page) ─── */
const teamImages = import.meta.glob('../assets/team/*.{jpg,jpeg,png,webp}', { eager: true })
function getTeamPhoto(name, photoSlug) {
    const slug = (photoSlug || name).toLowerCase()
    const key = Object.keys(teamImages).find((k) => {
        const fn = k.split('/').pop().split('.')[0].toLowerCase()
        return fn === slug || slug.includes(fn) || fn.includes(slug)
    })
    return key ? teamImages[key].default : null
}
const homeTeam = [
    { name: 'Srinidhi',  role: 'Host' },
    { name: 'Sarvottam', role: 'Direction' },
    { name: 'Pranava',   role: 'Sound',    photoSlug: 'anirudha' },
    { name: 'Anirudha',  role: 'Producer', photoSlug: 'pranava'  },
    { name: 'Smriti',    role: 'Research' },
]

/* ─── Data ─── */
const highlights = [
    { id: 1, title: 'ದ್ವೈತ ತತ್ತ್ವ', subtitle: 'Dwaita Philosophy', desc: 'The complete metaphysical vision of Madhvacharya.', fullWidth: true, img: hlImg1, video: video2 },
    { id: 2, title: 'ವ್ಯಾಸ ಸಾಹಿತ್ಯ', subtitle: 'Vyaasa Sahithya', desc: 'The literary tradition rooted in the works of Vedavyasa.', img: hlImg3 },
    { id: 3, title: 'ದಾಸ ಸಾಹಿತ್ಯ', subtitle: 'Daasa Sahithya', desc: 'Devotion in song — the tradition of the Haridasas.', img: hlImg2, video: daasaVideo },
]

const pillars = [
    { num: '01', label: 'Pramana', title: 'Right knowledge as the path.', body: 'Madhva insists: perception, inference, and scripture — together they form the only valid means of knowing reality. Nothing casual. Nothing borrowed.' },
    { num: '02', label: 'Bheda', title: 'Five irreducible differences.', body: 'God and the individual soul are forever distinct. The world is real. The differences between things are not an illusion — they are fundamental to the structure of existence.' },
    { num: '03', label: 'Bhakti', title: 'Devotion as the means to moksha.', body: 'Jnana alone is not enough. It is bhakti — fuelled by right knowledge — that carries the soul toward liberation. Vishnu is the sole independent reality.' },
]

/* ─── Title content (extracted to avoid defining component inside component) ─── */
function TitleContent() {
    return (
        <>
            <span className="title-samarkan">
                {'Madhwa'.split('').map((c, i) => <span key={`m-${c}-${i}`} className="h-char">{c}</span>)}
            </span>
            <span className="title-kn-hero">
                <span className="h-char">ಹೃದಯ</span>
            </span>
            <span className="title-samarkan title-vaasa">
                {'Vaasa'.split('').map((c, i) => <span key={`v-${c}-${i}`} className="h-char">{c}</span>)}
            </span>
        </>
    )
}

/* ─── Hero component ─── */
function HeroSection({ loaded }) {
    const heroRef = useRef(null)
    const textRef = useRef(null)
    const solidLayerRef = useRef(null)

    // Hero text entrance — waits for splash to complete
    useEffect(() => {
        if (!loaded) return

        // Query lines from EACH layer separately
        const outlineLines = heroRef.current?.querySelectorAll(
            '.hero-layer--outline .title-samarkan, .hero-layer--outline .title-kn-hero'
        )
        const solidLines = heroRef.current?.querySelectorAll(
            '.hero-layer--solid .title-samarkan, .hero-layer--solid .title-kn-hero'
        )
        const bottomEls = heroRef.current?.querySelectorAll('.hero-col, .hero-arrow')
        const heroRight = heroRef.current?.querySelector('.hero-right')

        const allTextEls = [
            ...(outlineLines || []),
            ...(solidLines   || []),
            ...(bottomEls    || []),
        ]

        // Safety fallback — if GSAP is interrupted for any reason, force text visible
        const fallback = setTimeout(() => {
            allTextEls.forEach(el => {
                el.style.opacity   = '1'
                el.style.transform = ''
                el.style.filter    = ''
            })
        }, 2600)

        const tl = gsap.timeline({ defaults: { ease: 'power4.out' }, overwrite: 'auto' })

        if (outlineLines?.length && solidLines?.length) {
            tl.fromTo(outlineLines,
                { y: 80, opacity: 0, filter: 'blur(8px)' },
                { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1.4, stagger: 0.18, ease: 'power3.out' },
                0.1
            )
            tl.fromTo(solidLines,
                { y: 80, opacity: 0, filter: 'blur(8px)' },
                { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1.4, stagger: 0.18, ease: 'power3.out' },
                0.1
            )
        }

        if (bottomEls?.length) {
            tl.fromTo(bottomEls,
                { y: 20, opacity: 0, filter: 'blur(4px)' },
                { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1, stagger: 0.1, ease: 'power2.out' },
                '-=0.4'
            )
        }

        if (heroRight) {
            tl.fromTo(heroRight,
                { opacity: 0 },
                { opacity: 1, duration: 1.6, ease: 'power2.out' },
                0.15
            )
        }

        return () => {
            clearTimeout(fallback)
            // Kill without reverting — keeps inline opacity:1 on the elements
            // so text is never left invisible when StrictMode double-fires or
            // the tab was hidden mid-animation
            tl.progress(1).kill()
        }
    }, [loaded])

    // Cursor mask — directly sets mask-image on the solid layer
    useEffect(() => {
        const RADIUS = 70
        const el = solidLayerRef.current
        if (!el) return

        const setMask = (val) => {
            el.style.webkitMaskImage = val
            el.style.maskImage = val
        }
        setMask(`radial-gradient(circle ${RADIUS}px at -9999px -9999px, transparent 0%, transparent 60%, black 100%)`)

        const onMove = (e) => {
            const rect = el.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            setMask(`radial-gradient(circle ${RADIUS}px at ${x}px ${y}px, transparent 0%, transparent 60%, black 100%)`)
        }

        const onLeave = () => {
            setMask(`radial-gradient(circle ${RADIUS}px at -9999px -9999px, transparent 0%, transparent 60%, black 100%)`)
        }

        globalThis.addEventListener('mousemove', onMove)
        document.addEventListener('mouseleave', onLeave)
        return () => {
            globalThis.removeEventListener('mousemove', onMove)
            document.removeEventListener('mouseleave', onLeave)
        }
    }, [])

    // TitleContent is defined outside the component (above)

    return (
        <section ref={heroRef} className="hero">
            {/* LEFT — text column */}
            <div className="hero-left">
                <div ref={textRef} className="hero-text-wrap">
                    <h1 className="hero-title">
                        {/* Layer 1: The Top SOLID layer, with a hole cut out by mask-image */}
                        <div ref={solidLayerRef} className="hero-layer hero-layer--solid">
                            <TitleContent />
                        </div>
                        {/* Layer 2: The Bottom OUTLINE layer, visible through the hole */}
                        <div className="hero-layer hero-layer--outline">
                            <TitleContent />
                        </div>
                    </h1>
                </div>
                <div className="hero-bottom">
                    <p className="hero-col anim-fadein-delay1">Dwaita Siddhanta.<br />Conversations.</p>
                    <span className="hero-rule" />
                    <p className="hero-col anim-fadein-delay2">Exploring philosophy with<br />the Acharyas of the Ashta Mathas.</p>
                    <span className="hero-arrow anim-fadein-delay2">↓</span>
                </div>
            </div>

            {/* RIGHT — 30% WebGL GLSL shader: Krishna char grid */}
            <div className="hero-right">
                {loaded && <KrishnaShader />}
                <div className="hero-right-overlay" />
            </div>

            {/* Socials — vertical strip on the right edge */}
            <div className="hero-socials">
                <a href="https://www.youtube.com/@Madhwahrudayavasa" target="_blank" rel="noopener noreferrer" className="hero-social-link" aria-label="YouTube">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
                <a href="https://www.instagram.com/madhwahrudayavasa/" target="_blank" rel="noopener noreferrer" className="hero-social-link" aria-label="Instagram">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
            </div>
        </section>
    )
}

HeroSection.propTypes = {
    loaded: PropTypes.bool,
}

/* ─── Showreel section — veil-reveal (like footer) ─── */
function ShowreelSection({ onPlay }) {
    const trackRef   = useRef(null)
    const sectionRef = useRef(null)
    const veilRef    = useRef(null)
    const [hovered, setHovered] = useState(false)
    const [cursor, setCursor] = useState({ x: 0, y: 0 })

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Veil slides UP to reveal the video beneath — same technique as footer
            gsap.to(veilRef.current, {
                yPercent: -100,
                ease: 'none',
                scrollTrigger: {
                    trigger: trackRef.current,
                    start: 'top bottom',
                    end: 'top 15%',
                    scrub: 1.2,
                },
            })
        })
        return () => ctx.revert()
    }, [])

    return (
        /* Extra height = scroll room for the sticky animation */
        <div ref={trackRef} className="showreel-track">
            <button
                type="button"
                ref={sectionRef}
                className={`showreel${hovered ? ' hovered' : ''}`}
                aria-label="Play showreel video"
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                onMouseMove={(e) => {
                    const r = sectionRef.current.getBoundingClientRect()
                    setCursor({ x: e.clientX - r.left, y: e.clientY - r.top })
                }}
                onClick={onPlay}
            >
                {/* Dark veil — scrolls up to reveal video */}
                <div ref={veilRef} className="showreel-veil" />

                <video
                    src={video1}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="showreel-video"
                />
                <div className="showreel-badge" style={{ left: cursor.x, top: cursor.y }}>
                    <span>▶</span> Play Reel
                </div>
            </button>
        </div>
    )
}

ShowreelSection.propTypes = {
    onPlay: PropTypes.func,
}

/* ─── Highlight card ─── */
function HighlightCard({ item, layout, onPlay }) {
    const [hovered, setHovered] = useState(false)
    const [pos, setPos] = useState({ x: 0, y: 0 })
    const cardRef = useRef(null)
    const vidRef = useRef(null)

    const handleMove = (e) => {
        const rect = cardRef.current.getBoundingClientRect()
        setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    }

    useEffect(() => {
        if (!vidRef.current) return
        if (hovered) vidRef.current.play().catch(() => { })
        else { vidRef.current.pause(); vidRef.current.currentTime = 0 }
    }, [hovered])

    return (
        <button
            type="button"
            ref={cardRef}
            className={`hl-card hl-card--${layout}${hovered ? ' hovered' : ''}`}
            aria-label={`Play ${item.subtitle} video`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onMouseMove={handleMove}
            onClick={() => onPlay?.()}
            style={{ cursor: 'none' }}
        >
            <div className="hl-card-bg">
                <img src={item.img || mulaImg} alt={item.subtitle} />
            </div>
            <div className="hl-card-info">
                <p className="hl-card-sub">{item.subtitle}</p>
                <h3 className="hl-card-title">{item.title}</h3>
                <p className="hl-card-desc">{item.desc}</p>
            </div>
            {/* Hover preview video */}
            <div className="hl-preview" style={{ left: pos.x, top: pos.y }}>
                <video ref={vidRef} src={item.video || video1} muted loop playsInline />
            </div>
            {/* Play badge — follows cursor like showreel badge */}
            <div className="hl-play-badge" style={{ left: pos.x, top: pos.y }}>
                <span>▶</span> Play
            </div>
        </button>
    )
}

HighlightCard.propTypes = {
    item: PropTypes.shape({
        img: PropTypes.string,
        subtitle: PropTypes.string,
        title: PropTypes.string,
        desc: PropTypes.string,
        video: PropTypes.string,
    }).isRequired,
    layout: PropTypes.string,
    onPlay: PropTypes.func,
}

/* ─── Team Strip ─── */
function TeamStrip() {
    return (
        <section className="team-strip">
            <div className="container">
                <div className="team-strip-inner" data-reveal>
                    <p className="team-strip-label">The people behind it</p>
                    <div className="team-strip-faces">
                        {homeTeam.map((m, i) => {
                            const photo = getTeamPhoto(m.name, m.photoSlug)
                            return (
                                <Link to="/contact" key={m.name} className="team-face" style={{ '--i': i }}>
                                    <div className="team-face-img">
                                        {photo
                                            ? <img src={photo} alt={m.name} />
                                            : <span className="team-face-init">{m.name[0]}</span>
                                        }
                                    </div>
                                    <span className="team-face-name">{m.name}</span>
                                </Link>
                            )
                        })}
                    </div>
                    <Link to="/contact" className="team-strip-cta">Meet the team ↗</Link>
                </div>
            </div>
        </section>
    )
}

/* ─── CTA with text-swap animation ─── */
function CtaSection() {
    const [hovered, setHovered] = useState(false)

    return (
        <section className="cta-section">
            <div className="container">
                <div className="rule" />
                <div className="cta-inner">
                    <Link
                        to="/contact"
                        className={`cta-link${hovered ? ' hovered' : ''}`}
                        onMouseEnter={() => setHovered(true)}
                        onMouseLeave={() => setHovered(false)}
                    >
                        <span className="cta-word cta-word--primary">Get to know us</span>
                        <span className="cta-word cta-word--secondary">About Us</span>
                    </Link>
                </div>
                <div className="rule" />
            </div>
        </section>
    )
}

/* ─── Main export ─── */
export default function Home({ loaded }) {
    const videoGrowRef = useRef(null)
    const videoInnerRef = useRef(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [modalSrc, setModalSrc] = useState('')
    const [liveVideos, setLiveVideos] = useState(null)

    useEffect(() => { document.title = '\u0CAE\u0CA7\u0CCD\u0CB5 \u0CB9\u0CC3\u0CA6\u0CAF \u0CB5\u0CBE\u0CB8 | Madhwa Hrudaya Vaasa' }, [])

    // Fetch live videos for the episode ticker
    useEffect(() => {
        fetchVideos()
            .then(data => {
                if (data?.length > 0) {
                    setLiveVideos(data)
                    // Videos loaded → page height changed → recalc scroll triggers
                    // Multiple refreshes to handle images/fonts loading after DOM paint
                    setTimeout(() => ScrollTrigger.refresh(), 100)
                    setTimeout(() => ScrollTrigger.refresh(), 600)
                    setTimeout(() => ScrollTrigger.refresh(), 2000)
                    setTimeout(() => ScrollTrigger.refresh(), 4000)
                }
            })
            .catch(() => {})
    }, [])

    const openModal = useCallback((src) => {
        setModalSrc(src)
        setModalOpen(true)
    }, [])

    // Video grow-on-scroll
    useEffect(() => {
        const ctx = gsap.context(() => {
            if (videoInnerRef.current) {
                gsap.fromTo(videoInnerRef.current,
                    { scale: 0.55, borderRadius: '24px' },
                    {
                        scale: 1,
                        borderRadius: '0px',
                        ease: 'none',
                        scrollTrigger: {
                            trigger: videoGrowRef.current,
                            start: 'top 80%',
                            end: 'center center',
                            scrub: 1,
                        },
                    }
                )
            }

            // Generic reveals
            gsap.utils.toArray('[data-reveal]').forEach((el) => {
                gsap.fromTo(el,
                    { opacity: 0, y: 40 },
                    { opacity: 1, y: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 86%' } }
                )
            })
        })
        return () => ctx.revert()
    }, [])

    return (
        <main className="home">

            {/* 1. HERO */}
            <HeroSection loaded={loaded} />

            {/* 2. SHOWREEL */}
            <ShowreelSection onPlay={() => openModal(video1)} />

            {/* 3. MISSION */}
            <section className="mission" data-reveal>
                <div className="container">
                    <div className="rule" />
                    <p className="mission-text">
                        We bring the living tradition of <em>Dwaita Siddhanta</em> to life — through long-form
                        conversations with Swamijis, scholars, and practitioners of the Ashta Mathas. Deep
                        philosophy, spoken clearly.{' '}
                        <Link to="/library" className="mission-link">Explore the episodes ↗</Link>
                    </p>
                    <div className="rule" />
                </div>
            </section>

            {/* 4. ESSENTIALS */}
            <section className="essentials" data-reveal>
                <div className="container">
                    <div className="essentials-row">
                        <p className="essentials-tagline">Ancient wisdom.<br />Modern conversations.</p>
                        <div className="essentials-body">
                            <p>Madhwa Hrudaya Vaasa is a long-form podcast dedicated to the Dwaita Vedanta tradition of Sri Madhvacharya. Every episode is a journey into Tattvavada — its philosophy, its devotion, its living lineage across the eight Mathas of Udupi.</p>
                            <p>We sit with Swamijis, pandits, and scholars to have the conversations that matter.</p>
                            <Link to="/contact" className="essentials-link">Learn more ↗</Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. HIGHLIGHTS — dark section */}
            <section className="highlights">
                <div className="container">
                    <div className="highlights-header" data-reveal>
                        <span className="highlights-title">Highlights</span>
                        <Link to="/library" className="highlights-all">See the work ↗</Link>
                    </div>
                </div>
                <HighlightCard item={highlights[0]} layout="full" onPlay={() => openModal(highlights[0].video || video1)} />
                <div className="hl-split">
                    <HighlightCard item={highlights[1]} layout="half" onPlay={() => openModal(highlights[1].video || video1)} />
                    <HighlightCard item={highlights[2]} layout="half" onPlay={() => openModal(highlights[2].video || video1)} />
                </div>
            </section>

            {/* 6. QUOTE BAR — after highlights, still dark, transitions to white */}
            <section className="quote-bar" data-reveal>
                <div className="container">
                    <div className="quote-inner">
                        <span className="quote-mark">"</span>
                        <blockquote className="quote-text">
                            Ananda-tirtha did not merely comment on the Upanishads —
                            he dismantled the prevailing interpretation entirely and built a new edifice of thought.
                            The result is a philosophy more internally consistent than any that came before.
                        </blockquote>
                        <cite className="quote-cite">— A scholar on Madhvacharya</cite>
                    </div>
                </div>
            </section>

            {/* 7. EPISODE TICKER — WHITE background, big organic tiles */}
            <section className="ep-ticker">
                <div className="container">
                    <div className="ep-ticker-header" data-reveal>
                        <span className="ep-ticker-label">Recent Episodes</span>
                        <Link to="/library" className="ep-ticker-all">View Library ↗</Link>
                    </div>
                </div>
                <div className="ep-track-wrap">
                    <div className="ep-track">
                        {(() => {
                            const list = liveVideos?.slice(0, 12) ?? podcasts
                            return [...list, ...list].map((p, i) => (
                                <EpisodeTile key={`${p.videoId || p.title}-${i}`} podcast={p} index={i} />
                            ))
                        })()}
                    </div>
                </div>
            </section>

            {/* 8. PHILOSOPHY — stays WHITE */}
            <section className="philosophy">
                <div className="container">
                    <div className="philosophy-top" data-reveal>
                        <h2 className="philosophy-heading">Our philosophy.</h2>
                    </div>
                    <div className="philosophy-rows">
                        {pillars.map((p) => (
                            <div key={p.num} className="philosophy-row" data-reveal>
                                <div className="philosophy-left">
                                    <span className="philosophy-num">{p.num}</span>
                                    <p className="philosophy-label">{p.label}</p>
                                </div>
                                <div className="philosophy-right">
                                    <h3 className="philosophy-title">{p.title}</h3>
                                    <p className="philosophy-body">{p.body}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 9. VIDEO GROW SECTION */}
            <section ref={videoGrowRef} className="video-grow">
                <div className="video-grow-inner" ref={videoInnerRef}>
                    <video src={video4} autoPlay muted loop playsInline className="video-grow-vid" />
                    <div className="video-grow-overlay">
                        <p className="video-grow-label">Watch a conversation ↗</p>
                    </div>
                </div>
            </section>

            {/* 10. TEAM STRIP */}
            <TeamStrip />

            {/* 11. CTA */}
            <CtaSection />

            {/* VIDEO MODAL */}
            <VideoModal src={modalSrc} isOpen={modalOpen} onClose={() => setModalOpen(false)} />

        </main>
    )
}

Home.propTypes = {
    loaded: PropTypes.bool,
}

/* ─── Episode Tile with organic shape ─── */
function EpisodeTile({ podcast, index }) {
    // Alternate between tall and short tiles for organic feel
    const shapes = ['tall', 'wide', 'square', 'wide', 'tall', 'square', 'wide', 'tall']
    const shape = shapes[index % shapes.length]

    return (
        <div className={`ep-tile ep-tile--${shape}`}>
            <div className="ep-tile-img">
                <img
                    src={podcast.thumbnail || `https://img.youtube.com/vi/${podcast.videoId}/hqdefault.jpg`}
                    alt={podcast.titleEn || podcast.title}
                    loading="lazy"
                    onError={(e) => { e.target.onerror = null; e.target.src = mulaImg }}
                />
            </div>
            <div className="ep-tile-info">
                <p className="ep-tile-cat">{podcast.category}</p>
                <p className="ep-tile-title">{podcast.titleEn}</p>
            </div>
        </div>
    )
}

EpisodeTile.propTypes = {
    podcast: PropTypes.shape({
        thumbnail: PropTypes.string,
        videoId: PropTypes.string,
        title: PropTypes.string,
        titleEn: PropTypes.string,
        category: PropTypes.string,
    }).isRequired,
    index: PropTypes.number.isRequired,
}
