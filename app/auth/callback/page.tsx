"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createClient()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      try {
        // Handles OAuth (code) and Magic Link (access_token) flows
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href)
        if (error) throw error
        // Success: send user to dashboard
        router.replace("/dashboard")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Authentication failed")
      }
    }

    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-sm w-full border rounded-lg p-6">
          <h1 className="text-lg font-medium mb-2">Authentication error</h1>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => router.replace("/auth")}
            className="inline-flex h-9 items-center justify-center rounded-md border px-4 text-sm"
          >
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Signing you in...
      </div>
    </div>
  )
}
