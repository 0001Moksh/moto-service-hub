'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function CustomerDashboard() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    const email = localStorage.getItem('userEmail')
    const role = localStorage.getItem('userRole')

    if (role !== 'customer') {
      router.push('/sign-in')
      return
    }

    setUserEmail(email || '')
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('userRole')
    localStorage.removeItem('userId')
    localStorage.removeItem('userEmail')
    router.push('/sign-in')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-8">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <div className="text-center space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-green-900 mb-2">Customer Dashboard</h1>
              <p className="text-gray-600">Manage your motorcycle and bookings</p>
            </div>

            <div className="bg-green-50 p-6 rounded-lg space-y-2">
              <p className="text-sm text-gray-600">Logged in as:</p>
              <p className="text-xl font-semibold text-green-900">{userEmail}</p>
            </div>

            <div className="pt-4 space-y-3">
              <p className="text-gray-600">Customer features coming soon:</p>
              <ul className="list-disc list-inside text-left text-gray-700 space-y-1">
                <li>Register and manage motorcycles</li>
                <li>Book bike services</li>
                <li>Track service requests</li>
                <li>View service history and payments</li>
              </ul>
            </div>

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
