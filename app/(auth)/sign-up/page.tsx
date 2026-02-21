"use client"

import { useState } from "react"
import Link from "next/link"
import { Eye, EyeOff, Mail, Lock, User, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { AuthCard } from "@/components/auth/auth-card"
import { GoogleButton } from "@/components/auth/google-button"

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!agreed) return
    setIsLoading(true)
    // Will integrate with Supabase Auth later
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
  }

  return (
    <AuthCard
      title="Create an Account"
      description="Join Moto ServiceHub to book bike services"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
            />
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              placeholder="+91 98765 43210"
              className="pl-10"
              required
              autoComplete="tel"
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
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
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
              className="pl-10"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
        </div>

        {/* Terms */}
        <div className="flex items-start gap-2">
          <Checkbox
            id="terms"
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked === true)}
            className="mt-0.5"
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
          disabled={isLoading || !agreed}
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
