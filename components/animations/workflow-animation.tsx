"use client"

import React, { useEffect, useState } from "react"
import { Code2, MousePointer2 } from "lucide-react"

export function WorkflowAnimation() {
  const [active, setActive] = useState("Drag")

  useEffect(() => {
    const sequence = ["Snap", "Opacity", "Drag", "Drag"]
    let idx = 0
    const id = setInterval(() => {
      idx = (idx + 1) % sequence.length
      setActive(sequence[idx])
    }, 2500)
    return () => clearInterval(id)
  }, [])

  const Chip = ({ name }: { name: string }) => (
    <div
      className={
        "transition-all duration-300 text-xs font-mono py-1 px-3 rounded-md border select-none " +
        (active === name
          ? "bg-slate-900 text-white border-slate-600 shadow-sm"
          : "bg-slate-800 border-slate-700 text-slate-400")
      }
    >
      {name}
    </div>
  )

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="relative w-full h-64 bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
        <div className="absolute inset-0 bg-grid-slate-700/20 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
        {/* Animated Cursor */}
        <MousePointer2 className="w-6 h-6 text-white absolute -translate-x-1/2 -translate-y-1/2 animation-workflow-cursor" />
        {/* Animated Window */}
        <div className="absolute w-40 h-24 rounded-lg shadow-2xl border-2 border-gray-400 animation-workflow-window">
          <div className="h-6 bg-gray-400 rounded-t-md flex items-center px-2">
            <Code2 className="w-4 h-4 text-black" />
          </div>
          <div className="h-[calc(6rem-1.5rem)] rounded-b-lg" style={{ backgroundColor: "rgba(2,6,23,0.8)", backdropFilter: "blur(6px)" }} />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-4">
        <Chip name="Drag" />
        <Chip name="Snap" />
        <Chip name="Opacity" />
      </div>
    </div>
  )
}

export default WorkflowAnimation
