/**
 * Custom Loader Component
 * Sleek animated loader inspired by Tokenomics Lab branding
 */

'use client'

import { motion } from 'framer-motion'

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  text?: string
  fullScreen?: boolean
}

export default function Loader({ size = 'md', text, fullScreen = false }: LoaderProps) {
  const sizes = {
    sm: 24,
    md: 40,
    lg: 60,
    xl: 80
  }

  const dimension = sizes[size]

  const containerVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "linear"
      }
    }
  }

  const dotVariants = {
    animate: (i: number) => ({
      scale: [1, 1.5, 1],
      opacity: [0.3, 1, 0.3],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        delay: i * 0.2,
        ease: "easeInOut"
      }
    })
  }

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Animated Logo Loader */}
      <motion.div
        className="relative"
        style={{ width: dimension, height: dimension }}
        variants={containerVariants}
        animate="animate"
      >
        {/* Outer Ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-white/20"
          style={{
            borderTopColor: 'white',
            borderRightColor: 'white'
          }}
        />
        
        {/* Inner Ring */}
        <motion.div
          className="absolute inset-2 rounded-full border-2 border-white/10"
          animate={{
            rotate: -360,
            transition: {
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }
          }}
          style={{
            borderBottomColor: 'rgba(255, 255, 255, 0.5)',
            borderLeftColor: 'rgba(255, 255, 255, 0.5)'
          }}
        />

        {/* Center Dots */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative" style={{ width: dimension * 0.4, height: dimension * 0.4 }}>
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="absolute bg-white rounded-full"
                style={{
                  width: dimension * 0.12,
                  height: dimension * 0.12,
                  top: '50%',
                  left: '50%',
                  transform: `translate(-50%, -50%) rotate(${i * 90}deg) translateY(-${dimension * 0.15}px)`
                }}
                custom={i}
                variants={dotVariants}
                animate="animate"
              />
            ))}
          </div>
        </div>

        {/* Pulse Effect */}
        <motion.div
          className="absolute inset-0 rounded-full bg-white/5"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>

      {/* Loading Text */}
      {text && (
        <motion.div
          className="text-white font-mono text-sm tracking-wider"
          animate={{
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {text}
        </motion.div>
      )}

      {/* Loading Dots */}
      {text && (
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-white"
              animate={{
                opacity: [0.3, 1, 0.3],
                y: [0, -4, 0]
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50">
        {content}
      </div>
    )
  }

  return content
}

// Minimal inline loader for buttons and small spaces
export function InlineLoader({ className = '' }: { className?: string }) {
  return (
    <motion.div
      className={`inline-block ${className}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    >
      <svg
        className="w-4 h-4 text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </motion.div>
  )
}

// Skeleton loader for content placeholders
export function SkeletonLoader({ className = '', count = 1 }: { className?: string; count?: number }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="h-4 bg-white/10 rounded"
          animate={{
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}
