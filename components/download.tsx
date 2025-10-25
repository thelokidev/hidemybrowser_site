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
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    name: "macOS",
    subtitle: "For Mac computers",
    icon: Apple,
    requirements: ["macOS 10.15 or later", "4GB RAM minimum", "500MB free space"],
    downloads: "6 downloads",
    version: "vrelease",
    gradient: "from-gray-500/10 to-slate-500/10",
    iconColor: "text-gray-700 dark:text-gray-300",
  },
]

export function Download() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="download" ref={ref} className="relative py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-background overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-12 md:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-medium tracking-tighter mx-auto text-pretty bg-linear-to-b from-sky-800 dark:from-sky-100 to-foreground dark:to-foreground bg-clip-text text-transparent mb-3 sm:mb-4">Download HideMyBrowser</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Get the truly undetectable browser for your platform. Start your stealth browsing experience today.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {platforms.map((platform, index) => {
            const Icon = platform.icon
            return (
              <motion.div
                key={platform.name}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className="h-full"
              >
                <div className={`relative h-full p-8 rounded-2xl bg-gradient-to-br ${platform.gradient} border-2 border-border hover:border-foreground/30 transition-all duration-300 hover:shadow-xl overflow-hidden group`}>
                  {/* Background icon decoration */}
                  <div className="absolute -right-8 -top-8 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
                    <Icon className="w-40 h-40" />
                  </div>

                  {/* Icon badge */}
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-background border-2 border-border mb-6 ${platform.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-8 h-8" strokeWidth={2} />
                  </div>

                  <h3 className="text-2xl font-bold mb-2">{platform.name}</h3>
                  <p className="text-muted-foreground mb-6">{platform.subtitle}</p>

                  <ul className="space-y-3 mb-8">
                    {platform.requirements.map((req) => (
                      <li key={req} className="flex items-start gap-3 text-sm">
                        <Check className="w-4 h-4 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
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

        {/* Removed 'What You Get' section */}
      </div>
    </section>
  )
}
