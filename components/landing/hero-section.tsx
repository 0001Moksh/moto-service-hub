"use client"

import Link from "next/link"
import { ArrowRight, Calendar, Users, Activity, ClipboardList } from "lucide-react"
import { Button } from "@/components/ui/button"

function DashboardPreview() {
  return (
    <div className="relative mx-auto w-full max-w-lg">
      {/* Glow effect */}
      <div className="absolute -inset-4 rounded-2xl bg-brand-blue/20 blur-3xl" />
      <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        {/* Header bar */}
        <div className="flex items-center gap-2 border-b border-border bg-secondary/50 px-4 py-3">
          <div className="h-3 w-3 rounded-full bg-destructive/60" />
          <div className="h-3 w-3 rounded-full bg-brand-orange/60" />
          <div className="h-3 w-3 rounded-full bg-brand-green/60" />
          <span className="ml-2 text-xs text-muted-foreground">
            Moto ServiceHub Dashboard
          </span>
        </div>
        {/* Mini dashboard content */}
        <div className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">
                {"Today's Bookings"}
              </p>
              <p className="text-2xl font-bold text-foreground">12</p>
            </div>
            <div className="rounded-lg bg-brand-blue/10 p-2">
              <Calendar className="h-5 w-5 text-brand-blue" />
            </div>
          </div>
          <div className="mb-4 grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-secondary p-3 text-center">
              <p className="text-lg font-bold text-brand-green">8</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div className="rounded-lg bg-secondary p-3 text-center">
              <p className="text-lg font-bold text-brand-orange">3</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
            <div className="rounded-lg bg-secondary p-3 text-center">
              <p className="text-lg font-bold text-brand-blue">1</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
          {/* Mini job list */}
          <div className="space-y-2">
            {[
              { name: "Honda Activa - Oil Change", status: "Done", color: "bg-brand-green" },
              { name: "Royal Enfield - Full Service", status: "Working", color: "bg-brand-orange" },
              { name: "Yamaha R15 - Brake Pad", status: "Queued", color: "bg-brand-blue" },
            ].map((job) => (
              <div
                key={job.name}
                className="flex items-center justify-between rounded-lg border border-border p-2"
              >
                <span className="text-xs text-foreground">{job.name}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium text-card ${job.color}`}
                >
                  {job.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-24 pb-16 lg:pt-32 lg:pb-24">
      {/* Background decorative elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-brand-blue/5 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-brand-orange/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-16">
          {/* Left: Content */}
          <div className="flex-1 text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/80 px-4 py-1.5 text-sm">
              <span className="inline-block h-2 w-2 rounded-full bg-brand-green" />
              <span className="text-muted-foreground">
                100% Free Platform for Service Shops
              </span>
            </div>

            <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
              <span className="text-balance">
                Manage Your{" "}
                <span className="text-brand-blue">Bike Service</span> Shop Like{" "}
                <span className="text-brand-orange">Never Before</span>
              </span>
            </h1>

            <p className="mx-auto mb-8 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground lg:mx-0">
              The all-in-one platform for motorcycle service shops. Smart
              scheduling, automatic worker assignment, real-time tracking, and
              digital job cards -- all free.
            </p>

            <div className="flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
              <Button
                size="lg"
                asChild
                className="bg-brand-orange text-foreground font-semibold hover:bg-brand-orange-light gap-2 px-8"
              >
                <Link href="/register-shop">
                  Add Your Shop
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="gap-2 px-8">
                <Link href="/sign-up">Book a Service</Link>
              </Button>
            </div>

            {/* Quick feature tags */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground lg:justify-start">
              {[
                { icon: Calendar, label: "Smart Scheduling" },
                { icon: Users, label: "Worker Management" },
                { icon: Activity, label: "Live Tracking" },
                { icon: ClipboardList, label: "Digital Job Cards" },
              ].map((feature) => (
                <div key={feature.label} className="flex items-center gap-1.5">
                  <feature.icon className="h-4 w-4 text-brand-blue" />
                  <span>{feature.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Dashboard Preview */}
          <div className="flex-1">
            <DashboardPreview />
          </div>
        </div>
      </div>
    </section>
  )
}
