"use client"

import { useEffect } from 'react'
import CustomModal from './custom-modal'
import { useModal } from '@/hooks/use-modal'

export default function ModalProvider() {
  const { modalState, closeModal, showModal } = useModal()

  useEffect(() => {
    const handleCustomModal = (event: CustomEvent) => {
      const { title, message, type, onConfirm, onCancel, confirmText, cancelText, showCancel } = event.detail
      
      showModal({
        type: type || 'info',
        title,
        message,
        confirmText,
        cancelText,
        showCancel,
        onConfirm: () => {
          if (onConfirm) onConfirm()
          closeModal()
        },
      })
    }

    window.addEventListener('show-custom-modal' as any, handleCustomModal as EventListener)
    return () => {
      window.removeEventListener('show-custom-modal' as any, handleCustomModal as EventListener)
    }
  }, [showModal, closeModal])

  return (
    <CustomModal
      isOpen={modalState.isOpen}
      onClose={closeModal}
      onConfirm={modalState.onConfirm}
      type={modalState.type}
      title={modalState.title}
      message={modalState.message}
      confirmText={modalState.confirmText}
      cancelText={modalState.cancelText}
      showCancel={modalState.showCancel}
    />
  )
}
