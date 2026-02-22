"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthCard } from "@/components/auth/auth-card"
import { GoogleButton } from "@/components/auth/google-button"
import { useAuth } from "@/hooks/use-auth"

export default function SignInPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [failedAttempts, setFailedAttempts] = useState(0)

  // Clear error when user starts typing
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    if (error) setError("")
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    if (error) setError("")
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Validate inputs
      if (!email.trim()) {
        setError("Please enter your email address")
        setIsLoading(false)
        return
      }
      if (!password) {
        setError("Please enter your password")
        setIsLoading(false)
        return
      }

      await login(email, password)
      setFailedAttempts(0) // Reset on success
    } catch (err: any) {
      const failCount = failedAttempts + 1
      setFailedAttempts(failCount)
      
      // Better error messages
      let errorMessage = "Invalid email or password"
      
      if (err.message?.includes("Invalid email")) {
        errorMessage = "Invalid email format"
      } else if (err.message?.includes("password")) {
        errorMessage = "Incorrect email or password. Please try again."
      }

      // Warn after multiple failed attempts
      if (failCount >= 3) {
        errorMessage += ` (${failCount} failed attempts)`
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthCard
      title="Welcome Back"
      description="Sign in to your Moto ServiceHub account"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400 flex gap-2 items-start">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Warning for too many attempts */}
        {failedAttempts >= 3 && (
          <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
            <p className="font-medium">Too many failed attempts</p>
            <p className="text-xs mt-1">If you forgot your password, please contact support@motoservicehub.com</p>
          </div>
        )}

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
              onChange={handleEmailChange}
              disabled={isLoading || failedAttempts >= 5}
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="#"
              className="text-xs text-brand-blue hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className="pl-10 pr-10"
              required
              autoComplete="current-password"
              value={password}
              onChange={handlePasswordChange}
              disabled={isLoading || failedAttempts >= 5}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
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
          className="w-full bg-brand-blue text-primary-foreground font-semibold hover:bg-brand-blue-light"
          disabled={isLoading || failedAttempts >= 5}
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>

        {/* Account locked message */}
        {failedAttempts >= 5 && (
          <div className="text-center text-sm text-red-600 dark:text-red-400">
            <p>Account temporarily locked due to too many failed attempts.</p>
            <p>Please contact support@motoservicehub.com</p>
          </div>
        )}
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-card px-2 text-muted-foreground">
            or continue with
          </span>
        </div>
      </div>

      {/* Google */}
      <GoogleButton label="Sign in with Google" disabled={failedAttempts >= 5} />

      {/* Links */}
      <div className="mt-6 space-y-2 text-center text-sm">
        <p className="text-muted-foreground">
          {"Don't have an account? "}
          <Link
            href="/sign-up"
            className="font-medium text-brand-blue hover:underline"
          >
            Sign Up
          </Link>
        </p>
        <p className="text-muted-foreground">
          Own a service shop?{" "}
          <Link
            href="/register-shop"
            className="font-medium text-brand-orange hover:underline"
          >
            Register your shop
          </Link>
        </p>
        <p className="text-xs text-muted-foreground border-t border-border pt-2 mt-2">
          Having login issues?{" "}
          <Link
            href="/debug"
            className="font-medium text-brand-blue hover:underline"
          >
            Check your account
          </Link>
        </p>
      </div>
    </AuthCard>
  )
}
