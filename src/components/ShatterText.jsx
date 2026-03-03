import { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'

/*
  ShatterText — Blob-based text shatter effect
  A soft blob follows the cursor affecting 2-3 characters at once.
  Characters get a glowing outline + inner light when the blob passes over.
  Scattered particles are white & gold with constellation lines.
*/

const CONFIG = {
    maxParticles: 140,
    particleLife: 3.5,
    connectionDistance: 130,
    blobRadius: 150,        // big enough to hit ~2-3 chars at once
    minSize: 2,
    maxSize: 7,
    colors: [
        'rgba(255, 255, 255,',  // white
        'rgba(255, 255, 255,',  // white (weighted)
        'rgba(212, 175, 55,',   // gold
        'rgba(255, 215, 0,',    // bright gold
        'rgba(200, 150, 62,',   // copper gold
    ],
}

function createParticle(x, y) {
    const angle = Math.random() * Math.PI * 2
    const distance = 5 + Math.random() * 45

    return {
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        vx: (Math.random() - 0.5) * 1.4,
        vy: (Math.random() - 0.5) * 1.1,
        size: CONFIG.minSize + Math.random() * (CONFIG.maxSize - CONFIG.minSize),
        opacity: 0,
        targetOpacity: 0.5 + Math.random() * 0.5,
        color: CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)],
        life: CONFIG.particleLife,
        age: 0,
        phase: Math.random() * Math.PI * 2,
    }
}

export default function ShatterText({ children, className = '' }) {
    const containerRef = useRef(null)
    const canvasRef = useRef(null)
    const particlesRef = useRef([])
    const rafRef = useRef(null)
    const mouseRef = useRef({ x: -1000, y: -1000 })
    const lastSpawnRef = useRef(0)
    const charIntensityRef = useRef(new Map())

    // Resize canvas to match container
    useEffect(() => {
        const resize = () => {
            const canvas = canvasRef.current
            const container = containerRef.current
            if (!canvas || !container) return
            const { width, height } = container.getBoundingClientRect()
            canvas.width = width
            canvas.height = height
        }
        resize()
        window.addEventListener('resize', resize)
        return () => window.removeEventListener('resize', resize)
    }, [])

    // Animation loop — particles + constellation lines
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        let time = 0

        function updateOpacity(p) {
            const lifeRatio = p.age / p.life
            if (lifeRatio < 0.12) {
                p.opacity = (lifeRatio / 0.12) * p.targetOpacity
            } else if (lifeRatio > 0.55) {
                p.opacity = p.targetOpacity * (1 - (lifeRatio - 0.55) / 0.45)
            } else {
                p.opacity = p.targetOpacity
            }
        }

        function drawLines(p, alpha, i, particles) {
            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j]
                const dist = Math.hypot(p.x - p2.x, p.y - p2.y)
                if (dist < CONFIG.connectionDistance) {
                    const lineAlpha = (1 - dist / CONFIG.connectionDistance) *
                        Math.min(alpha, p2.opacity) * 0.5
                    const isGold = (i + j) % 3 === 0
                    ctx.beginPath()
                    ctx.strokeStyle = isGold
                        ? `rgba(212, 175, 55, ${lineAlpha})`
                        : `rgba(255, 255, 255, ${lineAlpha})`
                    ctx.lineWidth = 0.8
                    ctx.moveTo(p.x, p.y)
                    ctx.lineTo(p2.x, p2.y)
                    ctx.stroke()
                }
            }
        }

        function drawParticle(p, alpha) {
            ctx.save()
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4)
            grad.addColorStop(0, `${p.color}${alpha.toFixed(2)})`)
            grad.addColorStop(0.25, `${p.color}${(alpha * 0.6).toFixed(2)})`)
            grad.addColorStop(0.6, `${p.color}${(alpha * 0.15).toFixed(2)})`)
            grad.addColorStop(1, `${p.color}0)`)
            ctx.fillStyle = grad
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2)
            ctx.fill()

            ctx.fillStyle = `${p.color}${Math.min(alpha * 1.2, 1).toFixed(2)})`
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2)
            ctx.fill()
            ctx.restore()
        }

        function animate() {
            time += 0.016
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            const particles = particlesRef.current

            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i]
                p.age += 0.016
                p.x += p.vx
                p.y += p.vy
                p.vx *= 0.994
                p.vy *= 0.994

                updateOpacity(p)

                if (p.age >= p.life) {
                    particles.splice(i, 1)
                    continue
                }

                const twinkle = 0.65 + 0.35 * Math.sin(time * 4.5 + p.phase)
                const alpha = p.opacity * twinkle

                drawLines(p, alpha, i, particles)
                drawParticle(p, alpha)
            }

            rafRef.current = requestAnimationFrame(animate)
        }

        animate()
        return () => cancelAnimationFrame(rafRef.current)
    }, [])

    // Mouse tracking — blob covers 2-3 chars, sets --shatter-intensity per char
    useEffect(() => {
        const intensityMap = charIntensityRef.current

        const handleMouseMove = (e) => {
            const canvas = canvasRef.current
            const container = containerRef.current
            if (!canvas || !container) return

            const rect = canvas.getBoundingClientRect()
            const mouseX = e.clientX - rect.left
            const mouseY = e.clientY - rect.top
            mouseRef.current = { x: mouseX, y: mouseY }

            const chars = container.querySelectorAll('.hoverable-char')

            chars.forEach((char, index) => {
                const cr = char.getBoundingClientRect()
                const cx = (cr.left - rect.left) + cr.width / 2
                const cy = (cr.top - rect.top) + cr.height / 2
                const dist = Math.hypot(mouseX - cx, mouseY - cy)

                if (dist < CONFIG.blobRadius) {
                    const intensity = Math.max(0, 1 - dist / CONFIG.blobRadius)
                    const prev = intensityMap.get(index) || 0
                    const next = prev + (intensity - prev) * 0.3
                    intensityMap.set(index, next)
                    char.style.setProperty('--shatter-intensity', next.toFixed(3))
                    char.classList.add('shatter-active')

                    // Spawn particles
                    const now = Date.now()
                    if (now - lastSpawnRef.current > 25) {
                        lastSpawnRef.current = now
                        const count = Math.ceil(2 + intensity * 4)
                        for (let i = 0; i < count; i++) {
                            if (particlesRef.current.length < CONFIG.maxParticles) {
                                const sx = (cr.left - rect.left) + Math.random() * cr.width
                                const sy = (cr.top - rect.top) + Math.random() * cr.height
                                particlesRef.current.push(createParticle(sx, sy))
                            }
                        }
                    }
                } else {
                    const prev = intensityMap.get(index) || 0
                    if (prev > 0.01) {
                        const next = prev * 0.88
                        intensityMap.set(index, next)
                        char.style.setProperty('--shatter-intensity', next.toFixed(3))
                    } else {
                        intensityMap.delete(index)
                        char.style.removeProperty('--shatter-intensity')
                        char.classList.remove('shatter-active')
                    }
                }
            })
        }

        // Continuous decay loop for smooth fade-out
        let decayRaf
        const decayLoop = () => {
            const container = containerRef.current
            if (container) {
                container.querySelectorAll('.hoverable-char').forEach((char, index) => {
                    const prev = intensityMap.get(index) || 0
                    if (prev > 0.01) {
                        const next = prev * 0.93
                        intensityMap.set(index, next)
                        char.style.setProperty('--shatter-intensity', next.toFixed(3))
                    } else if (prev > 0) {
                        intensityMap.delete(index)
                        char.style.removeProperty('--shatter-intensity')
                        char.classList.remove('shatter-active')
                    }
                })
            }
            decayRaf = requestAnimationFrame(decayLoop)
        }

        decayLoop()
        globalThis.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseleave', () => {
            mouseRef.current = { x: -1000, y: -1000 }
        })
        return () => {
            cancelAnimationFrame(decayRaf)
            globalThis.removeEventListener('mousemove', handleMouseMove)
        }
    }, [])

    return (
        <div
            ref={containerRef}
            className={`shatter-text-container ${className}`}
            style={{ position: 'relative' }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: 10,
                    mixBlendMode: 'screen',
                }}
            />
            <div style={{ position: 'relative', zIndex: 1 }}>
                {children}
            </div>
        </div>
    )
}

ShatterText.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
}
