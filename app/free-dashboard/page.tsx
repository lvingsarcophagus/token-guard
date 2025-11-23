"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function FreeDashboardRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to unified dashboard
    router.replace("/dashboard")
  }, [router])
  
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white font-mono text-sm">Redirecting to dashboard...</div>
    </div>
  )
}
