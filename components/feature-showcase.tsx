"use client"

import { useEffect, useState, useRef, type RefObject, type MutableRefObject } from "react"
import { motion, AnimatePresence, useDragControls } from "framer-motion"
import { Eye, EyeOff, Plus, X, Minus, Maximize2, MoreVertical, FileText, Mic, PlayCircle, Grid as GridIcon, RefreshCw } from "lucide-react"

function BrowserWindow({ onClose, constraintsRef }: { onClose?: () => void, constraintsRef?: RefObject<HTMLDivElement | null> | MutableRefObject<HTMLDivElement | null> }) {
  const [tabs, setTabs] = useState<{ id: number; title: string }[]>([
    { id: 1, title: "New Tab" },
  ])
  const [activeId, setActiveId] = useState<number>(1)
  const [stealthOn, setStealthOn] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [maximized, setMaximized] = useState(false)
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 960, height: 500 })
  const [prevSize, setPrevSize] = useState<{ width: number; height: number } | null>(null)
  const winRef = useRef<HTMLDivElement>(null)
  const dragControls = useDragControls()

  const addTab = () => {
    const id = (tabs.at(-1)?.id ?? 0) + 1
    const next = [...tabs, { id, title: "New Tab" }]
    setTabs(next)
    setActiveId(id)
  }

  const closeTab = (id: number) => {
    const remaining = tabs.filter((t) => t.id !== id)
    const next = remaining.length ? remaining : [{ id: 1, title: "New Tab" }]
    setTabs(next)
    if (id === activeId) setActiveId(next[next.length - 1].id)
  }

  const containerClasses = `relative rounded-xl border shadow-2xl overflow-hidden transition-all duration-300 ${
    stealthOn
      ? "bg-white/10 border-white/20 backdrop-blur-xl saturate-125"
      : "bg-[var(--background)] border-gray-800"
  }`

  const syncSizeFromDom = () => {
    const node = winRef.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    const bounds = (constraintsRef as any)?.current as HTMLDivElement | null
    const maxW = Math.max(560, Math.min((bounds?.clientWidth ?? 1024) - 48, 896))
    const maxH = Math.max(360, Math.min((bounds?.clientHeight ?? 700) - 48, 600))
    setSize((prev) => {
      const w = Math.round(rect.width)
      const h = Math.round(rect.height)
      const clampedW = Math.min(Math.max(560, w), maxW)
      const clampedH = Math.min(Math.max(360, h), maxH)
      if (Math.abs(prev.width - clampedW) > 0.5 || Math.abs(prev.height - clampedH) > 0.5) {
        return { width: clampedW, height: clampedH }
      }
      return prev
    })
  }

  function NewTabContent({ stealth }: { stealth: boolean }) {
    return (
      <div className={`relative w-full h-full rounded-xl ${stealth ? "bg-white/5" : "bg-[var(--background)]"} border border-white/10 overflow-hidden`}>
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{backgroundImage: "radial-gradient(transparent 1px, rgba(255,255,255,.3) 1px)", backgroundSize: "24px 24px"}} />
        <div className="relative p-4 sm:p-5 md:p-6 h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500/20 to-cyan-500/20 border border-sky-500/30 flex items-center justify-center">
              <FileText className="h-8 w-8 text-sky-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Interview Notes</h3>
              <p className="text-sm text-white/60">Your preparation materials</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      ref={winRef}
      className={containerClasses}
      style={{ 
        width: size.width, 
        height: size.height, 
        resize: "both" as any, 
        minWidth: 560, 
        minHeight: 360,
        maxWidth: Math.max(560, Math.min(((constraintsRef as any)?.current?.clientWidth ?? 1024) - 48, 896)),
        maxHeight: Math.max(360, Math.min(((constraintsRef as any)?.current?.clientHeight ?? 700) - 48, 600)),
      }}
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0.1}
      dragConstraints={constraintsRef as any}
      onPointerUp={syncSizeFromDom}
    >
      {/* Browser chrome */}
      <div
        className={`flex items-center gap-3 px-3 py-2 border-b transition-colors ${
          stealthOn ? "bg-white/10 border-white/20" : "bg-[#2d2d2d] border-gray-800"
        }`}
        onPointerDown={(e) => dragControls.start(e)}
      >
        <div className="flex items-center gap-2">
          <MoreVertical className="h-4 w-4 text-gray-300" />
          <div className="h-6 w-6 rounded-full bg-violet-500 text-white grid place-items-center text-xs font-semibold">H</div>
        </div>

        <div className="flex-1 flex items-center gap-2 min-w-0">
          <div className="hidden md:flex items-center gap-1 overflow-x-auto whitespace-nowrap scrollbar-none min-w-0">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveId(t.id)}
                className={`group flex items-center gap-2 px-3 py-1 rounded-md text-xs transition-colors min-w-[88px] ${
                  t.id === activeId ? "bg-neutral-700/70 text-white" : "bg-neutral-800/70 text-gray-300 hover:bg-neutral-700/60"
                }`}
                title={t.title}
              >
                <span className="truncate">{t.title}</span>
                <X
                  className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation()
                    closeTab(t.id)
                  }}
                />
              </button>
            ))}
          </div>

          <button
            onClick={addTab}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-neutral-800/70 text-gray-200 hover:bg-neutral-700/60 active:scale-95 transition"
            title="New tab"
          >
            <Plus className="h-4 w-4" />
          </button>

          <button
            onClick={() => setStealthOn((v) => !v)}
            className={`inline-flex items-center gap-2 rounded-md px-2 h-7 text-xs font-medium transition active:scale-95 ${
              stealthOn
                ? "bg-rose-500/20 text-rose-200 hover:bg-rose-500/25"
                : "bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/25"
            }`}
            title={stealthOn ? "Invisible" : "Visible"}
          >
            {stealthOn ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span className="hidden sm:inline">{stealthOn ? "Invisible" : "Visible"}</span>
          </button>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => onClose?.()}
            className="h-7 w-7 grid place-items-center rounded-md bg-neutral-800/70 text-gray-200 hover:bg-neutral-700/60 active:scale-95"
            title="Minimize"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              const bounds = (constraintsRef as any)?.current as HTMLDivElement | null
              const maxW = Math.max(560, Math.min((bounds?.clientWidth ?? 1024) - 48, 896))
              const maxH = Math.max(360, Math.min((bounds?.clientHeight ?? 700) - 48, 600))
              if (!maximized) {
                setPrevSize(size)
                const targetW = maxW
                const targetH = Math.min(maxH, Math.round(targetW * 0.6))
                setSize({ width: targetW, height: targetH })
                setMaximized(true)
              } else {
                setSize(prevSize ?? { width: 960, height: 500 })
                setMaximized(false)
              }
            }}
            className="h-7 w-7 grid place-items-center rounded-md bg-neutral-800/70 text-gray-200 hover:bg-neutral-700/60 active:scale-95"
            title={maximized ? "Restore" : "Maximize"}
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onClose?.()}
            className="h-7 w-7 grid place-items-center rounded-md bg-neutral-800/70 text-gray-200 hover:bg-red-600/70 hover:text-white active:scale-95"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Browser content */}
      {!minimized && (
        <div className="p-6 h-[calc(100%-44px)] overflow-hidden">
          {tabs.find((t) => t.id === activeId)?.title === "New Tab" ? (
            <NewTabContent stealth={stealthOn} />
          ) : (
            <div className="space-y-1 font-mono text-sm">
              <div className="flex gap-4">
                <span className="text-gray-600 w-8">1</span>
                <span className="text-[#569cd6]">model:</span>
              </div>
              <div className="flex gap-4">
                <span className="text-gray-600 w-8">2</span>
                <span className="text-gray-300 ml-4"><span className="text-[#4ec9b0]">hidden_size:</span> <span className="text-[#ce9178]">256</span></span>
              </div>
              <div className="flex gap-4">
                <span className="text-gray-600 w-8">3</span>
                <span className="text-gray-300 ml-4"><span className="text-[#4ec9b0]">dropout:</span> <span className="text-[#ce9178]">0.2</span></span>
              </div>
              <div className="flex gap-4">
                <span className="text-gray-600 w-8">4</span>
              </div>
              <div className="flex gap-4">
                <span className="text-gray-600 w-8">5</span>
                <span className="text-[#569cd6]">training:</span>
              </div>
              <div className="flex gap-4">
                <span className="text-gray-600 w-8">6</span>
                <span className="text-gray-300 ml-4"><span className="text-[#4ec9b0]">epochs:</span> <span className="text-[#ce9178]">10</span></span>
              </div>
              <div className="flex gap-4">
                <span className="text-gray-600 w-8">7</span>
                <span className="text-gray-300 ml-4"><span className="text-[#4ec9b0]">batch_size:</span> <span className="text-[#ce9178]">128</span></span>
              </div>
              <div className="flex gap-4">
                <span className="text-gray-600 w-8">8</span>
                <span className="text-gray-300 ml-4"><span className="text-[#4ec9b0]">learning_rate:</span> <span className="text-[#b5cea8]">0.001</span></span>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}

export function FeatureShowcase() {
  const [browserVisible, setBrowserVisible] = useState(true)
  const constraintsRef = useRef<HTMLDivElement>(null)
  const [demoVersion, setDemoVersion] = useState(0)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "\\" || e.code === "Backslash")) {
        setBrowserVisible((v) => !v)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <div className="relative mx-auto w-full max-w-7xl">
      {/* Background layer with demo.webp */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-800 shadow-2xl">
        <img 
          src="/demo.webp" 
          alt="Background" 
          className="w-full h-full object-cover" 
        />
        
        {/* Content overlay */}
        <div ref={constraintsRef} className="absolute inset-0 bg-gray-900/80 p-8 md:p-12 flex items-center justify-center">
          {/* Browser container */}
          <div className="max-w-4xl w-full relative">
            <AnimatePresence initial={false} mode="wait">
              {browserVisible && (
                <motion.div
                  key={`browser-${demoVersion}`}
                  initial={{ opacity: 0, y: 40, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.98 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                >
                  <BrowserWindow constraintsRef={constraintsRef} onClose={() => setBrowserVisible(false)} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Move the Alt+\ hint to the bottom-left of the entire background area */}
          <button
            onClick={() => setBrowserVisible((v) => !v)}
            className="absolute left-4 bottom-4 rounded-md border border-white/20 bg-black/70 text-white px-2 py-1 text-xs font-medium shadow hover:bg-black/80 active:scale-95 transition"
            title="Toggle demo (Alt + \\)"
          >
            <span className="font-mono">Alt</span>
            <span className="mx-1">+</span>
            <span className="font-mono">\</span>
          </button>
          {/* Refresh button bottom-right */}
          <button
            onClick={() => { setBrowserVisible(true); setDemoVersion((v) => v + 1) }}
            className="absolute right-4 bottom-4 rounded-md border border-white/20 bg-black/70 text-white p-1.5 text-xs font-medium shadow hover:bg-black/80 active:scale-95 transition"
            title="Reset demo"
            aria-label="Reset demo"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
