import { useRef, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './Footer.css'

gsap.registerPlugin(ScrollTrigger)

export default function Footer() {
    const footerRef = useRef(null)
    const veilRef = useRef(null)
    const [email, setEmail] = useState('')

    /* White veil scrolls UP to reveal dark footer beneath */
    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.to(veilRef.current, {
                yPercent: -100,
                ease: 'none',
                scrollTrigger: {
                    trigger: footerRef.current,
                    start: 'top bottom',
                    end: 'top 20%',
                    scrub: 1.2,
                },
            })
        })
        return () => ctx.revert()
    }, [])

    return (
        <footer ref={footerRef} className="footer">
            {/* White veil that scrolls up */}
            <div ref={veilRef} className="footer-veil" />

            {/* Footer content — revealed beneath */}
            <div className="footer-content">
                {/* Top row */}
                <div className="footer-top container">
                    <div className="footer-col">
                        <p className="footer-tagline">Do it once. Do it right.</p>
                        <p className="footer-contact-label">New Episodes:</p>
                        <a href="mailto:madhwahrudayavaasi@gmail.com" className="footer-email">
                            madhwahrudayavaasi@gmail.com
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
                            <Link to="/">Home</Link>
                            <Link to="/library">Library</Link>
                            <Link to="/contact">Contact</Link>
                        </nav>
                        <nav className="footer-nav">
                            <a href="https://www.youtube.com/@MadhwaHrudayaVaasi" target="_blank" rel="noreferrer">YouTube ↗</a>
                            <a href="https://www.instagram.com" target="_blank" rel="noreferrer">Instagram ↗</a>
                        </nav>
                    </div>

                    <div className="footer-meta">
                        <p className="footer-location">Udupi — India</p>
                        <div className="footer-legal">
                            <span>©️25–26</span>
                            <span>Terms</span>
                        </div>
                    </div>
                </div>

                {/* Wordmark — massive brand name at bottom */}
                <div className="footer-wordmark">
                    <span className="footer-wm-kn">ಮಧ್ವ ಹೃದಯ ವಾಸಿ</span>
                </div>
            </div>
        </footer>
    )
}
