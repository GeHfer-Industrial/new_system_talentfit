import { AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  loading?: boolean
  confirmLabel?: string
  variant?: 'danger' | 'warning'
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  loading,
  confirmLabel = 'Confirmar',
  variant = 'danger',
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${variant === 'danger' ? 'bg-red-50' : 'bg-amber-50'}`}>
          <AlertTriangle className={`h-5 w-5 ${variant === 'danger' ? 'text-red-500' : 'text-amber-500'}`} />
        </div>
        <p className="text-sm text-slate-600 leading-relaxed pt-1">{description}</p>
      </div>
    </Modal>
  )
}
