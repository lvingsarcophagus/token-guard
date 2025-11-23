"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { theme } from "@/lib/theme"
import Navbar from "@/components/navbar"
import { Download, Trash2, Shield } from "lucide-react"
import TwoFactorSetup from "@/components/two-factor-setup"
import ProfileImageUpload from "@/components/profile-image-upload"
import Loader from "@/components/loader"
import CustomModal from "@/components/custom-modal"
import { useModal } from "@/hooks/use-modal"

export default function ProfilePage() {
  const { user, userData, updateProfile, loading } = useAuth()
  const { modalState, closeModal, showSuccess, showError, showConfirm } = useModal()
  const [name, setName] = useState("")
  const [company, setCompany] = useState("")
  const [country, setCountry] = useState("")
  const [saving, setSaving] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const [connectingWallet, setConnectingWallet] = useState(false)
  const [exportingData, setExportingData] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [deletingAccount, setDeletingAccount] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
    // Set fields from userData
    if (userData?.name) {
      setName(userData.name)
    } else {
      setName('')
    }
    if (userData?.company) {
      setCompany(userData.company)
    } else {
      setCompany('')
    }
    if (userData?.country) {
      setCountry(userData.country)
    } else {
      setCountry('')
    }
    if (userData?.walletAddress) {
      setWalletAddress(userData.walletAddress)
    }
  }, [user, userData, loading, router])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateProfile({ name, company, country })
      showSuccess("Profile Updated", "Your profile information has been saved successfully!")
    } catch (error) {
      showError("Update Failed", "Failed to update profile. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleConnectWallet = async () => {
    setConnectingWallet(true)
    try {
      interface EthereumProvider {
        request: (args: { method: string }) => Promise<string[]>
      }

      const windowWithEthereum = window as unknown as { ethereum?: EthereumProvider }

      if (typeof window !== "undefined" && windowWithEthereum.ethereum) {
        const accounts = await windowWithEthereum.ethereum.request({
          method: "eth_requestAccounts",
        })
        const address = accounts[0]
        setWalletAddress(address)
        await updateProfile({ walletAddress: address })
        showSuccess("Wallet Connected", "Your wallet has been connected successfully!")
      } else {
        showError("Wallet Not Found", "Please install MetaMask or Phantom wallet extension to continue.")
      }
    } catch (error) {
      console.error("Error connecting wallet:", error)
      showError("Connection Failed", "Failed to connect wallet. Please try again.")
    } finally {
      setConnectingWallet(false)
    }
  }

  const handleDisconnectWallet = async () => {
    showConfirm(
      "Disconnect Wallet",
      "Are you sure you want to disconnect your wallet?",
      async () => {
        setWalletAddress("")
        await updateProfile({ walletAddress: "" })
        showSuccess("Wallet Disconnected", "Your wallet has been disconnected.")
      }
    )
  }

  const handleExportData = async () => {
    setExportingData(true)
    try {
      const response = await fetch('/api/user/export-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to export data')
      }

      const data = await response.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tokenguard-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showSuccess("Data Exported", "Your data has been exported successfully!")
    } catch (error) {
      console.error('Error exporting data:', error)
      showError("Export Failed", "Failed to export data. Please try again.")
    } finally {
      setExportingData(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE MY ACCOUNT") {
      showError("Confirmation Required", "Please type 'DELETE MY ACCOUNT' to confirm deletion.")
      return
    }

    setDeletingAccount(true)
    try {
      // Get the current user's ID token
      if (!user) {
        throw new Error('No authenticated user')
      }

      const token = await user.getIdToken()

      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete account')
      }

      showSuccess(
        "Account Deleted",
        "Your account has been permanently deleted. You will be redirected to the home page.",
        () => router.push('/')
      )
    } catch (error) {
      console.error('Error deleting account:', error)
      showError("Deletion Failed", "Failed to delete account. Please try again or contact support.")
      setDeletingAccount(false)
    }
  }

  if (loading) {
    return <Loader fullScreen text="Loading profile" />
  }

  if (!user) return null

  return (
    <>
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
      
      <div className={`relative min-h-screen ${theme.backgrounds.main} overflow-hidden`}>
      {/* Stars background */}
      <div className="fixed inset-0 stars-bg pointer-events-none"></div>

      {/* Corner frame accents */}
      <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-white/30 z-20"></div>
      <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-white/30 z-20"></div>
      <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-white/30 z-20"></div>
      <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-white/30 z-20"></div>

      <Navbar />

      <div className="relative max-w-4xl mx-auto px-4 pt-24 pb-12">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4 opacity-60">
            <div className={theme.decorative.divider}></div>
            <span className={`${theme.text.tiny} ${theme.text.primary} ${theme.fonts.mono} ${theme.fonts.tracking} uppercase`}>USER SETTINGS</span>
            <div className="flex-1 h-px bg-white"></div>
          </div>
          <h1 className={`text-3xl ${theme.fonts.bold} ${theme.text.primary} ${theme.fonts.mono} ${theme.fonts.tracking}`}>PROFILE</h1>
        </div>

        <div className="space-y-6">
          <Card className={`${theme.backgrounds.card} border ${theme.borders.default}`}>
            <CardHeader>
              <CardTitle className={`${theme.text.primary} ${theme.fonts.mono} ${theme.fonts.tracking}`}>ACCOUNT INFORMATION</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className={`${theme.text.secondary} ${theme.fonts.mono} ${theme.text.small} ${theme.fonts.tracking} uppercase`}>
                  Profile Image
                </Label>
                <div className="mt-2">
                  <ProfileImageUpload />
                </div>
              </div>

              <div>
                <Label htmlFor="name" className={`${theme.text.secondary} ${theme.fonts.mono} ${theme.text.small} ${theme.fonts.tracking} uppercase`}>
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`mt-1 ${theme.inputs.boxed}`}
                />
              </div>

              <div>
                <Label htmlFor="email" className={`${theme.text.secondary} ${theme.fonts.mono} ${theme.text.small} ${theme.fonts.tracking} uppercase`}>
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className={`mt-1 ${theme.inputs.boxed} opacity-60`}
                />
              </div>

              <div>
                <Label htmlFor="company" className={`${theme.text.secondary} ${theme.fonts.mono} ${theme.text.small} ${theme.fonts.tracking} uppercase`}>
                  Company (Optional)
                </Label>
                <Input
                  id="company"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Your company name"
                  className={`mt-1 ${theme.inputs.boxed}`}
                />
              </div>

              <div>
                <Label htmlFor="country" className={`${theme.text.secondary} ${theme.fonts.mono} ${theme.text.small} ${theme.fonts.tracking} uppercase`}>
                  Country (Optional)
                </Label>
                <Input
                  id="country"
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Your country"
                  className={`mt-1 ${theme.inputs.boxed}`}
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={saving}
                className={`${theme.buttons.primary} uppercase`}
              >
                {saving ? "SAVING..." : "SAVE CHANGES"}
              </Button>
            </CardContent>
          </Card>

          <Card className={`${theme.backgrounds.card} border ${theme.borders.default}`}>
            <CardHeader>
              <CardTitle className={`${theme.text.primary} ${theme.fonts.mono} ${theme.fonts.tracking}`}>SUBSCRIPTION</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`${theme.text.small} ${theme.text.secondary} ${theme.fonts.mono} uppercase ${theme.fonts.tracking}`}>Current Plan</div>
                  <div className={`${theme.text.xlarge} ${theme.fonts.bold} ${theme.text.primary} mt-1 ${theme.fonts.mono} ${theme.fonts.tracking}`}>
                    {(userData?.tier === "pro" || userData?.plan === "PREMIUM") ? "PREMIUM" : "FREE"}
                  </div>
                </div>

                {(userData?.tier === "free" || userData?.plan === "FREE") && (
                  <Link href="/pricing">
                    <Button className={`${theme.buttons.secondary} uppercase`}>
                      UPGRADE TO PRO
                    </Button>
                  </Link>
                )}
              </div>

              {(userData?.tier === "pro" || userData?.plan === "PREMIUM") && userData?.nextBillingDate && (
                <div className={`mt-4 pt-4 border-t ${theme.borders.default} ${theme.text.secondary} ${theme.text.base} ${theme.fonts.mono}`}>
                  Next billing date: {userData.nextBillingDate}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={`${theme.backgrounds.card} border ${theme.borders.default}`}>
            <CardHeader>
              <CardTitle className={`${theme.text.primary} ${theme.fonts.mono} ${theme.fonts.tracking}`}>CONNECTED WALLETS</CardTitle>
            </CardHeader>
            <CardContent>
              {walletAddress ? (
                <div className="space-y-4">
                  <div className={`flex items-center justify-between p-4 ${theme.backgrounds.overlay} border ${theme.borders.light}`}>
                    <div>
                      <div className={`${theme.text.small} ${theme.text.secondary} ${theme.fonts.mono} uppercase ${theme.fonts.tracking}`}>Connected Wallet</div>
                      <div className={`${theme.text.primary} ${theme.fonts.mono} mt-1`}>
                        {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                      </div>
                    </div>
                    <Button
                      onClick={handleDisconnectWallet}
                      className="border border-white/30 text-white hover:bg-white hover:text-black transition-all font-mono text-sm uppercase"
                    >
                      DISCONNECT
                    </Button>
                  </div>
                  <p className={`${theme.text.secondary} ${theme.text.base} ${theme.fonts.mono}`}>
                    Your wallet is connected. You can now track your portfolio and receive personalized alerts.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className={`${theme.text.secondary} ${theme.text.base} ${theme.fonts.mono}`}>
                    Connect your wallet to track your portfolio and receive personalized token alerts.
                  </p>
                  <Button
                    onClick={handleConnectWallet}
                    disabled={connectingWallet}
                    className={`${theme.buttons.primary} uppercase`}
                  >
                    {connectingWallet ? "CONNECTING..." : "CONNECT WALLET"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Two-Factor Authentication Section */}
          <Card className={`${theme.backgrounds.card} border ${theme.borders.default}`}>
            <CardHeader>
              <CardTitle className={`${theme.text.primary} ${theme.fonts.mono} ${theme.fonts.tracking} flex items-center gap-2`}>
                <Shield className="w-5 h-5" />
                SECURITY & TWO-FACTOR AUTHENTICATION
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TwoFactorSetup />
            </CardContent>
          </Card>

          <Card className={`${theme.backgrounds.card} border ${theme.borders.default}`}>
            <CardHeader>
              <CardTitle className={`${theme.text.primary} ${theme.fonts.mono} ${theme.fonts.tracking} flex items-center gap-2`}>
                <Shield className="w-5 h-5" />
                PRIVACY & DATA RIGHTS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-start gap-3 mb-4">
                  <Download className="w-5 h-5 text-white mt-1" />
                  <div className="flex-1">
                    <h3 className={`${theme.text.primary} ${theme.fonts.mono} ${theme.text.base} ${theme.fonts.bold} mb-2 uppercase`}>
                      EXPORT YOUR DATA
                    </h3>
                    <p className={`${theme.text.secondary} ${theme.text.small} ${theme.fonts.mono} mb-3`}>
                      Download a complete copy of your data in JSON format. Includes your profile, scan history, watchlist, and all analytics.
                    </p>
                    <Button
                      onClick={handleExportData}
                      disabled={exportingData}
                      className={`${theme.buttons.primary} uppercase`}
                    >
                      {exportingData ? "EXPORTING..." : "DOWNLOAD MY DATA"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className={`pt-6 border-t ${theme.borders.default}`}>
                <div className="flex items-start gap-3 mb-4">
                  <Trash2 className="w-5 h-5 text-red-500 mt-1" />
                  <div className="flex-1">
                    <h3 className={`${theme.text.primary} ${theme.fonts.mono} ${theme.text.base} ${theme.fonts.bold} mb-2 uppercase`}>
                      DELETE YOUR ACCOUNT
                    </h3>
                    <p className={`${theme.text.secondary} ${theme.text.small} ${theme.fonts.mono} mb-3`}>
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    <Button
                      onClick={() => setShowDeleteModal(true)}
                      className="border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all font-mono text-sm uppercase"
                    >
                      DELETE MY ACCOUNT
                    </Button>
                  </div>
                </div>
              </div>

              <div className={`pt-6 border-t ${theme.borders.default}`}>
                <p className={`${theme.text.secondary} ${theme.text.tiny} ${theme.fonts.mono}`}>
                  For more information about how we handle your data, please review our{" "}
                  <Link href="/privacy" className={`${theme.text.primary} hover:underline`}>
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${theme.backgrounds.card} border-2 ${theme.borders.default} p-8 max-w-md w-full`}>
            <h2 className={`${theme.text.xlarge} ${theme.fonts.bold} ${theme.text.primary} mb-4 ${theme.fonts.mono} ${theme.fonts.tracking} uppercase`}>
              CONFIRM ACCOUNT DELETION
            </h2>
            <p className={`${theme.text.secondary} ${theme.text.small} ${theme.fonts.mono} mb-6`}>
              This action is permanent and cannot be undone. All your data, including scan history, watchlist, and settings will be permanently deleted.
            </p>
            <p className={`${theme.text.primary} ${theme.text.small} ${theme.fonts.mono} mb-4`}>
              Type <span className="font-bold">DELETE MY ACCOUNT</span> to confirm:
            </p>
            <Input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className={`mb-6 ${theme.inputs.boxed}`}
              placeholder="DELETE MY ACCOUNT"
            />
            <div className="flex gap-4">
              <Button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirmText("")
                }}
                disabled={deletingAccount}
                className={`flex-1 ${theme.buttons.primary} uppercase`}
              >
                CANCEL
              </Button>
              <Button
                onClick={handleDeleteAccount}
                disabled={deletingAccount || deleteConfirmText !== "DELETE MY ACCOUNT"}
                className="flex-1 border-2 border-red-500 bg-red-500 text-white hover:bg-red-600 hover:border-red-600 transition-all font-mono text-sm uppercase"
              >
                {deletingAccount ? "DELETING..." : "DELETE FOREVER"}
              </Button>
            </div>
          </div>
        </div>
      )}

      </div>
      
      <style jsx>{`
        .stars-bg {
          background-image: 
            radial-gradient(1px 1px at 20% 30%, white, transparent),
            radial-gradient(1px 1px at 60% 70%, white, transparent),
            radial-gradient(1px 1px at 50% 50%, white, transparent),
            radial-gradient(1px 1px at 80% 10%, white, transparent),
            radial-gradient(1px 1px at 90% 60%, white, transparent),
            radial-gradient(1px 1px at 33% 80%, white, transparent),
            radial-gradient(1px 1px at 15% 60%, white, transparent),
            radial-gradient(1px 1px at 70% 40%, white, transparent);
          background-size: 200% 200%, 180% 180%, 250% 250%, 220% 220%, 190% 190%, 240% 240%, 210% 210%, 230% 230%;
          background-position: 0% 0%, 40% 40%, 60% 60%, 20% 20%, 80% 80%, 30% 30%, 70% 70%, 50% 50%;
          opacity: 0.3;
        }
      `}</style>
    </>
  )
}
