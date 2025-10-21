import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { UserAvatar } from '@/components/user-avatar'
import SubscriptionStatus from '@/components/subscription-status'
import Image from 'next/image'

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
    <div className="min-h-screen bg-background">
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
          <div className="mx-auto flex items-center justify-between mt-0 h-20 w-full max-w-6xl px-1 md:px-2">
            <Link 
              href="/" 
              className="flex items-center gap-2 font-bold transition-all duration-300 hover:opacity-80 text-xl"
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
            <h1 className="text-4xl font-bold mb-2">Welcome to your Dashboard</h1>
            <p className="text-muted-foreground">
              You're successfully signed in as <span className="font-medium text-foreground">{user.email}</span>
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
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

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Get started with HideMyBrowser</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <Link href="/#download">
                    <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 transition-all duration-300 hover:bg-foreground hover:text-background">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>Download App</span>
                    </Button>
                  </Link>

                  <Link href="/#pricing">
                    <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 transition-all duration-300 hover:bg-foreground hover:text-background">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>View Pricing</span>
                    </Button>
                  </Link>

                  <Link href="/#faq">
                    <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 transition-all duration-300 hover:bg-foreground hover:text-background">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span>Documentation</span>
                    </Button>
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
