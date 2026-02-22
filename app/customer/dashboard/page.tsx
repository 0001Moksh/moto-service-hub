'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Star, Loader, Bike, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Shop {
  shop_id: number
  name: string
  location: string
  rating: number
  picture_array: string[]
}

export default function CustomerDashboard() {
  const { user, logout, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [shops, setShops] = useState<Shop[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [activeTab, setActiveTab] = useState<'discover' | 'bookings'>('discover')

  // Redirect if not authenticated or not a customer
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'customer')) {
      router.push('/sign-in')
    }
  }, [user, authLoading, router])

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => console.error('Geolocation error:', error)
      )
    }
  }, [])

  // Fetch nearby shops
  useEffect(() => {
    const fetchShops = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        const response = await fetch(
          `/api/shops/nearby${userLocation ? `?lat=${userLocation.lat}&lng=${userLocation.lng}` : ''}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )

        if (response.ok) {
          const data = await response.json()
          setShops(data.shops || [])
        }
      } catch (error) {
        console.error('Failed to fetch shops:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (!authLoading) {
      fetchShops()
    }
  }, [authLoading, userLocation])

  const filteredShops = shops.filter((shop) =>
    shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shop.location.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (authLoading || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-brand-blue" />
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
              <h1 className="text-2xl font-bold text-foreground">Service Hub</h1>
              <p className="text-sm text-muted-foreground">Welcome, {user?.email}</p>
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
            <button
              onClick={() => setActiveTab('discover')}
              className={`pb-2 px-2 border-b-2 font-medium text-sm transition ${
                activeTab === 'discover'
                  ? 'border-brand-blue text-brand-blue'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Discover Shops
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`pb-2 px-2 border-b-2 font-medium text-sm transition ${
                activeTab === 'bookings'
                  ? 'border-brand-blue text-brand-blue'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              My Bookings
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {activeTab === 'discover' ? (
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Search Bar */}
          <div className="mb-6 space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search shops by name or location..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Location */}
            {userLocation && (
              <p className="text-sm text-muted-foreground">
                <MapPin className="inline h-4 w-4 mr-1" /> Showing shops near you
              </p>
            )}
          </div>

          {/* Shops Grid */}
          {filteredShops.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-12 text-center">
              <p className="text-muted-foreground">
                {shops.length === 0 ? 'No shops found near you' : 'No shops match your search'}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredShops.map((shop) => (
                <div
                  key={shop.shop_id}
                  className="overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-lg"
                >
                  {/* Shop Image */}
                  {shop.picture_array?.[0] ? (
                    <img
                      src={shop.picture_array[0]}
                      alt={shop.name}
                      className="h-48 w-full object-cover"
                    />
                  ) : (
                    <div className="h-48 w-full bg-muted flex items-center justify-center">
                      <Bike className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}

                  {/* Shop Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground">{shop.name}</h3>

                    {/* Location */}
                    <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 flex-shrink-0 pt-0.5" />
                      <span className="line-clamp-2">{shop.location}</span>
                    </p>

                    {/* Rating */}
                    <div className="mt-3 flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.round(shop.rating)
                              ? 'fill-brand-orange text-brand-orange'
                              : 'text-muted'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm font-medium text-foreground">
                        {shop.rating?.toFixed(1) || '0.0'}
                      </span>
                    </div>

                    {/* CTA Button */}
                    <Button
                      className="mt-4 w-full bg-brand-blue text-primary-foreground hover:bg-brand-blue-light"
                      onClick={() => router.push(`/shop/${shop.shop_id}`)}
                    >
                      Book Service
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">No bookings yet. Start by discovering shops above!</p>
            <Button
              onClick={() => setActiveTab('discover')}
              className="mt-4 bg-brand-blue text-primary-foreground hover:bg-brand-blue-light"
            >
              Browse Shops
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
