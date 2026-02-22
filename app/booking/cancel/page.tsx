'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';

interface BookingDetails {
  booking_id: string;
  status: string;
  service_name: string;
  shop_name: string;
  base_cost: number;
  estimated_time: number;
  created_at: string;
  scheduled_at?: string;
  started_at?: string;
}

interface CancellationTokenInfo {
  tokens_available: number;
  tokens_used: number;
  consecutive_cancellations: number;
}

const getCancellationPenalty = (consecutiveCancellations: number) => {
  return consecutiveCancellations >= 1 ? 2 : 1;
};

const getRefundPercentage = (bookingStatus: string, minutesToService: number) => {
  if (bookingStatus === 'pending' || bookingStatus === 'confirmed') {
    if (minutesToService > 60) return 100;
    if (minutesToService > 30) return 75;
    if (minutesToService > 0) return 50;
  }
  if (bookingStatus === 'assigned') {
    return 50;
  }
  if (bookingStatus === 'started') {
    return 0;
  }
  return 100;
};

function CancelBookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const bookingId = searchParams.get('booking_id');

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [tokenInfo, setTokenInfo] = useState<CancellationTokenInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'customer') {
      router.push('/sign-in');
      return;
    }

    if (!bookingId) {
      router.push('/customer/dashboard');
      return;
    }

    const fetchData = async () => {
      try {
        const token = localStorage.getItem('auth_token');

        // Fetch booking details
        const bookingRes = await fetch(`/api/bookings/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const bookingData = await bookingRes.json();

        // Fetch token info
        const tokenRes = await fetch('/api/cancellations/tokens', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const tokenData = await tokenRes.json();

        if (bookingRes.ok && bookingData.booking) {
          setBooking(bookingData.booking);
        }
        if (tokenRes.ok && tokenData.tokens) {
          setTokenInfo(tokenData.tokens);
        }
      } catch (err) {
        setError('Error fetching data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, router, bookingId]);

  const handleCancelBooking = async () => {
    if (!booking || !tokenInfo) return;

    if (!reason.trim()) {
      setError('Please provide a cancellation reason');
      return;
    }

    setCancelling(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          reason
        })
      });

      const data = await response.json();
      if (response.ok) {
        router.push(`/cancellation/confirmed?booking_id=${bookingId}`);
      } else {
        setError(data.error || 'Failed to cancel booking');
      }
    } catch (err) {
      setError('Error cancelling booking');
      console.error(err);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (!booking || !tokenInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <Alert variant="destructive">
                <AlertDescription>{error || 'Booking not found'}</AlertDescription>
              </Alert>
              <Button onClick={() => router.push('/customer/dashboard')} className="mt-4">
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const tokenPenalty = getCancellationPenalty(tokenInfo.consecutive_cancellations);
  const minutesToService = booking.scheduled_at 
    ? Math.max(0, (new Date(booking.scheduled_at).getTime() - Date.now()) / 60000)
    : 999;
  const refundPercentage = getRefundPercentage(booking.status, minutesToService);
  const refundAmount = Math.round(booking.base_cost * (refundPercentage / 100));

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-slate-100 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Warning Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-red-700 mb-2">Cancel Booking</h1>
          <p className="text-gray-600">You are about to cancel this booking. Please review the penalties below.</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Booking Details */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500">SERVICE</p>
                <p className="text-lg font-semibold">{booking.service_name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">SHOP</p>
                <p className="text-lg font-semibold">{booking.shop_name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">STATUS</p>
                <Badge className="mt-1">{booking.status}</Badge>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">BOOKING COST</p>
                <p className="text-lg font-semibold">₹{booking.base_cost}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Token Penalty Info */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Cancellation Penalty</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-4 rounded space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Your Cancellation Tokens</span>
                <Badge className="bg-blue-100 text-blue-800 text-lg py-1 px-3">
                  {tokenInfo.tokens_available} Available
                </Badge>
              </div>

              <div className="border-t pt-3">
                <p className="text-sm mb-2"><span className="font-semibold">Tokens Deducted:</span> {tokenPenalty}</p>
                <p className="text-xs text-gray-600">
                  {tokenInfo.consecutive_cancellations === 0
                    ? '✓ First cancellation: 1 token penalty'
                    : '⚠ Repeated cancellation: 2 token penalty for each subsequent cancellation'}
                </p>
              </div>

              {tokenInfo.tokens_available < tokenPenalty && (
                <Alert variant="destructive">
                  <AlertDescription>
                    You don't have enough tokens. You need {tokenPenalty - tokenInfo.tokens_available} more token(s).
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Refund Information */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-700">Refund Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-semibold">Refund Amount:</span> {refundPercentage}% = <span className="text-2xl font-bold text-green-600">₹{refundAmount}</span>
              </p>
              <p className="text-xs text-gray-600">
                {refundPercentage === 100 && 'Full refund - cancellation before service window'}
                {refundPercentage === 75 && 'Full refund - cancellation >1 hour before service'}
                {refundPercentage === 50 && 'Partial refund - cancellation within 30 minutes or service started'}
                {refundPercentage === 0 && 'No refund - service has already started'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Cancellation Reason */}
        <Card>
          <CardHeader>
            <CardTitle>Cancellation Reason</CardTitle>
            <CardDescription>Help us improve by telling us why you're cancelling</CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain why you need to cancel this booking..."
              className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-24"
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={cancelling}
            className="flex-1"
          >
            Keep Booking
          </Button>
          <Button
            onClick={handleCancelBooking}
            disabled={cancelling || tokenInfo.tokens_available < tokenPenalty || !reason.trim()}
            variant="destructive"
            className="flex-1"
          >
            {cancelling ? 'Cancelling...' : `Confirm Cancellation (-${tokenPenalty} Token)`}
          </Button>
        </div>

        {/* Token Policy Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-700 text-lg">About Cancellation Tokens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>💎 You start with 3 free cancellation tokens per month</p>
            <p>1️⃣ First cancellation costs 1 token</p>
            <p>2️⃣ Repeated cancellations cost 2 tokens each</p>
            <p>🔄 Tokens reset at the beginning of each calendar month</p>
            <p>💰 Refund amounts depend on booking status and timing</p>
            <Button
              variant="ghost"
              className="mt-2 h-auto p-0 text-blue-600 hover:text-blue-700"
              onClick={() => router.push('/cancellation/policy')}
            >
              Learn more →
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CancelBooking() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CancelBookingContent />
    </Suspense>
  );
}
