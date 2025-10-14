'use client'

import { useEffect, useState } from 'react'
import styles from './UserAvatar.module.css'

type UserAvatarProps = {
  user: {
    email?: string
    user_metadata?: {
      full_name?: string
      name?: string
      avatar_url?: string
    }
  } | null
  isPro?: boolean
  size?: number
}

export function UserAvatar({ user, isPro = false, size = 40 }: UserAvatarProps) {
  const [imageError, setImageError] = useState(false)
  
  const avatarUrl = user?.user_metadata?.avatar_url
  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || 'User'
  
  // Get initials from name or email
  const getInitials = (str: string) => {
    const parts = str.split(/[\s@]+/).filter(Boolean)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return str.slice(0, 2).toUpperCase()
  }
  
  const initials = getInitials(name)
  const showImage = avatarUrl && !imageError

  return (
    <div 
      className={`${styles.container} ${isPro ? styles.pro : ''}`}
      style={{ width: size, height: size }}
    >
      {showImage ? (
        <img
          src={avatarUrl}
          alt={name}
          className={styles.image}
          onError={() => setImageError(true)}
        />
      ) : (
        <div className={styles.initials} style={{ fontSize: size * 0.4 }}>
          {initials}
        </div>
      )}
    </div>
  )
}
