'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface ShopRequest {
  request_id: number
  owner_id: number
  shop_name: string
  shop_email: string
  shop_phone_number: string
  shop_address: string
  shop_city: string
  shop_country: string
  status: string
  created_at: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState('')
  const [shopRequests, setShopRequests] = useState<ShopRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const email = localStorage.getItem('userEmail')
    const role = localStorage.getItem('userRole')

    if (role !== 'admin') {
      router.push('/sign-in')
      return
    }

    setUserEmail(email || '')
    loadPendingRequests()
  }, [router])

  const loadPendingRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/shop-requests')
      const data = await response.json()
      if (data.success) {
        setShopRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Error loading requests:', error)
      setMessage('Error loading shop requests')
    } finally {
      setLoading(false)
    }
  }

  const handleApproveShop = async (requestId: number, shopName: string) => {
    if (!confirm(`Approve shop registration for ${shopName}?`)) return

    setActionLoading(requestId)
    try {
      const response = await fetch(`/api/admin/shop-requests/${requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`✓ Shop "${shopName}" approved! Credentials sent to owner.`)
        loadPendingRequests()
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      setMessage('Error during approval')
      console.error(error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectShop = async (requestId: number, shopName: string) => {
    if (!confirm(`Reject shop registration for ${shopName}?`)) return

    setActionLoading(requestId)
    try {
      const response = await fetch(`/api/admin/shop-requests/${requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`Shop "${shopName}" rejected.`)
        loadPendingRequests()
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      setMessage('Error during rejection')
      console.error(error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('userRole')
    localStorage.removeItem('userId')
    localStorage.removeItem('userEmail')
    router.push('/sign-in')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <Card className="p-8">
          <div className="space-y-4">
            <div>
              <h1 className="text-4xl font-bold text-blue-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage shop registrations and approvals</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Logged in as:</p>
              <p className="text-lg font-semibold text-blue-900">{userEmail}</p>
            </div>
          </div>
        </Card>

        {/* Message */}
        {message && (
          <Card className={`p-4 ${
            message.startsWith('✓')
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <p className={message.startsWith('✓') ? 'text-green-700' : 'text-red-700'}>
              {message}
            </p>
          </Card>
        )}

        {/* Pending Shop Requests */}
        <Card className="p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Pending Shop Approvals
              {shopRequests.length > 0 && (
                <span className="ml-2 inline-block bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                  {shopRequests.length}
                </span>
              )}
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Review and approve or reject shop registration requests
            </p>
          </div>

          {loading ? (
            <p className="text-center text-gray-600">Loading requests...</p>
          ) : shopRequests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">✓ No pending requests</p>
              <p className="text-sm">All shop registrations have been reviewed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {shopRequests.map((request) => (
                <Card key={request.request_id} className="p-6 border-2 border-orange-200">
                  <div className="space-y-4">
                    {/* Request Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {request.shop_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Request ID: {request.request_id}
                        </p>
                      </div>
                      <span className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                        Pending
                      </span>
                    </div>

                    {/* Request Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium text-gray-900">{request.shop_email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium text-gray-900">{request.shop_phone_number}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-600">Address</p>
                        <p className="font-medium text-gray-900">
                          {request.shop_address}, {request.shop_city}, {request.shop_country}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-600">Submitted</p>
                        <p className="font-medium text-gray-900">
                          {new Date(request.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end">
                      <Button
                        onClick={() => handleRejectShop(request.request_id, request.shop_name)}
                        className="bg-red-500 hover:bg-red-600 flex items-center gap-2"
                        disabled={actionLoading === request.request_id}
                      >
                        <X className="h-4 w-4" />
                        Reject
                      </Button>
                      <Button
                        onClick={() => handleApproveShop(request.request_id, request.shop_name)}
                        className="bg-green-500 hover:bg-green-600 flex items-center gap-2"
                        disabled={actionLoading === request.request_id}
                      >
                        <Check className="h-4 w-4" />
                        {actionLoading === request.request_id ? 'Processing...' : 'Approve'}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>

        {/* Logout */}
        <Button
          onClick={handleLogout}
          className="w-full bg-red-500 hover:bg-red-600"
        >
          Logout
        </Button>
      </div>
    </div>
  )
}
