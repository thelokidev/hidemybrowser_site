"use client"

import React from "react"
import { Eye, ScreenShare, Mail, BarChart2, Code2 } from "lucide-react"

function Window({ icon, title, color, className = "" }: { icon: React.ReactNode; title: string; color: string; className?: string }) {
  return (
    <div className={`absolute w-32 h-24 rounded-lg shadow-lg border ${className}`} style={{ borderColor: color }}>
      <div className="h-6 rounded-t-md flex items-center px-2" style={{ backgroundColor: color }}>
        {icon}
        <span className="text-xs font-bold text-black ml-1 truncate">{title}</span>
      </div>
      <div className="h-[calc(6rem-1.5rem)] rounded-b-lg p-2" style={{ backgroundColor: "rgba(15,23,42,0.8)", backdropFilter: "blur(6px)" }}>
        <div className="w-full h-1 bg-slate-700 rounded-full mb-2" />
        <div className="w-3/4 h-1 bg-slate-700 rounded-full mb-2" />
        <div className="w-1/2 h-1 bg-slate-700 rounded-full" />
      </div>
    </div>
  )
}

function SecretWindow({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute w-36 h-28 rounded-lg shadow-2xl border-2 border-gray-300 ${className}`}>
      <div className="h-7 bg-gray-300 rounded-t-md flex items-center px-2">
        <Code2 className="w-4 h-4 text-black" />
        <span className="text-sm font-bold text-black ml-2">SecretApp.tsx</span>
      </div>
      <div
        className="relative h-[calc(7rem-1.75rem)] rounded-b-lg p-2 overflow-hidden"
        style={{ backgroundColor: "rgba(2,6,23,0.75)", backdropFilter: "blur(6px)",
          backgroundImage: `linear-gradient(to right, rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.12) 1px, transparent 1px)`,
          backgroundSize: "14px 14px",
          maskImage: "linear-gradient(to bottom, white, transparent)" as any
        }}
      >
        <span className="font-mono text-xs text-gray-200">const stealth = true;</span>
      </div>
    </div>
  )
}

export function InvisibilityAnimation() {
  return (
    <div style={{ perspective: "1000px" }} className="w-full h-full flex items-center justify-center">
      <div className="relative w-80 h-64 animation-subtle-rotate" style={{ transformStyle: "preserve-3d" as any }}>
        {/* Layer 1: Your View */}
        <div className="absolute inset-0" style={{ transform: "translateZ(-50px)" }}>
          <div className="absolute inset-0 rounded-2xl border border-slate-700 shadow-2xl" style={{ backgroundColor: "rgba(30,41,59,0.5)" }} />
          <div className="absolute top-4 left-4 flex items-center gap-2 text-slate-300">
            <Eye className="w-5 h-5" />
            <span className="font-semibold">Your View</span>
          </div>
          <Window icon={<BarChart2 className="w-4 h-4 text-black" />} title="Analytics" color="#f59e0b" className="top-12 left-8" />
          <Window icon={<Mail className="w-4 h-4 text-black" />} title="Inbox" color="#84cc16" className="top-1/2 left-1/4 -translate-y-1/2" />
          <SecretWindow className="bottom-4 right-4" />
        </div>
        {/* Layer 2: Screen Share */}
        <div className="absolute inset-0" style={{ transform: "translateZ(50px)" }}>
          <div className="absolute inset-0 rounded-2xl border border-gray-700 shadow-2xl" style={{ backgroundColor: "rgba(3,7,18,0.6)", backdropFilter: "blur(6px)" }} />
          <div className="absolute top-4 left-4 flex items-center gap-2 text-gray-400">
            <ScreenShare className="w-5 h-5" />
            <span className="font-semibold">Screen Share View</span>
          </div>
          <Window icon={<BarChart2 className="w-4 h-4 text-black" />} title="Analytics" color="#f59e0b" className="top-12 left-8" />
          <Window icon={<Mail className="w-4 h-4 text-black" />} title="Inbox" color="#84cc16" className="top-1/2 left-1/4 -translate-y-1/2" />
          {/* Secret window omitted intentionally */}
        </div>
      </div>
    </div>
  )
}

export default InvisibilityAnimation
