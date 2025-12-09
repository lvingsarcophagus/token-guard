'use client'

/**
 * Modern Admin Control Panel
 * Redesigned with professional sidebar navigation and clean interface
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUserRole } from '@/hooks/use-user-role'
import { auth } from '@/lib/firebase'
import { 
  Shield, Users, Database, Activity, Settings,
  Search, Edit, Lock, Trash2, RefreshCw,
  TrendingUp, CheckCircle, XCircle, Power, Key, Smartphone, Copy, Check, Zap, DollarSign
} from 'lucide-react'
import Navbar from '@/components/navbar'
import Loader from '@/components/loader'
import { AdminPaymentsPanel } from '@/components/admin-payments-panel'
import { AdminSmartAlertsPanel } from '@/components/admin-smart-alerts-panel'
import { CacheViewer } from '@/components/admin-cache-viewer'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface User {
  uid: string
  email: string
  name?: string
  role: string
  tier: string
  plan?: string
  lastLogin?: string
  credits?: number
}

interface AnalyticsData {
  userGrowthData: Array<{ date: string; users: number }>
  scanActivityData: Array<{ date: string; scans: number }>
  tierDistribution: { free: number; premium: number; admin: number }
  chainUsage: Array<{ chain: string; count: number; percentage: number }>
}

interface SystemSettings {
  maintenanceMode: boolean
  maintenanceMessage: string
  totpEnabled: boolean
  totpRequired: boolean
  freeTierLimit: number
  cacheExpiration: number
}

export default function ModernAdminPanel() {
  const router = useRouter()
  const { isAdmin, loading: roleLoading } = useUserRole()
  
  const [activeTab, setActiveTab] = useState<'users' | 'cache' | 'system' | 'analytics' | 'settings' | 'logs' | 'payments' | 'alerts'>('users')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    payPerUseUsers: 0,
    totalCredits: 0,
    cachedTokens: 0,
    queries24h: 0
  })
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    maintenanceMode: false,
    maintenanceMessage: 'System is under maintenance. Please check back later.',
    totpEnabled: false,
    totpRequired: false,
    freeTierLimit: 20,
    cacheExpiration: 24
  })
  const [adminTotpSecret, setAdminTotpSecret] = useState<string>('')
  const [adminTotpQR, setAdminTotpQR] = useState<string>('')
  const [adminTotpEnabled, setAdminTotpEnabled] = useState(false)
  const [showTotpSetup, setShowTotpSetup] = useState(false)
  const [totpVerifyCode, setTotpVerifyCode] = useState('')
  const [totpCopied, setTotpCopied] = useState(false)
  const [activityLogs, setActivityLogs] = useState<any[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logsFilter, setLogsFilter] = useState<string>('')

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      router.push('/login')
    }
  }, [roleLoading, isAdmin, router])

  useEffect(() => {
    if (isAdmin) {
      loadAdminData()
      loadAnalytics()
      loadSettings()
      loadAdminTotpStatus()
    }
  }, [isAdmin])

  useEffect(() => {
    if (isAdmin && activeTab === 'logs') {
      loadActivityLogs()
    }
  }, [isAdmin, activeTab, logsFilter])

  const loadAdminData = async () => {
    try {
      // Get auth token
      const user = auth.currentUser
      if (!user) {
        console.error('No authenticated user')
        setLoading(false)
        return
      }

      const token = await user.getIdToken()
      
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Admin data loaded:', data)
        setUsers(data.users || [])
        setStats({
          totalUsers: data.users?.length || 0,
          premiumUsers: data.users?.filter((u: User) => u.tier === 'pro' || u.plan === 'PREMIUM').length || 0,
          payPerUseUsers: data.users?.filter((u: User) => u.plan === 'PAY_PER_USE').length || 0,
          totalCredits: data.users?.reduce((sum: number, u: User) => sum + (u.credits || 0), 0) || 0,
          cachedTokens: 13,
          queries24h: 0
        })
      } else {
        console.error('Failed to fetch users:', await response.text())
      }
    } catch (error) {
      console.error('Failed to load admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingName, setEditingName] = useState<string>('')
  const [editingEmail, setEditingEmail] = useState<string>('')
  const [editingRole, setEditingRole] = useState<string>('')
  const [editingTier, setEditingTier] = useState<string>('')

  const loadAnalytics = async () => {
    try {
      const user = auth.currentUser
      if (!user) return
      const token = await user.getIdToken()
      
      const response = await fetch('/api/admin/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setAnalyticsData(data)
      }
    } catch (error) {
      console.error('Failed to load analytics:', error)
    }
  }

  const loadSettings = async () => {
    try {
      const user = auth.currentUser
      if (!user) return
      const token = await user.getIdToken()
      
      const response = await fetch('/api/admin/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setSystemSettings(data.settings)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  const loadAdminTotpStatus = async () => {
    try {
      const user = auth.currentUser
      if (!user) return
      const token = await user.getIdToken()
      
      const response = await fetch('/api/admin/totp/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setAdminTotpEnabled(data.enabled || false)
      }
    } catch (error) {
      console.error('Failed to load TOTP status:', error)
    }
  }

  const loadActivityLogs = async () => {
    setLogsLoading(true)
    try {
      const user = auth.currentUser
      if (!user) {
        console.error('[Logs] No authenticated user')
        return
      }
      
      console.log('[Logs] Loading activity logs...')
      const token = await user.getIdToken()
      
      const params = new URLSearchParams({ limit: '100' })
      if (logsFilter) {
        params.append('action', logsFilter)
      }
      
      const response = await fetch(`/api/admin/activity-logs?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      console.log('[Logs] Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('[Logs] Loaded logs:', data.logs?.length || 0)
        setActivityLogs(data.logs || [])
      } else {
        const error = await response.json()
        console.error('[Logs] Failed to load:', error)
        alert(`Failed to load logs: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('[Logs] Error loading activity logs:', error)
      alert('Failed to load activity logs. Check console for details.')
    } finally {
      setLogsLoading(false)
    }
  }

  const updateSettings = async (updates: Partial<SystemSettings>) => {
    try {
      const user = auth.currentUser
      if (!user) return
      const token = await user.getIdToken()
      
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      })
      
      if (response.ok) {
        setSystemSettings({ ...systemSettings, ...updates })
      }
    } catch (error) {
      console.error('Failed to update settings:', error)
    }
  }

  const setupAdminTotp = async () => {
    try {
      const user = auth.currentUser
      if (!user) return
      const token = await user.getIdToken()
      
      const response = await fetch('/api/admin/totp/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setAdminTotpSecret(data.secret)
        setAdminTotpQR(data.qrCode)
        setShowTotpSetup(true)
      }
    } catch (error) {
      console.error('Failed to setup TOTP:', error)
    }
  }

  const verifyAdminTotp = async () => {
    try {
      const user = auth.currentUser
      if (!user) return
      const token = await user.getIdToken()
      
      const response = await fetch('/api/admin/totp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          secret: adminTotpSecret,
          token: totpVerifyCode
        })
      })
      
      if (response.ok) {
        setAdminTotpEnabled(true)
        setShowTotpSetup(false)
        setTotpVerifyCode('')
        alert('2FA enabled successfully!')
      } else {
        alert('Invalid verification code. Please try again.')
      }
    } catch (error) {
      console.error('Failed to verify TOTP:', error)
    }
  }

  const disableAdminTotp = async () => {
    if (!confirm('Are you sure you want to disable 2FA for your admin account?')) return
    
    try {
      const user = auth.currentUser
      if (!user) return
      const token = await user.getIdToken()
      
      const response = await fetch('/api/admin/totp/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        setAdminTotpEnabled(false)
        setAdminTotpSecret('')
        setAdminTotpQR('')
        alert('2FA disabled successfully!')
      }
    } catch (error) {
      console.error('Failed to disable TOTP:', error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setTotpCopied(true)
    setTimeout(() => setTotpCopied(false), 2000)
  }

  const handleViewUser = (user: User) => {
    setSelectedUser(user)
    setShowUserModal(true)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setEditingName(user.name || '')
    setEditingEmail(user.email)
    setEditingRole(user.role)
    setEditingTier(user.tier)
    setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedUser) return
    
    try {
      const user = auth.currentUser
      if (!user) {
        alert('Not authenticated')
        return
      }
      
      const token = await user.getIdToken()
      
      console.log('[Admin] Updating user:', selectedUser.uid, 'to tier:', editingTier, 'role:', editingRole)
      
      // Prepare updates object
      const updates: any = {
        tier: editingTier,
        plan: editingTier,  // Keep both in sync
        role: editingRole
      }
      
      // Add name if changed
      if (editingName && editingName !== selectedUser.name) {
        updates.name = editingName
        updates.displayName = editingName
      }
      
      // Update user
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'update',
          userId: selectedUser.uid,
          updates
        })
      })
      
      const data = await response.json()
      console.log('[Admin] Update response:', data)
      
      if (response.ok) {
        alert('User updated successfully!')
        setShowEditModal(false)
        await loadAdminData()
      } else {
        alert(`Failed to update user: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to update user:', error)
      alert('Failed to update user. Check console for details.')
    }
  }

  const handleBanUser = async (userId: string) => {
    if (!confirm('Are you sure you want to ban this user?')) return
    
    try {
      const user = auth.currentUser
      if (!user) return
      const token = await user.getIdToken()
      
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'ban',
          userId,
          reason: 'Banned by admin'
        })
      })
      
      if (response.ok) {
        loadAdminData()
      }
    } catch (error) {
      console.error('Failed to ban user:', error)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to permanently delete this user? This cannot be undone.')) return
    
    try {
      const user = auth.currentUser
      if (!user) return
      const token = await user.getIdToken()
      
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'delete',
          userId
        })
      })
      
      if (response.ok) {
        loadAdminData()
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
    }
  }

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (roleLoading || loading) {
    return <Loader fullScreen text="Loading admin panel" />
  }

  if (!isAdmin) return null

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-black pt-20">
        <div className="flex">
          {/* Modern Floating Sidebar */}
          <div className="w-20 fixed left-4 top-24 bottom-4 bg-black/60 backdrop-blur-xl border border-white/20 rounded-2xl flex flex-col items-center py-6 gap-2 z-40 shadow-2xl">
            <button
              onClick={() => setActiveTab('users')}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all relative group ${
                activeTab === 'users'
                  ? 'bg-white text-black shadow-lg'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
              title="Users"
            >
              <Users className="w-5 h-5" />
              {activeTab === 'users' && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-l-xl" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('cache')}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all relative group ${
                activeTab === 'cache'
                  ? 'bg-white text-black shadow-lg'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
              title="Cache"
            >
              <Database className="w-5 h-5" />
              {activeTab === 'cache' && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-l-xl" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all relative group ${
                activeTab === 'system'
                  ? 'bg-white text-black shadow-lg'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
              title="System"
            >
              <Activity className="w-5 h-5" />
              {activeTab === 'system' && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-l-xl" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all relative group ${
                activeTab === 'analytics'
                  ? 'bg-white text-black shadow-lg'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
              title="Analytics"
            >
              <TrendingUp className="w-5 h-5" />
              {activeTab === 'analytics' && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-l-xl" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all relative group ${
                activeTab === 'settings'
                  ? 'bg-white text-black shadow-lg'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
              title="Settings"
            >
              <Settings className="w-5 h-5" />
              {activeTab === 'settings' && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-l-xl" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all relative group ${
                activeTab === 'logs'
                  ? 'bg-white text-black shadow-lg'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
              title="Activity Logs"
            >
              <Activity className="w-5 h-5" />
              {activeTab === 'logs' && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-l-xl" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all relative group ${
                activeTab === 'payments'
                  ? 'bg-white text-black shadow-lg'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
              title="Payments"
            >
              <DollarSign className="w-5 h-5" />
              {activeTab === 'payments' && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-l-xl" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all relative group ${
                activeTab === 'alerts'
                  ? 'bg-white text-black shadow-lg'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
              title="Smart Alerts"
            >
              <Zap className="w-5 h-5" />
              {activeTab === 'alerts' && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-l-xl" />
              )}
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 ml-28 mr-4 p-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-6 h-6 text-white" />
                    <h1 className="text-2xl font-bold text-white font-mono tracking-wider">
                      Admin Control Panel
                    </h1>
                  </div>
                  <p className="text-white/60 text-sm font-mono">SYSTEM ADMINISTRATOR • ALL ACCESS</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-green-500 text-xs font-mono font-bold">SYSTEM STATUS: OPERATIONAL</span>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <div className="bg-black border border-white/10 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white/60 text-xs font-mono uppercase">Total Users</span>
                    <Users className="w-5 h-5 text-white/40" />
                  </div>
                  <div className="text-3xl font-bold text-white font-mono">{stats.totalUsers}</div>
                  <div className="text-green-500 text-xs font-mono mt-2">
                    ↑ {stats.totalUsers > 0 ? '0 active (24h)' : '0 active'}
                  </div>
                </div>

                <div className="bg-black border border-white/10 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white/60 text-xs font-mono uppercase">Premium Users</span>
                    <TrendingUp className="w-5 h-5 text-white/40" />
                  </div>
                  <div className="text-3xl font-bold text-white font-mono">{stats.premiumUsers}</div>
                  <div className="text-white/50 text-xs font-mono mt-2">
                    {stats.totalUsers > 0 ? `${((stats.premiumUsers / stats.totalUsers) * 100).toFixed(1)}%` : '0%'}
                  </div>
                </div>

                <div className="bg-black border border-blue-500/20 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-blue-400 text-xs font-mono uppercase">Pay-Per-Use</span>
                    <Zap className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-3xl font-bold text-white font-mono">{stats.payPerUseUsers}</div>
                  <div className="text-blue-400 text-xs font-mono mt-2">
                    {stats.totalUsers > 0 ? `${((stats.payPerUseUsers / stats.totalUsers) * 100).toFixed(1)}%` : '0%'}
                  </div>
                </div>

                <div className="bg-black border border-blue-500/20 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-blue-400 text-xs font-mono uppercase">Total Credits</span>
                    <Zap className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-3xl font-bold text-white font-mono">{stats.totalCredits}</div>
                  <div className="text-white/50 text-xs font-mono mt-2">
                    ${(stats.totalCredits * 0.10).toFixed(2)} value
                  </div>
                </div>

                <div className="bg-black border border-white/10 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white/60 text-xs font-mono uppercase">Cached Tokens</span>
                    <Database className="w-5 h-5 text-white/40" />
                  </div>
                  <div className="text-3xl font-bold text-white font-mono">{stats.cachedTokens}</div>
                  <div className="text-white/50 text-xs font-mono mt-2">158 total queries</div>
                </div>

                <div className="bg-black border border-white/10 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white/60 text-xs font-mono uppercase">Queries (24h)</span>
                    <Activity className="w-5 h-5 text-white/40" />
                  </div>
                  <div className="text-3xl font-bold text-white font-mono">{stats.queries24h}</div>
                  <div className="text-white/50 text-xs font-mono mt-2">0/hour avg</div>
                </div>
              </div>
            </div>



            {/* User Management Tab */}
            {activeTab === 'users' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    User Management
                  </h2>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-black border border-white/20 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-white/40 w-64"
                      />
                    </div>
                    <button
                      onClick={() => {
                        setLoading(true)
                        loadAdminData()
                      }}
                      disabled={loading}
                      className="px-4 py-2 rounded-lg border border-white/20 text-white/70 hover:text-white hover:bg-white/5 transition-all text-sm font-mono flex items-center gap-2 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                      REFRESH
                    </button>
                  </div>
                </div>

                {/* Users Table */}
                <div className="bg-black border border-white/10 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left px-6 py-4 text-white/60 font-mono text-xs uppercase">Name</th>
                        <th className="text-left px-6 py-4 text-white/60 font-mono text-xs uppercase">Email</th>
                        <th className="text-left px-6 py-4 text-white/60 font-mono text-xs uppercase">UID</th>
                        <th className="text-left px-6 py-4 text-white/60 font-mono text-xs uppercase">Role</th>
                        <th className="text-left px-6 py-4 text-white/60 font-mono text-xs uppercase">Tier</th>
                        <th className="text-left px-6 py-4 text-white/60 font-mono text-xs uppercase">Credits</th>
                        <th className="text-left px-6 py-4 text-white/60 font-mono text-xs uppercase">Last Login</th>
                        <th className="text-right px-6 py-4 text-white/60 font-mono text-xs uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.uid} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 text-white font-mono text-sm">{user.name || 'N/A'}</td>
                          <td className="px-6 py-4 text-white font-mono text-sm">{user.email}</td>
                          <td className="px-6 py-4 text-white/60 font-mono text-xs">{user.uid.slice(0, 12)}...</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                              user.role === 'admin' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/10 text-white/60'
                            }`}>
                              {user.role?.toUpperCase() || 'USER'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                              (user.tier === 'pro' || user.tier === 'PREMIUM' || user.plan === 'PREMIUM') ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
                              user.plan === 'PAY_PER_USE' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                              'bg-white/10 text-white/60'
                            }`}>
                              {(user.tier === 'pro' || user.tier === 'PREMIUM' || user.plan === 'PREMIUM') ? 'PREMIUM' : 
                               user.plan === 'PAY_PER_USE' ? 'PAY-PER-USE' : 'FREE'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {user.plan === 'PAY_PER_USE' ? (
                              <span className="text-white font-mono text-sm font-bold">
                                {user.credits || 0} <span className="text-white/40 text-xs">credits</span>
                              </span>
                            ) : (
                              <span className="text-white/40 font-mono text-xs">N/A</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-white/60 font-mono text-xs">
                            {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleViewUser(user)}
                                className="p-2 rounded-lg border border-white/20 hover:bg-white/5 transition-all"
                                title="View Details"
                              >
                                <Users className="w-4 h-4 text-white/60" />
                              </button>
                              <button
                                onClick={() => handleEditUser(user)}
                                className="p-2 rounded-lg border border-white/20 hover:bg-white/5 transition-all"
                                title="Edit User"
                              >
                                <Edit className="w-4 h-4 text-white/60" />
                              </button>
                              <button
                                onClick={() => handleBanUser(user.uid)}
                                className="p-2 rounded-lg border border-white/20 hover:bg-white/5 transition-all"
                                title="Ban User"
                              >
                                <Lock className="w-4 h-4 text-white/60" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.uid)}
                                className="p-2 rounded-lg border border-red-500/30 hover:bg-red-500/10 transition-all"
                                title="Delete User"
                              >
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-12 text-white/40 font-mono text-sm">
                      No users found
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cache Tab */}
            {activeTab === 'cache' && <CacheViewer />}

            {/* System Tab */}
            {activeTab === 'system' && (
              <div>
                <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2 mb-6">
                  <Activity className="w-5 h-5" />
                  System Status
                </h2>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-black border border-white/10 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-white/60 text-xs font-mono uppercase">API Status</span>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-white/80 font-mono text-sm">Mobula API</span>
                        <span className="text-green-500 font-mono text-xs">OPERATIONAL</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/80 font-mono text-sm">Moralis API</span>
                        <span className="text-green-500 font-mono text-xs">OPERATIONAL</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/80 font-mono text-sm">GoPlus API</span>
                        <span className="text-green-500 font-mono text-xs">OPERATIONAL</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/80 font-mono text-sm">Helius API</span>
                        <span className="text-green-500 font-mono text-xs">OPERATIONAL</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-black border border-white/10 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-white/60 text-xs font-mono uppercase">Database</span>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-white/80 font-mono text-sm">Firebase Auth</span>
                        <span className="text-green-500 font-mono text-xs">CONNECTED</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/80 font-mono text-sm">Firestore</span>
                        <span className="text-green-500 font-mono text-xs">CONNECTED</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/80 font-mono text-sm">Storage</span>
                        <span className="text-green-500 font-mono text-xs">CONNECTED</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div>
                <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2 mb-6">
                  <TrendingUp className="w-5 h-5" />
                  Analytics & Insights
                </h2>
                
                {/* User Growth Chart */}
                <div className="bg-black border border-white/10 rounded-xl p-6 mb-6">
                  <h3 className="text-white font-mono text-sm mb-4">User Growth (Last 30 Days)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData?.userGrowthData || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                      <XAxis dataKey="date" stroke="#ffffff60" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#ffffff60" style={{ fontSize: '12px' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff20', borderRadius: '8px' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Scan Activity Chart */}
                <div className="bg-black border border-white/10 rounded-xl p-6 mb-6">
                  <h3 className="text-white font-mono text-sm mb-4">Scan Activity (Last 7 Days)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData?.scanActivityData || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                      <XAxis dataKey="date" stroke="#ffffff60" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#ffffff60" style={{ fontSize: '12px' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff20', borderRadius: '8px' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="scans" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Tier Distribution */}
                  <div className="bg-black border border-white/10 rounded-xl p-6">
                    <h3 className="text-white font-mono text-sm mb-4">User Tier Distribution</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Free', value: analyticsData?.tierDistribution.free || 0, color: '#6b7280' },
                            { name: 'Premium', value: analyticsData?.tierDistribution.premium || 0, color: '#10b981' },
                            { name: 'Admin', value: analyticsData?.tierDistribution.admin || 0, color: '#ef4444' }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[
                            { name: 'Free', value: analyticsData?.tierDistribution.free || 0, color: '#6b7280' },
                            { name: 'Premium', value: analyticsData?.tierDistribution.premium || 0, color: '#10b981' },
                            { name: 'Admin', value: analyticsData?.tierDistribution.admin || 0, color: '#ef4444' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff20', borderRadius: '8px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Chain Usage */}
                  <div className="bg-black border border-white/10 rounded-xl p-6">
                    <h3 className="text-white font-mono text-sm mb-4">Popular Chains</h3>
                    <div className="space-y-4 mt-8">
                      {(analyticsData?.chainUsage || []).map((chain) => (
                        <div key={chain.chain} className="flex items-center justify-between">
                          <span className="text-white/80 font-mono text-sm">{chain.chain}</span>
                          <div className="flex items-center gap-3">
                            <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full" 
                                style={{ 
                                  width: `${chain.percentage}%`,
                                  backgroundColor: chain.chain === 'Solana' ? '#9945FF' : chain.chain === 'Ethereum' ? '#627EEA' : '#F0B90B'
                                }}
                              ></div>
                            </div>
                            <span className="text-white/60 font-mono text-xs w-12 text-right">{chain.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div>
                <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2 mb-6">
                  <Settings className="w-5 h-5" />
                  System Settings
                </h2>
                <div className="space-y-4">
                  {/* Admin 2FA Setup */}
                  <div className="bg-black border border-white/10 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Smartphone className="w-5 h-5 text-white" />
                          <h3 className="text-white font-mono text-sm">Admin 2FA (Your Account)</h3>
                        </div>
                        <p className="text-white/50 font-mono text-xs">Secure your admin account with two-factor authentication</p>
                      </div>
                      {adminTotpEnabled ? (
                        <button
                          onClick={disableAdminTotp}
                          className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all text-sm font-mono"
                        >
                          DISABLE 2FA
                        </button>
                      ) : (
                        <button
                          onClick={setupAdminTotp}
                          className="px-4 py-2 rounded-lg border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-all text-sm font-mono"
                        >
                          SETUP 2FA
                        </button>
                      )}
                    </div>
                    {adminTotpEnabled && (
                      <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="text-green-400 font-mono text-sm">2FA is enabled for your admin account</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Maintenance Mode */}
                  <div className="bg-black border border-white/10 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Power className="w-5 h-5 text-white" />
                          <h3 className="text-white font-mono text-sm">Maintenance Mode</h3>
                        </div>
                        <p className="text-white/50 font-mono text-xs">Temporarily disable the platform for maintenance</p>
                      </div>
                      <button
                        onClick={() => updateSettings({ maintenanceMode: !systemSettings.maintenanceMode })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          systemSettings.maintenanceMode ? 'bg-red-500' : 'bg-white/20'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            systemSettings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    {systemSettings.maintenanceMode && (
                      <div className="mt-4">
                        <label className="text-white/60 text-xs font-mono uppercase mb-2 block">Maintenance Message</label>
                        <textarea
                          value={systemSettings.maintenanceMessage}
                          onChange={(e) => setSystemSettings({ ...systemSettings, maintenanceMessage: e.target.value })}
                          onBlur={() => updateSettings({ maintenanceMessage: systemSettings.maintenanceMessage })}
                          className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white text-sm font-mono focus:outline-none focus:border-white/40 resize-none"
                          rows={3}
                        />
                      </div>
                    )}
                  </div>

                  {/* TOTP Configuration */}
                  <div className="bg-black border border-white/10 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Key className="w-5 h-5 text-white" />
                          <h3 className="text-white font-mono text-sm">Two-Factor Authentication (TOTP)</h3>
                        </div>
                        <p className="text-white/50 font-mono text-xs">Enable 2FA for enhanced security</p>
                      </div>
                      <button
                        onClick={() => updateSettings({ totpEnabled: !systemSettings.totpEnabled })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          systemSettings.totpEnabled ? 'bg-green-500' : 'bg-white/20'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            systemSettings.totpEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    {systemSettings.totpEnabled && (
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-white/80 font-mono text-sm">Require TOTP for all users</span>
                        <button
                          onClick={() => updateSettings({ totpRequired: !systemSettings.totpRequired })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            systemSettings.totpRequired ? 'bg-green-500' : 'bg-white/20'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              systemSettings.totpRequired ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* System Limits */}
                  <div className="bg-black border border-white/10 rounded-xl p-6">
                    <h3 className="text-white font-mono text-sm mb-4">System Limits</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-white/60 text-xs font-mono uppercase mb-2 block">Free Tier Daily Limit</label>
                        <input
                          type="number"
                          value={systemSettings.freeTierLimit}
                          onChange={(e) => setSystemSettings({ ...systemSettings, freeTierLimit: parseInt(e.target.value) })}
                          onBlur={() => updateSettings({ freeTierLimit: systemSettings.freeTierLimit })}
                          className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white font-mono focus:outline-none focus:border-white/40"
                        />
                      </div>
                      <div>
                        <label className="text-white/60 text-xs font-mono uppercase mb-2 block">Cache Expiration (hours)</label>
                        <input
                          type="number"
                          value={systemSettings.cacheExpiration}
                          onChange={(e) => setSystemSettings({ ...systemSettings, cacheExpiration: parseInt(e.target.value) })}
                          onBlur={() => updateSettings({ cacheExpiration: systemSettings.cacheExpiration })}
                          className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white font-mono focus:outline-none focus:border-white/40"
                        />
                      </div>
                    </div>
                  </div>

                  {/* API Configuration */}
                  <div className="bg-black border border-white/10 rounded-xl p-6">
                    <h3 className="text-white font-mono text-sm mb-4">API Configuration</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-mono text-sm">Mobula API</div>
                          <div className="text-white/50 font-mono text-xs">Market data provider</div>
                        </div>
                        <span className="text-green-500 font-mono text-xs">CONFIGURED</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-mono text-sm">Moralis API</div>
                          <div className="text-white/50 font-mono text-xs">Blockchain data provider</div>
                        </div>
                        <span className="text-green-500 font-mono text-xs">CONFIGURED</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-mono text-sm">Helius API</div>
                          <div className="text-white/50 font-mono text-xs">Solana data provider</div>
                        </div>
                        <span className="text-green-500 font-mono text-xs">CONFIGURED</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Activity Logs Tab */}
            {activeTab === 'logs' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    ACTIVITY LOGS
                  </h2>
                  <button
                    onClick={loadActivityLogs}
                    disabled={logsLoading}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-mono text-xs transition-all"
                  >
                    <RefreshCw className={`w-4 h-4 inline mr-2 ${logsLoading ? 'animate-spin' : ''}`} />
                    REFRESH
                  </button>
                </div>

                {/* Filter */}
                <div className="mb-6">
                  <select
                    value={logsFilter}
                    onChange={(e) => setLogsFilter(e.target.value)}
                    className="bg-black border border-white/20 rounded-lg px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-white/40"
                  >
                    <option value="">All Activities</option>
                    <option value="user_login">User Login</option>
                    <option value="user_logout">User Logout</option>
                    <option value="user_signup">User Signup</option>
                    <option value="token_scan">Token Scan</option>
                    <option value="watchlist_add">Watchlist Add</option>
                    <option value="watchlist_remove">Watchlist Remove</option>
                    <option value="tier_upgrade">Tier Upgrade</option>
                    <option value="tier_downgrade">Tier Downgrade</option>
                    <option value="profile_update">Profile Update</option>
                    <option value="2fa_enabled">2FA Enabled</option>
                    <option value="2fa_disabled">2FA Disabled</option>
                  </select>
                </div>

                {/* Logs Table */}
                {logsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader size="md" />
                  </div>
                ) : activityLogs.length === 0 ? (
                  <div className="text-center py-12 text-white/40 font-mono text-sm">
                    No activity logs found
                  </div>
                ) : (
                  <div className="bg-black border border-white/10 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-white/5 border-b border-white/10">
                          <tr>
                            <th className="px-4 py-3 text-left text-white/60 font-mono text-xs uppercase">Timestamp</th>
                            <th className="px-4 py-3 text-left text-white/60 font-mono text-xs uppercase">User</th>
                            <th className="px-4 py-3 text-left text-white/60 font-mono text-xs uppercase">Action</th>
                            <th className="px-4 py-3 text-left text-white/60 font-mono text-xs uppercase">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {activityLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-white/5 transition-colors">
                              <td className="px-4 py-3 text-white/80 font-mono text-xs whitespace-nowrap">
                                {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                              </td>
                              <td className="px-4 py-3 text-white/80 font-mono text-xs">
                                <div>{log.userEmail}</div>
                                <div className="text-white/40 text-[10px]">{log.userId.slice(0, 8)}...</div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-block px-2 py-1 rounded text-[10px] font-mono uppercase ${
                                  log.action.includes('login') || log.action.includes('signup') ? 'bg-green-500/20 text-green-400' :
                                  log.action.includes('logout') ? 'bg-gray-500/20 text-gray-400' :
                                  log.action.includes('scan') ? 'bg-blue-500/20 text-blue-400' :
                                  log.action.includes('upgrade') ? 'bg-purple-500/20 text-purple-400' :
                                  log.action.includes('downgrade') ? 'bg-orange-500/20 text-orange-400' :
                                  log.action.includes('delete') ? 'bg-red-500/20 text-red-400' :
                                  'bg-white/10 text-white/60'
                                }`}>
                                  {log.action.replace(/_/g, ' ')}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-white/60 font-mono text-xs">
                                {log.details}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <AdminPaymentsPanel />
            )}

            {/* Smart Alerts Tab */}
            {activeTab === 'alerts' && (
              <AdminSmartAlertsPanel />
            )}
          </div>
        </div>

        {/* User Details Modal */}
        {showUserModal && selectedUser && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowUserModal(false)}>
            <div className="bg-black border border-white/20 rounded-xl p-6 max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white font-mono">User Details</h3>
                <button onClick={() => setShowUserModal(false)} className="text-white/60 hover:text-white">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/60 text-xs font-mono uppercase">Name</label>
                    <div className="text-white font-mono">{selectedUser.name || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="text-white/60 text-xs font-mono uppercase">Email</label>
                    <div className="text-white font-mono">{selectedUser.email}</div>
                  </div>
                  <div>
                    <label className="text-white/60 text-xs font-mono uppercase">UID</label>
                    <div className="text-white font-mono text-xs">{selectedUser.uid}</div>
                  </div>
                  <div>
                    <label className="text-white/60 text-xs font-mono uppercase">Role</label>
                    <div className="text-white font-mono">{selectedUser.role}</div>
                  </div>
                  <div>
                    <label className="text-white/60 text-xs font-mono uppercase">Tier</label>
                    <div className="text-white font-mono">{selectedUser.tier || selectedUser.plan || 'FREE'}</div>
                  </div>
                  <div>
                    <label className="text-white/60 text-xs font-mono uppercase">Last Login</label>
                    <div className="text-white font-mono text-sm">{selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : 'Never'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TOTP Setup Modal */}
        {showTotpSetup && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowTotpSetup(false)}>
            <div className="bg-black border border-white/20 rounded-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white font-mono">Setup 2FA</h3>
                <button onClick={() => setShowTotpSetup(false)} className="text-white/60 hover:text-white">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="text-white/80 font-mono text-sm">
                  <p className="mb-4">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
                  {adminTotpQR && (
                    <div className="flex justify-center mb-4">
                      <img src={adminTotpQR} alt="QR Code" className="w-48 h-48 border border-white/20 rounded-lg" />
                    </div>
                  )}
                  <div className="mb-4">
                    <label className="text-white/60 text-xs font-mono uppercase mb-2 block">Or enter this secret manually:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={adminTotpSecret}
                        readOnly
                        className="flex-1 bg-black border border-white/20 rounded-lg px-4 py-2 text-white text-sm font-mono focus:outline-none"
                      />
                      <button
                        onClick={() => copyToClipboard(adminTotpSecret)}
                        className="p-2 rounded-lg border border-white/20 hover:bg-white/5 transition-all"
                        title="Copy to clipboard"
                      >
                        {totpCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-white/60" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-white/60 text-xs font-mono uppercase mb-2 block">Enter verification code:</label>
                    <input
                      type="text"
                      value={totpVerifyCode}
                      onChange={(e) => setTotpVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white text-center text-2xl font-mono tracking-widest focus:outline-none focus:border-white/40"
                      maxLength={6}
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={verifyAdminTotp}
                    disabled={totpVerifyCode.length !== 6}
                    className="flex-1 px-4 py-2 bg-white text-black rounded-lg font-mono text-sm hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    VERIFY & ENABLE
                  </button>
                  <button
                    onClick={() => setShowTotpSetup(false)}
                    className="flex-1 px-4 py-2 border border-white/20 text-white rounded-lg font-mono text-sm hover:bg-white/5 transition-all"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowEditModal(false)}>
            <div className="bg-black border border-white/20 rounded-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white font-mono">Edit User</h3>
                <button onClick={() => setShowEditModal(false)} className="text-white/60 hover:text-white">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-white/60 text-xs font-mono uppercase mb-2 block">Name</label>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white font-mono focus:outline-none focus:border-white/40"
                    placeholder="User name"
                  />
                </div>
                <div>
                  <label className="text-white/60 text-xs font-mono uppercase mb-2 block">Email</label>
                  <input
                    type="email"
                    value={editingEmail}
                    onChange={(e) => setEditingEmail(e.target.value)}
                    className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white font-mono focus:outline-none focus:border-white/40"
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <label className="text-white/60 text-xs font-mono uppercase mb-2 block">Role</label>
                  <select
                    value={editingRole}
                    onChange={(e) => setEditingRole(e.target.value)}
                    className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white font-mono focus:outline-none focus:border-white/40"
                  >
                    <option value="user">USER</option>
                    <option value="admin">ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="text-white/60 text-xs font-mono uppercase mb-2 block">Tier</label>
                  <select
                    value={editingTier}
                    onChange={(e) => setEditingTier(e.target.value)}
                    className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white font-mono focus:outline-none focus:border-white/40"
                  >
                    <option value="FREE">FREE</option>
                    <option value="PREMIUM">PREMIUM</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 px-4 py-2 bg-white text-black rounded-lg font-mono text-sm hover:bg-white/90 transition-all"
                  >
                    SAVE CHANGES
                  </button>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2 border border-white/20 text-white rounded-lg font-mono text-sm hover:bg-white/5 transition-all"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
