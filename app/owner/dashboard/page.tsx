'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Plus, Trash2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Worker {
  worker_id: number
  name: string
  mail: string
  age: number
  phone_number?: string
  created_at: string
}

export default function OwnerDashboard() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [shopName, setShopName] = useState('')
  const [shopSlug, setShopSlug] = useState('')
  const [shopId, setShopId] = useState('')

  const [workers, setWorkers] = useState<Worker[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
    phone: '',
  })

  useEffect(() => {
    const email = localStorage.getItem('userEmail')
    const role = localStorage.getItem('userRole')
    const id = localStorage.getItem('userId')

    if (role !== 'owner') {
      router.push('/sign-in')
      return
    }

    setUserEmail(email || '')
    setUserId(id || '')

    // Fetch shop details for this owner
    if (id) {
      fetchShopDetails(parseInt(id))
    }
  }, [router])

  const fetchShopDetails = async (ownerId: number) => {
    try {
      const response = await fetch(`/api/owner/shop?ownerId=${ownerId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.shop) {
          setShopName(data.shop.name || 'My Shop')
          setShopSlug(data.shop.slug || 'my-shop')
          setShopId(data.shop.shop_id)
          loadWorkers(data.shop.shop_id)
        }
      } else {
        console.error('Shop not found - owner may not have approved registration yet')
      }
    } catch (error) {
      console.error('Error fetching shop details:', error)
    }
  }

  const loadWorkers = async (sId: number) => {
    try {
      const response = await fetch(`/api/owner/workers?shopId=${sId}`)
      if (response.ok) {
        const data = await response.json()
        setWorkers(data.workers || [])
      }
    } catch (error) {
      console.error('Error loading workers:', error)
    }
  }

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/owner/workers/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: parseInt(shopId),
          email: formData.email,
          name: formData.name,
          age: parseInt(formData.age),
          phoneNumber: formData.phone,
          shopName: shopName,
          shopSlug: shopSlug,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage(`Error: ${data.error}`)
        return
      }

      setMessage(`✓ Worker added successfully! Email sent to ${formData.email}`)
      setFormData({ name: '', email: '', age: '', phone: '' })
      setShowAddForm(false)

      // Reload workers
      if (shopId) {
        loadWorkers(parseInt(shopId))
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteWorker = async (workerId: number) => {
    if (!confirm('Are you sure you want to delete this worker?')) return

    try {
      const response = await fetch(`/api/owner/workers/${workerId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setMessage('✓ Worker deleted successfully')
        if (shopId) {
          loadWorkers(parseInt(shopId))
        }
      } else {
        setMessage('Error deleting worker')
      }
    } catch (error) {
      setMessage('An error occurred')
      console.error(error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('userRole')
    localStorage.removeItem('userId')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userShop')
    router.push('/sign-in')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <Card className="p-8">
          <div className="space-y-4">
            <div>
              <h1 className="text-4xl font-bold text-orange-900">Shop Owner Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your shop and workers</p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Logged in as:</p>
              <p className="text-lg font-semibold text-orange-900">{userEmail}</p>
              {shopName && (
                <p className="text-lg font-semibold text-orange-900 mt-2">Shop: {shopName}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Workers Section */}
        <Card className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Workers</h2>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Worker
            </Button>
          </div>

          {message && (
            <div className={`p-4 rounded-lg ${
              message.startsWith('✓')
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}>
              {message}
            </div>
          )}

          {/* Add Worker Form */}
          {showAddForm && (
            <Card className="p-6 border-2 border-orange-200 space-y-4">
              <h3 className="text-lg font-semibold">Add New Worker</h3>
              <form onSubmit={handleAddWorker} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="age">Age *</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="25"
                      required
                      value={formData.age}
                      onChange={(e) =>
                        setFormData({ ...formData, age: e.target.value })
                      }
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (Optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+91 9999999999"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    className="bg-orange-600 hover:bg-orange-700"
                    disabled={loading}
                  >
                    {loading ? 'Adding...' : 'Add Worker'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false)
                      setFormData({ name: '', email: '', age: '', phone: '' })
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Workers List */}
          {workers.length > 0 ? (
            <div className="space-y-3">
              {workers.map((worker) => (
                <Card key={worker.worker_id} className="p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-gray-900">{worker.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4" />
                        {worker.mail}
                      </div>
                      <p className="text-sm text-gray-600">
                        Age: {worker.age}
                        {worker.phone_number && ` • Phone: ${worker.phone_number}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        Added: {new Date(worker.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleDeleteWorker(worker.worker_id)}
                      className="bg-red-500 hover:bg-red-600"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              <p>No workers added yet.</p>
              <p className="text-sm">Click "Add Worker" to onboard your first team member.</p>
            </div>
          )}
        </Card>

        {/* Features */}
        <Card className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Available Features</h2>
          <ul className="list-disc list-inside text-left text-gray-700 space-y-2">
            <li>Add and manage unlimited workers (based on plan)</li>
            <li>Workers receive unique login credentials via email</li>
            <li>Shop-scoped worker dashboards</li>
            <li>Track worker attendance and jobs (coming soon)</li>
            <li>View earnings and reports (coming soon)</li>
          </ul>
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
