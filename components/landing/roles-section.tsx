"use client"

import {
  Crown,
  Wrench,
  Bike,
  Shield,
  Calendar,
  Users,
  BarChart3,
  ClipboardList,
  Activity,
  FileText,
  MapPin,
  History,
  Settings,
  Eye,
  AlertTriangle,
} from "lucide-react"

const roles = [
  {
    title: "Shop Owner",
    subtitle: "Your digital garage command center",
    icon: Crown,
    color: "text-brand-blue",
    bg: "bg-brand-blue/10",
    borderColor: "border-brand-blue/30",
    features: [
      { icon: Calendar, label: "Calendar & holiday management" },
      { icon: Users, label: "Add & manage workers" },
      { icon: BarChart3, label: "Revenue & performance analytics" },
      { icon: Settings, label: "Configure services & durations" },
    ],
  },
  {
    title: "Worker",
    subtitle: "Mobile-first job management",
    icon: Wrench,
    color: "text-brand-orange",
    bg: "bg-brand-orange/10",
    borderColor: "border-brand-orange/30",
    features: [
      { icon: ClipboardList, label: "Instant digital job cards" },
      { icon: Activity, label: "Real-time status updates" },
      { icon: FileText, label: "Inspection & extra repair logging" },
      { icon: Wrench, label: "Parts & service execution" },
    ],
  },
  {
    title: "Customer",
    subtitle: "Book and track with ease",
    icon: Bike,
    color: "text-brand-green",
    bg: "bg-brand-green/10",
    borderColor: "border-brand-green/30",
    features: [
      { icon: MapPin, label: "Find nearby service shops" },
      { icon: Calendar, label: "Book available service slots" },
      { icon: Activity, label: "Live service tracking" },
      { icon: History, label: "Complete booking history" },
    ],
  },
  {
    title: "Platform Admin",
    subtitle: "Governance & oversight",
    icon: Shield,
    color: "text-brand-blue",
    bg: "bg-brand-blue/10",
    borderColor: "border-brand-blue/30",
    features: [
      { icon: Eye, label: "Monitor all registered shops" },
      { icon: AlertTriangle, label: "Abuse detection & action" },
      { icon: Settings, label: "Global platform configuration" },
      { icon: BarChart3, label: "Platform-wide analytics" },
    ],
  },
]

export function RolesSection() {
  return (
    <section id="roles" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        {/* Header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-orange">
            Built For Everyone
          </p>
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            <span className="text-balance">
              One Platform, Four Powerful Dashboards
            </span>
          </h2>
          <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
            Each user role gets a tailored experience designed for their specific
            workflow and responsibilities.
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {roles.map((role) => (
            <div
              key={role.title}
              className={`group rounded-xl border ${role.borderColor} bg-card p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}
            >
              <div className="mb-4 flex items-center gap-3">
                <div className={`rounded-lg p-2.5 ${role.bg}`}>
                  <role.icon className={`h-6 w-6 ${role.color}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {role.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {role.subtitle}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {role.features.map((feature) => (
                  <div
                    key={feature.label}
                    className="flex items-center gap-3 rounded-lg bg-secondary/50 px-3 py-2.5"
                  >
                    <feature.icon className={`h-4 w-4 shrink-0 ${role.color}`} />
                    <span className="text-sm text-foreground">
                      {feature.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
