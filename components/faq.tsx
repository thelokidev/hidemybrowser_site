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
    question: "How does the free trial work?",
    answer:
      "The free trial gives you 10 minutes of stealth browsing to test the core invisibility features. No credit card required. After the trial, you can choose a paid plan to unlock unlimited usage.",
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
      "No. You can download HideMyBrowser for free and use the trial version. You only need to purchase a license when you want to unlock the full features and unlimited usage.",
  },
]

export function FAQ() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="faq" ref={ref} className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-lg text-muted-foreground">Have questions? We've got answers.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  )
}
