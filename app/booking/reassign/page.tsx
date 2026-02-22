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

interface ReassignmentData {
  booking_id: string;
  customer_name: string;
  customer_phone: string;
  service_name: string;
  shop_name: string;
  previous_worker: {
    worker_id: string;
    worker_name: string;
    reason_unavailable: string;
  } | null;
  new_worker?: {
    worker_id: string;
    worker_name: string;
    rating: number;
    phone: string;
    response_time_minutes: number;
  } | null;
  status_message: string;
  estimated_arrival_minutes?: number;
}

export default function ReassignWorker() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking_id');

  const [reassignment, setReassignment] = useState<ReassignmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/sign-in');
      return;
    }

    if (!bookingId) {
      router.push('/customer/dashboard');
      return;
    }

    const fetchReassignment = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`/api/bookings/${bookingId}/reassign`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok && data.reassignment) {
          setReassignment(data.reassignment);
        } else {
          setError(data.error || 'Failed to fetch reassignment data');
        }
      } catch (err) {
        setError('Error fetching reassignment data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReassignment();
  }, [user, router, bookingId]);

  const handleConfirmReassignment = async () => {
    if (!reassignment || !reassignment.new_worker) return;

    setConfirming(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/bookings/${bookingId}/reassign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          new_worker_id: reassignment.new_worker.worker_id
        })
      });

      const data = await response.json();
      if (response.ok) {
        router.push(`/booking/track?booking_id=${bookingId}`);
      } else {
        setError(data.error || 'Failed to confirm reassignment');
      }
    } catch (err) {
      setError('Error confirming reassignment');
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

  if (!reassignment) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <Alert variant="destructive">
                <AlertDescription>{error || 'Reassignment data not found'}</AlertDescription>
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-slate-100 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Alert Header */}
        <Alert className="border-orange-300 bg-orange-100">
          <AlertDescription className="text-orange-900">
            ⚠️ Your assigned worker is temporarily unavailable. We're assigning you a replacement worker.
          </AlertDescription>
        </Alert>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Booking Info */}
        <Card>
          <CardHeader>
            <CardTitle>Service Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500">SERVICE</p>
                <p className="text-lg font-semibold">{reassignment.service_name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">SHOP</p>
                <p className="text-lg font-semibold">{reassignment.shop_name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Previous Worker Info (if applicable) */}
        {reassignment.previous_worker && (
          <Card className="bg-red-50 border-red-200">
            <CardHeader>
              <CardTitle className="text-red-700">Previous Worker</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm"><span className="font-semibold">Name:</span> {reassignment.previous_worker.worker_name}</p>
                <p className="text-sm"><span className="font-semibold">Reason:</span> {reassignment.previous_worker.reason_unavailable}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* New Worker Assignment */}
        {reassignment.new_worker ? (
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-700">New Worker Assigned</CardTitle>
              <CardDescription>We found an excellent replacement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-lg font-semibold">{reassignment.new_worker.worker_name}</p>
                  <p className="text-sm text-gray-600">📱 {reassignment.new_worker.phone}</p>
                </div>
                <Badge className="bg-green-600 text-lg py-1 px-3">
                  ⭐ {reassignment.new_worker.rating.toFixed(1)}
                </Badge>
              </div>

              <div className="bg-white p-3 rounded space-y-2">
                <p className="text-sm">
                  <span className="font-semibold">Experience:</span> Similar rating and expertise
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Response Time:</span> ~{reassignment.new_worker.response_time_minutes} minutes
                </p>
                {reassignment.estimated_arrival_minutes && (
                  <p className="text-sm text-green-600 font-semibold">
                    ✓ Will arrive in ~{reassignment.estimated_arrival_minutes} minutes
                  </p>
                )}
              </div>

              <button
                onClick={() => {
                  if (reassignment.new_worker?.phone) {
                    window.location.href = `tel:${reassignment.new_worker.phone}`;
                  }
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition"
              >
                📞 Contact New Worker
              </button>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader>
              <CardTitle className="text-yellow-700">Searching for Replacement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Spinner />
                <p className="text-sm">Finding the best available worker...</p>
              </div>
              <p className="text-xs text-gray-600">This may take a few moments</p>
            </CardContent>
          </Card>
        )}

        {/* Status Message */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-700">{reassignment.status_message}</p>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {reassignment.new_worker && (
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => router.push(`/booking/track?booking_id=${bookingId}`)}
              disabled={confirming}
              className="flex-1"
            >
              Skip
            </Button>
            <Button
              onClick={handleConfirmReassignment}
              disabled={confirming}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {confirming ? 'Confirming...' : 'Confirm Assignment'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
