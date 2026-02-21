"use client"

import { Store, CalendarCheck, Clock, IndianRupee } from "lucide-react"

const stats = [
  {
    icon: Store,
    value: "500+",
    label: "Service Shops",
    color: "text-brand-blue",
    bg: "bg-brand-blue/10",
  },
  {
    icon: CalendarCheck,
    value: "10,000+",
    label: "Bookings Managed",
    color: "text-brand-orange",
    bg: "bg-brand-orange/10",
  },
  {
    icon: Clock,
    value: "99.9%",
    label: "Platform Uptime",
    color: "text-brand-green",
    bg: "bg-brand-green/10",
  },
  {
    icon: IndianRupee,
    value: "100%",
    label: "Free Forever",
    color: "text-brand-blue",
    bg: "bg-brand-blue/10",
  },
]

export function StatsSection() {
  return (
    <section className="border-y border-border bg-secondary/30 py-12">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-3 text-center">
              <div className={`rounded-xl p-3 ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground md:text-3xl">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
