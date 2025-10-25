import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { Download } from "@/components/download"
import { Pricing } from "@/components/pricing"
import { FAQ } from "@/components/faq"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"

export default function Home() {
  return (
    <main className="min-h-screen bg-background relative overflow-x-clip">
      <Header />
      <Hero />
      <Features />
      <Download />
      <Pricing />
      <FAQ />
      <Footer />
    </main>
  )
}
