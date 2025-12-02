"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { theme } from '@/lib/theme'
import { useAuth } from '@/contexts/auth-context'
import { useX402Payment } from '@/hooks/use-x402-payment'
import { Loader2, Wallet, CheckCircle, Zap } from 'lucide-react'
import { toast } from 'sonner'

export default function PremiumSignupPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isTestnet, setIsTestnet] = useState(true)
  const [price, setPrice] = useState('29.00')
  const [asset, setAsset] = useState('USDC')
  const [selectedPaymentAsset, setSelectedPaymentAsset] = useState<'SOL' | 'USDC'>('USDC')
  const [alreadyPremium, setAlreadyPremium] = useState(false)
  const router = useRouter()
  const { user, userProfile } = useAuth()
  const { fetchWithPayment, isPaying } = useX402Payment()

  // Check if user already has premium
  useEffect(() => {
    if (userProfile?.plan === 'PREMIUM') {
      setAlreadyPremium(true)
    }
  }, [userProfile])

  // Fetch pricing settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/admin/x402-settings')
        if (response.ok) {
          const data = await response.json()
          const testnetMode = data.settings?.useTestnet ?? false
          setIsTestnet(testnetMode)
          setPrice(data.settings?.price ?? '29.00')
          // Asset is determined by testnet mode
          setAsset(testnetMode ? 'SOL' : 'USDC')
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err)
      }
    }
    fetchSettings()
    
    // Poll for settings changes every 5 seconds
    const interval = setInterval(fetchSettings, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleUpgrade = async () => {
    if (!user) {
      setError('Please sign in first')
      toast.error('Please sign in to upgrade')
      setTimeout(() => router.push('/login'), 1500)
      return
    }

    setLoading(true)
    setError('')

    try {
      const data = await fetchWithPayment('/api/premium/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      }) as { success?: boolean; error?: string }

      if (data.success) {
        setSuccess(true)
        toast.success('Successfully upgraded to Premium!')
        
        // Force full page reload to refresh auth context with new tier
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 2000)
      } else {
        throw new Error(data.error || 'Upgrade failed')
      }
    } catch (err: any) {
      console.error('Upgrade error:', err)
      setError(err.message || 'Payment failed')
      toast.error(err.message || 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`relative min-h-screen flex items-center justify-center ${theme.backgrounds.main} overflow-hidden p-4`}>
      {/* Stars background */}
      <div className="fixed inset-0 stars-bg pointer-events-none opacity-30"></div>

      <div className={`relative ${theme.backgrounds.card} border ${theme.borders.default} p-8 w-full max-w-5xl`}>
        <div className="flex items-center gap-2 mb-6 opacity-60">
          <div className={theme.decorative.divider}></div>
          <span className={`${theme.text.tiny} ${theme.text.primary} ${theme.fonts.mono} ${theme.fonts.tracking} uppercase`}>Premium Upgrade</span>
          <div className="flex-1 h-px bg-white"></div>
        </div>

        {alreadyPremium ? (
          // Already Premium State
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className={`${theme.text.xlarge} ${theme.fonts.bold} ${theme.text.primary} mb-2 ${theme.fonts.mono}`}>
              YOU'RE ALREADY PREMIUM!
            </h2>
            <p className={`${theme.text.secondary} ${theme.text.base} ${theme.fonts.mono} mb-6`}>
              You have full access to all premium features
            </p>
            <button
              onClick={() => router.push('/premium/dashboard')}
              className="border-2 border-white bg-white text-black hover:bg-black hover:text-white transition-all py-3 px-6 font-mono text-sm font-bold uppercase tracking-widest"
            >
              GO TO PREMIUM DASHBOARD
            </button>
          </div>
        ) : success ? (
          // Success State - Enhanced
          <div className="text-center py-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 bg-green-400/20 rounded-full animate-ping"></div>
              </div>
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4 relative z-10" />
            </div>
            <h2 className={`${theme.text.xlarge} ${theme.fonts.bold} ${theme.text.primary} mb-2 ${theme.fonts.mono}`}>
              PAYMENT COMPLETE!
            </h2>
            <p className={`${theme.text.secondary} ${theme.text.base} ${theme.fonts.mono} mb-4`}>
              🎉 Welcome to Premium
            </p>
            <div className="bg-green-500/10 border border-green-500/20 rounded p-4 mb-4">
              <p className="text-sm text-green-400 font-mono">
                ✓ Unlimited scans activated<br/>
                ✓ AI analysis enabled<br/>
                ✓ Real-time alerts active<br/>
                ✓ Full analytics unlocked
              </p>
            </div>
            <p className={`${theme.text.secondary} ${theme.text.small} ${theme.fonts.mono}`}>
              Redirecting to your premium dashboard...
            </p>
          </div>
        ) : (
          // Payment State - Wide Horizontal Layout
          <>
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3 opacity-60">
                <div className="w-8 h-px bg-white"></div>
                <span className="text-[10px] text-white font-mono tracking-widest uppercase">Premium Access</span>
                <div className="flex-1 h-px bg-white"></div>
              </div>
              <h2 className="text-2xl font-bold text-white font-mono tracking-wider uppercase">
                UPGRADE TO PREMIUM
              </h2>
            </div>

            {/* Main Content - 2 Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Pricing & Payment */}
              <div className="space-y-4">
                {/* Payment Method Selector */}
                <div>
                  <p className="text-xs text-white/60 font-mono mb-2 uppercase tracking-wider">Payment Method</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedPaymentAsset('SOL')}
                      className={`p-3 border transition-all ${
                        selectedPaymentAsset === 'SOL'
                          ? 'border-white bg-white/10'
                          : 'border-white/20 hover:border-white/40'
                      }`}
                    >
                      <div className="text-xl font-bold text-white font-mono">{price}</div>
                      <div className="text-xs text-white/60 font-mono">SOL</div>
                    </button>
                    <button
                      onClick={() => setSelectedPaymentAsset('USDC')}
                      className={`p-3 border transition-all ${
                        selectedPaymentAsset === 'USDC'
                          ? 'border-white bg-white/10'
                          : 'border-white/20 hover:border-white/40'
                      }`}
                    >
                      <div className="text-xl font-bold text-white font-mono">{price}</div>
                      <div className="text-xs text-white/60 font-mono">USDC</div>
                    </button>
                  </div>
                </div>

                {/* Pricing Display */}
                <div className="p-6 border border-white/20 bg-black/40 relative">
                  <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-white/40"></div>
                  <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/40"></div>
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-white/40"></div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white/40"></div>
                  
                  <div className="text-4xl font-bold text-white font-mono mb-1">
                    {price} {selectedPaymentAsset}
                  </div>
                  <div className="text-xs text-white/60 font-mono uppercase tracking-wider">
                    30-Day Subscription
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="p-3 border border-white/20 bg-black/60">
                    <p className="text-xs text-white font-mono">⚠ {error}</p>
                  </div>
                )}

                {/* Payment Button */}
                <button
                  onClick={handleUpgrade}
                  disabled={loading || isPaying || !user}
                  className="w-full border-2 border-white bg-white text-black hover:bg-black hover:text-white transition-all py-3 font-mono text-sm font-bold uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-black"
                >
                  {loading || isPaying ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isPaying ? 'PROCESSING...' : 'LOADING...'}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Wallet className="w-4 h-4" />
                      PAY {price} {selectedPaymentAsset}
                    </span>
                  )}
                </button>

                {!user && (
                  <div className="p-2 border border-white/20 bg-black/60">
                    <p className="text-center text-xs text-white font-mono">
                      ⚠ SIGN IN REQUIRED
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column - Features & Info */}
              <div className="space-y-4">
                {/* Features */}
                <div className="border border-white/20 p-4">
                  <p className="text-xs text-white/60 font-mono mb-3 uppercase tracking-wider">Included Features</p>
                  <div className="space-y-2">
                    {[
                      'Unlimited token scans',
                      'AI-powered risk analysis',
                      'Historical analytics',
                      'Real-time price alerts',
                      'Unlimited watchlist',
                    ].map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-white font-mono">
                        <span className="text-white/40">▸</span>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Process */}
                <div className="border border-white/20 p-4">
                  <p className="text-xs text-white/60 font-mono mb-3 uppercase tracking-wider">
                    Payment Process
                  </p>
                  <div className="space-y-2">
                    {[
                      'Connect Phantom wallet',
                      'Confirm transaction',
                      'Instant activation',
                    ].map((step, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-5 h-5 border border-white/40 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] text-white/60 font-mono">{i + 1}</span>
                        </div>
                        <p className="text-xs text-white/80 font-mono">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Info */}
                <div className="pt-3 border-t border-white/10">
                  <div className="flex items-center justify-center gap-3 text-[10px] text-white/40 font-mono uppercase tracking-wider">
                    <span>SECURE</span>
                    <span>•</span>
                    <span>INSTANT</span>
                    <span>•</span>
                    <span>30 DAYS</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .stars-bg {
          background-image: 
            radial-gradient(1px 1px at 20% 30%, white, transparent),
            radial-gradient(1px 1px at 60% 70%, white, transparent),
            radial-gradient(1px 1px at 50% 50%, white, transparent),
            radial-gradient(1px 1px at 80% 10%, white, transparent);
          background-size: 200% 200%;
          opacity: 0.3;
        }
      `}</style>
    </div>
  )
}


