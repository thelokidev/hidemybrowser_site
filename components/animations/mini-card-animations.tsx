"use client"

import React from "react"
import { Mic, Presentation, Users, NotebookPen, Play, Layout } from "lucide-react"

function MiniWindow({ children, title, icon }: { children: React.ReactNode; title: string; icon: React.ReactNode }) {
  return (
    <div className="relative w-full h-60 md:h-64 rounded-2xl border border-slate-700/40 bg-slate-900/70 overflow-hidden shadow-xl transition-transform duration-300 group-hover:scale-[1.02]">
      <div className="flex items-center gap-2 h-9 px-3 border-b border-slate-700/40 bg-slate-800/80">
        <span className="inline-flex items-center justify-center w-4 h-4 text-slate-200">{icon}</span>
        <span className="text-[12px] font-medium text-slate-200 truncate">{title}</span>
      </div>
      <div className="relative h-[calc(15rem-2.25rem)] md:h-[calc(16rem-2.25rem)] p-3">
        {children}
      </div>
    </div>
  )
}

export function MiniInterviews() {
  return (
    <MiniWindow title="Interview Notes" icon={<Mic className="w-3.5 h-3.5" />}> 
      <div className="absolute inset-0 bg-grid-slate-700/20 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
      <div className="space-y-3">
        <div className="h-2.5 w-4/5 bg-slate-700/60 rounded animate-[shimmer_2.2s_ease_infinite]" />
        <div className="h-2.5 w-3/4 bg-slate-700/50 rounded animate-[shimmer_2.4s_ease_infinite]" />
        <div className="h-2 w-5/6 bg-slate-700/40 rounded" />
      </div>
      <div className="absolute right-3 bottom-3 w-12 h-12 rounded-lg border border-emerald-400/30 bg-emerald-400/10 shadow-inner animation-float-slow" />
    </MiniWindow>
  )
}

export function MiniPresentations() {
  return (
    <MiniWindow title="Deck - Quarterly" icon={<Presentation className="w-3.5 h-3.5" />}> 
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="w-4/5 h-4/5 rounded-lg border border-blue-400/30 bg-blue-400/10 shadow-inner animation-float-slow" />
        <Play className="absolute w-6 h-6 text-blue-300/80" />
      </div>
    </MiniWindow>
  )
}

export function MiniMeetings() {
  return (
    <MiniWindow title="Standup - 10:00" icon={<Users className="w-3.5 h-3.5" />}> 
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-md bg-slate-700/50 animation-pulse-soft" />
        ))}
      </div>
      <div className="absolute right-3 bottom-3 inline-flex items-center gap-1 text-[10px] text-slate-300">
        <Layout className="w-3.5 h-3.5" />
        Grid view
      </div>
    </MiniWindow>
  )
}

export default function MiniCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <MiniInterviews />
      <MiniPresentations />
      <MiniMeetings />
    </div>
  )
}
