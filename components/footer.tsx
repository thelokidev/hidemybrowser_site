import Link from "next/link"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="relative border-t border-border bg-background/60 backdrop-blur-sm overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2 text-xl font-semibold hover:opacity-80 transition-opacity">
            <Image src="/favicon.ico" alt="HideMyBrowser logo" width={22} height={22} className="rounded-sm" />
            <span>HideMyBrowser</span>
          </Link>

          <nav className="flex items-center gap-6">
            <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
          </nav>
        </div>

        <div className="mt-8 pt-8 border-t border-border/80 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="text-muted-foreground order-2 md:order-1">© 2025 HideMyBrowser. All rights reserved.</div>
          <div className="flex items-center justify-start md:justify-end gap-6 order-1 md:order-2">
            <a href="mailto:support@hidemybrowser.app" className="text-muted-foreground hover:text-foreground transition-colors">support@hidemybrowser.app</a>
            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Status</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

