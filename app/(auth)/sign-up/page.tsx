"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Mail, Lock, User, Phone, AlertCircle, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { AuthCard } from "@/components/auth/auth-card"
import { GoogleButton } from "@/components/auth/google-button"

export default function SignUpPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Clear error when user starts typing
  const clearError = () => {
    if (error) setError("")
  }

  // Password strength indicator
  const passwordStrength = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  }

  const passwordsMatch = password && confirmPassword && password === confirmPassword

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    
    // Validation
    if (!fullName.trim()) {
      setError("Please enter your full name")
      return
    }

    if (!email.trim()) {
      setError("Please enter your email address")
      return
    }

    if (!password) {
      setError("Please enter a password")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    if (!confirmPassword) {
      setError("Please confirm your password")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (!agreed) {
      setError("Please agree to the terms and conditions")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          phone,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Sign-up failed. Please try again.")
        return
      }

      // Store token and redirect
      localStorage.setItem("auth_token", data.token)
      localStorage.setItem("auth_user", JSON.stringify(data.user))
      
      router.push(data.redirectUrl)
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthCard
      title="Create an Account"
      description="Join Moto ServiceHub to book bike services"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400 flex gap-2 items-start">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              className="pl-10"
              required
              autoComplete="name"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value)
                clearError()
              }}
              disabled={isLoading}
            />
          </div>
        </div>

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
              onChange={(e) => {
                setEmail(e.target.value)
                clearError()
              }}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number (Optional)</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              placeholder="+91 98765 43210"
              className="pl-10"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value)
                clearError()
              }}
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
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              className="pl-10 pr-10"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                clearError()
              }}
              disabled={isLoading}
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
          
          {/* Password Strength Indicator */}
          {password && (
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                {passwordStrength.length ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <div className="h-3 w-3 rounded-full bg-gray-300" />
                )}
                <span className={passwordStrength.length ? "text-green-600" : "text-gray-500"}>
                  At least 8 characters
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Confirm your password"
              className={`pl-10 ${
                confirmPassword && !passwordsMatch ? "border-red-500" : ""
              }`}
              required
              minLength={8}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                clearError()
              }}
              disabled={isLoading}
            />
            {confirmPassword && passwordsMatch && (
              <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-600" />
            )}
          </div>
          {confirmPassword && !passwordsMatch && (
            <p className="text-xs text-red-600">Passwords do not match</p>
          )}
        </div>

        {/* Terms */}
        <div className="flex items-start gap-2">
          <Checkbox
            id="terms"
            checked={agreed}
            onCheckedChange={(checked) => {
              setAgreed(checked === true)
              clearError()
            }}
            className="mt-0.5"
            disabled={isLoading}
          />
          <Label htmlFor="terms" className="text-xs leading-relaxed text-muted-foreground">
            I agree to the{" "}
            <Link href="#" className="text-brand-blue hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="#" className="text-brand-blue hover:underline">
              Privacy Policy
            </Link>
          </Label>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full bg-brand-blue text-primary-foreground font-semibold hover:bg-brand-blue-light"
          disabled={isLoading || !agreed || !passwordsMatch}
        >
          {isLoading ? "Creating account..." : "Create Account"}
        </Button>
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
      <GoogleButton label="Sign up with Google" />

      {/* Links */}
      <div className="mt-6 space-y-2 text-center text-sm">
        <p className="text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-brand-blue hover:underline"
          >
            Sign In
          </Link>
        </p>
        <p className="text-muted-foreground">
          Want to register a shop?{" "}
          <Link
            href="/register-shop"
            className="font-medium text-brand-orange hover:underline"
          >
            Apply here
          </Link>
        </p>
      </div>
    </AuthCard>
  )
}
