'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function WorkerDashboard() {
  const router = useRouter()
  const params = useParams()
  const shopSlug = params.shop_slug as string

  const [workerEmail, setWorkerEmail] = useState('')
  const [shopName, setShopName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const role = localStorage.getItem('workerRole')
    const email = localStorage.getItem('workerEmail')
    const shop = localStorage.getItem('shopName')
    const slug = localStorage.getItem('shopSlug')

    if (role !== 'worker' || slug !== shopSlug) {
      router.push(`/shop/${shopSlug}/worker/login`)
      return
    }

    setWorkerEmail(email || '')
    setShopName(shop || '')
    setLoading(false)
  }, [router, shopSlug])

  const handleLogout = () => {
    localStorage.removeItem('workerRole')
    localStorage.removeItem('workerId')
    localStorage.removeItem('workerEmail')
    localStorage.removeItem('shopSlug')
    localStorage.removeItem('shopId')
    localStorage.removeItem('shopName')
    router.push(`/shop/${shopSlug}/worker/login`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="p-8">
          <p className="text-gray-600">Loading...</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="p-8">
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-4xl font-bold text-blue-900">Worker Dashboard</h1>
              <p className="text-gray-600 mt-2">{shopName}</p>
            </div>

            {/* Worker Info */}
            <div className="bg-blue-50 p-6 rounded-lg space-y-3">
              <h2 className="font-semibold text-blue-900">Your Information</h2>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-lg font-medium text-gray-900">{workerEmail}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Shop</p>
                <p className="text-lg font-medium text-gray-900">{shopName}</p>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <h2 className="font-semibold text-blue-900">Available Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 border border-gray-200">
                  <h3 className="font-medium text-gray-900">Current Jobs</h3>
                  <p className="text-sm text-gray-600 mt-2">View and manage your assigned jobs</p>
                </Card>
                <Card className="p-4 border border-gray-200">
                  <h3 className="font-medium text-gray-900">Schedule</h3>
                  <p className="text-sm text-gray-600 mt-2">Check your working schedule</p>
                </Card>
                <Card className="p-4 border border-gray-200">
                  <h3 className="font-medium text-gray-900">Attendance</h3>
                  <p className="text-sm text-gray-600 mt-2">Mark attendance and track hours</p>
                </Card>
                <Card className="p-4 border border-gray-200">
                  <h3 className="font-medium text-gray-900">Profile</h3>
                  <p className="text-sm text-gray-600 mt-2">Update your profile information</p>
                </Card>
              </div>
            </div>

            {/* Logout */}
            <Button
              onClick={handleLogout}
              className="w-full bg-red-500 hover:bg-red-600"
            >
              Logout
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
