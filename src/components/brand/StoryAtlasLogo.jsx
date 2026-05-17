export default function StoryAtlasLogo({ className = '', title = 'Story Atlas' }) {
  return (
    <img
      src="/story-atlas-logo.png"
      className={`story-atlas-logo ${className}`.trim()}
      alt={title || ''}
      style={{ objectFit: 'contain', borderRadius: '6px' }}
    />
  )
}
