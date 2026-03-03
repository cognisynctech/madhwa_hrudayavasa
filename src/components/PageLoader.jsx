import { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { gsap } from 'gsap'
import './PageLoader.css'

/**
 * PageLoader — Awwwards-level cinematic intro animation.
 * Reveals "Madhwa / ಹೃದಯ / Vaasa" line by line, fills a gold progress bar,
 * then wipes the entire loader off-screen upward.
 *
 * Props:
 *   onComplete — called after wipe-out finishes
 */
export default function PageLoader({ onComplete }) {
    const loaderRef = useRef(null)
    const line1Ref  = useRef(null)
    const line2Ref  = useRef(null)
    const line3Ref  = useRef(null)
    const barRef    = useRef(null)
    const counterRef = useRef(null)

    useEffect(() => {
        const tl = gsap.timeline({
            defaults: { ease: 'power4.out' },
        })

        // 1. Staggered line-by-line reveal
        tl.to([line1Ref.current, line2Ref.current, line3Ref.current], {
            y: '0%',
            duration: 1,
            stagger: 0.15,
        }, 0.1)

        // 2. Gold progress bar fills (runs simultaneously with text)
        tl.fromTo(barRef.current,
            { scaleX: 0 },
            { scaleX: 1, duration: 1.6, ease: 'power2.inOut' },
            0.2
        )

        // 3. Counter 0 → 100 in sync with the bar
        const num = { val: 0 }
        tl.to(num, {
            val: 100,
            duration: 1.6,
            ease: 'power2.inOut',
            onUpdate() {
                if (counterRef.current) {
                    counterRef.current.textContent = Math.round(num.val)
                }
            },
        }, 0.2)

        // 4. Short hold, then wipe up
        tl.to(loaderRef.current, {
            yPercent: -102,
            duration: 0.95,
            ease: 'power3.inOut',
            delay: 0.25,
            onComplete: onComplete ?? (() => {}),
        })

        return () => tl.kill()
    }, [onComplete])

    return (
        <div ref={loaderRef} className="page-loader" aria-hidden="true">
            {/* Top-left label */}
            <span className="loader-eyebrow">Tattva · Bhakti · Vichara</span>

            {/* Year bottom-right */}
            <span className="loader-year">Est. 2024</span>

            <div className="loader-content">
                {/* Title — three lines, each clipped */}
                <div className="loader-title">
                    <div className="loader-line-wrap">
                        <span ref={line1Ref} className="loader-word">Madhwa</span>
                    </div>
                    <div className="loader-line-wrap">
                        <span ref={line2Ref} className="loader-word loader-word--kn">ಹೃದಯ</span>
                    </div>
                    <div className="loader-line-wrap">
                        <span ref={line3Ref} className="loader-word loader-word--accent">Vaasa</span>
                    </div>
                </div>

                {/* Progress bar + counter */}
                <div className="loader-bottom">
                    <div className="loader-bar-wrap">
                        <div ref={barRef} className="loader-bar-fill" />
                    </div>
                    <span ref={counterRef} className="loader-counter">0</span>
                </div>
            </div>
        </div>
    )
}

PageLoader.propTypes = {
    onComplete: PropTypes.func.isRequired,
}
