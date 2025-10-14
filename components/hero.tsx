"use client"

import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import { Eye, EyeOff, Play, Monitor, Command } from "lucide-react"

const rotatingWords = [
  { text: "Otter", className: "italic" },
  { text: "Notes", className: "" },
  { text: "Research", className: "" },
  { text: "Prep Notes", className: "" },
  { text: "Cheat sheet", className: "" },
  { text: "Backup Slides", className: "" },
]

export function Hero() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [autoToggle, setAutoToggle] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % rotatingWords.length)
    }, 2500)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!autoToggle) return
    
    const interval = setInterval(() => {
      setIsVisible((prev) => !prev)
    }, 3000)

    return () => clearInterval(interval)
  }, [autoToggle])

  const scrollToDownload = () => {
    const downloadSection = document.getElementById("download")
    if (downloadSection) {
      downloadSection.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  const scrollToFeatures = () => {
    const featuresSection = document.getElementById("features")
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  const handleToggle = () => {
    setAutoToggle(false)
    setIsVisible(!isVisible)
  }

  return (
    <section className="relative pt-20 sm:pt-24 md:pt-28 lg:pt-32 xl:pt-36 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="max-w-6xl mx-auto">
        {/* Hero heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-3xl mx-auto text-center mb-6 sm:mb-8"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-normal tracking-[-0.04em] leading-[1.1] mb-6 sm:mb-8" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
            <span className="block">The Truly Undetectable Browser To Hide</span>
            <span className="flex items-center justify-center gap-3 my-2">
              <span className="inline-block relative h-[1.2em]">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={currentWordIndex}
                    initial={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="absolute left-1/2 -translate-x-1/2 top-0 whitespace-nowrap font-normal"
                  >
                    {rotatingWords[currentWordIndex].text}
                  </motion.span>
                </AnimatePresence>
                <span className="invisible whitespace-nowrap font-normal">{rotatingWords.reduce((a, b) => a.text.length > b.text.length ? a : b).text}</span>
              </span>
            </span>
            <span className="block">From Screenshare.</span>
          </h1>

          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-6 max-w-2xl mx-auto leading-relaxed">
            Share your screen, not your secrets.
          </p>

          <p className="text-sm sm:text-base text-muted-foreground/80">Perfect for Interviews - Presentations - Demos</p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
        >
          <Button size="lg" className="text-[15px] px-8 h-12" onClick={scrollToDownload}>
            Download Now
          </Button>
          <Button size="lg" variant="outline" className="text-[15px] px-8 h-12 bg-transparent" onClick={scrollToFeatures}>
            Learn More
          </Button>
        </motion.div>

        {/* Interactive Demo */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative max-w-6xl mx-auto"
        >
          {/* Subtle light-green glow behind the demo */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-24 -bottom-24 h-80 bg-emerald-400/15 blur-3xl rounded-full z-0"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-40 -top-10 h-40 bg-emerald-300/10 blur-2xl rounded-full z-0"
          />
          {/* Screen Share Window Mockup */}
          <div className="relative z-10 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 shadow-2xl border border-slate-700/50">
            {/* Window Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex items-center gap-3">
                <Monitor className="w-5 h-5 text-slate-400" />
                <span className="text-sm text-slate-300 font-medium">Video Call - Screen Sharing</span>
              </div>
            </div>

            {/* Demo Content Area */}
            <div className="relative bg-slate-950/50 rounded-xl px-8 pb-8 pt-6 sm:pt-10 aspect-video flex items-start justify-center backdrop-blur-sm border border-slate-700/30 overflow-hidden">
              {/* Background Video (optimized from GIF) */}
              <div className="absolute inset-0 z-0 rounded-xl pointer-events-none overflow-hidden">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                >
                  <source src="/demo.mp4" type="video/mp4" />
                </video>
              </div>
              {/* Shared Screen Content removed */}

              {/* HideMyBrowser Window - Always Visible */
              }
              <AnimatePresence mode="wait">
                <motion.div
                  key="browser-window"
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="relative z-10 w-full max-w-md mt-20 sm:mt-32"
                >
                  {/* Browser Window */}
                  <div className="bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-700">
                    {/* Browser Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          <div className="w-3 h-3 rounded-full bg-yellow-500" />
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                        </div>
                        {/* URL Tab */}
                        <div className="px-3 py-1 bg-slate-700/50 rounded text-xs text-slate-300 font-medium">
                          hidemybrowser.com
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {isVisible ? (
                          <>
                            <Eye className="w-3 h-3 text-slate-300" />
                            <span className="font-medium text-slate-300">Visible</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3 text-red-500" />
                            <span className="font-medium text-red-500">Invisible</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Browser Content - Empty lines */}
                    <div className="p-6 space-y-3">
                      <div className="h-3 bg-slate-700/30 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-700/30 rounded w-1/2"></div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

          </div>
        </motion.div>

        
      </div>
    </section>
  )
}
