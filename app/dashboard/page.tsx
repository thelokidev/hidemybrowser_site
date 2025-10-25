import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { UserAvatar } from '@/components/user-avatar'
import SubscriptionStatus from '@/components/subscription-status'
import Image from 'next/image'
import { Download, CreditCard, BookOpen, Mail, FileText, Shield, ChevronRight } from 'lucide-react'
import { LicensePill } from '@/components/license-pill'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/auth')
  }

  const handleSignOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/auth')
  }

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -right-24 w-[560px] h-[420px] bg-light/60 dark:bg-light/40 blur-[140px] rounded-[48rem]" />
        <div className="absolute bottom-[-10%] -left-24 w-[520px] h-[420px] bg-light/40 dark:bg-light/25 blur-[130px] rounded-[48rem]" />
      </div>
      {/* Back to home (matches auth page UX) */}
      <Link
        href="/"
        className="fixed top-6 left-6 z-50 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
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

      <header>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex items-center justify-between mt-4 h-16 w-full max-w-6xl px-3 md:px-4 rounded-2xl border border-border/60 bg-background/70 backdrop-blur-md">
            <Link 
              href="/" 
              className="flex items-center gap-2 font-bold transition-all duration-300 hover:opacity-80 text-lg"
            >
              <Image
                src="/favicon.ico"
                alt="HideMyBrowser logo"
                width={24}
                height={24}
                priority
                className="rounded-sm"
              />
              <span>HideMyBrowser</span>
            </Link>

            <div className="flex items-center gap-2">
              <UserAvatar size={36} className="ring-1 ring-border/60" withLink={false} />
              <form action={handleSignOut}>
                <Button size="sm" className="transition-all duration-300 hover:scale-105 hover:shadow-lg" type="submit">
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl md:text-5xl font-medium tracking-tighter bg-linear-to-b from-sky-800 dark:from-sky-100 to-foreground dark:to-foreground bg-clip-text text-transparent">Welcome to your Dashboard</h1>
              <LicensePill />
            </div>
            <p className="text-muted-foreground mt-1">
              You're successfully signed in as <span className="font-medium text-foreground">{user.email}</span>
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-xl">
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">User ID</p>
                  <p className="font-mono text-sm">{user.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sign-in Method</p>
                  <p className="font-medium capitalize">
                    {user.app_metadata.provider || 'Email (Magic Link)'}
                  </p>
                </div>
                {user.user_metadata.full_name && (
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{user.user_metadata.full_name}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <SubscriptionStatus />

            <Card className="md:col-span-2 border border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-xl">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Get started with HideMyBrowser</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <Link href="/#download">
                    <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                      <Download className="w-6 h-6" />
                      <span>Download App</span>
                    </Button>
                  </Link>

                  <Link href="/#pricing">
                    <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                      <CreditCard className="w-6 h-6" />
                      <span>View Pricing</span>
                    </Button>
                  </Link>

                  <Link href="/#faq">
                    <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                      <BookOpen className="w-6 h-6" />
                      <span>Documentation</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Resources */}
            <Card className="md:col-span-2 border border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-xl">
              <CardHeader>
                <CardTitle>Resources</CardTitle>
                <CardDescription>Helpful links and support</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Link href="mailto:support@hidemybrowser.app" className="group inline-flex items-center justify-between rounded-lg border border-border bg-background/50 px-4 py-3 hover:shadow-md transition-shadow">
                    <span className="inline-flex items-center gap-2 text-sm"><Mail className="w-4 h-4" /> Support</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <Link href="/terms" className="group inline-flex items-center justify-between rounded-lg border border-border bg-background/50 px-4 py-3 hover:shadow-md transition-shadow">
                    <span className="inline-flex items-center gap-2 text-sm"><FileText className="w-4 h-4" /> Terms of Service</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <Link href="/privacy" className="group inline-flex items-center justify-between rounded-lg border border-border bg-background/50 px-4 py-3 hover:shadow-md transition-shadow">
                    <span className="inline-flex items-center gap-2 text-sm"><Shield className="w-4 h-4" /> Privacy Policy</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
