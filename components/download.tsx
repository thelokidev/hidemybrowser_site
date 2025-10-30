"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { DownloadIcon, Monitor, Apple, Check } from "lucide-react"

const platforms = [
  {
    name: "Windows",
    subtitle: "For Windows PCs",
    icon: Monitor,
    requirements: ["Windows 10 or later", "4GB RAM minimum", "500MB free space"],
    downloads: "6 downloads",
    version: "vrelease",
    gradient: "from-blue-500/10 to-cyan-500/10",
    iconColor: "text-blue-400",
  },
  {
    name: "macOS",
    subtitle: "For Mac computers",
    icon: Apple,
    requirements: ["macOS 10.15 or later", "4GB RAM minimum", "500MB free space"],
    downloads: "6 downloads",
    version: "vrelease",
    gradient: "from-gray-500/10 to-slate-500/10",
    iconColor: "text-gray-300",
  },
]

export function Download() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="download" ref={ref} className="relative py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-background overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-24 -z-10 opacity-60 blur-3xl [mask-image:radial-gradient(closest-side,white,transparent)]">
        <div className="mx-auto h-60 w-[70%] rounded-full bg-gradient-to-b from-sky-400/30 via-cyan-400/20 to-indigo-500/10" />
      </div>
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-12 md:mb-14"
        >
          <h2 className="text-[34px] sm:text-4xl md:text-5xl font-medium tracking-tighter mx-auto text-pretty bg-gradient-to-b from-sky-100 to-foreground bg-clip-text text-transparent mb-3 sm:mb-4">Download HideMyBrowser</h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
            Get the truly undetectable browser for your platform. Start your stealth browsing experience today.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 sm:gap-7 mb-10">
          {platforms.map((platform, index) => {
            const Icon = platform.icon
            return (
              <motion.div
                key={platform.name}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -6 }}
                className="h-full"
              >
                <div className={`relative h-full p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl ring-0 hover:ring-1 hover:ring-foreground/15 transition-all duration-300 hover:shadow-2xl overflow-hidden group`}>
                  <div className="absolute -right-8 -top-8 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
                    <Icon className="w-40 h-40" />
                  </div>

                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur border border-white/20 mb-6 ${platform.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-8 h-8" strokeWidth={2} />
                  </div>

                  <h3 className="text-2xl font-bold mb-2">{platform.name}</h3>
                  <p className="text-muted-foreground mb-6">{platform.subtitle}</p>

                  <ul className="space-y-2.5 mb-8">
                    {platform.requirements.map((req) => (
                      <li key={req} className="flex items-center gap-2.5 text-sm">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300"><Check className="w-3.5 h-3.5" /></span>
                        <span className="text-muted-foreground">{req}</span>
                      </li>
                    ))}
                  </ul>

                  <Button className="w-full mb-4 group-hover:shadow-lg transition-shadow" size="lg">
                    <DownloadIcon className="w-4 h-4 mr-2" />
                    Download for {platform.name}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <span>{platform.downloads}</span>
                    <span>-</span>
                    <span>{platform.version}</span>
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
