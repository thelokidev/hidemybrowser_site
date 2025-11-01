"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqs = [
  {
    question: "What makes HideMyBrowser truly undetectable?",
    answer:
      "HideMyBrowser uses advanced system-level integration to completely hide from screen sharing software, recording tools, and system monitors. When hidden, it leaves absolutely no trace in taskbars, alt-tab menus, or any visible system interface.",
  },
  {
    question: "How do I hide and show the browser?",
    answer:
      "Simply press Alt+\\ from anywhere on your system. The keyboard shortcut works instantly and system-wide, allowing you to toggle visibility in milliseconds without interrupting your workflow.",
  },
  {
    question: "Does it work with Otter.ai?",
    answer:
      "Yes! HideMyBrowser is specifically optimized for Otter.ai and other meeting transcription services. You can run Otter.ai invisibly in the background during your meetings without anyone knowing.",
  },
  {
    question: "Will others see HideMyBrowser during video calls?",
    answer:
      "No. When hidden, HideMyBrowser is completely invisible during screen shares, video calls, and recordings. It won't appear in any shared content or recordings.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "No. HideMyBrowser does not offer a free trial. Access to the app requires an active license.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Absolutely. HideMyBrowser operates entirely on your local machine and doesn't collect or transmit any browsing data. Your privacy and security are our top priorities.",
  },
  {
    question: "How do I install HideMyBrowser?",
    answer:
      "Download the installer for your platform (Windows or macOS), run it, and follow the simple setup wizard. Installation takes less than 2 minutes and requires no browser extensions.",
  },
  {
    question: "Do I need to pay before downloading?",
    answer:
      "You can download the installer for free, but a valid license is required to use HideMyBrowser. There is no free trial.",
  },
]

export function FAQ() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="faq" ref={ref} className="relative py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-background overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-24 -z-10 opacity-60 blur-3xl [mask-image:radial-gradient(closest-side,white,transparent)]">
        <div className="mx-auto h-60 w-[70%] rounded-full bg-gradient-to-b from-sky-400/30 via-cyan-400/20 to-indigo-500/10" />
      </div>
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-4">
            <span className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground">FAQ</span>
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter mx-auto text-pretty bg-gradient-to-b from-white via-sky-100 to-sky-300 bg-clip-text text-transparent mb-4">Frequently Asked Questions</h2>
          <p className="text-base sm:text-lg text-muted-foreground">Have questions? We've got answers.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-2 sm:p-3">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
