'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';

interface BookingTracking {
  booking_id: string;
  status: 'pending' | 'confirmed' | 'assigned' | 'started' | 'completed' | 'cancelled';
  bike_model: string;
  shop_name: string;
  service_name: string;
  estimated_time: number;
  base_cost: number;
  assigned_worker?: {
    worker_id: string;
    worker_name: string;
    rating: number;
    phone: string;
    latitude?: number;
    longitude?: number;
  };
  created_at: string;
  started_at?: string;
  completed_at?: string;
  progress_percentage: number;
}

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-gray-500', icon: '⏳' },
  confirmed: { label: 'Confirmed', color: 'bg-blue-500', icon: '✓' },
  assigned: { label: 'Worker Assigned', color: 'bg-purple-500', icon: '👷' },
  started: { label: 'In Progress', color: 'bg-orange-500', icon: '🔧' },
  completed: { label: 'Completed', color: 'bg-green-500', icon: '✓' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500', icon: '✗' }
};

function TrackBookingContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking_id');

  const [booking, setBooking] = useState<BookingTracking | null>(null);
  const [loading, setLoading] = useState(true);
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

    const fetchBookingStatus = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`/api/bookings/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok && data.booking) {
          setBooking(data.booking);
        } else {
          setError(data.error || 'Failed to fetch booking');
        }
      } catch (err) {
        setError('Error fetching booking status');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    // Fetch immediately and then every 5 seconds
    fetchBookingStatus();
    const interval = setInterval(fetchBookingStatus, 5000);

    return () => clearInterval(interval);
  }, [user, router, bookingId]);

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

  const config = statusConfig[booking.status];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header with Status */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl">Your Service</CardTitle>
                <CardDescription>Booking ID: {bookingId}</CardDescription>
              </div>
              <Badge className={`${config.color} text-white text-lg py-2 px-4`}>
                {config.icon} {config.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-semibold">Progress</span>
                <span>{booking.progress_percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${config.color} transition-all duration-300`}
                  style={{ width: `${booking.progress_percentage}%` }}
                ></div>
              </div>
            </div>

            {/* Service Details */}
            <div className="grid grid-cols-2 gap-4 border-t pt-4">
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

        {/* Assigned Worker Card */}
        {booking.assigned_worker && (
          <Card className="bg-purple-50 border-purple-200">
            <CardHeader>
              <CardTitle>Your Assigned Worker</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-lg font-semibold">{booking.assigned_worker.worker_name}</p>
                  <p className="text-sm text-gray-600">📱 {booking.assigned_worker.phone}</p>
                </div>
                <Badge variant="secondary" className="text-base py-1">
                  ⭐ {booking.assigned_worker.rating.toFixed(1)}
                </Badge>
              </div>
              
              {booking.assigned_worker.latitude && booking.assigned_worker.longitude && (
                <div className="bg-white p-3 rounded border border-purple-200">
                  <p className="text-xs text-gray-600 mb-2">📍 Location</p>
                  <p className="text-sm font-mono">
                    {booking.assigned_worker.latitude.toFixed(4)}, {booking.assigned_worker.longitude.toFixed(4)}
                  </p>
                </div>
              )}

              {booking.status === 'started' && (
                <button
                  onClick={() => {
                    if (booking.assigned_worker?.phone) {
                      window.location.href = `tel:${booking.assigned_worker.phone}`;
                    }
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition"
                >
                  📞 Call Worker
                </button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-4">
              {booking.created_at && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                    <div className="w-0.5 h-8 bg-gray-300"></div>
                  </div>
                  <div className="pb-4">
                    <p className="font-semibold">Booking Created</p>
                    <p className="text-sm text-gray-600">
                      {new Date(booking.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
              {booking.started_at && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                    <div className="w-0.5 h-8 bg-gray-300"></div>
                  </div>
                  <div className="pb-4">
                    <p className="font-semibold">Service Started</p>
                    <p className="text-sm text-gray-600">
                      {new Date(booking.started_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
              {booking.completed_at && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-semibold">Service Completed</p>
                    <p className="text-sm text-gray-600">
                      {new Date(booking.completed_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/customer/dashboard')}
            className="flex-1"
          >
            Back to Dashboard
          </Button>
          {booking.status !== 'completed' && booking.status !== 'cancelled' && (
            <Button
              variant="destructive"
              className="flex-1"
              disabled
            >
              Cancel Booking
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TrackBooking() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TrackBookingContent />
    </Suspense>
  );
}
