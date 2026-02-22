'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';

interface CancellationConfirmation {
  cancellation_id: string;
  booking_id: string;
  cancelled_at: string;
  service_name: string;
  tokens_deducted: number;
  refund_amount: number;
  reason: string;
}

export default function CancellationConfirmed() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking_id');

  const [confirmation, setConfirmation] = useState<CancellationConfirmation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'customer') {
      router.push('/sign-in');
      return;
    }

    if (!bookingId) {
      router.push('/customer/dashboard');
      return;
    }

    const fetchConfirmation = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`/api/cancellations/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok && data.cancellation) {
          setConfirmation(data.cancellation);
        } else {
          setError(data.error || 'Failed to fetch cancellation details');
        }
      } catch (err) {
        setError('Error fetching cancellation details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchConfirmation();
  }, [user, router, bookingId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (!confirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <p className="text-red-600 font-semibold">{error || 'Cancellation details not found'}</p>
              <Button onClick={() => router.push('/customer/dashboard')} className="mt-4">
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-slate-100 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Success Header */}
        <div className="text-center space-y-3">
          <div className="text-6xl">✓</div>
          <h1 className="text-3xl font-bold">Booking Cancelled</h1>
          <p className="text-gray-600">Your cancellation has been processed</p>
        </div>

        {/* Confirmation Details */}
        <Card>
          <CardHeader>
            <CardTitle>Cancellation Summary</CardTitle>
            <CardDescription>
              Confirmation ID: {confirmation.cancellation_id}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500">SERVICE</p>
                <p className="text-lg font-semibold">{confirmation.service_name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">CANCELLED ON</p>
                <p className="text-lg font-semibold">
                  {new Date(confirmation.cancelled_at).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cancellation Impact */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-700">Cancellation Impact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-white rounded">
                <span className="font-semibold">Tokens Deducted</span>
                <Badge variant="destructive" className="text-lg py-1 px-3">
                  -{confirmation.tokens_deducted}
                </Badge>
              </div>

              <div className="flex justify-between items-center p-3 bg-white rounded">
                <span className="font-semibold">Refund Issued</span>
                <span className="text-lg font-bold text-green-600">₹{confirmation.refund_amount}</span>
              </div>

              <div className="text-sm text-gray-600 p-3 bg-white rounded">
                <p className="mb-2"><span className="font-semibold">Reason provided:</span></p>
                <p className="italic">"{confirmation.reason}"</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Refund Details */}
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-700">Refund Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>✓ Refund amount: <span className="font-bold">₹{confirmation.refund_amount}</span></p>
            <p>✓ Refund method: Original payment method</p>
            <p>✓ Processing time: 3-5 business days</p>
            <p className="text-gray-600">Check your bank account or digital wallet for the refund.</p>
          </CardContent>
        </Card>

        {/* Token Balance Notice */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-700">Your Tokens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">You have used {confirmation.tokens_deducted} cancellation token(s) this month.</p>
            <p className="text-sm text-gray-600">Tokens will reset on the first day of next month.</p>
            <Button
              variant="ghost"
              className="mt-2 h-auto p-0 text-blue-600 hover:text-blue-700"
              onClick={() => router.push('/cancellation/policy')}
            >
              Learn about cancellation tokens →
            </Button>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => router.push('/customer/dashboard')}
            className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700"
          >
            Back to Dashboard
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/booking/create')}
            className="w-full h-12 text-lg"
          >
            Book Again
          </Button>
        </div>

        {/* Support Notice */}
        <Card className="bg-gray-50">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">
              Need help? If you believe this cancellation was processed incorrectly, contact our support team within 24 hours.
            </p>
            <Button variant="ghost" className="mt-3 p-0 text-blue-600 hover:text-blue-700">
              Contact Support →
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
