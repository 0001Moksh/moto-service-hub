'use client';

export const dynamic = 'force-dynamic';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function CancellationPolicy() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Cancellation Policy</h1>
          <p className="text-gray-600">Understanding the 2-Token Cancellation System</p>
        </div>

        {/* Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="text-3xl">💎</div>
                <div>
                  <p className="font-semibold mb-1">Monthly Token Allowance</p>
                  <p className="text-gray-600">You receive 3 free cancellation tokens at the start of each calendar month.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="text-3xl">1️⃣</div>
                <div>
                  <p className="font-semibold mb-1">First Cancellation</p>
                  <p className="text-gray-600">Costs 1 token. You can cancel your first booking per month without extra penalty.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="text-3xl">2️⃣</div>
                <div>
                  <p className="font-semibold mb-1">Repeated Cancellations</p>
                  <p className="text-gray-600">Each cancellation after the first costs 2 tokens to discourage last-minute cancellations.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="text-3xl">🚫</div>
                <div>
                  <p className="font-semibold mb-1">Zero Tokens</p>
                  <p className="text-gray-600">Once you run out of tokens, you cannot cancel bookings. You must complete them or contact support.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Refund Policy */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Refund Schedule</CardTitle>
            <CardDescription>Refunds depend on when you cancel relative to the service time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-4 bg-emerald-50 border-l-4 border-emerald-600 rounded">
                <div className="flex justify-between items-center mb-1">
                  <p className="font-semibold">More than 1 hour before service</p>
                  <Badge className="bg-emerald-600">100% Refund</Badge>
                </div>
                <p className="text-sm text-gray-600">Full refund if you cancel well in advance</p>
              </div>

              <div className="p-4 bg-blue-50 border-l-4 border-blue-600 rounded">
                <div className="flex justify-between items-center mb-1">
                  <p className="font-semibold">30 minutes to 1 hour before</p>
                  <Badge className="bg-blue-600">75% Refund</Badge>
                </div>
                <p className="text-sm text-gray-600">3/4 refund if you cancel with moderate notice</p>
              </div>

              <div className="p-4 bg-orange-50 border-l-4 border-orange-600 rounded">
                <div className="flex justify-between items-center mb-1">
                  <p className="font-semibold">Less than 30 minutes before</p>
                  <Badge className="bg-orange-600">50% Refund</Badge>
                </div>
                <p className="text-sm text-gray-600">Half refund if you cancel on short notice</p>
              </div>

              <div className="p-4 bg-red-50 border-l-4 border-red-600 rounded">
                <div className="flex justify-between items-center mb-1">
                  <p className="font-semibold">After service has started</p>
                  <Badge className="bg-red-600">No Refund</Badge>
                </div>
                <p className="text-sm text-gray-600">No refund if worker is already attending to your bike</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Examples */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Examples</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-50 rounded space-y-2">
              <p className="font-semibold">Scenario 1: First Cancellation (90 minutes before)</p>
              <p className="text-sm text-gray-600">• Tokens deducted: 1</p>
              <p className="text-sm text-gray-600">• Refund: 100%</p>
              <p className="text-sm text-gray-600">• Remaining tokens: 2 for the month</p>
            </div>

            <div className="p-4 bg-gray-50 rounded space-y-2">
              <p className="font-semibold">Scenario 2: Second Cancellation (20 minutes before)</p>
              <p className="text-sm text-gray-600">• Tokens deducted: 2</p>
              <p className="text-sm text-gray-600">• Refund: 50%</p>
              <p className="text-sm text-gray-600">• Remaining tokens: 0 (out for the month)</p>
            </div>

            <div className="p-4 bg-gray-50 rounded space-y-2">
              <p className="font-semibold">Scenario 3: Attempted Third Cancellation</p>
              <p className="text-sm text-gray-600">• Status: BLOCKED - Not enough tokens</p>
              <p className="text-sm text-gray-600">• Action: Contact support or wait for next month</p>
              <p className="text-sm text-gray-600">• Next reset: First day of next month</p>
            </div>
          </CardContent>
        </Card>

        {/* FAQs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-semibold mb-2">Q: What happens if I run out of tokens?</p>
              <p className="text-sm text-gray-600">A: You cannot cancel bookings. You'll need to complete them or contact our support team for special circumstances.</p>
            </div>

            <div>
              <p className="font-semibold mb-2">Q: When do tokens reset?</p>
              <p className="text-sm text-gray-600">A: Your token count resets on the first day of each calendar month at 00:00 IST.</p>
            </div>

            <div>
              <p className="font-semibold mb-2">Q: Can I buy additional tokens?</p>
              <p className="text-sm text-gray-600">A: Currently no, but we're exploring this feature. For now, tokens are free and allotted monthly.</p>
            </div>

            <div>
              <p className="font-semibold mb-2">Q: What if I cancel due to an emergency?</p>
              <p className="text-sm text-gray-600">A: Contact our support team immediately. We may waive penalties for genuine emergencies.</p>
            </div>

            <div>
              <p className="font-semibold mb-2">Q: How do refunds work?</p>
              <p className="text-sm text-gray-600">A: Refunds are credited back to your original payment method within 3-5 business days.</p>
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        <Button
          onClick={() => router.back()}
          className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700"
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
