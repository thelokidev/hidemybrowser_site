"use client"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { UserAvatar } from "@/components/user-avatar"
import { LayoutGrid, LogOut, ExternalLink } from "lucide-react"

export function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, signOut } = useAuth()
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const handleSignOut = async () => {
    setIsOpen(false)
    await signOut()
    router.replace("/auth")
  }

  const handleDashboard = () => {
    setIsOpen(false)
    router.push("/dashboard")
  }

  if (!user) return null

  const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "User"
  const isPro = user.user_metadata?.subscription === "pro"

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="transition-all duration-200 hover:opacity-80"
      >
        <UserAvatar size={36} className="ring-1 ring-border/60" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-[340px] bg-[#1c1f26] rounded-2xl shadow-2xl border border-white/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-5 border-b border-white/[0.08]">
            <div className="flex items-start gap-3.5">
              <UserAvatar size={48} className="mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-[15px] font-medium text-white truncate">{userName}</h3>
                  {isPro && (
                    <span className="px-2 py-0.5 text-[11px] font-semibold text-white bg-indigo-600 rounded-md">
                      PRO
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-white/50 truncate">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="py-2">
            <button
              onClick={handleDashboard}
              className="w-full flex items-center gap-3.5 px-5 py-3 text-white/90 hover:bg-white/[0.03] transition-colors duration-150 text-left group"
            >
              <LayoutGrid className="w-[18px] h-[18px] text-white/40 group-hover:text-white/60 transition-colors" />
              <span className="text-[15px] flex-1">Dashboard</span>
              <ExternalLink className="w-[14px] h-[14px] text-white/30 group-hover:text-white/50 transition-colors" />
            </button>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3.5 px-5 py-3 text-white/90 hover:bg-white/[0.03] transition-colors duration-150 text-left group"
            >
              <LogOut className="w-[18px] h-[18px] text-white/40 group-hover:text-white/60 transition-colors" />
              <span className="text-[15px]">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
