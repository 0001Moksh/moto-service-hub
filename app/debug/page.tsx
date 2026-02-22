"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import Link from "next/link"

export default function AuthDebugPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  async function handleDebug(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setResult(null)

    try {
      const response = await fetch("/api/auth/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Debug check failed")
        return
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message || "Error checking account")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-4">
          <Link href="/" className="text-brand-blue hover:underline">
            ← Back to Home
          </Link>
        </div>

        <Card className="p-6 space-y-4">
          <div>
            <h1 className="text-2xl font-bold">🔍 Auth Debug Tool</h1>
            <p className="text-sm text-muted-foreground">Check if your account exists in the system and debug login issues</p>
          </div>

          <form onSubmit={handleDebug} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Checking..." : "Check Account"}
            </Button>
          </form>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
              <p className="font-semibold">Error:</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className={`p-4 border rounded-md ${result.results.customer || result.results.owner || result.results.admin || result.results.worker ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                <p className={`font-semibold ${result.results.customer || result.results.owner || result.results.admin || result.results.worker ? "text-green-900" : "text-red-900"}`}>
                  {result.message}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer */}
                <div className={`p-4 border rounded-md ${result.results.customer ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
                  <h3 className="font-semibold mb-2">👤 Customer</h3>
                  {result.results.customer ? (
                    <div className="text-sm space-y-1">
                      <p className="text-green-700 font-medium">✓ Account Found</p>
                      <p><span className="text-gray-600">ID:</span> {result.results.customer.id}</p>
                      <p><span className="text-gray-600">Email:</span> {result.results.customer.email}</p>
                      <p><span className="text-gray-600">Password:</span> {result.results.customer.hasPassword ? "✓ Hash stored" : "❌ NOT STORED"}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">Not registered as customer</p>
                  )}
                </div>

                {/* Owner */}
                <div className={`p-4 border rounded-md ${result.results.owner ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
                  <h3 className="font-semibold mb-2">🏪 Owner</h3>
                  {result.results.owner ? (
                    <div className="text-sm space-y-1">
                      <p className="text-green-700 font-medium">✓ Account Found</p>
                      <p><span className="text-gray-600">ID:</span> {result.results.owner.id}</p>
                      <p><span className="text-gray-600">Email:</span> {result.results.owner.email}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">Not registered as owner</p>
                  )}
                </div>

                {/* Admin */}
                <div className={`p-4 border rounded-md ${result.results.admin ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
                  <h3 className="font-semibold mb-2">🔐 Admin</h3>
                  {result.results.admin ? (
                    <div className="text-sm space-y-1">
                      <p className="text-green-700 font-medium">✓ Account Found</p>
                      <p><span className="text-gray-600">ID:</span> {result.results.admin.id}</p>
                      <p><span className="text-gray-600">Email:</span> {result.results.admin.email}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">Not registered as admin</p>
                  )}
                </div>

                {/* Worker */}
                <div className={`p-4 border rounded-md ${result.results.worker ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
                  <h3 className="font-semibold mb-2">🔧 Worker</h3>
                  {result.results.worker ? (
                    <div className="text-sm space-y-1">
                      <p className="text-green-700 font-medium">✓ Account Found</p>
                      <p><span className="text-gray-600">ID:</span> {result.results.worker.id}</p>
                      <p><span className="text-gray-600">Email:</span> {result.results.worker.email}</p>
                      <p><span className="text-gray-600">Password:</span> {result.results.worker.hasPassword ? "✓ Hash stored" : "❌ NOT STORED"}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">Not registered as worker</p>
                  )}
                </div>
              </div>

              {/* Recommendations */}
              <div className={`p-4 border rounded-md ${result.results.customer?.found && result.results.customer?.hasPassword ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}`}>
                <p className={`font-semibold mb-2 ${result.results.customer?.found && result.results.customer?.hasPassword ? "text-green-900" : "text-yellow-900"}`}>
                  💡 Recommendations:
                </p>
                <div className="text-sm space-y-2">
                  {!result.results.customer?.found && !result.results.owner?.found && !result.results.admin?.found && !result.results.worker?.found && (
                    <p>❌ <strong>Account not found!</strong> You need to register first.</p>
                  )}
                  {(result.results.customer?.found || result.results.owner?.found || result.results.admin?.found || result.results.worker?.found) && !result.results.customer?.hasPassword && !result.results.owner?.found && (
                    <p>❌ <strong>Account found but password not stored!</strong> Registration issue. Try again.</p>
                  )}
                  {result.results.customer?.found && result.results.customer?.hasPassword && (
                    <>
                      <p className="text-green-700">✓ <strong>Account ready for login!</strong></p>
                      <p>If login still fails, check your password uppercase/lowercase.</p>
                      <p><Link href="/sign-in" className="text-brand-blue hover:underline font-semibold">→ Go to Sign In</Link></p>
                    </>
                  )}
                  {result.results.owner?.found && (
                    <>
                      <p className="text-green-700">✓ <strong>Shop Owner account found!</strong></p>
                      <p><Link href="/sign-in" className="text-brand-blue hover:underline font-semibold">→ Go to Sign In</Link></p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-900">
            <p className="font-semibold mb-2">ℹ️ How this works:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Enter your email to check if an account exists</li>
              <li>See which user type (Customer/Owner/Admin/Worker) your account is</li>
              <li>Verify password is properly stored</li>
              <li>Get recommendations for fixing login issues</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  )
}
