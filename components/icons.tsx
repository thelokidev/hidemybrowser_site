import * as React from "react"

export type HmbIconProps = React.SVGProps<SVGSVGElement>

export function HmbBolt({ className, ...props }: HmbIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function HmbEyeOff({ className, ...props }: HmbIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
      <path d="M4 4l16 16" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function HmbGhost({ className, ...props }: HmbIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M7 21s1.5-1 2.5-1 2.5 1 2.5 1 1.5-1 2.5-1 2.5 1 2.5 1V11a6.5 6.5 0 0 0-13 0v10Z" />
      <circle cx="9" cy="10" r="1" />
      <circle cx="15" cy="10" r="1" />
    </svg>
  )
}

export function HmbMic({ className, ...props }: HmbIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <rect x="8" y="3" width="8" height="12" rx="4" />
      <path d="M12 19v3" />
      <path d="M5 12a7 7 0 0 0 14 0" />
    </svg>
  )
}

export function HmbKeyboard({ className, ...props }: HmbIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <rect x="3" y="7" width="18" height="10" rx="2" />
      <path d="M7 10h1M10 10h1M13 10h1M16 10h1M7 13h10" />
    </svg>
  )
}

export function HmbShield({ className, ...props }: HmbIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M12 2 5 5v6c0 4.5 2.6 8.5 7 10 4.4-1.5 7-5.5 7-10V5l-7-3Z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}
