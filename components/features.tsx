"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useReducedMotion } from "framer-motion"
import { useRef, useState } from "react"

// Bento data: top row (2 large cards) and bottom row (4 smaller cards)
const topCards = [
  {
    key: "quantum",
    title: "Instant Toggle",
    description:
      "Press Alt+\\ from anywhere to instantly hide or show HideMyBrowser. Works system-wide in milliseconds.",
    badge: "Neural Detection",
    image: "/feature/quantum.jpg",
  },
  {
    key: "stealth",
    title: "Screen Share Invisible",
    description:
      "Completely undetectable during screen shares and video calls. Your browser won't appear in any recordings or shared screens.",
    badge: "Undetectable",
    image: "/feature/stealth.jpg",
  },
]

const bottomCards = [
  {
    key: "ghost",
    title: "Zero Footprint",
    description:
      "Leaves no traces in taskbars, alt-tab menus, or system monitors when hidden. Truly invisible.",
    badge: "Invisible",
    image: "/feature/foot.jpg",
  },
  {
    key: "audio",
    title: "Otter.ai Optimized",
    description:
      "Perfect for seamless meeting transcription. Run Otter.ai in the background without anyone knowing.",
    badge: "Covert",
    image: "/feature/otter.jpg",
  },
  {
    key: "multi",
    title: "Instant Hide/Unhide",
    description:
      "Use Alt+\\ on Windows or Control+\\ on Mac to instantly hide or reveal HideMyBrowser, no matter what app you're in.",
    badge: "Parallel",
    image: "/feature/ghost.jpg",
  },
]

// Bento layout uses simple placeholders for imagery which you can replace with real images later

type CardProps = {
  title: string
  description: string
  badge?: string
  size?: "lg" | "sm"
  image?: string
}

function BentoCard({ title, description, badge, size = "sm", image }: CardProps) {
  const prefersReducedMotion = useReducedMotion()
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 })
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([])
  const cardRef = useRef<HTMLDivElement>(null)

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return
    const el = cardRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    const ry = px * 10
    const rx = -py * 10
    setTilt({ rx, ry })
  }

  const onLeave = () => setTilt({ rx: 0, ry: 0 })

  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return
    const el = cardRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now()
    setRipples((prev) => [...prev, { id, x, y }])
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      className="group relative h-full rounded-2xl border border-white/10 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-xl overflow-hidden transition-shadow duration-300 hover:shadow-2xl hover:border-white/20"
      style={{
        transform: prefersReducedMotion
          ? undefined
          : `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        willChange: "transform",
        transition: "transform 200ms ease",
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute -left-1/2 top-0 h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-6" />
      </div>

      {ripples.map((r) => (
        <motion.span
          key={r.id}
          initial={{ opacity: 0.35, scale: 0 }}
          animate={{ opacity: 0, scale: 3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          onAnimationComplete={() => setRipples((prev) => prev.filter((x) => x.id !== r.id))}
          className="pointer-events-none absolute rounded-full bg-white/30 dark:bg-white/20"
          style={{ left: r.x - 40, top: r.y - 40, width: 80, height: 80 }}
        />
      ))}

      <div className={size === "lg" ? "p-8" : "p-6"}>
        {image ? (
          <motion.div
            whileHover={prefersReducedMotion ? undefined : { scale: 1.03, opacity: 1 }}
            initial={{ opacity: 0.95 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
            className={`overflow-hidden rounded-xl mb-5 border border-white/10`}
          >
            <img
              src={image}
              alt={title}
              className={`${size === "lg" ? "h-52" : "h-40"} w-full object-cover`}
            />
          </motion.div>
        ) : (
          <motion.div
            className={`${size === "lg" ? "h-52" : "h-40"} rounded-xl mb-5 bg-gradient-to-br from-slate-200/60 to-slate-100/40 dark:from-white/10 dark:to-white/5 border border-white/10`}
            whileHover={prefersReducedMotion ? undefined : { scale: 1.03, opacity: 1 }}
            initial={{ opacity: 0.9 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
          />
        )}

        <div className="flex items-start justify-between gap-4 mb-2">
          <h3 className={`${size === "lg" ? "text-2xl" : "text-xl"} font-bold text-gray-900 dark:text-white`}>{title}</h3>
          {badge ? (
            <span className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold bg-white/20 dark:bg-white/10 border border-white/20 text-gray-900 dark:text-white">
              {badge}
            </span>
          ) : null}
        </div>
        <p className="text-sm sm:text-[15px] text-gray-700 dark:text-gray-300 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

export function Features() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="features" ref={ref} className="relative py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gray-50/50 dark:bg-background">
      
      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-14 md:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-gray-900 dark:text-white">
            Why Choose HideMyBrowser?
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            The only browser built specifically for professionals who need complete invisibility during meetings and screen shares.
          </p>
        </motion.div>

        {/* Bento Grid */}
        {/* Top row: 2 large cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {topCards.map((c, i) => (
            <motion.div
              key={c.key}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <BentoCard title={c.title} description={c.description} badge={c.badge} size="lg" image={(c as any).image} />
            </motion.div>
          ))}
        </div>

        {/* Bottom row: 3 smaller cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {bottomCards.map((c, i) => (
            <motion.div
              key={c.key}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <BentoCard title={c.title} description={c.description} badge={c.badge} image={(c as any).image} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}