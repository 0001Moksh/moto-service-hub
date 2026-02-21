"use client"

import Image from "next/image"
import Link from "next/link"

interface AuthCardProps {
  children: React.ReactNode
  title: string
  description: string
}

export function AuthCard({ children, title, description }: AuthCardProps) {
  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="mb-8 flex justify-center">
        <Link href="/">
          <Image
            src="/logo_squre-removebg-preview.png"
            alt="Moto ServiceHub"
            width={80}
            height={80}
            className="h-20 w-auto"
            priority
          />
        </Link>
      </div>

      {/* Card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-lg sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="mb-1 text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {children}
      </div>
    </div>
  )
}
