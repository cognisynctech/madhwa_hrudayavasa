import { useEffect, useRef, useCallback } from 'react'

/* ─── Particle config ─── */
const CONFIG = {
    maxParticles: 50,
    spawnPerMove: 1,
    baseSize: 1.0,
    sizeVariance: 1.5,
    speedBase: 0.05,
    speedVariance: 0.1,
    life: 0.006,        // slow fade
    gravityY: -0.05,    // barely drifting
    // Mostly white, occasional copper, forming structure
    colours: ['rgba(255,255,255,', 'rgba(255,255,255,', 'rgba(200,150,62,'],
}

function createParticle(x, y) {
    const angle = Math.random() * Math.PI * 2
    const speed = CONFIG.speedBase + Math.random() * CONFIG.speedVariance
    const col = CONFIG.colours[Math.floor(Math.random() * CONFIG.colours.length)]
    return {
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + CONFIG.gravityY,
        size: CONFIG.baseSize + Math.random() * CONFIG.sizeVariance,
        opacity: 0.5 + Math.random() * 0.4,
        col,
    }
}

export default function HeroParticles({ containerRef }) {
    const canvasRef = useRef(null)
    const particlesRef = useRef([])
    const rafRef = useRef(null)
    const activeRef = useRef(false)  // true while mouse is inside

    // Resize canvas to match container
    const resize = useCallback(() => {
        const canvas = canvasRef.current
        const container = containerRef?.current
        if (!canvas || !container) return
        const { width, height } = container.getBoundingClientRect()
        canvas.width = width
        canvas.height = height
    }, [containerRef])

    useEffect(() => {
        resize()
        window.addEventListener('resize', resize)
        return () => window.removeEventListener('resize', resize)
    }, [resize])

    // Animation loop
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')

        function loop() {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            particlesRef.current = particlesRef.current.filter(p => p.opacity > 0.02)

            for (let i = 0; i < particlesRef.current.length; i++) {
                const p1 = particlesRef.current[i];
                p1.x += p1.vx
                p1.y += p1.vy
                p1.opacity -= CONFIG.life

                // Draw constellation lines
                for (let j = i + 1; j < particlesRef.current.length; j++) {
                    const p2 = particlesRef.current[j];
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 45) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - dist / 45) * Math.min(p1.opacity, p2.opacity) * 0.8})`;
                        ctx.lineWidth = 0.6;
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }

                // Draw glowing dot
                ctx.save()
                ctx.globalAlpha = p1.opacity
                const grd = ctx.createRadialGradient(p1.x, p1.y, 0, p1.x, p1.y, p1.size * 2)
                grd.addColorStop(0, `${p1.col}${p1.opacity.toFixed(2)})`)
                grd.addColorStop(1, `${p1.col}0)`)
                ctx.fillStyle = grd
                ctx.beginPath()
                ctx.arc(p1.x, p1.y, p1.size * 2, 0, Math.PI * 2)
                ctx.fill()

                ctx.fillStyle = `${p1.col}${p1.opacity.toFixed(2)})`
                ctx.beginPath()
                ctx.arc(p1.x, p1.y, p1.size * 0.5, 0, Math.PI * 2)
                ctx.fill()
                ctx.restore()
            }

            rafRef.current = requestAnimationFrame(loop)
        }

        rafRef.current = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(rafRef.current)
    }, [])

    // Spawn on mouse move globally, but only if hovering a letter
    useEffect(() => {
        const handleGlobalMouseMove = (e) => {
            const mTarget = e.target.closest('.hoverable-char')
            if (!mTarget) return

            const canvas = canvasRef.current
            if (!canvas) return

            const canvasRect = canvas.getBoundingClientRect()
            const charRect = mTarget.getBoundingClientRect()

            // Randomize spawn position across the character bounds rather than pinpointing cursor
            for (let i = 0; i < CONFIG.spawnPerMove; i++) {
                if (particlesRef.current.length < CONFIG.maxParticles) {
                    const spawnX = (charRect.left - canvasRect.left) + Math.random() * charRect.width
                    const spawnY = (charRect.top - canvasRect.top) + Math.random() * charRect.height
                    particlesRef.current.push(createParticle(spawnX, spawnY))
                }
            }
        }

        window.addEventListener('mousemove', handleGlobalMouseMove)
        return () => window.removeEventListener('mousemove', handleGlobalMouseMove)
    }, [])

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',  /* ignores mouse so text gets hover state */
                zIndex: 5,
                mixBlendMode: 'screen', /* particles composite on dark bg beautifully */
            }}
        />
    )
}
