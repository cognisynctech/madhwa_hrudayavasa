import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './Contact.css'

gsap.registerPlugin(ScrollTrigger)

const teamImages = import.meta.glob('../assets/team/*.{jpg,jpeg,png,webp}', { eager: true })

function getTeamPhoto(name, photoSlug) {
    const slug = (photoSlug || name).toLowerCase().replaceAll(' ', '')
    const key = Object.keys(teamImages).find((k) => {
        const fn = k.split('/').pop().split('.')[0].toLowerCase().replaceAll(/[\s_-]+/g, '')
        return fn === slug || slug.includes(fn) || fn.includes(slug)
    })
    return key ? teamImages[key].default : null
}

function getInitials(name) {
    return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

const team = [
    { name: 'Sarvottam', insta: '#' },
    { name: 'Srinidhi', insta: '#' },
    { name: 'Pranava',  photoSlug: 'anirudha', insta: '#' },
    { name: 'Anirudha', photoSlug: 'pranava', insta: '#'  },
    { name: 'Smriti', insta: '#' },
]

export default function Contact() {
    const pageRef = useRef(null)

    useEffect(() => { document.title = 'Contact | Madhwa Hrudaya Vasa' }, [])

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.utils.toArray('[data-reveal]').forEach((el) => {
                gsap.fromTo(el,
                    { opacity: 0, y: 36 },
                    {
                        opacity: 1, y: 0,
                        duration: 0.9,
                        ease: 'power3.out',
                        scrollTrigger: { trigger: el, start: 'top 88%' },
                    }
                )
            })
        }, pageRef)
        return () => ctx.revert()
    }, [])

    return (
        <main className="con" ref={pageRef}>

            {/* ── Hero ─────────────────────────────────────────── */}
            <section className="con-hero">
                <div className="con-hero-bg">
                    <span className="con-hero-wm" aria-hidden="true">ಮಧ್ವ</span>
                </div>
                <div className="container con-hero-inner">
                    <div className="con-hero-top">
                        <span className="con-hero-kicker">The People</span>
                        <span className="con-hero-ep-count">{team.length} members</span>
                    </div>
                    <h1 className="con-hero-title anim-fadein">
                        Voices behind<br />
                        <em>the tradition.</em>
                    </h1>
                </div>
            </section>

            {/* ── Team portraits ────────────────────────────────── */}
            <section className="con-team">
                <div className="container">
                    <div className="con-team-grid">
                        {team.map((m, i) => {
                            const photo = getTeamPhoto(m.name, m.photoSlug)
                            return (
                                <div key={m.name} className="con-member" data-reveal style={{ '--i': i }}>
                                    <div className="con-member-photo">
                                        {photo ? (
                                            <img src={photo} alt={m.name} />
                                        ) : (
                                            <div className="con-member-initials">
                                                {getInitials(m.name)}
                                            </div>
                                        )}
                                        <div className="con-member-overlay">
                                            <span className="con-member-num">0{i + 1}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.2rem' }}>
                                        <p className="con-member-name" style={{ marginTop: '0' }}>{m.name}</p>
                                        <a href={m.insta} target="_blank" rel="noopener noreferrer" className="con-member-insta" aria-label={`${m.name} on Instagram`}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                                            </svg>
                                        </a>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            <div className="container"><div className="rule" /></div>

            {/* ── About ─────────────────────────────────────────── */}
            <section className="con-about" data-reveal>
                <div className="container">
                    <div className="con-about-row">
                        <p className="con-about-label">About the podcast</p>
                        <div className="con-about-body">
                            <p>
                                <strong>ಮಧ್ವ ಹೃದಯ ವಾಸ</strong> — "one who resides in the heart of Madhwa" —
                                is a podcast dedicated to exploring Dwaita Vedanta, the philosophy of
                                Sri Madhvacharya.
                            </p>
                            <p>
                                Through long-form conversations with Swamijis, pandit scholars, and
                                practitioners, we explore the metaphysics, epistemology, devotional
                                practices, and living traditions of Tattvavada.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <div className="container"><div className="rule" /></div>

            {/* ── CTA + Socials ─────────────────────────────────── */}
            <section className="con-cta" data-reveal>
                <div className="container">
                    <div className="con-cta-inner">
                        <div className="con-cta-left">
                            <span className="con-cta-eyebrow">Get in touch</span>
                            <h2 className="con-cta-heading">Let's<br />talk.</h2>
                        </div>
                        <div className="con-cta-right">
                            <p className="con-cta-sub">
                                Interested in being a guest? Have an episode suggestion?
                                Or just want to connect with the team?
                            </p>
                            <a href="mailto:madhwahrudayavasa@gmail.com" className="con-cta-btn">
                                <span>madhwahrudayavasa@gmail.com</span>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2.5">
                                    <path d="M7 17L17 7M7 7h10v10" />
                                </svg>
                            </a>
                            <div className="con-social-row">
                                <a href="https://www.youtube.com/@Madhwahrudayavasa" target="_blank"
                                   rel="noopener noreferrer" className="con-social-link">
                                    YouTube ↗
                                </a>
                                <a href="https://www.instagram.com/madhwahrudayavasa/" target="_blank"
                                   rel="noopener noreferrer" className="con-social-link">
                                    Instagram ↗
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        </main>
    )
}
