import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import './CustomCursor.css'

export default function CustomCursor() {
    const cursorRef = useRef(null)
    const followerRef = useRef(null)

    useEffect(() => {
        const cursor = cursorRef.current
        const follower = followerRef.current

        const xTo = gsap.quickTo(cursor, 'x', { duration: 0.1, ease: 'power3' })
        const yTo = gsap.quickTo(cursor, 'y', { duration: 0.1, ease: 'power3' })
        const xToF = gsap.quickTo(follower, 'x', { duration: 0.35, ease: 'power3' })
        const yToF = gsap.quickTo(follower, 'y', { duration: 0.35, ease: 'power3' })

        const onMove = (e) => {
            xTo(e.clientX)
            yTo(e.clientY)
            xToF(e.clientX)
            yToF(e.clientY)
        }

        const onEnterLink = () => {
            gsap.to(cursor, { scale: 2.5, duration: 0.3, ease: 'power2.out' })
            gsap.to(follower, { scale: 1.8, opacity: 0.5, duration: 0.3 })
        }

        const onLeaveLink = () => {
            gsap.to(cursor, { scale: 1, duration: 0.3, ease: 'power2.out' })
            gsap.to(follower, { scale: 1, opacity: 1, duration: 0.3 })
        }

        window.addEventListener('mousemove', onMove)

        const links = document.querySelectorAll('a, button, .video-card')
        links.forEach((el) => {
            el.addEventListener('mouseenter', onEnterLink)
            el.addEventListener('mouseleave', onLeaveLink)
        })

        return () => {
            window.removeEventListener('mousemove', onMove)
        }
    }, [])

    return (
        <>
            <div ref={cursorRef} className="cursor" />
            <div ref={followerRef} className="cursor-follower" />
        </>
    )
}
