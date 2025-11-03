"use client"

import { useEffect, useRef, useState } from "react"
import { motion, animate, useMotionValue, useMotionValueEvent, useTransform } from "framer-motion"
import { Eye, EyeOff, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"

function Keycap({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/10 px-2 py-1 text-[11px] font-medium text-white/90 shadow-sm backdrop-blur">
      {children}
    </span>
  )
}

function BrowserWindow({ className = "", subtle = false, stealthOn = false }: { className?: string; subtle?: boolean; stealthOn?: boolean }) {
  return (
    <div
      className={
        "pointer-events-none relative w-full max-w-[200px] xs:max-w-[240px] sm:max-w-[280px] md:max-w-[320px] lg:max-w-[360px] xl:max-w-[380px] rounded-xl border " +
        (subtle ? "border-white/10 bg-white/5" : "border-slate-700 bg-slate-900/95") +
        " shadow-2xl overflow-hidden " +
        className
      }
    >
      <div className={(subtle ? "bg-white/10 border-white/10" : "bg-slate-800/90 border-slate-700") + " flex items-center justify-between border-b px-2 sm:px-3 py-1.5 sm:py-2"}>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
          <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-red-500 shrink-0" />
          <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-yellow-500 shrink-0" />
          <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-green-500 shrink-0" />
          <span className={(subtle ? "bg-white/20 text-white" : "bg-slate-700 text-slate-200") + " ml-2 sm:ml-3 rounded px-1.5 sm:px-2 py-0.5 text-[9px] xs:text-[10px] sm:text-[10px] font-medium truncate"}>
            hidemybrowser.com
          </span>
        </div>
        <div className={"flex items-center gap-1 text-[9px] xs:text-[10px] sm:text-[10px] shrink-0 ml-1 " + (subtle ? "text-white/80" : stealthOn ? "text-rose-400/90" : "text-emerald-400/90") }>
          {stealthOn ? <EyeOff className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> : <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
          <span className="font-medium hidden xs:inline">{stealthOn ? "Invisible" : "Visible"}</span>
        </div>
      </div>
      <div className="p-3 sm:p-4">
        <div className={(subtle ? "bg-white/20" : "bg-slate-700/40") + " mb-2 h-2 sm:h-2.5 w-3/4 rounded"} />
        <div className={(subtle ? "bg-white/10" : "bg-slate-700/30") + " h-2 sm:h-2.5 w-1/2 rounded"} />
      </div>
    </div>
  )
}

export function FeatureDemo() {
  const [stealthOn, setStealthOn] = useState(true)
  const [userInteracted, setUserInteracted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Keep centered; no drifting out of frame
  const mvOpacity = useMotionValue(1)

  const spring = { type: "spring" as const, stiffness: 280, damping: 32, mass: 0.7 }

  const quickToggle = () => {
    setUserInteracted(true)
    setStealthOn((s) => !s)
  }

  useEffect(() => {
    if (userInteracted) return
    let step = 0
    const id = setInterval(() => {
      step = (step + 1) % 4
      if (step === 0) {
        setStealthOn(false)
        animate(mvOpacity, 1, { duration: 0.4 })
      } else if (step === 1) {
        setStealthOn(true)
      } else if (step === 2) {
        setStealthOn(false)
      } else if (step === 3) {
        animate(mvOpacity, 0.45, { duration: 0.6 })
        setTimeout(() => animate(mvOpacity, 1, { duration: 0.6 }), 900)
      }
    }, 3600)
    return () => clearInterval(id)
  }, [userInteracted])

  return (
    <div className="relative mx-auto w-full max-w-7xl">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 p-5 md:p-6 shadow-2xl">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2 text-white/90">
              <span className="text-sm font-semibold">Live Demo</span>
              <span className="hidden text-xs text-white/60 sm:inline">Press Alt + \ or use the button</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/80">
              {stealthOn ? (
                <>
                  <EyeOff className="h-3.5 w-3.5 text-rose-400" />
                  <span>Invisible to everyone else</span>
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Visible</span>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div className="relative rounded-xl border border-white/10 bg-black/40 overflow-hidden aspect-[3/2] xl:aspect-[16/9]">
              <img src="/demo.webp" alt="Video call background" className="absolute inset-0 h-full w-full object-cover opacity-90" />
              <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/80">Your screen</div>
              <motion.div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ opacity: mvOpacity }}>
                <BrowserWindow stealthOn={stealthOn} />
              </motion.div>
              {/* In-window stealth toggle control */}
              <motion.button
                onClick={() => { setUserInteracted(true); quickToggle() }}
                whileTap={{ scale: 0.96 }}
                className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur hover:bg-white/20 transition-colors"
                aria-label="Toggle stealth"
              >
                {stealthOn ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                {/* Ripple feedback */}
                <motion.span
                  key={stealthOn ? 'on' : 'off'}
                  initial={{ scale: 0.6, opacity: 0.35 }}
                  animate={{ scale: 1.6, opacity: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-full bg-white/20"
                />
              </motion.button>
              {/* Hotkey hint */}
              <div className="absolute left-3 bottom-3 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/80">
                <span className="opacity-80">Alt</span>
                <span>+</span>
                <span>\\</span>
                <span className="hidden sm:inline opacity-70">Hide/Unhide</span>
              </div>
              {/* Caption: clarify left view */}
              
            </div>

            <div className="relative rounded-xl border border-white/10 bg-black/30 overflow-hidden aspect-[3/2] xl:aspect-[16/9]">
              <img src="/demo.webp" alt="Video call background" className="absolute inset-0 h-full w-full object-cover opacity-80" />
              <div className="pointer-events-none absolute right-3 top-3 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/80">What others see</div>
              <motion.div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" animate={{ opacity: stealthOn ? 0 : 1 }} transition={{ duration: 0.35 }}>
                <BrowserWindow subtle stealthOn={false} />
              </motion.div>
              {/* Caption: clarify right view */}
            </div>
          </div>

          <div className="mt-6 flex flex-row flex-wrap items-center justify-center gap-3">
            <Button onClick={quickToggle} size="lg" variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
              <span className="mr-2 text-white/80">Toggle with</span>
              <Keycap>Alt</Keycap>
              <span className="mx-1 text-white/50">+</span>
              <Keycap>\\</Keycap>
            </Button>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
              {stealthOn ? <EyeOff className="h-4 w-4 text-rose-400" /> : <Eye className="h-4 w-4 text-emerald-400" />}
              <span className="font-medium">{stealthOn ? "Stealth mode active" : "Stealth mode off"}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
