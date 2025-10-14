import Link from "next/link"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="border-t border-border py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
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

        <div className="mt-8 text-center text-sm text-muted-foreground">(c) 2025 HideMyBrowser. All rights reserved.</div>
      </div>
    </footer>
  )
}
