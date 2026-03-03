import { useEffect, useRef, useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import { gsap } from 'gsap'
import './VideoModal.css'

function fmt(s) {
    if (!s || Number.isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function VideoModal({ src, isOpen, onClose }) {
    const overlayRef   = useRef(null)
    const wrapRef      = useRef(null)
    const videoRef     = useRef(null)
    const topBarRef    = useRef(null)
    const bottomBarRef = useRef(null)
    const tlRef        = useRef(null)
    const prevOpen     = useRef(false)
    const scrubbing    = useRef(false)
    const [cursor, setCursor]     = useState({ x: -9999, y: -9999 })
    const [progress, setProgress] = useState(0)       // 0–1
    const [duration, setDuration] = useState(0)
    const [currentT, setCurrentT] = useState(0)
    const [paused, setPaused]     = useState(false)
    const [ready, setReady]       = useState(false)   // timeline visible once video plays

    /* ── Wire video events (re-run when src changes so listeners attach to the new <video>) ── */
    useEffect(() => {
        const video = videoRef.current
        if (!video) return
        const onTime = () => {
            if (!scrubbing.current) {
                setCurrentT(video.currentTime)
                setProgress(video.duration ? video.currentTime / video.duration : 0)
            }
        }
        const onMeta  = () => setDuration(video.duration)
        const onPlay  = () => { setPaused(false); setReady(true) }
        const onPause = () => setPaused(true)
        video.addEventListener('timeupdate',  onTime)
        video.addEventListener('loadedmetadata', onMeta)
        video.addEventListener('play',  onPlay)
        video.addEventListener('pause', onPause)
        return () => {
            video.removeEventListener('timeupdate',  onTime)
            video.removeEventListener('loadedmetadata', onMeta)
            video.removeEventListener('play',  onPlay)
            video.removeEventListener('pause', onPause)
        }
    }, [src])

    /* Reset timeline when modal closes */
    useEffect(() => {
        if (!isOpen) { setProgress(0); setCurrentT(0); setDuration(0); setReady(false) }
    }, [isOpen])

    /* ── Scrub helpers ── */
    const seek = useCallback((e) => {
        const bar = e.currentTarget
        const rect = bar.getBoundingClientRect()
        const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
        setProgress(ratio)
        const video = videoRef.current
        if (video?.duration) {
            video.currentTime = ratio * video.duration
            setCurrentT(video.currentTime)
        }
    }, [])

    const onScrubStart = useCallback((e) => {
        scrubbing.current = true
        seek(e)
    }, [seek])

    const onScrubMove = useCallback((e) => {
        if (!scrubbing.current) return
        e.preventDefault()
        seek(e)
    }, [seek])

    const onScrubEnd = useCallback(() => { scrubbing.current = false }, [])

    const togglePlay = useCallback((e) => {
        e.stopPropagation()
        const video = videoRef.current
        if (!video) return
        video.paused ? video.play().catch(() => {}) : video.pause()
    }, [])

    useEffect(() => {
        const overlay   = overlayRef.current
        const wrap      = wrapRef.current
        const video     = videoRef.current
        const topBar    = topBarRef.current
        const bottomBar = bottomBarRef.current
        if (!overlay || !wrap || !topBar || !bottomBar) return

        if (tlRef.current) tlRef.current.kill()

        if (isOpen && !prevOpen.current) {
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
        <dialog // NOSONAR — modal overlay requires mouse/keyboard listeners for close & cursor
            ref={overlayRef}
            className="vmodal"
            aria-label="Video player"
            style={{ opacity: 0, visibility: 'hidden', pointerEvents: 'none' }}
            onMouseMove={(e) => setCursor({ x: e.clientX, y: e.clientY })}
            onMouseLeave={() => setCursor({ x: -9999, y: -9999 })}
            onClick={onClose}
            onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
        >
            <div ref={topBarRef}    className="vmodal-bar vmodal-bar--top" />
            <div ref={bottomBarRef} className="vmodal-bar vmodal-bar--bottom" />

            <div ref={wrapRef} className="vmodal-wrap">
                {src ? (
                    <video
                        ref={videoRef}
                        src={src}
                        playsInline
                        className="vmodal-video"
                    >
                        <track kind="captions" />
                    </video>
                ) : (
                    <div className="vmodal-video" />
                )}
            </div>

            {/* ── Timeline controls ── */}
            <div
                className={`vmodal-controls${ready ? ' vmodal-controls--visible' : ''}`}
                role="toolbar"
                aria-label="Video controls"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
            >
                {/* Play / Pause */}
                <button className="vmodal-playbtn" onClick={togglePlay} aria-label={paused ? 'Play' : 'Pause'}>
                    {paused
                        ? <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                        : <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6zm8-14v14h4V5z"/></svg>
                    }
                </button>

                {/* Time */}
                <span className="vmodal-time">{fmt(currentT)}</span>

                {/* Scrub bar */}
                <div
                    className="vmodal-scrub"
                    role="slider"
                    aria-label="Seek video"
                    aria-valuenow={Math.round(progress * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    tabIndex={0}
                    onMouseDown={onScrubStart}
                    onMouseMove={onScrubMove}
                    onMouseUp={onScrubEnd}
                    onMouseLeave={onScrubEnd}
                >
                    <div className="vmodal-scrub-track">
                        <div className="vmodal-scrub-fill"  style={{ width: `${progress * 100}%` }} />
                        <div className="vmodal-scrub-thumb" style={{ left:  `${progress * 100}%` }} />
                    </div>
                </div>

                <span className="vmodal-time vmodal-time--dur">{fmt(duration)}</span>
            </div>

            {/* Close badge follows cursor */}
            <div className="vmodal-close-badge" style={{ left: cursor.x, top: cursor.y }}>
                <span>✕</span> Close Reel
            </div>
        </dialog>
    )
}

VideoModal.propTypes = {
    src: PropTypes.string,
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
}
