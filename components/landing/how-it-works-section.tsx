"use client"

import { Store, UserPlus, CalendarCheck, Receipt } from "lucide-react"

const steps = [
  {
    number: "01",
    icon: Store,
    title: "Register Your Shop",
    description:
      "Sign up and configure your digital garage. Set working hours, define service types and durations, and establish buffer times.",
    color: "text-brand-blue",
    bg: "bg-brand-blue/10",
  },
  {
    number: "02",
    icon: UserPlus,
    title: "Add Workers & Services",
    description:
      "Add your mechanics with a single email invite. Define their skills and set availability. The system calculates real-time booking capacity.",
    color: "text-brand-orange",
    bg: "bg-brand-orange/10",
  },
  {
    number: "03",
    icon: CalendarCheck,
    title: "Customers Book Online",
    description:
      "Customers discover your shop, verify their vehicle via RTO APIs, pick a service category, and book an available slot instantly.",
    color: "text-brand-green",
    bg: "bg-brand-green/10",
  },
  {
    number: "04",
    icon: Receipt,
    title: "Track, Complete & Bill",
    description:
      "Workers receive digital job cards, update live status, log inspections. Once done, invoices auto-generate and email to the customer.",
    color: "text-brand-blue",
    bg: "bg-brand-blue/10",
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-secondary/30 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        {/* Header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-orange">
            How It Works
          </p>
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            <span className="text-balance">Up and Running in 4 Simple Steps</span>
          </h2>
          <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
            From registration to your first completed booking, get started in
            minutes -- not weeks.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line (desktop) */}
          <div className="absolute top-24 left-0 right-0 hidden h-0.5 bg-border lg:block" />

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.number} className="relative flex flex-col items-center text-center">
                {/* Step number circle */}
                <div className="relative z-10 mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-border bg-card shadow-sm">
                  <span className="text-lg font-bold text-brand-blue">
                    {step.number}
                  </span>
                </div>

                {/* Icon */}
                <div className={`mb-4 rounded-xl p-3 ${step.bg}`}>
                  <step.icon className={`h-6 w-6 ${step.color}`} />
                </div>

                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>

                {/* Arrow (mobile) */}
                {index < steps.length - 1 && (
                  <div className="mt-6 text-border md:hidden">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="mx-auto">
                      <path
                        d="M12 5v14m0 0l-5-5m5 5l5-5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
