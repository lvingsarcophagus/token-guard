'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import Navbar from '@/components/navbar'
import { Download, Trash2, Mail, Shield, Cookie, AlertTriangle, Lock, Eye } from 'lucide-react'

export default function PrivacySettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showExportSuccess, setShowExportSuccess] = useState(false)
  
  const handleExportData = async () => {
    setLoading(true)
    try {
      const token = await user?.getIdToken()
      const response = await fetch('/api/user/export-data', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) throw new Error('Export failed')
      
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tokenomicslab-data-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      
      setShowExportSuccess(true)
      setTimeout(() => setShowExportSuccess(false), 3000)
    } catch (error) {
      alert('❌ Failed to export data. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  const handleDeleteAccount = async () => {
    if (!window.confirm('⚠️ FINAL CONFIRMATION: This action cannot be undone. Delete account permanently?')) {
      return
    }
    
    setLoading(true)
    try {
      const token = await user?.getIdToken()
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) throw new Error('Deletion failed')
      
      alert('✅ Your account has been permanently deleted. You will be redirected to the home page.')
      window.location.href = '/'
    } catch (error) {
      alert('❌ Failed to delete account. Please contact support.')
    } finally {
      setLoading(false)
    }
  }
  
  // Redirect if not logged in
  if (!user) {
    router.push('/login')
    return null
  }
  
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2 font-mono tracking-wider">
              PRIVACY & DATA SETTINGS
            </h1>
            <p className="text-gray-400 font-mono text-sm">
              MANAGE YOUR DATA AND EXERCISE YOUR GDPR RIGHTS
            </p>
          </div>
          
          {/* Success Message */}
          {showExportSuccess && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
              <p className="text-green-400 font-mono text-sm">
                ✅ YOUR DATA HAS BEEN DOWNLOADED SUCCESSFULLY
              </p>
            </div>
          )}
          
          {/* GDPR Rights Section */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2 font-mono">
              <Shield className="w-5 h-5 text-white/70" />
              YOUR GDPR RIGHTS
            </h2>
            <p className="text-gray-300 text-sm mb-6 font-mono">
              AS AN EU DATA SUBJECT, YOU HAVE THE FOLLOWING RIGHTS UNDER GDPR:
            </p>
            
            <div className="space-y-4">
              {/* Right to Access & Portability */}
              <div className="flex items-start justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:border-white/30 transition">
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1 flex items-center gap-2 font-mono">
                    <Download className="w-4 h-4 text-white/70" />
                    DOWNLOAD MY DATA
                  </h3>
                  <p className="text-sm text-gray-400 font-mono">
                    Export all your data in JSON format (GDPR Article 15 & 20)
                  </p>
                  <p className="text-xs text-gray-500 mt-1 font-mono">
                    Includes: account info, search history, watchlist, preferences
                  </p>
                </div>
                <button
                  onClick={handleExportData}
                  disabled={loading}
                  className="ml-4 px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-gray-600 text-white rounded-lg font-medium transition font-mono text-sm border border-white/30"
                >
                  {loading ? 'EXPORTING...' : 'EXPORT'}
                </button>
              </div>
              
              {/* Right to Erasure */}
              <div className="flex items-start justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:border-white/30 transition">
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1 flex items-center gap-2 font-mono">
                    <Trash2 className="w-4 h-4 text-red-400" />
                    DELETE MY ACCOUNT
                  </h3>
                  <p className="text-sm text-gray-400 font-mono">
                    Permanently delete all your data (GDPR Article 17)
                  </p>
                  <p className="text-xs text-red-400 mt-1 font-mono">
                    ⚠️ THIS ACTION CANNOT BE UNDONE
                  </p>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="ml-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-medium transition font-mono text-sm"
                >
                  DELETE
                </button>
              </div>
              
              {/* Cookie Management */}
              <div className="flex items-start justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:border-yellow-500/50 transition">
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1 flex items-center gap-2 font-mono">
                    <Cookie className="w-4 h-4 text-yellow-400" />
                    COOKIE PREFERENCES
                  </h3>
                  <p className="text-sm text-gray-400 font-mono">
                    Manage your cookie consent settings
                  </p>
                </div>
                <button
                  onClick={() => {
                    localStorage.removeItem('tokenomicslab-cookie-consent')
                    window.location.reload()
                  }}
                  className="ml-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition font-mono text-sm"
                >
                  MANAGE
                </button>
              </div>
            </div>
          </div>
          
          {/* Data Processing Information */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2 font-mono">
              <Eye className="w-5 h-5 text-cyan-400" />
              DATA PROCESSING TRANSPARENCY
            </h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <h4 className="font-semibold text-white mb-2 font-mono text-sm">DATA WE COLLECT</h4>
                <ul className="text-sm text-gray-400 space-y-1 font-mono">
                  <li>• Account information (email, display name)</li>
                  <li>• Token analysis search history</li>
                  <li>• Watchlist and alert preferences</li>
                  <li>• Usage statistics (scans performed)</li>
                </ul>
              </div>
              
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <h4 className="font-semibold text-white mb-2 font-mono text-sm">THIRD-PARTY PROCESSORS</h4>
                <ul className="text-sm text-gray-400 space-y-1 font-mono">
                  <li>• Firebase/Google Cloud (hosting & database)</li>
                  <li>• Moralis (blockchain data)</li>
                  <li>• Mobula (market data)</li>
                  <li>• Helius (Solana data)</li>
                  <li>• GoPlus Labs (security analysis)</li>
                </ul>
              </div>
              
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <h4 className="font-semibold text-white mb-2 font-mono text-sm">DATA RETENTION</h4>
                <p className="text-sm text-gray-400 font-mono">
                  • Search history: 90 days<br />
                  • Account data: Until account deletion<br />
                  • Deletion logs: 3 years (legal requirement)
                </p>
              </div>
            </div>
          </div>
          
          {/* Email Preferences */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2 font-mono">
              <Mail className="w-5 h-5 text-cyan-400" />
              EMAIL PREFERENCES
            </h2>
            
            <div className="space-y-3">
              <label className="flex items-center justify-between p-4 bg-white/5 rounded-lg cursor-pointer border border-white/10 hover:border-cyan-500/50 transition">
                <span className="text-gray-300 font-mono text-sm">Security alerts (recommended)</span>
                <input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-cyan-500" />
              </label>
              
              <label className="flex items-center justify-between p-4 bg-white/5 rounded-lg cursor-pointer border border-white/10 hover:border-cyan-500/50 transition">
                <span className="text-gray-300 font-mono text-sm">Watchlist notifications</span>
                <input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-cyan-500" />
              </label>
              
              <label className="flex items-center justify-between p-4 bg-white/5 rounded-lg cursor-pointer border border-white/10 hover:border-cyan-500/50 transition">
                <span className="text-gray-300 font-mono text-sm">Product updates & news</span>
                <input type="checkbox" className="w-5 h-5 rounded accent-cyan-500" />
              </label>
              
              <label className="flex items-center justify-between p-4 bg-white/5 rounded-lg cursor-pointer border border-white/10 hover:border-cyan-500/50 transition">
                <span className="text-gray-300 font-mono text-sm">Marketing emails</span>
                <input type="checkbox" className="w-5 h-5 rounded accent-cyan-500" />
              </label>
            </div>
          </div>
          
          {/* Legal Links */}
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm font-mono mb-2">
              FOR MORE INFORMATION:
            </p>
            <div className="flex justify-center gap-4">
              <a href="/privacy" className="text-cyan-400 hover:text-cyan-300 underline font-mono text-sm">
                Privacy Policy
              </a>
              <a href="/terms" className="text-cyan-400 hover:text-cyan-300 underline font-mono text-sm">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
        
        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-2xl border-2 border-red-500/50 max-w-md w-full p-6">
              <div className="text-center mb-4">
                <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2 font-mono">
                  CONFIRM DELETION
                </h3>
              </div>
              
              <p className="text-gray-300 mb-4 font-mono text-sm">
                This will permanently delete:
              </p>
              <ul className="list-disc list-inside text-red-400 text-sm mb-6 space-y-1 font-mono">
                <li>Your account and profile</li>
                <li>All search history</li>
                <li>Watchlist and alerts</li>
                <li>Preferences and settings</li>
              </ul>
              <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg mb-6">
                <p className="text-red-400 text-sm font-semibold font-mono text-center">
                  THIS ACTION CANNOT BE UNDONE
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition font-mono"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 text-white rounded-lg font-semibold transition font-mono"
                >
                  {loading ? 'DELETING...' : 'DELETE FOREVER'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
