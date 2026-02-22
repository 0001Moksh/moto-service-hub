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

interface Worker {
  worker_id: string;
  worker_name: string;
  rating: number;
  total_jobs: number;
  response_time_minutes: number;
}

interface BookingDetails {
  booking_id: string;
  bike_model: string;
  shop_name: string;
  service_name: string;
  estimated_time: number;
  base_cost: number;
  status: string;
  available_worker?: Worker;
}

export default function ConfirmBooking() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking_id');

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'customer') {
      router.push('/sign-in');
      return;
    }

    if (!bookingId) {
      router.push('/booking/create');
      return;
    }

    const fetchBookingDetails = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`/api/bookings/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok && data.booking) {
          setBooking(data.booking);
        } else {
          setError(data.error || 'Failed to fetch booking details');
        }
      } catch (err) {
        setError('Error fetching booking details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [user, router, bookingId]);

  const handleConfirmBooking = async () => {
    if (!booking) return;

    setConfirming(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      
      // Confirm booking
      const confirmResponse = await fetch('/api/bookings/confirm', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ booking_id: bookingId })
      });

      const confirmData = await confirmResponse.json();
      if (!confirmResponse.ok) {
        setError(confirmData.error || 'Failed to confirm booking');
        return;
      }

      // Auto-assign worker
      const assignResponse = await fetch('/api/bookings/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ booking_id: bookingId })
      });

      const assignData = await assignResponse.json();
      if (assignResponse.ok) {
        router.push(`/booking/track?booking_id=${bookingId}`);
      } else {
        setError(assignData.error || 'Failed to assign worker');
      }
    } catch (err) {
      setError('Error processing booking');
      console.error(err);
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <Alert variant="destructive">
                <AlertDescription>{error || 'Booking not found'}</AlertDescription>
              </Alert>
              <Button onClick={() => router.push('/booking/create')} className="mt-4">
                Create New Booking
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Booking Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Booking Confirmation</CardTitle>
            <CardDescription>Booking ID: {bookingId}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500">BIKE</p>
                <p className="text-lg font-semibold">{booking.bike_model}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">SHOP</p>
                <p className="text-lg font-semibold">{booking.shop_name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">SERVICE</p>
                <p className="text-lg font-semibold">{booking.service_name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">EST. TIME</p>
                <p className="text-lg font-semibold">{booking.estimated_time} min</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg">Total Cost</span>
                <span className="text-3xl font-bold text-blue-600">₹{booking.base_cost}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Worker Preview */}
        {booking.available_worker && (
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-xl">Assigned Worker</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-lg font-semibold">{booking.available_worker.worker_name}</p>
                  <p className="text-sm text-gray-600">Response time: ~{booking.available_worker.response_time_minutes} min</p>
                </div>
                <Badge variant="secondary" className="text-base py-1">
                  ⭐ {booking.available_worker.rating.toFixed(1)}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                {booking.available_worker.total_jobs} completed jobs
              </p>
            </CardContent>
          </Card>
        )}

        {/* Terms & Conditions */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="space-y-3 text-sm">
              <p>
                <span className="font-semibold">✓</span> You can track the worker's location in real-time
              </p>
              <p>
                <span className="font-semibold">✓</span> You will receive SMS/email notifications
              </p>
              <p>
                <span className="font-semibold">✓</span> Service starts within estimated time
              </p>
              <p>
                <span className="font-semibold text-red-600">⚠</span> Cancelling after confirmation may incur charges
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={confirming}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            onClick={handleConfirmBooking}
            disabled={confirming}
            className="flex-1"
          >
            {confirming ? 'Confirming...' : 'Confirm & Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}
