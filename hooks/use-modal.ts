"use client"

import { useState, useCallback } from 'react'
import type { ModalType } from '@/components/custom-modal'

interface ModalState {
  isOpen: boolean
  type: ModalType
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  showCancel?: boolean
  onConfirm?: () => void
}

export function useModal() {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  })

  const showModal = useCallback((config: Omit<ModalState, 'isOpen'>) => {
    setModalState({
      ...config,
      isOpen: true,
    })
  }, [])

  const closeModal = useCallback(() => {
    setModalState(prev => ({ ...prev, isOpen: false }))
  }, [])

  // Convenience methods
  const showSuccess = useCallback((title: string, message: string, onConfirm?: () => void) => {
    showModal({
      type: 'success',
      title,
      message,
      confirmText: 'OK',
      onConfirm,
    })
  }, [showModal])

  const showError = useCallback((title: string, message: string, onConfirm?: () => void) => {
    showModal({
      type: 'error',
      title,
      message,
      confirmText: 'OK',
      onConfirm,
    })
  }, [showModal])

  const showWarning = useCallback((title: string, message: string, onConfirm?: () => void) => {
    showModal({
      type: 'warning',
      title,
      message,
      confirmText: 'OK',
      onConfirm,
    })
  }, [showModal])

  const showInfo = useCallback((title: string, message: string, onConfirm?: () => void) => {
    showModal({
      type: 'info',
      title,
      message,
      confirmText: 'OK',
      onConfirm,
    })
  }, [showModal])

  const showConfirm = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText = 'CONFIRM',
    cancelText = 'CANCEL'
  ) => {
    showModal({
      type: 'confirm',
      title,
      message,
      confirmText,
      cancelText,
      showCancel: true,
      onConfirm,
    })
  }, [showModal])

  return {
    modalState,
    showModal,
    closeModal,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
  }
}

// Helper function to replace window.alert
export function customAlert(title: string, message: string, type: ModalType = 'info') {
  // This is a simplified version for quick replacements
  // For full functionality, use the useModal hook in components
  return new Promise<void>((resolve) => {
    const event = new CustomEvent('show-custom-modal', {
      detail: { title, message, type, onConfirm: resolve }
    })
    window.dispatchEvent(event)
  })
}

// Helper function to replace window.confirm
export function customConfirm(title: string, message: string) {
  return new Promise<boolean>((resolve) => {
    const event = new CustomEvent('show-custom-modal', {
      detail: {
        title,
        message,
        type: 'confirm',
        showCancel: true,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false)
      }
    })
    window.dispatchEvent(event)
  })
}
