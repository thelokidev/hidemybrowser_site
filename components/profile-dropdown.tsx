"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { UserAvatar } from "@/components/user-avatar"

export function ProfileDropdown() {
  const { user } = useAuth()
  const router = useRouter()

  if (!user) return null

  return (
    <div className="relative">
      <button
        onClick={() => router.push("/dashboard")}
        className="transition-all duration-200 hover:opacity-80"
      >
        <UserAvatar size={36} className="ring-1 ring-border/60" />
      </button>
    </div>
  )
}
