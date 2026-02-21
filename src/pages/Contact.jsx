import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './Contact.css'

gsap.registerPlugin(ScrollTrigger)

const team = [
    {
        id: 1,
        name: 'Raghavendra Acharya',
        role: 'Host & Founder',
        bio: 'A Madhwa scholar who spent a decade studying the Ashta Matha tradition. Started this podcast to make Dwaita accessible to a new generation.',
    },
    {
        id: 2,
        name: 'Srinivasa Bhatta',
        role: 'Co-Host & Producer',
        bio: 'Passionate about Haridasa literature and the musical traditions of the Madhwa sampradaya. Handles production and brings scholarly depth to every episode.',
    },
    {
        id: 3,
        name: 'Vidya Prabha',
        role: 'Research & Content',
        bio: 'Background in Sanskrit and Vedic studies. Crafts the questions that drive conversations deeper — every episode\'s depth is her contribution.',
    },
]

export default function Contact() {
    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.utils.toArray('[data-reveal]').forEach((el) => {
                gsap.fromTo(el,
                    { opacity: 0, y: 30 },
                    {
                        opacity: 1, y: 0,
                        duration: 0.8,
                        ease: 'power3.out',
                        scrollTrigger: { trigger: el, start: 'top 88%' },
                    }
                )
            })
        })
        return () => ctx.revert()
    }, [])

    return (
        <main className="con">

            {/* Title */}
            <section className="con-header">
                <div className="con-title-wrap">
                    <h1 className="con-title anim-fadein">The People</h1>
                </div>
                <div className="container">
                    <div className="rule" />
                </div>
            </section>

            {/* About - 2 col */}
            <section className="con-about" data-reveal>
                <div className="container">
                    <div className="con-about-row">
                        <p className="con-about-label">About the podcast</p>
                        <div className="con-about-body">
                            <p>
                                <strong>ಮಧ್ವ ಹೃದಯ ವಾಸಿ</strong> — "one who resides in the heart of Madhwa" —
                                is a podcast dedicated to exploring Dwaita Vedanta, the philosophy of Sri Madhvacharya.
                            </p>
                            <p>
                                Through long-form conversations with Swamijis, pandit scholars, and practitioners,
                                we explore the metaphysics, epistemology, devotional practices, and living traditions
                                of Tattvavada.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Team */}
            <section className="con-team">
                <div className="container">
                    <div className="rule" />
                    <div className="con-team-header" data-reveal>
                        <h2 className="con-team-heading">Team</h2>
                    </div>
                    <div className="rule" />
                    {team.map((m, i) => (
                        <div key={m.id} data-reveal>
                            <div className="con-team-row">
                                <span className="con-team-num">0{i + 1}</span>
                                <div className="con-team-info">
                                    <p className="con-team-name">{m.name}</p>
                                    <p className="con-team-role">{m.role}</p>
                                </div>
                                <p className="con-team-bio">{m.bio}</p>
                            </div>
                            <div className="rule" />
                        </div>
                    ))}
                </div>
            </section>

            {/* Contact CTA */}
            <section className="con-cta" data-reveal>
                <div className="container">
                    <div className="rule" />
                    <div className="con-cta-inner">
                        <h2 className="con-cta-heading">Let's talk.</h2>
                        <div className="con-cta-right">
                            <p className="con-cta-sub">
                                Interested in being a guest? Have an episode suggestion?
                                Or just want to connect?
                            </p>
                            <a href="mailto:madhwahrudayavaasi@gmail.com" className="con-cta-btn">
                                madhwahrudayavaasi@gmail.com ↗
                            </a>
                        </div>
                    </div>
                    <div className="rule" />
                </div>
            </section>

            {/* Social */}
            <section className="con-social" data-reveal>
                <div className="container">
                    <div className="con-social-row">
                        <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" className="con-social-link">
                            YouTube ↗
                        </a>
                        <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="con-social-link">
                            Instagram ↗
                        </a>
                    </div>
                </div>
            </section>

        </main>
    )
}
