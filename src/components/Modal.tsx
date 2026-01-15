import { useEffect } from 'react'
import type { ReactNode } from 'react'
import './Modal.css'

export interface ModalProps {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
}

export default function Modal({ open, title, children, onClose }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
