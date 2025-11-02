"use client"

import { motion } from "framer-motion"

// Custom SVG Icons for better brand representation
const InstagramIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
)

const XIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)

const TikTokIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
)

const socialLinks = [
  {
    name: "Instagram",
    icon: InstagramIcon,
    url: "https://www.instagram.com/hidemybrowser/",
    bgColor: "bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500",
    hoverBg: "hover:from-purple-700 hover:via-pink-700 hover:to-orange-600",
    glowColor: "shadow-purple-500/50"
  },
  {
    name: "X",
    icon: XIcon,
    url: "https://x.com/hidemybrowser",
    bgColor: "bg-black",
    hoverBg: "hover:bg-gray-900",
    glowColor: "shadow-gray-500/50"
  },
  {
    name: "TikTok",
    icon: TikTokIcon,
    url: "https://www.tiktok.com/@hidemybrowser",
    bgColor: "bg-gradient-to-br from-black via-gray-900 to-black",
    hoverBg: "hover:from-gray-900 hover:via-black hover:to-gray-900",
    glowColor: "shadow-cyan-500/50"
  }
]

export function SocialSection() {
  return (
    <div className="relative py-12">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-sky-200 via-cyan-200 to-indigo-200 bg-clip-text text-transparent mb-2">
          Connect With Us
        </h3>
        <p className="text-sm text-muted-foreground/80">
          Follow us for updates, tips, and exclusive content
        </p>
      </div>
      
      <div className="flex items-center justify-center gap-6">
        {socialLinks.map((social, index) => {
          const Icon = social.icon
          return (
            <motion.a
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.4, 
                delay: index * 0.15,
                type: "spring",
                stiffness: 200
              }}
              whileHover={{ scale: 1.1, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Glow effect on hover */}
              <div className={`absolute inset-0 ${social.bgColor} opacity-0 group-hover:opacity-50 blur-2xl transition-opacity duration-500 rounded-2xl`} />
              
              {/* Main button with glass effect */}
              <div className={`relative ${social.bgColor} ${social.hoverBg} p-4 rounded-2xl shadow-lg group-hover:shadow-2xl ${social.glowColor} transition-all duration-300 border border-white/10 backdrop-blur-sm`}>
                <div className="text-white">
                  <Icon />
                </div>
              </div>
              
              {/* Animated tooltip */}
              <motion.div 
                className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap"
                initial={{ y: -5 }}
                whileHover={{ y: 0 }}
              >
                <span className="text-xs font-medium text-foreground bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 shadow-xl">
                  {social.name}
                </span>
              </motion.div>
            </motion.a>
          )
        })}
      </div>
    </div>
  )
}
