/**
 * Admin panel for Smart Alerts system control
 */

'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, RefreshCw, Loader2, AlertTriangle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { auth } from '@/lib/firebase'

export function AdminSmartAlertsPanel() {
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<any>(null)
  const [updating, setUpdating] = useState(false)

  const fetchSettings = async () => {
    try {
      const user = auth.currentUser
      if (!user) return

      const token = await user.getIdToken()
      const response = await fetch('/api/admin/smart-alerts', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Failed to fetch settings')

      const data = await response.json()
      setSettings(data.settings)
    } catch (error: any) {
      console.error('Failed to fetch Smart Alerts settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const toggleAlerts = async () => {
    try {
      setUpdating(true)
      const user = auth.currentUser
      if (!user) return

      const newEnabled = !settings.enabled

      const token = await user.getIdToken()
      const response = await fetch('/api/admin/smart-alerts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          enabled: newEnabled,
          scanIntervalHours: settings.scanIntervalHours || 1
        })
      })

      if (!response.ok) throw new Error('Failed to update settings')

      setSettings({ ...settings, enabled: newEnabled })
      toast.success(`Smart Alerts ${newEnabled ? 'enabled' : 'disabled'}`)
    } catch (error: any) {
      console.error('Failed to toggle Smart Alerts:', error)
      toast.error('Failed to update settings')
    } finally {
      setUpdating(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    )
  }

  const isEnabled = settings?.enabled || false

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border border-white/30 flex items-center justify-center">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white font-mono tracking-wider">SMART ALERTS</h2>
            <p className="text-white/50 text-xs font-mono mt-0.5">Premium Feature Control</p>
          </div>
        </div>
        <button
          onClick={() => fetchSettings()}
          className="px-4 py-2 border-2 border-white/20 text-white hover:bg-white/5 font-mono text-xs transition-all"
        >
          <RefreshCw className="w-3 h-3 inline mr-2" />
          REFRESH
        </button>
      </div>

      {/* Status Card */}
      <div className={`bg-black/60 backdrop-blur-lg border-2 p-6 ${
        isEnabled ? 'border-green-500/50' : 'border-white/20'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {isEnabled ? (
              <CheckCircle className="w-6 h-6 text-green-400" />
            ) : (
              <BellOff className="w-6 h-6 text-white/40" />
            )}
            <div>
              <div className="text-lg font-bold text-white font-mono">
                {isEnabled ? 'SYSTEM ACTIVE' : 'SYSTEM DISABLED'}
              </div>
              <div className="text-xs text-white/50 font-mono">
                {isEnabled 
                  ? 'Scanning watchlist tokens every hour' 
                  : 'No automatic scans running'}
              </div>
            </div>
          </div>
          <button
            onClick={toggleAlerts}
            disabled={updating}
            className={`px-6 py-3 border-2 font-mono text-sm font-bold transition-all ${
              isEnabled
                ? 'border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                : 'border-green-500/50 bg-green-500/10 text-green-400 hover:bg-green-500/20'
            } ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {updating ? (
              <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
            ) : isEnabled ? (
              <BellOff className="w-4 h-4 inline mr-2" />
            ) : (
              <Bell className="w-4 h-4 inline mr-2" />
            )}
            {isEnabled ? 'DISABLE' : 'ENABLE'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
          <div>
            <div className="text-white/40 text-xs font-mono mb-1">SCAN INTERVAL</div>
            <div className="text-white font-mono text-lg font-bold">
              {settings?.scanIntervalHours || 1}h
            </div>
          </div>
          <div>
            <div className="text-white/40 text-xs font-mono mb-1">TOTAL SCANS</div>
            <div className="text-white font-mono text-lg font-bold">
              {settings?.totalScans || 0}
            </div>
          </div>
          <div>
            <div className="text-white/40 text-xs font-mono mb-1">ALERTS SENT</div>
            <div className="text-white font-mono text-lg font-bold">
              {settings?.totalAlerts || 0}
            </div>
          </div>
        </div>

        {settings?.lastRun && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="text-white/40 text-xs font-mono mb-1">LAST RUN</div>
            <div className="text-white/60 font-mono text-sm">
              {new Date(settings.lastRun).toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {/* Alert Conditions */}
      <div className="bg-black/60 backdrop-blur-lg border border-white/20 p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          <h3 className="text-white font-mono text-sm font-bold tracking-wider">ALERT CONDITIONS</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-yellow-400 mt-1.5"></div>
            <div>
              <div className="text-white font-mono text-sm">Risk Score Increase</div>
              <div className="text-white/50 text-xs font-mono">Triggers when score increases by &gt;15 points</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5"></div>
            <div>
              <div className="text-white font-mono text-sm">Critical Flags</div>
              <div className="text-white/50 text-xs font-mono">New honeypot, mint authority, or freeze authority detected</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-orange-400 mt-1.5"></div>
            <div>
              <div className="text-white font-mono text-sm">Liquidity Drop</div>
              <div className="text-white/50 text-xs font-mono">Liquidity decreases by &gt;30%</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5"></div>
            <div>
              <div className="text-white font-mono text-sm">Holder Concentration</div>
              <div className="text-white/50 text-xs font-mono">Top 10 holders increase by &gt;10%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Warning */}
      {isEnabled && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-yellow-400 font-mono text-sm font-bold mb-1">RESOURCE USAGE</div>
              <div className="text-yellow-400/80 text-xs font-mono leading-relaxed">
                Smart Alerts scans all Premium users' watchlist tokens every hour. This consumes API credits 
                (Mobula, Moralis, GoPlus, Helius) and may incur costs. Monitor usage in the Analytics panel.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
