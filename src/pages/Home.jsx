import { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import easyVideo from '../assets/videos/easy.mp4'
import mulaImg from '../assets/pics/mula.jpeg'
import { podcasts } from '../data/podcasts'
import KrishnaShader from '../components/KrishnaShader'
import './Home.css'

gsap.registerPlugin(ScrollTrigger)

/* ─── Data ─── */
const highlights = [
    { id: 1, title: 'ದ್ವೈತ ತತ್ತ್ವ', subtitle: 'Dwaita Philosophy', desc: 'The complete metaphysical vision of Madhvacharya.', fullWidth: true },
    { id: 2, title: 'ಅಷ್ಟ ಮಠ', subtitle: 'Ashta Mathas of Udupi', desc: 'Eight living monasteries. One unbroken tradition.' },
    { id: 3, title: 'ಹರಿದಾಸ ಸಾಹಿತ್ಯ', subtitle: 'Haridasa Literature', desc: 'Devotion in song — the Carnatic tradition of the Dasas.' },
]

const pillars = [
    { num: '01', label: 'Pramana', title: 'Right knowledge as the path.', body: 'Madhva insists: perception, inference, and scripture — together they form the only valid means of knowing reality. Nothing casual. Nothing borrowed.' },
    { num: '02', label: 'Bheda', title: 'Five irreducible differences.', body: 'God and the individual soul are forever distinct. The world is real. The differences between things are not an illusion — they are fundamental to the structure of existence.' },
    { num: '03', label: 'Bhakti', title: 'Devotion as the means to moksha.', body: 'Jnana alone is not enough. It is bhakti — fuelled by right knowledge — that carries the soul toward liberation. Vishnu is the sole independent reality.' },
]

/* ─── Hero component ─── */
function HeroSection() {
    const heroRef = useRef(null)
    const textRef = useRef(null)

    // Scroll-shrink on hero text
    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.to(textRef.current, {
                scale: 0.72,
                opacity: 0.1,
                y: -60,
                ease: 'none',
                scrollTrigger: {
                    trigger: heroRef.current,
                    start: 'top top',
                    end: 'bottom top',
                    scrub: 1.5,
                },
            })
        })
        return () => ctx.revert()
    }, [])

    return (
        <section ref={heroRef} className="hero">
            {/* LEFT — 70% text column */}
            <div className="hero-left">
                <div ref={textRef} className="hero-text-wrap">
                    <h1 className="hero-title anim-fadein">
                        Madhwa<br />Hrudaya<br />Vaasi
                    </h1>
                </div>
                <div className="hero-bottom">
                    <p className="hero-col anim-fadein-delay1">Dwaita Siddhanta.<br />Conversations.</p>
                    <p className="hero-col anim-fadein-delay2">Exploring philosophy with<br />the Acharyas of the Ashta Mathas.</p>
                    <span className="hero-arrow anim-fadein-delay2">↓</span>
                </div>
            </div>

            {/* RIGHT — 30% WebGL GLSL shader: Krishna char grid */}
            <div className="hero-right">
                <KrishnaShader />
                <div className="hero-right-overlay" />
            </div>
        </section>
    )
}

/* ─── Showreel section ─── */
function ShowreelSection() {
    const ref = useRef(null)
    const [hovered, setHovered] = useState(false)
    const [cursor, setCursor] = useState({ x: 0, y: 0 })

    return (
        <section
            ref={ref}
            className={`showreel${hovered ? ' hovered' : ''}`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onMouseMove={(e) => {
                const r = ref.current.getBoundingClientRect()
                setCursor({ x: e.clientX - r.left, y: e.clientY - r.top })
            }}
        >
            <video src={easyVideo} autoPlay muted loop playsInline className="showreel-video" />
            <div className="showreel-badge" style={{ left: cursor.x, top: cursor.y }}>
                <span>▶</span> Play Reel
            </div>
            <p className="showreel-label">Showreel</p>
        </section>
    )
}

/* ─── Highlight card ─── */
function HighlightCard({ item, layout }) {
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
        <div
            ref={cardRef}
            className={`hl-card hl-card--${layout}${hovered ? ' hovered' : ''}`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onMouseMove={handleMove}
        >
            <div className="hl-card-bg">
                <img src={mulaImg} alt={item.subtitle} />
            </div>
            <div className="hl-card-info">
                <p className="hl-card-sub">{item.subtitle}</p>
                <h3 className="hl-card-title">{item.title}</h3>
                <p className="hl-card-desc">{item.desc}</p>
            </div>
            <div className="hl-preview" style={{ left: pos.x, top: pos.y }}>
                <video ref={vidRef} src={easyVideo} muted loop playsInline />
            </div>
        </div>
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
export default function Home() {
    const videoGrowRef = useRef(null)
    const videoInnerRef = useRef(null)

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
            <HeroSection />

            {/* 2. SHOWREEL */}
            <ShowreelSection />

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
                            <p>Madhwa Hrudaya Vaasi is a long-form podcast dedicated to the Dwaita Vedanta tradition of Sri Madhvacharya. Every episode is a journey into Tattvavada — its philosophy, its devotion, its living lineage across the eight Mathas of Udupi.</p>
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
                <HighlightCard item={highlights[0]} layout="full" />
                <div className="hl-split">
                    <HighlightCard item={highlights[1]} layout="half" />
                    <HighlightCard item={highlights[2]} layout="half" />
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
                        {[...podcasts, ...podcasts].map((p, i) => (
                            <EpisodeTile key={i} podcast={p} index={i} />
                        ))}
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
                    <video src={easyVideo} autoPlay muted loop playsInline className="video-grow-vid" />
                    <div className="video-grow-overlay">
                        <p className="video-grow-label">Watch a conversation ↗</p>
                    </div>
                </div>
            </section>

            {/* 10. CTA */}
            <CtaSection />

        </main>
    )
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
                    src={`https://img.youtube.com/vi/${podcast.videoId}/mqdefault.jpg`}
                    alt={podcast.titleEn}
                    onError={(e) => { e.target.src = mulaImg }}
                />
            </div>
            <div className="ep-tile-info">
                <p className="ep-tile-cat">{podcast.category}</p>
                <p className="ep-tile-title">{podcast.titleEn}</p>
            </div>
        </div>
    )
}
