"use client"

import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { FeatureDemo } from "@/components/feature-demo"
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
      <section className="max-w-(--breakpoint-xl) mx-auto px-4 py-28 gap-12 md:px-8 flex flex-col justify-center items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring", bounce: 0 }}
          className="flex flex-col justify-center items-center space-y-5 max-w-4xl mx-auto text-center"
        >
          <h1 className="text-4xl md:text-6xl font-medium tracking-tighter mx-auto text-pretty">
            <span className="block bg-linear-to-b from-sky-800 dark:from-sky-100 to-foreground dark:to-foreground bg-clip-text text-transparent">The Truly Undetectable Browser To Hide</span>
            <span className="flex items-center justify-center gap-3 my-2">
              <span className="inline-flex w-[14ch] justify-center">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={currentWordIndex}
                    initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    className="whitespace-nowrap font-medium inline-block bg-gradient-to-r from-sky-500 via-cyan-400 to-indigo-500 dark:from-sky-300 dark:via-cyan-300 dark:to-indigo-400 bg-clip-text text-transparent drop-shadow"
                  >
                    {rotatingWords[currentWordIndex].text}
                  </motion.span>
                </AnimatePresence>
              </span>
            </span>
            <span className="block bg-linear-to-b from-sky-800 dark:from-sky-100 to-foreground dark:to-foreground bg-clip-text text-transparent">From Screenshare.</span>
          </h1>
          <p className="max-w-2xl text-lg mx-auto text-muted-foreground text-balance">
            Share your screen, not your secrets.
          </p>
          <p className="text-sm sm:text-base text-muted-foreground/80">Perfect for Interviews - Presentations - Demos</p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="items-center justify-center gap-x-3 space-y-3 sm:flex sm:space-y-0"
          >
            <Button size="lg" className="text-[15px] px-8 h-12 shadow-lg" onClick={scrollToDownload}>
              Download Now
            </Button>
            <Button size="lg" variant="outline" className="text-[15px] px-8 h-12 bg-transparent" onClick={scrollToFeatures}>
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
          <FeatureDemo />
        </motion.div>
      </section>

      
    </div>
  )
}

