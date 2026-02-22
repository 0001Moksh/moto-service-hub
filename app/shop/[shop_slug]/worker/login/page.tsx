'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'

export default function WorkerLoginPage() {
  const router = useRouter()
  const params = useParams()
  const shopSlug = params.shop_slug as string

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [shopName, setShopName] = useState('')

  // Validate shop exists on mount
  useEffect(() => {
    const validateShop = async () => {
      try {
        const response = await fetch(`/api/shop/${shopSlug}/validate`)
        const data = await response.json()

        if (!response.ok) {
          setError('Invalid shop URL. Please check the link provided in your email.')
          return
        }

        setShopName(data.shopName)
      } catch (err) {
        setError('Unable to validate shop. Please try again.')
        console.error(err)
      }
    }

    if (shopSlug) {
      validateShop()
    }
  }, [shopSlug])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/shop/${shopSlug}/worker/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Login failed')
        return
      }

      // Store worker session
      localStorage.setItem('workerRole', 'worker')
      localStorage.setItem('workerId', data.workerId)
      localStorage.setItem('workerEmail', data.email)
      localStorage.setItem('shopSlug', shopSlug)
      localStorage.setItem('shopId', data.shopId)
      localStorage.setItem('shopName', data.shopName)

      // Redirect to worker dashboard
      router.push(`/shop/${shopSlug}/worker/dashboard`)
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-md mx-auto">
        <Card className="p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Worker Login</h1>
            {shopName && (
              <p className="text-gray-600 mt-2">
                {shopName}
              </p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Enter your credentials to access your dashboard
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="pl-10 pr-10"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full bg-blue-600 text-white font-semibold hover:bg-blue-700"
              disabled={isLoading || !shopName}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-600">
            <p>Didn't receive credentials?</p>
            <p>Contact your shop manager for assistance.</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
