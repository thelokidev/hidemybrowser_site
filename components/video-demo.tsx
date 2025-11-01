"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"
import { Play } from "lucide-react"

export function VideoDemo() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} className="pt-8 pb-20 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
        transition={{ duration: 0.8 }}
        className="max-w-6xl mx-auto"
      >
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-pink-200 via-indigo-200 to-blue-300 p-1">
          <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 aspect-video">
            {/* Mock browser interface */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-full h-full">
                {/* Browser chrome */}
                <div className="absolute top-4 left-4 right-4 h-8 bg-gray-700/50 rounded-lg flex items-center px-3 gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="flex-1 h-5 bg-gray-600/50 rounded mx-4" />
                </div>

                {/* Video call mockup */}
                <div className="absolute top-16 left-8 w-64 bg-gray-800 rounded-lg p-4 shadow-2xl">
                  <div className="text-white text-sm font-medium mb-2">Video Call - Screen Sharing</div>
                  <div className="aspect-video bg-gray-700 rounded mb-2" />
                  <div className="flex gap-2">
                    <div className="flex-1 h-8 bg-gray-700 rounded" />
                    <div className="flex-1 h-8 bg-gray-700 rounded" />
                  </div>
                </div>

                {/* HideMyBrowser window */}
                <div className="absolute top-20 right-12 w-80 bg-white rounded-lg shadow-2xl overflow-hidden">
                  <div className="bg-gray-100 px-4 py-3 border-b flex items-center justify-between">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="text-center mb-4">
                      <div className="w-12 h-12 bg-black rounded-full mx-auto mb-2" />
                      <div className="font-semibold">HideMyBrowser</div>
                    </div>
                    <div className="text-sm text-gray-600 mb-4">Use Better AI to write better emails</div>
                    <div className="flex gap-2 justify-center mb-4">
                      <div className="w-8 h-8 rounded-full bg-gray-200" />
                      <div className="w-8 h-8 rounded-full bg-gray-200" />
                    </div>
                    <div className="bg-black text-white text-center py-2 rounded text-sm">Install</div>
                  </div>
                </div>

                {/* Status indicator */}
                <div className="absolute bottom-8 left-8 bg-black/80 backdrop-blur text-white px-4 py-2 rounded-lg text-sm">
                  HideMyBrowser Running (Invisible)
                </div>

                <div className="absolute bottom-8 right-8 bg-black/80 backdrop-blur text-white px-4 py-2 rounded-lg text-sm">
                  Press Alt+\ to toggle
                </div>

                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-20 h-20 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-2xl"
                  >
                    <Play className="w-8 h-8 text-gray-900 ml-1" fill="currentColor" />
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
