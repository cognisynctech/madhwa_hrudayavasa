import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import './VideoModal.css'

/**
 * VideoModal — Cinematic fullscreen video overlay.
 *
 * OPEN  → black backdrop fades in → letterbox bars slide in from top/bottom
 *         → video frame expands via clip-path from a small centre rect
 *         → letterbox bars snap away
 *
 * CLOSE → reverse: video shrinks back, bars flash in, fade out
 *
 * A "✕ Close Reel" badge follows the cursor.
 */
export default function VideoModal({ src, isOpen, onClose }) {
    const overlayRef   = useRef(null)
    const wrapRef      = useRef(null)
    const videoRef     = useRef(null)
    const topBarRef    = useRef(null)
    const bottomBarRef = useRef(null)
    const tlRef        = useRef(null)
    const prevOpen     = useRef(false)
    const [cursor, setCursor] = useState({ x: -9999, y: -9999 })

    useEffect(() => {
        const overlay   = overlayRef.current
        const wrap      = wrapRef.current
        const video     = videoRef.current
        const topBar    = topBarRef.current
        const bottomBar = bottomBarRef.current
        if (!overlay || !wrap || !topBar || !bottomBar) return

        if (tlRef.current) tlRef.current.kill()

        if (isOpen && !prevOpen.current) {
            // ── OPEN ──
            overlay.style.visibility = 'visible'
            overlay.style.pointerEvents = 'auto'

            gsap.set(overlay,   { opacity: 0 })
            gsap.set(wrap,      { clipPath: 'inset(28% 18% 28% 18% round 4px)' })
            gsap.set(topBar,    { scaleY: 0, transformOrigin: 'top center',    opacity: 1 })
            gsap.set(bottomBar, { scaleY: 0, transformOrigin: 'bottom center', opacity: 1 })

            const tl = gsap.timeline()
            tlRef.current = tl

            tl.to(overlay, { opacity: 1, duration: 0.35, ease: 'power2.out' })
            tl.to([topBar, bottomBar], { scaleY: 1, duration: 0.38, ease: 'power3.out' }, '-=0.1')
            tl.to(wrap, { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 0.85, ease: 'power4.out' }, '-=0.2')
            tl.to([topBar, bottomBar], { scaleY: 0, duration: 0.32, ease: 'power2.in' }, '-=0.3')
            tl.call(() => {
                if (video) { video.load(); video.currentTime = 0; video.play().catch(() => {}) }
            }, [], '-=0.55')

        } else if (!isOpen && prevOpen.current) {
            // ── CLOSE ──
            const tl = gsap.timeline({
                onComplete: () => {
                    overlay.style.visibility = 'hidden'
                    overlay.style.pointerEvents = 'none'
                    if (video) { video.pause(); video.currentTime = 0 }
                },
            })
            tlRef.current = tl

            gsap.set([topBar, bottomBar], { scaleY: 0, opacity: 1 })
            tl.to([topBar, bottomBar],  { scaleY: 1, duration: 0.28, ease: 'power3.out' })
            tl.to(wrap,                 { clipPath: 'inset(28% 18% 28% 18% round 4px)', duration: 0.6, ease: 'power4.in' }, '-=0.1')
            tl.to([overlay, topBar, bottomBar], { opacity: 0, duration: 0.32, ease: 'power2.in' }, '-=0.1')
        }

        prevOpen.current = isOpen
    }, [isOpen])

    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [isOpen])

    return (
        <div
            ref={overlayRef}
            className="vmodal"
            style={{ opacity: 0, visibility: 'hidden', pointerEvents: 'none' }}
            onMouseMove={(e) => setCursor({ x: e.clientX, y: e.clientY })}
            onMouseLeave={() => setCursor({ x: -9999, y: -9999 })}
            onClick={onClose}
        >
            {/* Cinematic letterbox bars */}
            <div ref={topBarRef}    className="vmodal-bar vmodal-bar--top" />
            <div ref={bottomBarRef} className="vmodal-bar vmodal-bar--bottom" />

            <div ref={wrapRef} className="vmodal-wrap">
                {src ? (
                    <video
                        ref={videoRef}
                        src={src}
                        playsInline
                        className="vmodal-video"
                    />
                ) : (
                    <div className="vmodal-video" />
                )}
            </div>

            {/* Close badge follows cursor */}
            <div className="vmodal-close-badge" style={{ left: cursor.x, top: cursor.y }}>
                <span>✕</span> Close Reel
            </div>
        </div>
    )
}
