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
    version: "v1.35.1",
    gradient: "from-blue-500/10 to-cyan-500/10",
    iconColor: "text-blue-400",
    downloadUrl: "https://github.com/thelokidev/hidemybrowser_site/releases/download/v1.35.1/hidemybrowser-1.35.1-setup.exe",
    available: true,
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
    downloadUrl: null,
    available: false,
  },
]

export function Download() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const handleDownload = (platform: typeof platforms[0]) => {
    if (!platform.available || !platform.downloadUrl) {
      return
    }

    // For GitHub releases, create a temporary link to trigger download
    // GitHub releases send proper Content-Disposition headers for downloads
    const link = document.createElement('a')
    link.href = platform.downloadUrl
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

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
          className="text-center mb-12 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-4">
            <span className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground">Download</span>
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter mx-auto text-pretty bg-gradient-to-b from-white via-sky-100 to-sky-300 bg-clip-text text-transparent mb-4">Download HideMyBrowser</h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
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
                <div className={`relative h-full p-10 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl ring-0 hover:ring-2 hover:ring-sky-400/30 transition-all duration-300 hover:shadow-2xl overflow-hidden group`}>
                  <div className="absolute -right-8 -top-8 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
                    <Icon className="w-40 h-40" />
                  </div>
                  
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/10 backdrop-blur border border-white/20 mb-6 ${platform.iconColor} group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 relative z-10`}>
                    <Icon className="w-10 h-10" strokeWidth={2} />
                  </div>

                  <h3 className="text-2xl font-bold mb-2 relative z-10">{platform.name}</h3>
                  <p className="text-muted-foreground mb-6 relative z-10">{platform.subtitle}</p>

                  <ul className="space-y-3 mb-8 relative z-10">
                    {platform.requirements.map((req) => (
                      <li key={req} className="flex items-center gap-2.5 text-sm">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300 shrink-0"><Check className="w-3.5 h-3.5" /></span>
                        <span className="text-muted-foreground">{req}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className={`w-full group-hover:shadow-lg transition-shadow relative z-10 ${platform.available ? 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500' : 'bg-gray-600/50 cursor-not-allowed opacity-60'}`}
                    size="lg"
                    onClick={() => handleDownload(platform)}
                    disabled={!platform.available}
                  >
                    <DownloadIcon className="w-4 h-4 mr-2" />
                    {platform.available ? `Download for ${platform.name}` : `Coming Soon for ${platform.name}`}
                  </Button>
                </div>
              </motion.div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
