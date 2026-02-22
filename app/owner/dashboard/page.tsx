'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import {
  Settings,
  Users,
  BarChart3,
  Plus,
  LogOut,
  Loader,
  Edit2,
  Clock,
  MapPin,
  DollarSign,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface Shop {
  shop_id: number
  name: string
  location: string
  rating: number
  revenue: number
  owner_id: number
}

interface Worker {
  worker_id: number
  mail: string
  age: number
  rating: number
}

export default function OwnerDashboard() {
  const { user, logout, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [shop, setShop] = useState<Shop | null>(null)
  const [workers, setWorkers] = useState<Worker[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'workers' | 'settings'>('overview')
  const [showAddWorkerForm, setShowAddWorkerForm] = useState(false)
  const [showEditShopForm, setShowEditShopForm] = useState(false)

  // Form states
  const [newWorkerForm, setNewWorkerForm] = useState({
    mail: '',
    age: '',
  })

  const [shopForm, setShopForm] = useState({
    name: '',
    location: '',
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'owner')) {
      router.push('/sign-in')
    }
  }, [user, authLoading, router])

  // Fetch shop and workers
  useEffect(() => {
    const fetchShopData = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        
        // Fetch shop
        const shopResponse = await fetch('/api/owner/shop', {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (shopResponse.ok) {
          const shopData = await shopResponse.json()
          setShop(shopData.shop)
          setShopForm({
            name: shopData.shop.name,
            location: shopData.shop.location,
          })

          // Fetch workers
          const workersResponse = await fetch(
            `/api/owner/workers?shopId=${shopData.shop.shop_id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          )

          if (workersResponse.ok) {
            const workersData = await workersResponse.json()
            setWorkers(workersData.workers || [])
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (!authLoading) {
      fetchShopData()
    }
  }, [authLoading])

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/owner/workers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shop_id: shop?.shop_id,
          mail: newWorkerForm.mail,
          age: parseInt(newWorkerForm.age),
          password: Math.random().toString(36).slice(-12), // Temporary password
        }),
      })

      if (response.ok) {
        setNewWorkerForm({ mail: '', age: '' })
        setShowAddWorkerForm(false)
        // Refresh workers
        const workersResponse = await fetch(
          `/api/owner/workers?shopId=${shop?.shop_id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        if (workersResponse.ok) {
          const data = await workersResponse.json()
          setWorkers(data.workers || [])
        }
      }
    } catch (error) {
      console.error('Failed to add worker:', error)
    }
  }

  const handleUpdateShop = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/owner/shop/${shop?.shop_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(shopForm),
      })

      if (response.ok) {
        const data = await response.json()
        setShop(data.shop)
        setShowEditShopForm(false)
      }
    } catch (error) {
      console.error('Failed to update shop:', error)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    )
  }

  if (!shop) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Shop not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{shop.name}</h1>
              <p className="text-sm text-muted-foreground">Shop Owner Dashboard</p>
            </div>
            <Button
              variant="outline"
              onClick={logout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex gap-4 border-b border-border">
            {['overview', 'workers', 'settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                className={`pb-2 px-2 border-b-2 font-medium text-sm transition capitalize ${
                  activeTab === tab
                    ? 'border-brand-blue text-brand-blue'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'overview' && <BarChart3 className="inline h-4 w-4 mr-2" />}
                {tab === 'workers' && <Users className="inline h-4 w-4 mr-2" />}
                {tab === 'settings' && <Settings className="inline h-4 w-4 mr-2" />}
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPIs */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-border bg-card p-6">
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="mt-2 text-3xl font-bold text-foreground">
                  ₹{shop.revenue?.toLocaleString() || '0'}
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card p-6">
                <p className="text-sm text-muted-foreground">Rating</p>
                <p className="mt-2 text-3xl font-bold text-foreground">
                  {shop.rating?.toFixed(1) || '0.0'} ⭐
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card p-6">
                <p className="text-sm text-muted-foreground">Workers</p>
                <p className="mt-2 text-3xl font-bold text-foreground">
                  {workers.length}
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card p-6">
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="mt-2 truncate font-semibold text-foreground">
                  {shop.location}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'workers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Manage Workers</h2>
              <Button
                onClick={() => setShowAddWorkerForm(!showAddWorkerForm)}
                className="bg-brand-blue text-primary-foreground hover:bg-brand-blue-light"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Worker
              </Button>
            </div>

            {/* Add Worker Form */}
            {showAddWorkerForm && (
              <div className="rounded-lg border border-border bg-card p-6">
                <form onSubmit={handleAddWorker} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="mail">Email</Label>
                      <Input
                        id="mail"
                        type="email"
                        placeholder="worker@example.com"
                        required
                        value={newWorkerForm.mail}
                        onChange={(e) =>
                          setNewWorkerForm({ ...newWorkerForm, mail: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        placeholder="25"
                        required
                        value={newWorkerForm.age}
                        onChange={(e) =>
                          setNewWorkerForm({ ...newWorkerForm, age: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      className="bg-brand-blue text-primary-foreground hover:bg-brand-blue-light"
                    >
                      Add Worker
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowAddWorkerForm(false)
                        setNewWorkerForm({ mail: '', age: '' })
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Workers List */}
            {workers.length > 0 ? (
              <div className="grid gap-4">
                {workers.map((worker) => (
                  <div
                    key={worker.worker_id}
                    className="rounded-lg border border-border bg-card p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{worker.mail}</p>
                        <p className="text-sm text-muted-foreground">Age: {worker.age}</p>
                        <p className="text-sm text-muted-foreground">
                          Rating: {worker.rating?.toFixed(1) || '0.0'} ⭐
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-card/50 p-12 text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">
                  No workers added yet. Add your first worker to get started!
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Shop Settings</h2>
                {!showEditShopForm && (
                  <Button
                    variant="outline"
                    onClick={() => setShowEditShopForm(true)}
                    className="flex items-center gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </Button>
                )}
              </div>

              {showEditShopForm ? (
                <form onSubmit={handleUpdateShop} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="shopName">Shop Name</Label>
                    <Input
                      id="shopName"
                      value={shopForm.name}
                      onChange={(e) =>
                        setShopForm({ ...shopForm, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shopLocation">Location</Label>
                    <Textarea
                      id="shopLocation"
                      value={shopForm.location}
                      onChange={(e) =>
                        setShopForm({ ...shopForm, location: e.target.value })
                      }
                      className="min-h-24"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      className="bg-brand-blue text-primary-foreground hover:bg-brand-blue-light"
                    >
                      Save Changes
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowEditShopForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Shop Name</p>
                    <p className="font-semibold text-foreground">{shop.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="flex items-start gap-2 font-semibold text-foreground">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      {shop.location}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Coming Soon Features */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="mb-4 font-bold text-foreground">Coming Soon</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Working Hours Configuration
                </li>
                <li className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" /> Pricing Management
                </li>
                <li className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" /> Advanced Analytics
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
