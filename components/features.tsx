"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"
import { EyeOff, Zap, Mic, Shield, Ghost, Users, Command } from "lucide-react"

const features = [
  {
    icon: Zap,
    title: "Instant Toggle",
    description:
      "Press Alt+\\ from anywhere to instantly hide or show HideMyBrowser. Works system-wide in milliseconds.",
    iconColor: "text-yellow-600 dark:text-yellow-400",
    iconBg: "bg-yellow-500/10",
  },
  {
    icon: EyeOff,
    title: "Screen Share Invisible",
    description:
      "Completely undetectable during screen shares and video calls. Your browser won't appear in any recordings or shared screens.",
    iconColor: "text-purple-600 dark:text-purple-400",
    iconBg: "bg-purple-500/10",
  },
  {
    icon: Mic,
    title: "Otter.ai Optimized",
    description: "Perfect for seamless meeting transcription. Run Otter.ai in the background without anyone knowing.",
    iconColor: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-500/10",
  },
  {
    icon: Shield,
    title: "Meeting Stealth",
    description:
      "Designed specifically for professionals who need discretion during meetings, calls, and presentations.",
    iconColor: "text-green-600 dark:text-green-400",
    iconBg: "bg-green-500/10",
  },
  {
    icon: Ghost,
    title: "Zero Footprint",
    description: "Leaves no traces in taskbars, alt-tab menus, or system monitors when hidden. Truly invisible.",
    iconColor: "text-gray-600 dark:text-gray-400",
    iconBg: "bg-gray-500/10",
  },
  {
    icon: Command,
    title: "Instant Hide/Unhide",
    description:
      "Use Alt+\\ on Windows or Control+\\ on Mac to instantly hide or reveal HideMyBrowser, no matter what app you're in.",
    iconColor: "text-cyan-600 dark:text-cyan-400",
    iconBg: "bg-cyan-500/10",
  },
]

export function Features() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="features" ref={ref} className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      {/* Blend with surrounding sections to avoid visible separators */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-16 h-24 bg-gradient-to-b from-background to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -bottom-16 h-24 bg-gradient-to-t from-background to-transparent" />

      {/* Subtle green hue leaking in from hero (softened) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[1400px] h-80 bg-emerald-400/8 blur-3xl rounded-full"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-1/5 w-[800px] h-72 bg-emerald-300/6 blur-3xl rounded-full"
      />

      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-12 md:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Why Choose HideMyBrowser?
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            The only browser built specifically for professionals who need complete invisibility during meetings and
            screen shares.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 md:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="h-full"
              >
                <div className="h-full p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 group relative overflow-hidden">
                  {/* Subtle gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Icon container - elevated design */}
                  <div className="relative mb-6">
                    <div className={`w-14 h-14 rounded-xl ${feature.iconBg} flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg shadow-${feature.iconColor}/20`}>
                      <Icon className={`w-7 h-7 ${feature.iconColor}`} strokeWidth={2.5} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="relative">
                    <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed text-[15px]">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
