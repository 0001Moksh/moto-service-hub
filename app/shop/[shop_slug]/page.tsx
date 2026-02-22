'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  MapPin,
  Star,
  Phone,
  Clock,
  Users,
  Loader,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Shop {
  shop_id: number
  name: string
  location: string
  rating: number
  picture_array: string[]
  owner: {
    phone: string
  }
}

interface Worker {
  worker_id: number
  mail: string
  rating: number
}

export default function ShopDetailPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const shopId = params.id as string

  const [shop, setShop] = useState<Shop | null>(null)
  const [workers, setWorkers] = useState<Worker[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'customer')) {
      router.push('/sign-in')
    }
  }, [user, authLoading, router])

  // Fetch shop details
  useEffect(() => {
    const fetchShopDetails = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        const response = await fetch(`/api/shops/${shopId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.ok) {
          const data = await response.json()
          setShop(data.shop)
          setWorkers(data.shop.workers || [])
        } else {
          router.push('/customer/dashboard')
        }
      } catch (error) {
        console.error('Failed to fetch shop details:', error)
        router.push('/customer/dashboard')
      } finally {
        setIsLoading(false)
      }
    }

    if (!authLoading) {
      fetchShopDetails()
    }
  }, [authLoading, shopId, router])

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
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Shop Image */}
        {shop.picture_array?.[0] ? (
          <img
            src={shop.picture_array[0]}
            alt={shop.name}
            className="mb-6 h-96 w-full rounded-lg object-cover"
          />
        ) : (
          <div className="mb-6 h-96 w-full rounded-lg bg-muted" />
        )}

        {/* Shop Info */}
        <div className="mb-8 space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{shop.name}</h1>
            <div className="mt-3 flex items-center gap-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.round(shop.rating)
                      ? 'fill-brand-orange text-brand-orange'
                      : 'text-muted'
                  }`}
                />
              ))}
              <span className="ml-2 font-semibold text-foreground">
                {shop.rating?.toFixed(1) || '0.0'} ({workers.length} workers)
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 flex-shrink-0 text-brand-blue mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium text-foreground">{shop.location}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 flex-shrink-0 text-brand-blue mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium text-foreground">
                  {shop.owner?.phone || 'Not available'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 flex-shrink-0 text-brand-blue mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Available Workers</p>
                <p className="font-medium text-foreground">{workers.length}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 flex-shrink-0 text-brand-blue mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Hours</p>
                <p className="font-medium text-foreground">9:00 AM - 6:00 PM</p>
              </div>
            </div>
          </div>
        </div>

        {/* Workers */}
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-foreground">Available Workers</h2>
          {workers.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {workers.map((worker) => (
                <div
                  key={worker.worker_id}
                  className="rounded-lg border border-border bg-card p-4"
                >
                  <p className="font-semibold text-foreground">{worker.mail}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Rating: {worker.rating?.toFixed(1) || '0.0'} ⭐
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No workers available currently</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            className="flex-1 bg-brand-blue text-primary-foreground hover:bg-brand-blue-light"
            onClick={() => router.push(`/booking/create?shop=${shopId}`)}
          >
            Book Service
          </Button>
          <Button variant="outline" onClick={() => router.back()}>
            View Other Shops
          </Button>
        </div>
      </div>
    </div>
  )
}
