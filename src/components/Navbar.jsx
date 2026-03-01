import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import logoImg from '../assets/pics/logo.jpg'
import { podcasts } from '../data/podcasts'
import './Navbar.css'

/* Sections that have a light/white background */
const LIGHT_SECTIONS = ['.ep-ticker', '.philosophy', '.video-grow', '.cta-section']
/* Hero or big dark immersive sections — navbar goes fully transparent here */
/* .lib and .con cover the entire Library/Contact pages (all-dark) */
const HERO_SECTIONS  = ['.hero', '.showreel-track', '.lib-hero', '.lib', '.con']

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false)
    const [theme, setTheme] = useState('hero') // 'hero' | 'dark' | 'light'
    const [libScrolled, setLibScrolled] = useState(false)
    const navRef = useRef(null)
    const location = useLocation()

    /* Detect which section the navbar overlaps — 3 states */
    useEffect(() => {
        const checkTheme = () => {
            const navEl = navRef.current
            if (!navEl) return
            const navBottom = navEl.getBoundingClientRect().bottom

            // 1. Check hero/immersive sections first → fully transparent
            for (const sel of HERO_SECTIONS) {
                const el = document.querySelector(sel)
                if (el) {
                    const rect = el.getBoundingClientRect()
                    if (rect.top < navBottom && rect.bottom > navBottom) {
                        setTheme('hero')
                        return
                    }
                }
            }

            // 2. Check light/white sections → light glass
            for (const sel of LIGHT_SECTIONS) {
                const el = document.querySelector(sel)
                if (el) {
                    const rect = el.getBoundingClientRect()
                    if (rect.top < navBottom && rect.bottom > 0) {
                        setTheme('light')
                        return
                    }
                }
            }

            // 3. Everything else → dark glass
            setTheme('dark')
        }

        window.addEventListener('scroll', checkTheme, { passive: true })
        checkTheme()

        return () => window.removeEventListener('scroll', checkTheme)
    }, [location])

    /* Library — track when user scrolls past the hero */
    useEffect(() => {
        if (location.pathname !== '/library') {
            setLibScrolled(false)
            return
        }
        const track = () => {
            const hero = document.querySelector('.lib-hero')
            setLibScrolled(hero ? window.scrollY > hero.offsetTop + hero.offsetHeight * 0.75 : false)
        }
        window.addEventListener('scroll', track, { passive: true })
        track()
        return () => window.removeEventListener('scroll', track)
    }, [location.pathname])

    useEffect(() => { setMenuOpen(false) }, [location])

    const links = [
        { label: 'Home', path: '/' },
        { label: 'Library', path: '/library' },
        { label: 'Contact', path: '/contact' },
    ]

    return (
        <>
            <nav ref={navRef} className={`nav nav--${theme}`}>
                <Link to="/" className="nav-brand">
                    <img src={logoImg} alt="Madhwa Hrudaya Vaasa" className="nav-logo" />
                </Link>

                <ul className="nav-links">
                    {links.map(l => (
                        <li key={l.path}>
                            <Link
                                to={l.path}
                                className={`nav-link${location.pathname === l.path ? ' active' : ''}`}
                            >
                                {l.label}
                            </Link>
                        </li>
                    ))}
                </ul>

                {/* Library scroll context — fades in when past the hero */}
                <div className={`nav-ctx${libScrolled ? ' nav-ctx--visible' : ''}`}>
                    <span className="nav-ctx-label">Library</span>
                    <span className="nav-ctx-dot" />
                    <span className="nav-ctx-count">{podcasts.length} Episodes</span>
                </div>

                <a href="mailto:madhwahrudayavasa@gmail.com" className="nav-cta">
                    Join a Podcast ↗
                </a>

                <button
                    className={`nav-burger${menuOpen ? ' open' : ''}`}
                    onClick={() => setMenuOpen(v => !v)}
                    aria-label="Menu"
                >
                    <span /><span />
                </button>
            </nav>

            <div className={`nav-mobile${menuOpen ? ' open' : ''}`}>
                {links.map(l => (
                    <Link key={l.path} to={l.path} className="nav-mobile-link">
                        {l.label}
                    </Link>
                ))}
                <a href="mailto:madhwahrudayavasa@gmail.com" className="nav-mobile-cta">
                    Join a Podcast ↗
                </a>
            </div>
        </>
    )
}
