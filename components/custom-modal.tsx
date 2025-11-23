"use client"

import { useEffect } from "react"
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"
import { Button } from "./ui/button"
import { theme } from "@/lib/theme"

export type ModalType = 'success' | 'error' | 'warning' | 'info' | 'confirm'

interface CustomModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
  type?: ModalType
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  showCancel?: boolean
}

export default function CustomModal({
  isOpen,
  onClose,
  onConfirm,
  type = 'info',
  title,
  message,
  confirmText = 'OK',
  cancelText = 'CANCEL',
  showCancel = false
}: CustomModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-12 h-12 text-green-400" />
      case 'error':
        return <AlertCircle className="w-12 h-12 text-red-400" />
      case 'warning':
        return <AlertTriangle className="w-12 h-12 text-yellow-400" />
      case 'confirm':
        return <AlertTriangle className="w-12 h-12 text-orange-400" />
      default:
        return <Info className="w-12 h-12 text-blue-400" />
    }
  }

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          border: 'border-green-500/30',
          bg: 'bg-green-500/10',
          glow: 'from-green-500 to-emerald-500'
        }
      case 'error':
        return {
          border: 'border-red-500/30',
          bg: 'bg-red-500/10',
          glow: 'from-red-500 to-pink-500'
        }
      case 'warning':
        return {
          border: 'border-yellow-500/30',
          bg: 'bg-yellow-500/10',
          glow: 'from-yellow-500 to-orange-500'
        }
      case 'confirm':
        return {
          border: 'border-orange-500/30',
          bg: 'bg-orange-500/10',
          glow: 'from-orange-500 to-red-500'
        }
      default:
        return {
          border: 'border-blue-500/30',
          bg: 'bg-blue-500/10',
          glow: 'from-blue-500 to-cyan-500'
        }
    }
  }

  const colors = getColors()

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md animate-in zoom-in-95 duration-200">
        {/* Glow Effect */}
        <div className={`absolute -inset-1 bg-gradient-to-r ${colors.glow} rounded-2xl blur-xl opacity-20 animate-pulse`}></div>
        
        {/* Modal Content */}
        <div className={`relative ${theme.backgrounds.card} border-2 ${colors.border} rounded-2xl p-6 backdrop-blur-2xl`}>
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-white/60 hover:text-white" />
          </button>

          {/* Icon */}
          <div className={`flex justify-center mb-4 p-4 rounded-full ${colors.bg} border ${colors.border} w-fit mx-auto`}>
            {getIcon()}
          </div>

          {/* Title */}
          <h2 className={`text-xl ${theme.fonts.bold} ${theme.text.primary} ${theme.fonts.mono} ${theme.fonts.tracking} text-center mb-3 uppercase`}>
            {title}
          </h2>

          {/* Message */}
          <p className={`${theme.text.secondary} ${theme.text.base} ${theme.fonts.mono} text-center mb-6 leading-relaxed`}>
            {message}
          </p>

          {/* Actions */}
          <div className={`flex gap-3 ${showCancel || type === 'confirm' ? 'justify-between' : 'justify-center'}`}>
            {(showCancel || type === 'confirm') && (
              <Button
                onClick={onClose}
                className="flex-1 border-2 border-white/20 bg-white/5 hover:bg-white/10 text-white transition-all font-mono text-sm uppercase"
              >
                {cancelText}
              </Button>
            )}
            <Button
              onClick={handleConfirm}
              className={`${(showCancel || type === 'confirm') ? 'flex-1' : 'min-w-[120px]'} ${
                type === 'error' || type === 'confirm'
                  ? 'border-2 border-red-500 bg-red-500 hover:bg-red-600 text-white'
                  : type === 'success'
                  ? 'border-2 border-green-500 bg-green-500 hover:bg-green-600 text-white'
                  : theme.buttons.primary
              } transition-all font-mono text-sm uppercase`}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
