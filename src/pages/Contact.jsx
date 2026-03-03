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
    { name: 'Srinidhi' },
    { name: 'Sarvottam' },
    { name: 'Pranava',  photoSlug: 'anirudha' },
    { name: 'Anirudha', photoSlug: 'pranava'  },
    { name: 'Smriti' },
]

export default function Contact() {
    const pageRef = useRef(null)

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
                                    <p className="con-member-name">{m.name}</p>
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
