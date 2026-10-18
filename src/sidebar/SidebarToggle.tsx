import type { Ref } from 'react'
import { texts } from '../texts'

type Props = { open: boolean; onToggle: () => void; ref: Ref<HTMLButtonElement> }

export function SidebarToggle({ open, onToggle, ref }: Props) {
  const label = open ? texts.sidebar.close : texts.sidebar.open
  return (
    <button
      ref={ref}
      type="button"
      className="btn btn-icon"
      aria-label={label}
      aria-expanded={open}
      title={label}
      onClick={onToggle}
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M9 4v16" />
      </svg>
    </button>
  )
}
