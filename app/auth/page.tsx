"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { Download } from "@/components/download"
import { Pricing } from "@/components/pricing"
import { FAQ } from "@/components/faq"
import { Footer } from "@/components/footer"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
// removed auto-redirect to avoid navigation loops on sign-out
import { Loader2, Mail, CheckCircle2 } from "lucide-react"

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const next = searchParams.get('next')
        const target = next && next.startsWith('/') ? next : "/dashboard"
        console.log('[Auth Page] User already authenticated, redirecting to', target)
        router.replace(target)
      }
    }
    checkAuth()
  }, [supabase, router, searchParams])

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading('magic-link')
    setMessage(null)

    try {
      const next = searchParams.get('next')
      const redirectTo = next 
        ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
        : `${window.location.origin}/auth/callback`
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo
        }
      })

      if (error) throw error

      setMessage({ 
        type: 'success', 
        text: 'Check your email for the magic link!' 
      })
      setEmail('')
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'An error occurred' 
      })
    } finally {
      setLoading(null)
    }
  }

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setLoading(provider)
    setMessage(null)

    try {
      const next = searchParams.get('next')
      const redirectTo = next 
        ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
        : `${window.location.origin}/auth/callback`
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectTo
        }
      })

      if (error) throw error
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'An error occurred' 
      })
      setLoading(null)
    }
  }

  return (
    <div className="relative min-h-screen">
      {/* Background: landing page */}
      <div className="absolute inset-0 -z-10 overflow-y-auto bg-background">
        <main className="min-h-screen">
          <Header />
          <Hero />
          <Features />
          <Download />
          <Pricing />
          <FAQ />
          <Footer />
        </main>
      </div>

      {/* Semi-transparent overlay at 40% opacity (60% transparent) */}
      <div className="absolute inset-0 -z-0 bg-background/40 backdrop-blur-sm" />

      {/* Foreground: auth form */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <Link
          href="/"
          className="fixed top-6 left-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-6">
              <div className="w-12 h-12 bg-foreground rounded-lg flex items-center justify-center mx-auto">
                <span className="text-background font-bold text-xl">HMB</span>
              </div>
            </Link>
            <h1
              className="text-3xl font-normal tracking-[-0.02em] mb-2"
              style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
            >
              Welcome to HideMyBrowser
            </h1>
            <p className="text-muted-foreground text-sm">
              Sign in with your email or social account
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
            {/* OAuth Buttons First */}
            <div className="space-y-3 mb-6">
              <Button
                variant="outline"
                className="w-full h-11 text-[15px] font-normal"
                type="button"
                onClick={() => handleOAuthSignIn('google')}
                disabled={loading === 'google'}
              >
                {loading === 'google' ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                {loading === 'google' ? 'Connecting...' : 'Continue with Google'}
              </Button>

              <Button
                variant="outline"
                className="w-full h-11 text-[15px] font-normal"
                type="button"
                onClick={() => handleOAuthSignIn('github')}
                disabled={loading === 'github'}
              >
                {loading === 'github' ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                )}
                {loading === 'github' ? 'Connecting...' : 'Continue with GitHub'}
              </Button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or use magic link</span>
              </div>
            </div>

            {/* Magic Link Form */}
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="h-11 pl-10"
                    required
                    disabled={loading === 'magic-link'}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 text-[15px]"
                disabled={loading === 'magic-link'}
              >
                {loading === 'magic-link' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending magic link...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send magic link
                  </>
                )}
              </Button>
            </form>

            {/* Success/Error Message */}
            {message && (
              <div className={`mt-4 p-3 rounded-lg flex items-start gap-2 text-sm ${
                message.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                ) : (
                  <svg className="h-5 w-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                <p>{message.text}</p>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-foreground">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}


