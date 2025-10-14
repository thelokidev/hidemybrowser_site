"use client"

import Link from "next/link"
import { useMemo, useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import styles from "./UserAvatar.module.css"

function getInitials(nameOrEmail?: string | null) {
  if (!nameOrEmail) return "U"
  const str = String(nameOrEmail)
  if (str.includes("@")) return str[0]?.toUpperCase() ?? "U"
  const parts = str.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "U"
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
}

export type UserAvatarProps = {
  href?: string
  size?: number
  withLink?: boolean
  className?: string
}

export function UserAvatar({ href = "/dashboard", size = 32, withLink = true, className }: UserAvatarProps) {
  const { user } = useAuth()
  const [isPro, setIsPro] = useState(false)

  const { src, fallback } = useMemo(() => {
    const meta = (user?.user_metadata as any) || {}
    const identities: any[] = (user as any)?.identities || []

    // Try multiple sources in order of likelihood
    let url: string | undefined =
      meta.avatar_url ||
      meta.picture ||
      meta.user_picture ||
      identities.find(i => i?.identity_data?.avatar_url)?.identity_data?.avatar_url ||
      identities.find(i => i?.identity_data?.picture)?.identity_data?.picture ||
      identities.find(i => i?.identity_data?.user_picture)?.identity_data?.user_picture

    if (!url) {
      // Default avatar for magic link or missing image
      url = "/placeholder-user.jpg"
    }

    const name = meta.full_name || meta.name || user?.email
    return {
      src: url,
      fallback: getInitials(name),
    }
  }, [user])

  const [imgSrc, setImgSrc] = useState<string>(src)

  useEffect(() => {
    setImgSrc(src)
  }, [src])

  // Fetch full user from Supabase to get latest metadata/identities (some providers only expose picture there)
  useEffect(() => {
    const supabase = createClient()
    let cancelled = false
    const run = async () => {
      const { data } = await supabase.auth.getUser()
      const u = data?.user as any
      if (!u) return
      const meta = (u.user_metadata as any) || {}
      const identities: any[] = (u.identities as any[]) || []
      const freshUrl: string | undefined =
        meta.avatar_url ||
        meta.picture ||
        meta.user_picture ||
        identities.find(i => i?.identity_data?.avatar_url)?.identity_data?.avatar_url ||
        identities.find(i => i?.identity_data?.picture)?.identity_data?.picture ||
        identities.find(i => i?.identity_data?.user_picture)?.identity_data?.user_picture
      if (!cancelled && freshUrl && freshUrl !== imgSrc) {
        setImgSrc(freshUrl)
      }

      // Fetch subscription status to determine if user is pro
      if (!cancelled && u.id) {
        try {
          const { data: subs } = await supabase
            .from('subscriptions')
            .select('status, dodo_product_id')
            .eq('user_id', u.id)
            .eq('status', 'active')
            .limit(1)
          
          // User is pro if they have an active subscription
          setIsPro(!!subs && subs.length > 0)
        } catch {}
      }
    }
    run()
    return () => { cancelled = true }
  }, [])

  const avatar = (
    <div className={`${styles.container} ${isPro ? styles.pro : ''} ${className || ''}`} style={{ width: size, height: size }}>
      <AvatarImage
        src={imgSrc}
        alt="User avatar"
        className={styles.image}
        onError={() => setImgSrc("/placeholder-user.jpg")}
      />
      <AvatarFallback className={styles.initials} style={{ fontSize: size * 0.4 }}>{fallback}</AvatarFallback>
    </div>
  )

  if (withLink) {
    return (
      <Link href={href} aria-label="Open dashboard">
        {avatar}
      </Link>
    )
  }

  return avatar
}
