"use client"

import { useAccessStatus } from "@/hooks/use-access-status"
import { useSubscription } from "@/hooks/use-subscription"
import { CheckCircle2, Clock, AlertCircle } from "lucide-react"

export function LicensePill() {
  const access = useAccessStatus()
  const { subscription } = useSubscription()

  const base =
    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium " +
    "border-white/20 bg-white/60 text-foreground/80 shadow-sm backdrop-blur " +
    "dark:border-white/10 dark:bg-white/10 dark:text-white/80"

  if (access.loading) {
    return (
      <span className={base} title="Checking license">
        <Clock className="h-3.5 w-3.5" />
        Checking license
      </span>
    )
  }

  if (access.error) {
    return (
      <span className={base} title={access.error}>
        <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
        Error
      </span>
    )
  }

  if (access.accessType === "subscription" && subscription) {
    const daysRemaining = (() => {
      if (!subscription.current_period_end) return null
      const now = new Date()
      const end = new Date(subscription.current_period_end)
      const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return diff > 0 ? diff : 0
    })()

    return (
      <span className={base + " border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400"} title="Active license">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Active{typeof daysRemaining === "number" ? ` • ${daysRemaining}d left` : ""}
      </span>
    )
  }

  return (
    <span className={base} title="No active license">
      <AlertCircle className="h-3.5 w-3.5" />
      No license
    </span>
  )
}
