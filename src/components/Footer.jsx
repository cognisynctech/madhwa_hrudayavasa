import { useRef, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import logoImg from '../assets/pics/logo.jpg'
import './Footer.css'

gsap.registerPlugin(ScrollTrigger)

export default function Footer() {
    const footerRef = useRef(null)
    const veilRef = useRef(null)
    const [email, setEmail] = useState('')
    const { pathname } = useLocation()

    /* Only show the white veil on the home page (transitions from light sections).
       On Library / Contact (all-dark pages) the veil matches --bg so it's invisible. */
    const isHome = pathname === '/'

    /* Home: white veil slides UP to reveal dark footer.
       Dark pages: footer content rises up with clip-path/translate reveal. */
    useEffect(() => {
        const footer = footerRef.current
        const ctx = gsap.context(() => {
            if (isHome) {
                // White veil scrolls away
                gsap.to(veilRef.current, {
                    yPercent: -100,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: footer,
                        start: 'top bottom',
                        end: 'top 20%',
                        scrub: 1.2,
                    },
                })
            } else {
                // Dark-page reveal: footer content slides up from below
                const items = footer.querySelectorAll(
                    '.footer-brand-row, .footer-email, .footer-newsletter, .footer-nav, .footer-meta, .footer-wordmark'
                )
                gsap.fromTo(items,
                    { opacity: 0, y: 36 },
                    {
                        opacity: 1, y: 0,
                        duration: 0.85,
                        ease: 'power3.out',
                        stagger: 0.07,
                        scrollTrigger: {
                            trigger: footer,
                            start: 'top 88%',
                        },
                    }
                )
            }
        })

        // Refresh triggers multiple times to handle async content (API data, lazy images)
        const t1 = setTimeout(() => ScrollTrigger.refresh(), 200)
        const t2 = setTimeout(() => ScrollTrigger.refresh(), 800)
        const t3 = setTimeout(() => ScrollTrigger.refresh(), 2000)
        const t4 = setTimeout(() => ScrollTrigger.refresh(), 4000)

        // Safety fallback — ensure footer content is always visible after 3s
        // even if GSAP/ScrollTrigger fails to fire
        const tSafety = setTimeout(() => {
            const items = footer?.querySelectorAll(
                '.footer-brand-row, .footer-email, .footer-newsletter, .footer-nav, .footer-meta, .footer-wordmark, .footer-credit'
            )
            items?.forEach(el => {
                if (getComputedStyle(el).opacity === '0') {
                    el.style.opacity = '1'
                    el.style.transform = 'none'
                }
            })
        }, 3000)

        // Watch for page height changes (images loading, async data) and refresh triggers
        let ro
        const mainEl = document.querySelector('main')
        if (mainEl && typeof ResizeObserver !== 'undefined') {
            let debounce
            ro = new ResizeObserver(() => {
                clearTimeout(debounce)
                debounce = setTimeout(() => ScrollTrigger.refresh(), 150)
            })
            ro.observe(mainEl)
        }

        return () => {
            clearTimeout(t1)
            clearTimeout(t2)
            clearTimeout(t3)
            clearTimeout(t4)
            clearTimeout(tSafety)
            if (ro) ro.disconnect()
            if (isHome) { ctx.revert() } else { ctx.kill() }
        }
    }, [isHome])

    return (
        <footer ref={footerRef} className={`footer${isHome ? '' : ' footer--dark-reveal'}`}>
            {/* Veil only rendered on home page */}
            {isHome && <div ref={veilRef} className="footer-veil" />}

            {/* Footer content — revealed beneath */}
            <div className="footer-content">
                {/* Top row */}
                <div className="footer-top container">
                    <div className="footer-col">
                        <div className="footer-brand-row">
                            <img src={logoImg} alt="" className="footer-brand-logo" />
                            <div>
                                <p className="footer-brand-name">Madhwa Hrudaya Vaasa</p>
                                <p className="footer-brand-sub">Tattva · Bhakti · Vichara</p>
                            </div>
                        </div>
                        <p className="footer-contact-label">New Episodes:</p>
                        <a href="mailto:madhwahrudayavasa@gmail.com" className="footer-email">
                            madhwahrudayavasa@gmail.com
                        </a>
                        <div className="footer-newsletter">
                            <p className="footer-nl-label">Subscribe (no spam)</p>
                            <form className="footer-nl-form" onSubmit={e => e.preventDefault()}>
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="footer-nl-input"
                                />
                                <button type="submit" className="footer-nl-btn">→</button>
                            </form>
                        </div>
                    </div>

                    <div className="footer-nav-cols">
                        <nav className="footer-nav">
                            <span className="footer-nav-heading">Pages</span>
                            <Link to="/">Home</Link>
                            <Link to="/library">Library</Link>
                            <Link to="/contact">Contact</Link>
                        </nav>
                        <nav className="footer-nav">
                            <span className="footer-nav-heading">Socials</span>
                            <a href="https://www.youtube.com/@Madhwahrudayavasa" target="_blank" rel="noopener noreferrer">YouTube ↗</a>
                            <a href="https://www.instagram.com/madhwahrudayavasa/" target="_blank" rel="noopener noreferrer">Instagram ↗</a>
                        </nav>
                    </div>

                    <div className="footer-meta">
                        <p className="footer-location">Bangalore — India</p>
                        <div className="footer-legal">
                            <span>©️ 2025–26</span>
                            <span>Terms</span>
                        </div>
                    </div>
                </div>

                {/* Wordmark — massive styled brand name at bottom */}
                <div className="footer-wordmark">
                    <span className="footer-wm-en">Madhwa</span>
                    <span className="footer-wm-kn">ಹೃದಯ</span>
                    <span className="footer-wm-en footer-wm-en--dim">Vaasa</span>
                </div>

                {/* Credit */}
                <div className="footer-credit">
                    <span>Made by</span>
                    <a href="https://cogniwire.tech" target="_blank" rel="noopener noreferrer">cogniwire.tech</a>
                </div>
            </div>
        </footer>
    )
}
