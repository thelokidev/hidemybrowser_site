"use client"

import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { FeatureShowcase } from "@/components/feature-showcase"
import { useEffect, useState } from "react"

export function Hero() {
  const rotatingWords = [
    { text: "Otter", className: "italic" },
    { text: "Notes", className: "" },
    { text: "Research", className: "" },
    { text: "Prep Notes", className: "" },
    { text: "Cheat sheet", className: "" },
    { text: "Backup Slides", className: "" },
  ]

  const [currentWordIndex, setCurrentWordIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % rotatingWords.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

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

  return (
    <div className="relative justify-center items-center overflow-hidden">
      {/* Enhanced background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-b from-sky-500/20 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-t from-indigo-500/15 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 sm:py-32 md:py-40 gap-8 sm:gap-12 flex flex-col justify-center items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring", bounce: 0 }}
          className="flex flex-col justify-center items-start space-y-4 sm:space-y-5 w-full text-left"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] sm:text-xs font-medium text-muted-foreground">100% Undetectable</span>
          </motion.div>

          <h1 className="text-[28px] sm:text-[36px] md:text-[42px] lg:text-[48px] font-medium tracking-tighter text-pretty leading-tight sm:leading-none">
            <span className="flex flex-col sm:flex-row sm:items-baseline my-0 gap-x-2 gap-y-1">
              <span className="bg-gradient-to-b from-sky-100 to-foreground bg-clip-text text-transparent">The Truly Undetectable Browser To Hide</span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentWordIndex}
                  initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  className="whitespace-nowrap font-medium inline-block bg-gradient-to-r from-sky-300 via-cyan-300 to-indigo-400 bg-clip-text text-transparent drop-shadow"
                >
                  {rotatingWords[currentWordIndex].text}
                </motion.span>
              </AnimatePresence>
            </span>
            <span className="block bg-gradient-to-b from-sky-100 to-foreground bg-clip-text text-transparent leading-tight sm:leading-none mt-1">From Screenshare.</span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl">
            Browse privately during screen shares, video calls, and recordings. Instantly toggle with Alt+\
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3 w-full sm:w-auto"
          >
            <Button size="lg" className="text-sm sm:text-[15px] px-6 sm:px-8 h-11 sm:h-12 rounded-full shadow-[0_6px_0_rgba(0,0,0,0.35)] hover:shadow-[0_4px_0_rgba(0,0,0,0.35)] active:translate-y-[2px] active:shadow-[0_2px_0_rgba(0,0,0,0.35)] ring-1 ring-white/10 w-full sm:w-auto" onClick={scrollToDownload}>
              Download Now
            </Button>
            <Button size="lg" variant="outline" className="text-sm sm:text-[15px] px-6 sm:px-8 h-11 sm:h-12 rounded-full border-2 border-foreground/20 bg-transparent hover:bg-foreground/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] w-full sm:w-auto" onClick={scrollToFeatures}>
              Learn More
            </Button>
          </motion.div>
        </motion.div>

        {/* Interactive Demo */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative w-full max-w-7xl mx-auto"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-sky-500/10 to-transparent blur-3xl" />
          <FeatureShowcase />
        </motion.div>
      </section>

      
    </div>
  )
}

