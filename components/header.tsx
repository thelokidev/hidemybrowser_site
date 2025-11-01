"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { ProfileDropdown } from "@/components/profile-dropdown"
import Image from "next/image"

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    // Mark as mounted to avoid hydration mismatch when auth state resolves
    setMounted(true)

    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }

    // Throttle scroll events for better performance
    let ticking = false
    const scrollListener = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener("scroll", scrollListener, { passive: true })
    // Set initial state in case the page loads with an offset (e.g., deep link)
    handleScroll()
    return () => window.removeEventListener("scroll", scrollListener)
  }, [])

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4">
        <div
          className={`relative flex items-center justify-between transition-all duration-500 rounded-2xl overflow-hidden transform-gpu ${
            scrolled
              ? "mx-auto mt-3 h-12 sm:h-14 w-full max-w-3xl sm:max-w-4xl border border-border/50 px-3 md:px-4"
              : "mt-0 h-16 sm:h-18 md:h-20 w-full max-w-none border border-transparent px-0"
          }`}
          style={scrolled ? {
            boxShadow: `
              0 1px 2px 0 rgba(0, 0, 0, 0.05),
              0 4px 6px -1px rgba(0, 0, 0, 0.1),
              0 10px 15px -3px rgba(0, 0, 0, 0.1),
              inset 0 1px 0 0 rgba(255, 255, 255, 0.1)
            `
          } : undefined}
        >
          <div
            className={`pointer-events-none absolute inset-0 z-0 bg-background/90 backdrop-blur-md transition-opacity duration-300 ${
              scrolled ? "opacity-100" : "opacity-0"
            }`}
          />
          <Link 
            href="/" 
            className={`relative z-10 shrink-0 flex items-center gap-2 font-bold transition-all duration-300 hover:opacity-80 leading-none ${
              scrolled ? "text-base sm:text-lg" : "text-lg sm:text-xl"
            }`}
          >
            <Image
              src="/favicon.ico"
              alt="HideMyBrowser logo"
              width={24}
              height={24}
              priority
              className="rounded-sm"
            />
            <span className="bg-gradient-to-b from-sky-100 to-foreground bg-clip-text text-transparent tracking-tighter leading-none">HideMyBrowser</span>
          </Link>

          <nav className="relative z-10 hidden md:flex flex-1 items-center justify-center gap-1 min-w-0">
            <NavLink href="#features" scrolled={scrolled}>
              How it works
            </NavLink>
            <NavLink href="#pricing" scrolled={scrolled}>
              Pricing
            </NavLink>
            <NavLink href="/feedback" scrolled={scrolled}>
              Feedback
            </NavLink>
          </nav>

          <div className="relative z-10 shrink-0 flex items-center gap-2">
            {/* Keep server and first client render identical to avoid hydration mismatch */}
            {!mounted ? (
              <div className="h-9 w-[180px]" />
            ) : user ? (
              <ProfileDropdown />
            ) : (
              <>
                <Button 
                  variant="ghost"
                  size="sm"
                  className="transition-all duration-300 hover:bg-accent/50 leading-none"
                >
                  Get a Demo
                </Button>
                <Link href="/auth">
                  <Button 
                    /* primary (black) */
                    size="sm"
                    className="transition-all duration-300 hover:scale-105 hover:shadow-lg leading-none"
                  >
                    Login
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

interface NavLinkProps {
  href: string
  children: React.ReactNode
  scrolled: boolean
}

function NavLink({ href, children, scrolled }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={`relative px-3 py-2 text-muted-foreground hover:text-foreground transition-all duration-200 group ${
        scrolled ? "text-sm" : "text-[15px]"
      }`}
    >
      <span className="relative z-10">{children}</span>
      <span className="absolute inset-0 bg-accent/50 rounded-md scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-200 ease-out" />
    </Link>
  )
}
