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
    <div className="relative justify-center items-center">
      <section className="max-w-7xl mx-auto px-4 py-40 gap-12 flex flex-col justify-center items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring", bounce: 0 }}
          className="flex flex-col justify-center items-start space-y-5 w-full text-left"
        >
          <h1 className="text-[32px] md:text-[32px] font-medium tracking-tighter text-pretty">
            <span className="block bg-linear-to-b from-sky-800 dark:from-sky-100 to-foreground dark:to-foreground bg-clip-text text-transparent">The Truly Undetectable Browser To Hide</span>
            <span className="flex items-center my-0">
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentWordIndex}
                  initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  className="whitespace-nowrap font-medium inline-block bg-gradient-to-r from-sky-500 via-cyan-400 to-indigo-500 dark:from-sky-300 dark:via-cyan-300 dark:to-indigo-400 bg-clip-text text-transparent drop-shadow mr-3"
                >
                  {rotatingWords[currentWordIndex].text}
                </motion.span>
              </AnimatePresence>
              <span className="bg-linear-to-b from-sky-800 dark:from-sky-100 to-foreground dark:to-foreground bg-clip-text text-transparent">From Screenshare.</span>
            </span>
          </h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="items-start gap-x-3 space-y-3 sm:flex sm:space-y-0"
          >
            <Button size="lg" className="text-[15px] px-8 h-12 rounded-full shadow-[0_6px_0_rgba(0,0,0,0.35)] hover:shadow-[0_4px_0_rgba(0,0,0,0.35)] active:translate-y-[2px] active:shadow-[0_2px_0_rgba(0,0,0,0.35)] ring-1 ring-white/10" onClick={scrollToDownload}>
              Download Now
            </Button>
            <Button size="lg" variant="outline" className="text-[15px] px-8 h-12 rounded-full border-2 border-foreground/20 bg-transparent hover:bg-foreground/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]" onClick={scrollToFeatures}>
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
          <FeatureShowcase />
        </motion.div>
      </section>

      
    </div>
  )
}

