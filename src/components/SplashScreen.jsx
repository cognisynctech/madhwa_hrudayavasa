import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import logoImg from '../assets/pics/logo.jpg'
import './SplashScreen.css'

/**
 * SplashScreen — Minimal logo-pulse loader.
 * Logo blinks with a golden ring pulse, then fades out.
 *
 * Props:
 *   onComplete — called when the splash finishes
 */
export default function SplashScreen({ onComplete }) {
    const splashRef = useRef(null)

    useEffect(() => {
        const tl = gsap.timeline()

        // Brief hold, then fade out fast
        tl.to(splashRef.current, {
            opacity: 0,
            duration: 0.35,
            ease: 'power2.inOut',
            delay: 0.6,
            onComplete: () => {
                if (splashRef.current) {
                    splashRef.current.style.display = 'none'
                }
                onComplete?.()
            },
        })

        return () => tl.kill()
    }, [onComplete])

    return (
        <div ref={splashRef} className="splash" aria-hidden="true">
            <div className="splash-logo-wrap">
                <span className="splash-ring" />
                <span className="splash-ring" />
                <img src={logoImg} alt="" className="splash-logo" />
            </div>
        </div>
    )
}
