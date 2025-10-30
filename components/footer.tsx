import Link from "next/link"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="relative border-t border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-20 opacity-60 blur-3xl [mask-image:linear-gradient(to_bottom,white,transparent)]">
        <div className="mx-auto h-24 w-[70%] rounded-full bg-gradient-to-b from-sky-400/25 via-cyan-400/15 to-indigo-500/10" />
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2 text-xl font-semibold hover:opacity-80 transition-opacity">
            <Image src="/favicon.ico" alt="HideMyBrowser logo" width={22} height={22} className="rounded-sm" />
            <span className="bg-gradient-to-b from-sky-100 to-foreground bg-clip-text text-transparent tracking-tight">HideMyBrowser</span>
          </Link>

          <nav className="flex items-center gap-6">
            <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/60 rounded">
              Pricing
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/60 rounded">
              Terms of Service
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/60 rounded">
              Privacy Policy
            </Link>
          </nav>
        </div>

        <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="text-muted-foreground order-2 md:order-1">© 2025 HideMyBrowser. All rights reserved.</div>
          <div className="flex items-center justify-start md:justify-end gap-6 order-1 md:order-2">
            <a href="mailto:support@hidemybrowser.app" className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/60 rounded">support@hidemybrowser.app</a>
            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/60 rounded">Contact</Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/60 rounded">Status</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

