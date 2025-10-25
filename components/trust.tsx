"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"

const logos = [
  "Acme Corp",
  "Globex",
  "Umbrella",
  "Soylent",
  "Initech",
  "Hooli",
]

const testimonials = [
  {
    quote:
      "Screen-share invisibility lets me take notes and pull context without distractions. It just works.",
    name: "Jordan P.",
    role: "Product Manager",
  },
  {
    quote:
      "The instant toggle is a game changer during sales demos. Zero artifacts on recordings.",
    name: "Riley S.",
    role: "Account Executive",
  },
  {
    quote:
      "I can run Otter.ai in the background for transcripts without raising eyebrows on Zoom.",
    name: "Avery C.",
    role: "Consultant",
  },
]

export function Trust() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} className="relative py-14 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">

      <div className="relative max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 sm:mb-12"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tighter mx-auto text-pretty bg-linear-to-b from-sky-800 dark:from-sky-100 to-foreground dark:to-foreground bg-clip-text text-transparent mb-3">Trusted by professionals</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Featured in and used across leading teams</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 sm:gap-6 mb-12"
        >
          {logos.map((logo) => (
            <div
              key={logo}
              className="h-12 rounded-lg border border-border/60 bg-background/60 text-muted-foreground flex items-center justify-center text-xs sm:text-sm font-medium"
            >
              {logo}
            </div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.45, delay: 0.1 + i * 0.06 }}
              className="h-full p-6 rounded-xl border border-border bg-background/80 backdrop-blur-sm"
            >
              <div className="text-4xl leading-none text-foreground/30 mb-3">“</div>
              <p className="text-sm text-foreground/80 leading-relaxed mb-4">{t.quote}</p>
              <div className="text-sm font-semibold text-foreground">{t.name}</div>
              <div className="text-xs text-muted-foreground">{t.role}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
