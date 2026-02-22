'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { UserRole } from '@/lib/auth'

interface User {
  id: number | string
  email: string
  role: UserRole
  shopId?: number
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Initialize from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('auth_user')

    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setToken(storedToken)
        setUser(userData)
      } catch (error) {
        console.error('Failed to restore session:', error)
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
      }
    }

    setIsLoading(false)
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/auth/sign-in', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Sign-in failed')
        }

        // Store token and user
        localStorage.setItem('auth_token', data.token)
        localStorage.setItem('auth_user', JSON.stringify(data.user))
        Cookies.set('auth_token', data.token, { expires: 7 })

        setToken(data.token)
        setUser(data.user)

        // Redirect based on role
        router.push(data.redirectUrl)
      } catch (error) {
        console.error('Login error:', error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [router]
  )

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    Cookies.remove('auth_token')
    setToken(null)
    setUser(null)
    router.push('/')
  }, [router])

  return {
    user,
    token,
    isLoading,
    login,
    logout,
    isAuthenticated: !!token && !!user,
  }
}
