"use client"

import {
  Calendar,
  Users,
  Activity,
  ClipboardList,
  ShieldCheck,
  BarChart3,
} from "lucide-react"

const features = [
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description:
      "Real-time slot calculation based on worker availability, service durations, and buffer times. No more overbooking.",
    color: "text-brand-blue",
    bg: "bg-brand-blue/10",
    border: "border-brand-blue/20",
  },
  {
    icon: Users,
    title: "Auto Worker Assignment",
    description:
      "Round-robin logic automatically assigns the earliest free worker to each job. Emergency re-assignment built in.",
    color: "text-brand-orange",
    bg: "bg-brand-orange/10",
    border: "border-brand-orange/20",
  },
  {
    icon: Activity,
    title: "Real-Time Tracking",
    description:
      "Customers and shop owners see live status updates as bikes move through inspection, service, and completion.",
    color: "text-brand-green",
    bg: "bg-brand-green/10",
    border: "border-brand-green/20",
  },
  {
    icon: ClipboardList,
    title: "Digital Job Cards",
    description:
      "Workers get instant digital job cards on their mobile. Update status, log parts, and add inspection notes on the go.",
    color: "text-brand-blue",
    bg: "bg-brand-blue/10",
    border: "border-brand-blue/20",
  },
  {
    icon: ShieldCheck,
    title: "Anti-Abuse System",
    description:
      "Cancellation tokens, no-show detection, and Google reCAPTCHA protect your shop from misuse and fake bookings.",
    color: "text-brand-orange",
    bg: "bg-brand-orange/10",
    border: "border-brand-orange/20",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Track revenue trends, peak hours, worker efficiency, and no-show rates. Data-driven decisions for your shop.",
    color: "text-brand-green",
    bg: "bg-brand-green/10",
    border: "border-brand-green/20",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        {/* Header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-orange">
            Features
          </p>
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            <span className="text-balance">
              Everything You Need to Run a Modern Service Shop
            </span>
          </h2>
          <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
            From booking to billing, every step of your service workflow is
            automated, tracked, and optimized.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className={`group relative rounded-xl border ${feature.border} bg-card p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}
            >
              <div className={`mb-4 inline-flex rounded-lg p-3 ${feature.bg}`}>
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
