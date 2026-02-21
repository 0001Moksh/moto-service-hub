"use client"

import Link from "next/link"
import Image from "next/image"

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "For Shop Owners", href: "#roles" },
    { label: "For Customers", href: "#roles" },
  ],
  Company: [
    { label: "About Us", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "#" },
  ],
  Support: [
    { label: "Help Center", href: "#" },
    { label: "FAQs", href: "#" },
    { label: "Report an Issue", href: "#" },
    { label: "Status", href: "#" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookie Policy", href: "#" },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="mb-4 inline-block">
              <Image
                src="/logo_reactangular-removebg-preview.png"
                alt="Moto ServiceHub"
                width={160}
                height={42}
                className="h-9 w-auto"
              />
            </Link>
            <p className="mb-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              The free, all-in-one platform for motorcycle service shops. Smart
              scheduling, automatic worker assignment, and real-time tracking.
            </p>
            <p className="text-xs text-muted-foreground">
              Built with care for the Indian motorcycle service industry.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="mb-4 text-sm font-semibold text-foreground">
                {category}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-xs text-muted-foreground">
            {`\u00A9 ${new Date().getFullYear()} Moto ServiceHub. All rights reserved.`}
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="inline-block h-2 w-2 rounded-full bg-brand-green" />
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
