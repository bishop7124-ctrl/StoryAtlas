export default function StoryAtlasLogo({ className = '', title = 'Story Atlas' }) {
  return (
    <svg
      className={`story-atlas-logo ${className}`.trim()}
      viewBox="0 0 64 64"
      role={title ? 'img' : 'presentation'}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title && <title>{title}</title>}
      <rect className="story-atlas-logo-bg" x="4" y="4" width="56" height="56" rx="14" />
      <g className="story-atlas-logo-mark">
        <path d="M15 18 L32 10 L32 32 L13 32 L14 25 Z" />
        <path d="M32 18 H46 C53 18 56 22 56 29 V32 H32 Z" />
        <path d="M14 34 H32 V55 C27 47 21 44 14 45 Z" />
        <path d="M32 34 H55 C53 46 45 55 32 58 Z" />
        <path d="M45 11 L36 18 H45 L53 12" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="53" cy="11" r="4.25" />
      </g>
      <g className="story-atlas-logo-cuts">
        <path d="M16 18 L31 31" />
        <path d="M14 25 L32 10" />
        <path d="M20 32 L31 14" />
        <path d="M14 32 L19 20 L26 32" />
        <path d="M32 18 H37" />
        <path d="M32 32 H46" />
        <path d="M46 19 C42 22 40 26 40 32" />
        <circle cx="50" cy="25" r="2.5" />
        <circle cx="50" cy="31" r="2.5" />
        <path d="M14 45 C22 43 28 47 32 55" />
        <path d="M14 50 C22 48 28 51 32 57" />
        <path d="M42 42 C45 39 50 39 53 42" />
        <path d="M41 50 C45 51 49 49 51 45" />
      </g>
      <path className="story-atlas-logo-axis" d="M32 10 V58 M13 32 H56" />
    </svg>
  )
}
