"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useReducedMotion } from "framer-motion"
import { useRef, useState } from "react"
import type { SVGProps } from "react"
import { HmbBolt, HmbEyeOff, HmbGhost, HmbMic, HmbKeyboard, HmbShield } from "./icons"
import { InvisibilityAnimation } from "@/components/animations/invisibility-animation"
import { WorkflowAnimation } from "@/components/animations/workflow-animation"
import { MiniInterviews, MiniPresentations, MiniMeetings } from "@/components/animations/mini-card-animations"
import { Check } from "lucide-react"

// Bento data: top row (2 large cards) and bottom row (4 smaller cards)
const topCards = [
  {
    key: "quantum",
    title: "Instant Toggle",
    description:
      "Press Alt+\\ from anywhere to instantly hide or show HideMyBrowser. Works system-wide in milliseconds.",
    badge: "Neural Detection",
    image: undefined,
    icon: HmbBolt,
    accent: "from-amber-400/30 to-amber-500/10",
    bullets: [
      "System-wide hotkey Alt+\\",
      "Instant response",
    ],
  },
  {
    key: "stealth",
    title: "Screen Share Invisible",
    description:
      "Completely undetectable during screen shares and video calls. Your browser won't appear in any recordings or shared screens.",
    badge: "Undetectable",
    image: undefined,
    icon: HmbEyeOff,
    accent: "from-violet-400/30 to-fuchsia-500/10",
    bullets: [
      "Hidden in screen shares",
      "Invisible in recordings",
    ],
  },
]

const bottomCards = [
  {
    key: "ghost",
    title: "Zero Footprint",
    description:
      "Leaves no traces in taskbars, alt-tab menus, or system monitors when hidden. Truly invisible.",
    badge: "Invisible",
    image: undefined,
    icon: HmbGhost,
    accent: "from-cyan-400/30 to-cyan-500/10",
    bullets: [
      "No taskbar or alt-tab",
      "No system monitor traces",
    ],
  },
  {
    key: "audio",
    title: "Otter.ai Optimized",
    description:
      "Perfect for seamless meeting transcription. Run Otter.ai in the background without anyone knowing.",
    badge: "Covert",
    image: undefined,
    icon: HmbMic,
    accent: "from-sky-400/30 to-sky-500/10",
    bullets: [
      "Run transcription silently",
      "Great for meetings",
    ],
  },
  {
    key: "multi",
    title: "Instant Hide/Unhide",
    description:
      "Use Alt+\\ on Windows or Control+\\ on Mac to instantly hide or reveal HideMyBrowser, no matter what app you're in.",
    badge: "Parallel",
    image: undefined,
    icon: HmbKeyboard,
    accent: "from-emerald-400/30 to-emerald-500/10",
    bullets: [
      "Works across apps",
      "Windows & Mac shortcuts",
    ],
  },
  {
    key: "shield",
    title: "Secure and Private",
    description:
      "Your browsing data is encrypted and protected from prying eyes. We respect your online privacy.",
    badge: "Secure",
    image: undefined,
    icon: HmbShield,
    accent: "from-blue-400/30 to-blue-500/10",
    bullets: [
      "Encrypted local data",
      "No tracking",
    ],
  },
]

// Bento layout uses simple placeholders for imagery which you can replace with real images later

type CardProps = {
  title: string
  description: string
  badge?: string
  size?: "lg" | "sm"
  image?: string
  icon?: (props: SVGProps<SVGSVGElement>) => JSX.Element
  accent?: string
  bullets?: string[]
}

function BentoCard({ title, description, badge, size = "sm", image, icon: Icon, accent }: CardProps) {
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
      className="group relative h-full rounded-2xl p-px overflow-hidden transition-shadow duration-300 hover:shadow-2xl"
      style={{
        transform: prefersReducedMotion
          ? undefined
          : `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        willChange: "transform",
        transition: "transform 200ms ease",
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.06))",
      }}
    >
      <div className="relative h-full rounded-2xl border border-white/10 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-xl overflow-hidden">
        {/* Accent glow */}
        <div className={`pointer-events-none absolute -inset-24 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100 ${accent ? `bg-gradient-to-br ${accent}` : "bg-gradient-to-br from-white/10 to-transparent"}`} />

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
          {Icon ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-xl bg-white/20 dark:bg-white/10 p-4 backdrop-blur-sm border border-white/20">
                <Icon className="h-8 w-8 text-white" />
              </div>
            </div>
          ) : null}

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
    </div>
  )
}

function FeatureItem({ title, description, icon: Icon, bullets }: Pick<CardProps, "title" | "description" | "icon" | "bullets">) {
  return (
    <div className="flex flex-col gap-3 items-center text-center">
      <div className="h-10 w-10 rounded-full bg-gray-100 text-gray-900 dark:bg-white/10 dark:text-white flex items-center justify-center">
        {Icon ? <Icon className="h-5 w-5" /> : null}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      {bullets && bullets.length ? (
        <ul className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed space-y-1">
          {bullets.map((b) => (
            <li key={b} className="flex items-start justify-center gap-2">
              <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-current/60" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
      )}
    </div>
  )
}

export function Features() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const features = [...topCards, ...bottomCards]

  return (
    <section id="features" ref={ref} className="relative py-20 md:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden bg-white dark:bg-background">
      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <div className="text-xs tracking-widest uppercase text-muted-foreground mb-3">The future of privacy</div>
          <h2 className="text-4xl md:text-5xl font-medium tracking-tighter mx-auto text-pretty bg-linear-to-b from-sky-800 dark:from-sky-100 to-foreground dark:to-foreground bg-clip-text text-transparent">
            Hide Your Browser helps with anything you need to hide.
          </h2>
        </motion.div>

        {/* Top grid: 2 frosted feature cards + quick highlights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="rounded-2xl border border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-xl p-7">
              <div className="flex items-center justify-between mb-2 text-xs font-semibold text-foreground/60">
                <span>Sees what others can’t</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Browser-only visibility</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Create a completely invisible browsing layer that only you can see during sharing, recording, or monitoring tools.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-xl p-7">
              <div className="flex items-center justify-between mb-2 text-xs font-semibold text-foreground/60">
                <span>Works on everything</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Compatible anywhere</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Zoom, Teams, Meet, Slack, Discord. Any software that screenshares. Our system technology operates at the OS level.</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="rounded-2xl border border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-xl p-7"
          >
            <div className="text-xs font-semibold text-foreground/60 mb-3">Quick controls</div>
            <ul className="space-y-3">
              {["Instant toggle with Alt\\", "Drag anywhere on screen", "Adjustable opacity"].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check className="w-4 h-4 mt-[2px] text-sky-600 dark:text-sky-400" />
                  <span className="text-sm text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Dark callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 p-8 md:p-10 mb-10 shadow-2xl"
        >
          <div className="text-center">
            <h3 className="text-white text-xl md:text-2xl font-semibold mb-2">Undetectable by design.</h3>
            <p className="text-white/70 text-sm md:text-base mb-5">No bots in the room. No Zoom guests. No screenshare trails. Works on everything.</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
  <img alt="Slack" src="https://api.iconify.design/logos/slack-icon.svg" className="w-6 h-6" />
  <img alt="Google Meet" src="https://api.iconify.design/logos/google-meet.svg" className="w-6 h-6" />
  <img alt="Zoom" src="https://api.iconify.design/logos/zoom-icon.svg" className="w-6 h-6" />
  <img alt="Microsoft Teams" src="https://api.iconify.design/logos/microsoft-teams.svg" className="w-6 h-6" />
</div>
          </div>
        </motion.div>

        {/* Two benefit rows */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="rounded-2xl border border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-xl p-6 order-1"
          >
            <h3 className="text-2xl font-semibold mb-3 text-foreground">Invisible to screen-share</h3>
            <p className="text-sm text-muted-foreground mb-3">Never shows up in shared screens, recordings, or internal meeting tools. It’s fully hidden from everyone but you.</p>
            <ul className="space-y-2">
              {["System-level invisibility layer","Undetectable by recording software","No traces in system logs"].map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm">
                  <Check className="w-4 h-4 mt-[2px] text-emerald-600 dark:text-emerald-500" />
                  <span className="text-muted-foreground">{b}</span>
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl border border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-xl aspect-[4/3] w-full overflow-hidden order-2"
          >
            <InvisibilityAnimation />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl border border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-xl aspect-[4/3] w-full overflow-hidden order-1 lg:order-none"
          >
            <WorkflowAnimation />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="rounded-2xl border border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-xl p-6"
          >
            <h3 className="text-2xl font-semibold mb-3 text-foreground">Follow your workflow</h3>
            <p className="text-sm text-muted-foreground mb-3">The window is fully moveable so you can position it exactly where you need it — without ever breaking concentration.</p>
            <div className="text-xs font-semibold text-foreground/60 mb-2">Keyboard shortcuts</div>
            <div className="flex flex-wrap gap-2">
              {['Toggle (Alt+\\)', 'Snap/Drag', 'Opacity'].map((x) => (
                <span key={x} className="px-3 py-1 rounded-full text-xs font-medium border border-foreground/15 text-foreground/80">{x}</span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom: three use-cases */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6"
        >
          <h3 className="text-3xl md:text-4xl font-medium tracking-tight bg-linear-to-b from-sky-800 dark:from-sky-100 to-foreground dark:to-foreground bg-clip-text text-transparent">Three ways Hide Your Browser changes how you work.</h3>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {[
            { title: 'Interviews', desc: 'Reference your prep notes, ask Otter for timestamps, and capture next steps — without anyone noticing.', anim: <MiniInterviews /> },
            { title: 'Presentations', desc: 'Keep your speaker notes, backup slides, and reference links open. Present confidently with instant access.', anim: <MiniPresentations /> },
            { title: 'Meetings', desc: 'Access your notes, research, and internal context during meetings. Stay productive while staying present.', anim: <MiniMeetings /> },
          ].map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.05 + i * 0.06 }}
              className="group rounded-2xl border border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-xl p-6 md:p-7 transition-all hover:shadow-xl hover:-translate-y-0.5 hover:ring-1 hover:ring-foreground/15 flex flex-col h-full"
            >
              <div className="mb-4 rounded-xl overflow-hidden">{c.anim}</div>
              <h4 className="text-xl font-semibold text-foreground mb-1">{c.title}</h4>
              <p className="text-[15px] text-muted-foreground leading-relaxed">{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}