export default function YOWLogo({ className = '', title = 'Your Own World' }) {
  return (
    <img
      src="/yow-logo.png"
      className={`yow-logo ${className}`.trim()}
      alt={title || ''}
      style={{ objectFit: 'contain', borderRadius: '6px' }}
    />
  )
}
