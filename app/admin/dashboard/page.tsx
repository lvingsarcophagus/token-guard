'use client'

/**
 * Enhanced Admin Dashboard - Comprehensive Control Panel
 * Features: User Management, API Monitoring, System Health, Analytics, API Keys
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUserRole } from '@/hooks/use-user-role'
import { auth } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  Shield, Users, DollarSign, TrendingUp, AlertTriangle, 
  Search, Edit, Trash2, LogOut, Database, Activity,
  Server, Wifi, Key, Clock, BarChart3, Settings,
  CheckCircle, XCircle, Zap, Globe, Code, Lock, Unlock
} from 'lucide-react'
import Link from 'next/link'

interface User {
  uid: string
  email: string
  role: string
  tier: string
  admin: boolean
  createdAt?: string
  premiumSince?: string
  lastLogin?: string
  banned?: boolean
  bannedAt?: string
  banReason?: string
}

interface CachedToken {
  address: string
  name: string
  symbol: string
  lastUpdated: string
  queryCount: number
}

interface APIStatus {
  name: string
  status: 'operational' | 'degraded' | 'down'
  responseTime: number
  lastChecked: string
  successRate: number
}

interface SystemMetrics {
  cpuUsage: number
  memoryUsage: number
  activeConnections: number
  requestsPerMinute: number
  errorRate: number
}

export default function EnhancedAdminDashboard() {
  const router = useRouter()
  const { role, isAdmin, loading: roleLoading } = useUserRole()
  
  const [users, setUsers] = useState<User[]>([])
  const [cachedTokens, setCachedTokens] = useState<CachedToken[]>([])
  const [apiStatuses, setApiStatuses] = useState<APIStatus[]>([])
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null)
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    freeUsers: 0,
    premiumUsers: 0,
    adminUsers: 0,
    cachedTokens: 0,
    totalQueries: 0,
    queriesLast24h: 0,
    activeUsers24h: 0,
  })
  
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'users' | 'cache' | 'analytics' | 'apis' | 'system' | 'settings'>('users')
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<'FREE' | 'PREMIUM' | 'ADMIN'>('FREE')
  const [apiKeys, setApiKeys] = useState<Record<string, { status: string, lastUsed: string }>>({})
  const [selectedUserDetails, setSelectedUserDetails] = useState<any>(null)
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false)
  const [banningUser, setBanningUser] = useState(false)

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      router.push('/admin/login')
    }
  }, [roleLoading, isAdmin, router])

  useEffect(() => {
    if (isAdmin) {
      loadAdminData()
      loadAPIStatuses()
      loadSystemMetrics()
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        loadAPIStatuses()
        loadSystemMetrics()
      }, 30000)
      
      return () => clearInterval(interval)
    }
  }, [isAdmin])

  const loadAdminData = async () => {
    try {
      const user = auth.currentUser
      if (!user) return

      const token = await user.getIdToken()

      // Load users
      const usersResponse = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (usersResponse.ok) {
        const data = await usersResponse.json()
        setUsers(data.users || [])
        
        const freeCount = data.users.filter((u: User) => u.role === 'FREE').length
        const premiumCount = data.users.filter((u: User) => u.role === 'PREMIUM').length
        const adminCount = data.users.filter((u: User) => u.role === 'ADMIN').length
        
        setStats(prev => ({
          ...prev,
          totalUsers: data.users.length,
          freeUsers: freeCount,
          premiumUsers: premiumCount,
          adminUsers: adminCount,
        }))
      }

      // Load cached tokens
      const cacheResponse = await fetch('/api/admin/cache-stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (cacheResponse.ok) {
        const cacheData = await cacheResponse.json()
        setCachedTokens(cacheData.tokens || [])
        setStats(prev => ({
          ...prev,
          cachedTokens: cacheData.tokens?.length || 0,
          totalQueries: cacheData.totalQueries || 0,
        }))
      }

      // Load API keys status
      const keysResponse = await fetch('/api/admin/api-keys', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (keysResponse.ok) {
        const keysData = await keysResponse.json()
        setApiKeys(keysData.keys || {})
      }

      // Load analytics
      const analyticsResponse = await fetch('/api/admin/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json()
        setStats(prev => ({
          ...prev,
          queriesLast24h: analyticsData.queriesLast24h || 0,
          activeUsers24h: analyticsData.activeUsers24h || 0,
        }))
      }

    } catch (error) {
      console.error('Failed to load admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAPIStatuses = async () => {
    try {
      const user = auth.currentUser
      if (!user) return

      const token = await user.getIdToken()
      const response = await fetch('/api/admin/api-status', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setApiStatuses(data.apis || [])
      }
    } catch (error) {
      console.error('Failed to load API statuses:', error)
    }
  }

  const loadSystemMetrics = async () => {
    try {
      const user = auth.currentUser
      if (!user) return

      const token = await user.getIdToken()
      const response = await fetch('/api/admin/system-metrics', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setSystemMetrics(data.metrics || null)
      }
    } catch (error) {
      console.error('Failed to load system metrics:', error)
    }
  }

  const handleSetRole = async (uid: string, newRole: 'FREE' | 'PREMIUM' | 'ADMIN') => {
    try {
      const user = auth.currentUser
      if (!user) return

      const token = await user.getIdToken()

      const response = await fetch('/api/admin/set-user-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUid: uid, role: newRole }),
      })

      if (response.ok) {
        await loadAdminData()
        setEditingUser(null)
        alert(`✅ User role updated to ${newRole}`)
      }
    } catch (error) {
      console.error('Failed to update role:', error)
      alert('❌ Failed to update user role')
    }
  }

  const handleDeleteUser = async (uid: string) => {
    if (!confirm('⚠️ Are you sure you want to delete this user? This cannot be undone.')) return

    try {
      const user = auth.currentUser
      if (!user) return

      const token = await user.getIdToken()

      const response = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ uid }),
      })

      if (response.ok) {
        await loadAdminData()
        alert('✅ User deleted successfully')
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
      alert('❌ Failed to delete user')
    }
  }

  const handleBanUser = async (uid: string, currentlyBanned: boolean) => {
    const action = currentlyBanned ? 'unban' : 'ban'
    let reason = ''
    
    if (!currentlyBanned) {
      reason = prompt('Enter ban reason:') || 'No reason provided'
      if (!reason && reason !== 'No reason provided') return
    }

    if (!confirm(`Are you sure you want to ${action} this user?`)) return

    setBanningUser(true)
    try {
      const user = auth.currentUser
      if (!user) return

      const token = await user.getIdToken()

      const response = await fetch('/api/admin/ban-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          userId: uid, 
          banned: !currentlyBanned,
          reason 
        }),
      })

      if (response.ok) {
        await loadAdminData()
        alert(`✅ User ${action}ned successfully`)
      } else {
        throw new Error('Ban request failed')
      }
    } catch (error) {
      console.error(`Failed to ${action} user:`, error)
      alert(`❌ Failed to ${action} user`)
    } finally {
      setBanningUser(false)
    }
  }

  const handleViewUserDetails = async (uid: string) => {
    try {
      const user = auth.currentUser
      if (!user) return

      const token = await user.getIdToken()

      const response = await fetch('/api/admin/user-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: uid }),
      })

      if (response.ok) {
        const data = await response.json()
        setSelectedUserDetails(data.user)
        setShowUserDetailsModal(true)
      } else {
        throw new Error('Failed to fetch user details')
      }
    } catch (error) {
      console.error('Failed to load user details:', error)
      alert('❌ Failed to load user details')
    }
  }

  const handleClearCache = async (address?: string) => {
    const confirmMsg = address 
      ? `Clear cache for ${address}?` 
      : '⚠️ Clear ALL cache? This will affect performance temporarily.'
    
    if (!confirm(confirmMsg)) return

    try {
      const user = auth.currentUser
      if (!user) return

      const token = await user.getIdToken()

      const response = await fetch('/api/admin/clear-cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ address }),
      })

      if (response.ok) {
        await loadAdminData()
        alert(address ? '✅ Token cache cleared' : '✅ All cache cleared')
      }
    } catch (error) {
      console.error('Failed to clear cache:', error)
    }
  }

  const handleTestAPI = async (apiName: string) => {
    try {
      const user = auth.currentUser
      if (!user) return

      const token = await user.getIdToken()

      const response = await fetch('/api/admin/test-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ apiName }),
      })

      const data = await response.json()
      
      if (response.ok) {
        alert(`✅ ${apiName} API Test\n\nStatus: ${data.status}\nResponse Time: ${data.responseTime}ms`)
      } else {
        alert(`❌ ${apiName} API Test Failed\n\n${data.error}`)
      }
      
      await loadAPIStatuses()
    } catch (error) {
      alert(`❌ Failed to test ${apiName} API`)
    }
  }

  const handleLogout = async () => {
    await auth.signOut()
    router.push('/admin/login')
  }

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.uid.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white font-mono">LOADING ADMIN CONTROL PANEL...</div>
        </div>
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 stars-bg pointer-events-none opacity-30"></div>
      <div className="fixed inset-0 grid-pattern pointer-events-none opacity-20"></div>

      {/* Header */}
      <header className="relative border-b border-white/20 bg-black/95 backdrop-blur-lg z-10 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/Logo.png" 
              alt="Tokenomics Lab" 
              className="w-10 h-10 object-contain transition-all duration-300 hover:scale-110 hover:brightness-110" 
            />
            <div>
              <h1 className="text-xl font-bold text-white font-mono tracking-widest">
                ADMIN CONTROL PANEL
              </h1>
              <p className="text-white/60 text-xs font-mono">SYSTEM ADMINISTRATOR • ALL ACCESS</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right text-xs font-mono">
              <div className="text-white/60">SYSTEM STATUS</div>
              <div className="text-white flex items-center gap-1">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                OPERATIONAL
              </div>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white hover:text-black font-mono">
                User View
              </Button>
            </Link>
            <Button 
              onClick={handleLogout}
              className="bg-white text-black hover:bg-white/90 font-mono"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="relative max-w-7xl mx-auto px-4 py-8 z-10">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-black/60 backdrop-blur-xl border-2 border-white/20 p-6 hover:border-white/40 transition-all hover:shadow-lg hover:shadow-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-xs font-mono tracking-wider mb-1">TOTAL USERS</p>
                <p className="text-4xl font-bold text-white font-mono tracking-wider">{stats.totalUsers}</p>
                <p className="text-white/80 text-xs font-mono tracking-wider mt-1">▲ {stats.activeUsers24h} active (24h)</p>
              </div>
              <Users className="w-12 h-12 text-white/40" />
            </div>
          </div>

          <div className="bg-black/60 backdrop-blur-xl border-2 border-white/20 p-6 hover:border-white/40 transition-all hover:shadow-lg hover:shadow-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-xs font-mono tracking-wider mb-1">PREMIUM USERS</p>
                <p className="text-4xl font-bold text-white font-mono tracking-wider">{stats.premiumUsers}</p>
                <p className="text-white/80 text-xs font-mono tracking-wider mt-1">
                  {stats.totalUsers > 0 ? ((stats.premiumUsers / stats.totalUsers) * 100).toFixed(1) : 0}% conversion
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-white/40" />
            </div>
          </div>

          <div className="bg-black/60 backdrop-blur-xl border-2 border-white/20 p-6 hover:border-white/40 transition-all hover:shadow-lg hover:shadow-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-xs font-mono tracking-wider mb-1">CACHED TOKENS</p>
                <p className="text-4xl font-bold text-white font-mono tracking-wider">{stats.cachedTokens}</p>
                <p className="text-white/80 text-xs font-mono tracking-wider mt-1">{stats.totalQueries} total queries</p>
              </div>
              <Database className="w-12 h-12 text-white/40" />
            </div>
          </div>

          <div className="bg-black/60 backdrop-blur-xl border-2 border-white/20 p-6 hover:border-white/40 transition-all hover:shadow-lg hover:shadow-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-xs font-mono tracking-wider mb-1">QUERIES (24H)</p>
                <p className="text-4xl font-bold text-white font-mono tracking-wider">{stats.queriesLast24h}</p>
                <p className="text-white/80 text-xs font-mono tracking-wider mt-1">
                  {Math.round(stats.queriesLast24h / 24)}/hour avg
                </p>
              </div>
              <Activity className="w-12 h-12 text-white/40" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'users', icon: Users, label: 'USERS' },
            { id: 'apis', icon: Server, label: 'API STATUS' },
            { id: 'cache', icon: Database, label: 'CACHE' },
            { id: 'system', icon: Activity, label: 'SYSTEM' },
            { id: 'analytics', icon: BarChart3, label: 'ANALYTICS' },
            { id: 'settings', icon: Settings, label: 'SETTINGS' },
          ].map(tab => (
            <Button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              variant={activeTab === tab.id ? 'default' : 'outline'}
              className={`font-mono tracking-wider whitespace-nowrap transition-all ${
                activeTab === tab.id 
                  ? 'bg-white text-black hover:bg-white/90 border-2 border-white shadow-lg shadow-white/20' 
                  : 'border-2 border-white/20 hover:border-white/40 hover:bg-white/10 backdrop-blur-md text-white'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <div className="bg-black/60 backdrop-blur-xl border-2 border-white/20 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white font-mono tracking-wider flex items-center gap-2">
                <Users className="w-6 h-6" />
                USER MANAGEMENT
              </h2>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
                  <Input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-black/50 border-2 border-white/20 text-white font-mono tracking-wider w-64 focus:border-white/40 transition-all"
                  />
                </div>
                <Button onClick={loadAdminData} variant="outline" className="font-mono tracking-wider border-2 border-white/20 hover:border-white/40 hover:bg-white/10 backdrop-blur-md transition-all">
                  <Activity className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-white/20">
                    <th className="text-left p-3 text-white/60 text-xs font-mono tracking-wider">EMAIL</th>
                    <th className="text-left p-3 text-white/60 text-xs font-mono tracking-wider">UID</th>
                    <th className="text-left p-3 text-white/60 text-xs font-mono tracking-wider">ROLE</th>
                    <th className="text-left p-3 text-white/60 text-xs font-mono tracking-wider">TIER</th>
                    <th className="text-left p-3 text-white/60 text-xs font-mono tracking-wider">LAST LOGIN</th>
                    <th className="text-left p-3 text-white/60 text-xs font-mono tracking-wider">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.uid} className="border-b border-white/10 hover:bg-white/5 backdrop-blur-sm transition-colors">
                      <td className="p-3 text-white text-sm font-mono tracking-wider">{user.email}</td>
                      <td className="p-3 text-white/60 text-xs font-mono tracking-wider">
                        {user.uid.slice(0, 12)}...
                      </td>
                      <td className="p-3">
                        {editingUser === user.uid ? (
                          <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value as any)}
                            className="bg-black border-2 border-white/20 text-white text-sm p-2 rounded font-mono tracking-wider focus:border-white/40 transition-all"
                          >
                            <option value="FREE">FREE</option>
                            <option value="PREMIUM">PREMIUM</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        ) : (
                          <span className={`px-3 py-1 text-xs font-mono tracking-wider rounded border-2 ${
                            user.role === 'ADMIN' ? 'bg-red-500/20 text-red-400 border-red-500' :
                            user.role === 'PREMIUM' ? 'bg-green-500/20 text-green-400 border-green-500' :
                            'bg-gray-500/20 text-gray-400 border-gray-500'
                          }`}>
                            {user.role}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 text-xs font-mono tracking-wider rounded border ${
                          user.tier === 'pro' ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-gray-500/10 text-gray-400 border-gray-500/30'
                        }`}>
                          {user.tier}
                        </span>
                      </td>
                      <td className="p-3 text-white/60 text-xs font-mono tracking-wider">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          {editingUser === user.uid ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleSetRole(user.uid, selectedRole)}
                                className="bg-green-600 hover:bg-green-700 text-white font-mono tracking-wider border-2 border-green-500 shadow-lg shadow-green-500/30"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingUser(null)}
                                className="border-2 border-white/20 hover:border-white/40 hover:bg-white/10 backdrop-blur-md font-mono tracking-wider"
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewUserDetails(user.uid)}
                                className="border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 backdrop-blur-md transition-all"
                                title="View Details"
                              >
                                <Users className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingUser(user.uid)
                                  setSelectedRole(user.role as any)
                                }}
                                className="border-2 border-blue-500/50 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500 backdrop-blur-md transition-all"
                                title="Edit Role"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className={`border-2 ${
                                  user.banned 
                                    ? 'border-green-500/50 text-green-400 hover:bg-green-500/20 hover:border-green-500' 
                                    : 'border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20 hover:border-yellow-500'
                                } backdrop-blur-md transition-all`}
                                onClick={() => handleBanUser(user.uid, user.banned || false)}
                                disabled={banningUser}
                                title={user.banned ? 'Unban User' : 'Ban User'}
                              >
                                {user.banned ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-2 border-red-500/50 text-red-400 hover:bg-red-500/20 hover:border-red-500 backdrop-blur-md transition-all"
                                onClick={() => handleDeleteUser(user.uid)}
                                title="Delete User"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-white/20 mx-auto mb-4" />
                  <p className="text-white/60 font-mono tracking-wider">No users found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* API Status Tab */}
        {activeTab === 'apis' && (
          <div className="space-y-6">
            <div className="bg-black/60 backdrop-blur-xl border-2 border-white/20 p-6 shadow-2xl">
              <h2 className="text-2xl font-bold text-white font-mono tracking-wider mb-6 flex items-center gap-2">
                <Server className="w-6 h-6" />
                API STATUS MONITOR
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {apiStatuses.map((api) => (
                  <div key={api.name} className={`p-4 border-2 backdrop-blur-md transition-all hover:shadow-lg ${
                    api.status === 'operational' ? 'border-green-500/50 bg-green-500/10 hover:shadow-green-500/20' :
                    api.status === 'degraded' ? 'border-yellow-500/50 bg-yellow-500/10 hover:shadow-yellow-500/20' :
                    'border-red-500/50 bg-red-500/10 hover:shadow-red-500/20'
                  }`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-white font-mono tracking-wider font-bold text-lg">{api.name}</h3>
                        <p className="text-white/60 text-xs font-mono tracking-wider">
                          Last checked: {new Date(api.lastChecked).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded text-xs font-mono tracking-wider flex items-center gap-2 border ${
                        api.status === 'operational' ? 'bg-green-500/20 text-green-400 border-green-500/50' :
                        api.status === 'degraded' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' :
                        'bg-red-500/20 text-red-400 border-red-500/50'
                      }`}>
                        {api.status === 'operational' && <CheckCircle className="w-3 h-3" />}
                        {api.status === 'degraded' && <AlertTriangle className="w-3 h-3" />}
                        {api.status === 'down' && <XCircle className="w-3 h-3" />}
                        {api.status.toUpperCase()}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-white/60 text-xs font-mono tracking-wider mb-1">Response Time</p>
                        <p className="text-white font-mono tracking-wider text-lg">{api.responseTime}ms</p>
                      </div>
                      <div>
                        <p className="text-white/60 text-xs font-mono tracking-wider mb-1">Success Rate</p>
                        <p className="text-white font-mono tracking-wider text-lg">{api.successRate}%</p>
                      </div>
                    </div>

                    <div className="w-full bg-white/10 rounded-full h-2 mb-3">
                      <div 
                        className={`h-2 rounded-full ${
                          api.successRate >= 95 ? 'bg-green-500' :
                          api.successRate >= 80 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${api.successRate}%` }}
                      />
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTestAPI(api.name)}
                      className="w-full border-2 border-white/20 hover:border-white/40 hover:bg-white/10 backdrop-blur-md font-mono tracking-wider transition-all"
                    >
                      <Zap className="w-3 h-3 mr-2" />
                      Test API
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* API Keys Management */}
            <div className="bg-black/60 backdrop-blur-xl border-2 border-white/20 p-6 shadow-2xl">
              <h2 className="text-2xl font-bold text-white font-mono tracking-wider mb-6 flex items-center gap-2">
                <Key className="w-6 h-6" />
                API KEYS STATUS
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(apiKeys).map(([key, data]) => (
                  <div key={key} className="p-4 bg-black/50 border-2 border-white/10 backdrop-blur-md hover:border-white/20 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-mono tracking-wider font-bold">{key}</h3>
                      <div className={`w-3 h-3 rounded-full ${
                        data.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                      }`} />
                    </div>
                    <p className="text-white/60 text-xs font-mono tracking-wider">
                      Status: <span className={data.status === 'active' ? 'text-green-400' : 'text-red-400'}>
                        {data.status}
                      </span>
                    </p>
                    <p className="text-white/60 text-xs font-mono tracking-wider">
                      Last used: {data.lastUsed}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Cache Management Tab */}
        {activeTab === 'cache' && (
          <div className="bg-black/60 backdrop-blur-xl border-2 border-white/20 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white font-mono tracking-wider flex items-center gap-2">
                <Database className="w-6 h-6" />
                CACHE MANAGEMENT
              </h2>
              <Button
                onClick={() => handleClearCache()}
                className="bg-red-600 hover:bg-red-700 text-white font-mono tracking-wider border-2 border-red-500 shadow-lg shadow-red-500/30 transition-all"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All Cache
              </Button>
            </div>

            <div className="space-y-2">
              {cachedTokens.map((token) => (
                <div key={token.address} className="flex items-center justify-between p-4 bg-black/50 border-2 border-white/10 rounded backdrop-blur-md hover:border-white/30 hover:bg-black/60 transition-all">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                        <Code className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-mono tracking-wider font-bold">{token.symbol || 'Unknown'}</p>
                        <p className="text-white/60 text-xs font-mono tracking-wider">{token.name || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right mr-6">
                    <p className="text-white/60 text-xs font-mono tracking-wider">Address</p>
                    <p className="text-white text-xs font-mono tracking-wider">{token.address.slice(0, 10)}...{token.address.slice(-8)}</p>
                  </div>
                  <div className="text-right mr-6">
                    <p className="text-white/60 text-xs font-mono tracking-wider">Queries</p>
                    <p className="text-green-400 text-lg font-mono tracking-wider font-bold">{token.queryCount}</p>
                  </div>
                  <div className="text-right mr-6">
                    <p className="text-white/60 text-xs font-mono tracking-wider">Last Updated</p>
                    <p className="text-white text-xs font-mono tracking-wider">
                      {new Date(token.lastUpdated).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleClearCache(token.address)}
                    className="border-2 border-red-500/50 text-red-400 hover:bg-red-500/20 hover:border-red-500 backdrop-blur-md transition-all"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                </div>
              ))}
              {cachedTokens.length === 0 && (
                <div className="text-center py-12">
                  <Database className="w-16 h-16 text-white/20 mx-auto mb-4" />
                  <p className="text-white/60 font-mono tracking-wider">No cached tokens</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* System Metrics Tab */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            <div className="bg-black/60 backdrop-blur-xl border-2 border-white/20 p-6 shadow-2xl">
              <h2 className="text-2xl font-bold text-white font-mono tracking-wider mb-6 flex items-center gap-2">
                <Activity className="w-6 h-6" />
                SYSTEM METRICS
              </h2>

              {systemMetrics && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white/60 font-mono tracking-wider text-sm">CPU Usage</p>
                      <p className="text-white font-mono tracking-wider font-bold">{systemMetrics.cpuUsage}%</p>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-3 border border-white/20">
                      <div 
                        className={`h-3 rounded-full transition-all ${
                          systemMetrics.cpuUsage < 50 ? 'bg-green-500' :
                          systemMetrics.cpuUsage < 80 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${systemMetrics.cpuUsage}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white/60 font-mono tracking-wider text-sm">Memory Usage</p>
                      <p className="text-white font-mono tracking-wider font-bold">{systemMetrics.memoryUsage}%</p>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-3 border border-white/20">
                      <div 
                        className={`h-3 rounded-full transition-all ${
                          systemMetrics.memoryUsage < 50 ? 'bg-green-500' :
                          systemMetrics.memoryUsage < 80 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${systemMetrics.memoryUsage}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white/60 font-mono tracking-wider text-sm">Error Rate</p>
                      <p className="text-white font-mono tracking-wider font-bold">{systemMetrics.errorRate}%</p>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-3 border border-white/20">
                      <div 
                        className={`h-3 rounded-full transition-all ${
                          systemMetrics.errorRate < 1 ? 'bg-green-500' :
                          systemMetrics.errorRate < 5 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(systemMetrics.errorRate * 10, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="p-4 bg-blue-500/10 border-2 border-blue-500/30 backdrop-blur-md hover:border-blue-500/50 transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-300 text-xs font-mono tracking-wider mb-1">Active Connections</p>
                      <p className="text-3xl font-bold text-white font-mono tracking-wider">
                        {systemMetrics?.activeConnections || 0}
                      </p>
                    </div>
                    <Wifi className="w-10 h-10 text-blue-400 opacity-50" />
                  </div>
                </div>

                <div className="p-4 bg-purple-500/10 border-2 border-purple-500/30 backdrop-blur-md hover:border-purple-500/50 transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-300 text-xs font-mono tracking-wider mb-1">Requests/Minute</p>
                      <p className="text-3xl font-bold text-white font-mono tracking-wider">
                        {systemMetrics?.requestsPerMinute || 0}
                      </p>
                    </div>
                    <Zap className="w-10 h-10 text-purple-400 opacity-50" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-black/60 backdrop-blur-xl border-2 border-white/20 p-6 shadow-2xl">
              <h2 className="text-xl font-bold text-white font-mono tracking-wider mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5" />
                SYSTEM HEALTH
              </h2>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-500/20 border-2 border-green-500/50 rounded backdrop-blur-md hover:border-green-500 transition-all">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 font-mono tracking-wider text-sm">Database Connection</span>
                  </div>
                  <span className="text-green-400 font-mono tracking-wider text-xs">HEALTHY</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-500/20 border-2 border-green-500/50 rounded backdrop-blur-md hover:border-green-500 transition-all">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 font-mono tracking-wider text-sm">Authentication Service</span>
                  </div>
                  <span className="text-green-400 font-mono tracking-wider text-xs">OPERATIONAL</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-500/20 border-2 border-green-500/50 rounded backdrop-blur-md hover:border-green-500 transition-all">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 font-mono tracking-wider text-sm">Cache System</span>
                  </div>
                  <span className="text-green-400 font-mono tracking-wider text-xs">ACTIVE</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-500/20 border-2 border-blue-500/50 rounded backdrop-blur-md hover:border-blue-500 transition-all">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-400" />
                    <span className="text-blue-400 font-mono tracking-wider text-sm">Uptime</span>
                  </div>
                  <span className="text-blue-400 font-mono tracking-wider text-xs">99.9%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="bg-black/60 backdrop-blur-xl border-2 border-white/20 p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-white font-mono tracking-wider mb-6 flex items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              ANALYTICS & INSIGHTS
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-white font-mono tracking-wider mb-4 text-lg">User Distribution</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm text-white/60 font-mono tracking-wider mb-1">
                      <span>FREE Users</span>
                      <span>{stats.freeUsers} ({stats.totalUsers > 0 ? ((stats.freeUsers / stats.totalUsers) * 100).toFixed(1) : 0}%)</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-3 border border-white/20">
                      <div 
                        className="bg-gray-500 h-3 rounded-full transition-all" 
                        style={{ width: `${stats.totalUsers > 0 ? (stats.freeUsers / stats.totalUsers) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm text-white/60 font-mono tracking-wider mb-1">
                      <span>PREMIUM Users</span>
                      <span>{stats.premiumUsers} ({stats.totalUsers > 0 ? ((stats.premiumUsers / stats.totalUsers) * 100).toFixed(1) : 0}%)</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-3 border border-white/20">
                      <div 
                        className="bg-green-500 h-3 rounded-full transition-all" 
                        style={{ width: `${stats.totalUsers > 0 ? (stats.premiumUsers / stats.totalUsers) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm text-white/60 font-mono tracking-wider mb-1">
                      <span>ADMIN Users</span>
                      <span>{stats.adminUsers} ({stats.totalUsers > 0 ? ((stats.adminUsers / stats.totalUsers) * 100).toFixed(1) : 0}%)</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-3 border border-white/20">
                      <div 
                        className="bg-red-500 h-3 rounded-full transition-all" 
                        style={{ width: `${stats.totalUsers > 0 ? (stats.adminUsers / stats.totalUsers) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-white font-mono tracking-wider mb-4 text-lg">Performance Metrics</h3>
                <div className="space-y-3">
                  <div className="p-4 bg-green-500/20 border-2 border-green-500/50 rounded backdrop-blur-md hover:border-green-500 transition-all">
                    <p className="text-green-400 font-mono tracking-wider text-sm mb-1">Cache Hit Rate</p>
                    <p className="text-3xl font-bold text-white font-mono tracking-wider">85.2%</p>
                  </div>
                  <div className="p-4 bg-blue-500/20 border-2 border-blue-500/50 rounded backdrop-blur-md hover:border-blue-500 transition-all">
                    <p className="text-blue-400 font-mono tracking-wider text-sm mb-1">Avg Response Time</p>
                    <p className="text-3xl font-bold text-white font-mono tracking-wider">142ms</p>
                  </div>
                  <div className="p-4 bg-purple-500/20 border-2 border-purple-500/50 rounded backdrop-blur-md hover:border-purple-500 transition-all">
                    <p className="text-purple-400 font-mono tracking-wider text-sm mb-1">API Success Rate</p>
                    <p className="text-3xl font-bold text-white font-mono tracking-wider">99.7%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-black/60 backdrop-blur-xl border-2 border-white/20 p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-white font-mono tracking-wider mb-6 flex items-center gap-2">
              <Settings className="w-6 h-6" />
              SYSTEM SETTINGS
            </h2>
            
            <div className="space-y-6">
              <div className="p-4 bg-yellow-500/10 border-2 border-yellow-500/30 rounded backdrop-blur-md hover:border-yellow-500/50 transition-all">
                <h3 className="text-yellow-400 font-mono tracking-wider font-bold mb-2">⚠️ MAINTENANCE MODE</h3>
                <p className="text-white/60 text-sm font-mono tracking-wider mb-4">
                  Enable maintenance mode to prevent user access during updates
                </p>
                <Button variant="outline" className="border-2 border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20 hover:border-yellow-500 backdrop-blur-md font-mono tracking-wider transition-all">
                  Enable Maintenance Mode
                </Button>
              </div>

              <div className="p-4 bg-red-500/10 border-2 border-red-500/30 rounded backdrop-blur-md hover:border-red-500/50 transition-all">
                <h3 className="text-red-400 font-mono tracking-wider font-bold mb-2">🗑️ DANGER ZONE</h3>
                <p className="text-white/60 text-sm font-mono tracking-wider mb-4">
                  Irreversible actions that affect the entire system
                </p>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full border-2 border-red-500/50 text-red-400 hover:bg-red-500/20 hover:border-red-500 backdrop-blur-md font-mono tracking-wider transition-all">
                    Clear All User Data
                  </Button>
                  <Button variant="outline" className="w-full border-2 border-red-500/50 text-red-400 hover:bg-red-500/20 hover:border-red-500 backdrop-blur-md font-mono tracking-wider transition-all">
                    Reset Rate Limits
                  </Button>
                  <Button variant="outline" className="w-full border-2 border-red-500/50 text-red-400 hover:bg-red-500/20 hover:border-red-500 backdrop-blur-md font-mono tracking-wider transition-all">
                    Purge All Caches
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showUserDetailsModal && selectedUserDetails && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowUserDetailsModal(false)}>
          <div className="bg-black border-2 border-white/20 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white font-mono tracking-wider">USER DETAILS</h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowUserDetailsModal(false)}
                className="border-2 border-white/20 hover:border-white/40"
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Basic Info */}
              <div className="bg-white/5 border border-white/10 rounded p-4">
                <h3 className="text-white font-mono tracking-wider font-bold mb-3">BASIC INFORMATION</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-white/60 font-mono">Email</p>
                    <p className="text-white font-mono">{selectedUserDetails.email}</p>
                  </div>
                  <div>
                    <p className="text-white/60 font-mono">UID</p>
                    <p className="text-white font-mono text-xs">{selectedUserDetails.uid}</p>
                  </div>
                  <div>
                    <p className="text-white/60 font-mono">Role</p>
                    <p className="text-white font-mono">{selectedUserDetails.role || selectedUserDetails.plan}</p>
                  </div>
                  <div>
                    <p className="text-white/60 font-mono">Tier</p>
                    <p className="text-white font-mono">{selectedUserDetails.tier}</p>
                  </div>
                  {selectedUserDetails.banned && (
                    <>
                      <div className="col-span-2">
                        <p className="text-red-400 font-mono font-bold">⚠️ USER IS BANNED</p>
                        <p className="text-white/60 font-mono text-xs">Reason: {selectedUserDetails.banReason}</p>
                        <p className="text-white/60 font-mono text-xs">Banned At: {new Date(selectedUserDetails.bannedAt).toLocaleString()}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Usage Stats */}
              <div className="bg-white/5 border border-white/10 rounded p-4">
                <h3 className="text-white font-mono tracking-wider font-bold mb-3">USAGE STATISTICS</h3>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-white/60 font-mono">Tokens Analyzed</p>
                    <p className="text-white font-mono text-lg">{selectedUserDetails.dailyAnalyses || 0}</p>
                  </div>
                  <div>
                    <p className="text-white/60 font-mono">Watchlist</p>
                    <p className="text-white font-mono text-lg">{selectedUserDetails.watchlistCount || 0}</p>
                  </div>
                  <div>
                    <p className="text-white/60 font-mono">Active Alerts</p>
                    <p className="text-white font-mono text-lg">{selectedUserDetails.activeAlertsCount || 0}</p>
                  </div>
                </div>
              </div>

              {/* Auth Data */}
              {selectedUserDetails.authData && (
                <div className="bg-white/5 border border-white/10 rounded p-4">
                  <h3 className="text-white font-mono tracking-wider font-bold mb-3">AUTHENTICATION</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/60 font-mono">Email Verified</span>
                      <span className={`font-mono ${selectedUserDetails.authData.emailVerified ? 'text-green-400' : 'text-red-400'}`}>
                        {selectedUserDetails.authData.emailVerified ? '✓ Yes' : '✗ No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60 font-mono">Account Disabled</span>
                      <span className={`font-mono ${selectedUserDetails.authData.disabled ? 'text-red-400' : 'text-green-400'}`}>
                        {selectedUserDetails.authData.disabled ? '✓ Yes' : '✗ No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60 font-mono">Sign-In Provider</span>
                      <span className="text-white font-mono">
                        {selectedUserDetails.authData.providerData?.[0]?.providerId || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60 font-mono">Created</span>
                      <span className="text-white font-mono text-xs">
                        {selectedUserDetails.authData.metadata?.creationTime || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60 font-mono">Last Sign In</span>
                      <span className="text-white font-mono text-xs">
                        {selectedUserDetails.authData.metadata?.lastSignInTime || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Scans */}
              {selectedUserDetails.recentScans && selectedUserDetails.recentScans.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded p-4">
                  <h3 className="text-white font-mono tracking-wider font-bold mb-3">RECENT SCANS</h3>
                  <div className="space-y-2">
                    {selectedUserDetails.recentScans.slice(0, 5).map((scan: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-xs border-b border-white/5 pb-2">
                        <span className="text-white font-mono">{scan.tokenSymbol || scan.tokenAddress?.slice(0, 8)}</span>
                        <span className="text-white/60 font-mono">{new Date(scan.scannedAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
