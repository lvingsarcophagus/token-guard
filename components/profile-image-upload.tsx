'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Upload, User, X } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'

export default function ProfileImageUpload() {
  const { user, userData, updateProfile } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Update preview when userData changes
  useEffect(() => {
    if (userData?.photoURL) {
      setPreviewUrl(userData.photoURL)
    }
  }, [userData])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Invalid file type', {
        description: 'Please select an image file (JPG, PNG, or GIF)'
      })
      return
    }

    // Validate file size (max 1MB for base64 storage)
    if (file.size > 1 * 1024 * 1024) {
      toast.error('File too large', {
        description: 'Image size must be less than 1MB'
      })
      return
    }

    setUploading(true)

    try {
      // Convert image to base64
      const reader = new FileReader()
      
      reader.onloadend = async () => {
        try {
          const base64String = reader.result as string
          
          console.log('[ProfileUpload] Base64 string length:', base64String.length)
          console.log('[ProfileUpload] User ID:', user.uid)
          
          // Update user profile with base64 image
          await updateProfile({ photoURL: base64String })
          
          console.log('[ProfileUpload] Profile updated successfully')
          
          setPreviewUrl(base64String)
          toast.success('Profile image updated', {
            description: 'Your profile image has been updated successfully'
          })
        } catch (error) {
          console.error('[ProfileUpload] Error updating profile:', error)
          toast.error('Upload failed', {
            description: 'Failed to save image. Please try again.'
          })
        } finally {
          setUploading(false)
        }
      }

      reader.onerror = () => {
        console.error('Error reading file')
        toast.error('Upload failed', {
          description: 'Failed to read image file. Please try again.'
        })
        setUploading(false)
      }

      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Upload failed', {
        description: 'Failed to upload image. Please try again.'
      })
      setUploading(false)
    }
  }

  const handleRemoveImage = async () => {
    if (!user) return

    try {
      setUploading(true)

      // Update profile to remove photo URL
      await updateProfile({ photoURL: '' })
      setPreviewUrl(null)
      toast.success('Image removed', {
        description: 'Your profile image has been removed'
      })
    } catch (error) {
      console.error('Error removing image:', error)
      toast.error('Remove failed', {
        description: 'Failed to remove image. Please try again.'
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-6">
        {/* Profile Image Preview */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-2 border-white/30 bg-white/5 flex items-center justify-center overflow-hidden">
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Profile"
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-white/40" />
            )}
          </div>
          {previewUrl && (
            <button
              onClick={handleRemoveImage}
              disabled={uploading}
              className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
              title="Remove image"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          )}
        </div>

        {/* Upload Button */}
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            variant="outline"
            className="border border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white font-mono text-sm uppercase"
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'UPLOADING...' : 'UPLOAD IMAGE'}
          </Button>
          <p className="text-white/40 font-mono text-xs mt-2">
            JPG, PNG or GIF. Max 5MB.
          </p>
        </div>
      </div>
    </div>
  )
}
