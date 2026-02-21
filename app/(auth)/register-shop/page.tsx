"use client"

import { useState } from "react"
import Link from "next/link"
import {
  User,
  Mail,
  Phone,
  Store,
  MapPin,
  CreditCard,
  CheckCircle2,
  Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AuthCard } from "@/components/auth/auth-card"

export default function RegisterShopPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [selfieFile, setSelfieFile] = useState<File | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    // Will integrate with Supabase later
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsLoading(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <AuthCard
        title="Application Submitted"
        description="Your shop registration request has been received"
      >
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="rounded-full bg-brand-green/10 p-4">
            <CheckCircle2 className="h-12 w-12 text-brand-green" />
          </div>
          <div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              Under Review
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Our admin team will review your application and verify your
              details. You will receive an email notification once your shop is
              approved and ready to go.
            </p>
          </div>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline">
              <Link href="/">Back to Home</Link>
            </Button>
            <Button
              asChild
              className="bg-brand-blue text-primary-foreground hover:bg-brand-blue-light"
            >
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </div>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Register Your Shop"
      description="Apply to list your motorcycle service shop on the platform"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Section: Owner Details */}
        <div className="mb-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Owner Details
          </p>
        </div>

        {/* Owner Name */}
        <div className="space-y-2">
          <Label htmlFor="ownerName">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="ownerName"
              type="text"
              placeholder="Your full name"
              className="pl-10"
              required
              autoComplete="name"
            />
          </div>
        </div>

        {/* Owner Email */}
        <div className="space-y-2">
          <Label htmlFor="ownerEmail">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="ownerEmail"
              type="email"
              placeholder="you@example.com"
              className="pl-10"
              required
              autoComplete="email"
            />
          </div>
        </div>

        {/* Owner Phone */}
        <div className="space-y-2">
          <Label htmlFor="ownerPhone">Phone Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="ownerPhone"
              type="tel"
              placeholder="+91 98765 43210"
              className="pl-10"
              required
              autoComplete="tel"
            />
          </div>
        </div>

        {/* Selfie Upload */}
        <div className="space-y-2">
          <Label htmlFor="selfie">Owner Selfie (Optional)</Label>
          <div className="flex items-center gap-3">
            <label
              htmlFor="selfie"
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-brand-blue hover:text-brand-blue"
            >
              <Upload className="h-4 w-4" />
              {selfieFile ? selfieFile.name : "Upload photo"}
            </label>
            <input
              id="selfie"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setSelfieFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border pt-4">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Shop Details
          </p>
        </div>

        {/* Shop Name */}
        <div className="space-y-2">
          <Label htmlFor="shopName">Shop Name</Label>
          <div className="relative">
            <Store className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="shopName"
              type="text"
              placeholder="Your service shop name"
              className="pl-10"
              required
            />
          </div>
        </div>

        {/* Shop Address */}
        <div className="space-y-2">
          <Label htmlFor="shopAddress">Shop Address</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Textarea
              id="shopAddress"
              placeholder="Full address including city, state, and PIN code"
              className="min-h-20 pl-10"
              required
            />
          </div>
        </div>

        {/* Aadhaar (optional) */}
        <div className="space-y-2">
          <Label htmlFor="aadhaar">Aadhaar Card Number (Optional)</Label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="aadhaar"
              type="text"
              placeholder="XXXX XXXX XXXX"
              className="pl-10"
              maxLength={14}
              pattern="\d{4}\s?\d{4}\s?\d{4}"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Used for identity verification. Your data is encrypted and secure.
          </p>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full bg-brand-orange text-foreground font-semibold hover:bg-brand-orange-light"
          disabled={isLoading}
        >
          {isLoading ? "Submitting application..." : "Submit Application"}
        </Button>
      </form>

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
          Just a customer?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-brand-blue hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </AuthCard>
  )
}
