import type { ReactNode, SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function Icon({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export function IconGrid(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
    </Icon>
  )
}

export function IconCalendar(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </Icon>
  )
}

export function IconList(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 6h16M4 12h16M4 18h10" />
    </Icon>
  )
}

export function IconBed(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6M3 18h18M3 18v2M21 18v2M6 10V7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
    </Icon>
  )
}

export function IconUsers(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8" r="3.4" />
      <path d="M3 20c0-3.2 2.7-5.2 6-5.2s6 2 6 5.2" />
      <path d="M16 5.2a3.4 3.4 0 0 1 0 6.6M17.5 14.5c2 .7 3.5 2.4 3.5 5" />
    </Icon>
  )
}

export function IconSettings(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 14.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-2.87 1.2v.17a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-2.93-1.16l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 3.5 13.6h-.17a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.58 6.67l-.06-.06A2 2 0 1 1 7.35 3.8l.06.06a1.7 1.7 0 0 0 2.87-1.2V2.5a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 2.93 1.16l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0 1.16 2.93h.17a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.56 1.03z" />
    </Icon>
  )
}

export function IconPlus(props: IconProps) {
  return (
    <Icon {...props} strokeWidth="2.2">
      <path d="M12 5v14M5 12h14" />
    </Icon>
  )
}

export function IconClose(props: IconProps) {
  return (
    <Icon {...props} strokeWidth="2">
      <path d="M6 6l12 12M18 6 6 18" />
    </Icon>
  )
}

export function IconChevronLeft(props: IconProps) {
  return (
    <Icon {...props} strokeWidth="2">
      <path d="M15 6l-6 6 6 6" />
    </Icon>
  )
}

export function IconChevronRight(props: IconProps) {
  return (
    <Icon {...props} strokeWidth="2">
      <path d="M9 6l6 6-6 6" />
    </Icon>
  )
}

export function IconSearch(props: IconProps) {
  return (
    <Icon {...props} strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Icon>
  )
}

export function IconArrive(props: IconProps) {
  return (
    <Icon {...props} strokeWidth="1.9">
      <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19h14" />
    </Icon>
  )
}

export function IconDepart(props: IconProps) {
  return (
    <Icon {...props} strokeWidth="1.9">
      <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 19h14" />
    </Icon>
  )
}

export function IconCheck(props: IconProps) {
  return (
    <Icon {...props} strokeWidth="2">
      <path d="M20 6 9 17l-5-5" />
    </Icon>
  )
}
