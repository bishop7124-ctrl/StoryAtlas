import { useEffect } from 'react'
import { StudioSheet } from '../presentation/Studio'

// The Fix: uses theme variables so all 4 themes apply correctly
export default function Modal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return <StudioSheet title={title} onClose={onClose} narrow={!wide}>{children}</StudioSheet>
}
