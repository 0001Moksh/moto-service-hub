"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CtaSection() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-brand-blue" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-blue-light/30 via-transparent to-transparent" />

      <div className="mx-auto max-w-4xl px-4 text-center lg:px-8">
        <h2 className="mb-4 text-3xl font-bold text-primary-foreground md:text-4xl lg:text-5xl">
          <span className="text-balance">
            Ready to Transform Your Workshop?
          </span>
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-pretty text-lg leading-relaxed text-primary-foreground/80">
          Join hundreds of service shop owners who have digitized their
          operations. Registration is free and takes less than 5 minutes.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            size="lg"
            asChild
            className="bg-brand-orange text-foreground font-semibold hover:bg-brand-orange-light gap-2 px-8"
          >
            <Link href="/register-shop">
              Add Your Shop Now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 px-8"
          >
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </div>

        <p className="mt-6 text-sm text-primary-foreground/60">
          No credit card required. Free forever.
        </p>
      </div>
    </section>
  )
}
