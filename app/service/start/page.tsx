'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';

interface ServiceStartData {
  booking_id: string;
  customer_phone: string;
  customer_name: string;
  bike_model: string;
  bike_license_plate: string;
  service_name: string;
  estimated_time: number;
  base_cost: number;
  shop_name: string;
}

export default function StartService() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking_id');

  const [booking, setBooking] = useState<ServiceStartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'worker') {
      router.push('/sign-in');
      return;
    }

    if (!bookingId) {
      router.push('/worker/dashboard');
      return;
    }

    const fetchServiceDetails = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`/api/bookings/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok && data.booking) {
          setBooking(data.booking);
        } else {
          setError(data.error || 'Failed to fetch service details');
        }
      } catch (err) {
        setError('Error fetching service details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchServiceDetails();
  }, [user, router, bookingId]);

  const handleStartService = async () => {
    if (!booking) return;

    setStarting(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/bookings/${bookingId}/start`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          worker_id: user?.id,
          started_at: new Date().toISOString()
        })
      });

      const data = await response.json();
      if (response.ok) {
        router.push(`/service/progress?booking_id=${bookingId}`);
      } else {
        setError(data.error || 'Failed to start service');
      }
    } catch (err) {
      setError('Error starting service');
      console.error(err);
    } finally {
      setStarting(false);
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
                <AlertDescription>{error || 'Service not found'}</AlertDescription>
              </Alert>
              <Button onClick={() => router.push('/worker/dashboard')} className="mt-4">
                Back to Dashboard
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
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Start Service</CardTitle>
            <CardDescription>Booking ID: {bookingId}</CardDescription>
          </CardHeader>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Customer Details */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500">NAME</p>
                <p className="text-lg font-semibold">{booking.customer_name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">PHONE</p>
                <p className="text-lg font-semibold">{booking.customer_phone}</p>
              </div>
            </div>
            <button
              onClick={() => window.location.href = `tel:${booking.customer_phone}`}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition"
            >
              📞 Call Customer
            </button>
          </CardContent>
        </Card>

        {/* Bike Details */}
        <Card>
          <CardHeader>
            <CardTitle>Bike Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500">MODEL</p>
                <p className="text-lg font-semibold">{booking.bike_model}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">LICENSE PLATE</p>
                <p className="text-lg font-semibold">{booking.bike_license_plate}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Details */}
        <Card>
          <CardHeader>
            <CardTitle>Service Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-500">SERVICE</p>
              <p className="text-lg font-semibold">{booking.service_name}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500">EST. TIME</p>
                <p className="text-lg font-semibold">{booking.estimated_time} min</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">BASE CHARGE</p>
                <p className="text-lg font-semibold">₹{booking.base_cost}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Checklist */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle>Before Starting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="flex items-center gap-2">
              <span className="text-lg">✓</span> Verify bike license plate matches
            </p>
            <p className="flex items-center gap-2">
              <span className="text-lg">✓</span> Check bike condition (note any existing damage)
            </p>
            <p className="flex items-center gap-2">
              <span className="text-lg">✓</span> Confirm service details with customer
            </p>
            <p className="flex items-center gap-2">
              <span className="text-lg">✓</span> Have customer sign off on baseline condition
            </p>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={starting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleStartService}
            disabled={starting}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {starting ? 'Starting...' : '▶ Start Service'}
          </Button>
        </div>
      </div>
    </div>
  );
}
