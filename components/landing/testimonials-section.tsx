"use client"

import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Rajesh Kumar",
    role: "Owner, Kumar Bike Works",
    location: "Bangalore",
    quote:
      "Before Moto ServiceHub, we managed everything with paper registers. Now my 4 workers get instant job cards on their phones, and I can see my revenue trends in real-time. Game changer.",
    rating: 5,
  },
  {
    name: "Priya Sharma",
    role: "Owner, SpeedFix Garage",
    location: "Mumbai",
    quote:
      "The auto worker assignment alone saved me hours of daily headache. Customers book online, workers get notified, and I focus on growing my business instead of juggling phone calls.",
    rating: 5,
  },
  {
    name: "Vikram Singh",
    role: "Owner, Royal Service Center",
    location: "Delhi",
    quote:
      "The anti-abuse system with cancellation tokens is brilliant. No-shows dropped by 60% since we started using the platform. And the best part -- it's completely free.",
    rating: 5,
  },
]

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="bg-secondary/30 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        {/* Header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-orange">
            Testimonials
          </p>
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            <span className="text-balance">
              Trusted by Shop Owners Across India
            </span>
          </h2>
          <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
            Hear from real garage owners who transformed their operations with
            Moto ServiceHub.
          </p>
        </div>

        {/* Testimonial Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="flex flex-col rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:shadow-lg"
            >
              {/* Stars */}
              <div className="mb-4 flex gap-1">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-brand-orange text-brand-orange"
                  />
                ))}
              </div>

              {/* Quote */}
              <p className="mb-6 flex-1 text-sm leading-relaxed text-muted-foreground">
                {`"${testimonial.quote}"`}
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 border-t border-border pt-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-blue/10 text-sm font-bold text-brand-blue">
                  {testimonial.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {testimonial.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {testimonial.role} -- {testimonial.location}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
