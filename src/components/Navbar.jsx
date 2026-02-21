import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { gsap } from 'gsap'
import './Navbar.css'

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const navRef = useRef(null)
    const location = useLocation()

    /* scroll state for dark/light blend */
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40)
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    useEffect(() => { setMenuOpen(false) }, [location])

    const links = [
        { label: 'Home', path: '/' },
        { label: 'Library', path: '/library' },
        { label: 'Contact', path: '/contact' },
    ]

    return (
        <>
            <nav ref={navRef} className={`nav${scrolled ? ' scrolled' : ''}`}>
                {/* Left — brand */}
                <Link to="/" className="nav-brand">
                    ಮಧ್ವ ಹೃದಯ ವಾಸಿ
                </Link>

                {/* Center — links */}
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

                {/* Right — CTA */}
                <a href="mailto:madhwahrudayavaasi@gmail.com" className="nav-cta">
                    Join a Podcast ↗
                </a>

                {/* Mobile hamburger */}
                <button
                    className={`nav-burger${menuOpen ? ' open' : ''}`}
                    onClick={() => setMenuOpen(v => !v)}
                    aria-label="Menu"
                >
                    <span /><span />
                </button>
            </nav>

            {/* Mobile overlay */}
            <div className={`nav-mobile${menuOpen ? ' open' : ''}`}>
                {links.map(l => (
                    <Link key={l.path} to={l.path} className="nav-mobile-link">
                        {l.label}
                    </Link>
                ))}
                <a href="mailto:madhwahrudayavaasi@gmail.com" className="nav-mobile-cta">
                    Join a Podcast ↗
                </a>
            </div>
        </>
    )
}
