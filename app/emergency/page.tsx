'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';

interface EmergencyData {
  booking_id: string;
  customer_name: string;
  service_name: string;
  shop_name: string;
  assigned_worker_id: string;
  assigned_worker_name: string;
}

function WorkerEmergencyContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking_id');

  const [emergency, setEmergency] = useState<EmergencyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState('');
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

    const fetchEmergencyData = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`/api/bookings/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok && data.booking) {
          setEmergency(data.booking);
        } else {
          setError(data.error || 'Failed to fetch booking');
        }
      } catch (err) {
        setError('Error fetching booking');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmergencyData();
  }, [user, router, bookingId]);

  const handleSubmitEmergency = async () => {
    if (!reason.trim()) {
      setError('Please describe the emergency');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/worker/emergency`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          booking_id: bookingId,
          emergency_reason: reason,
          worker_id: user?.id
        })
      });

      const data = await response.json();
      if (response.ok) {
        router.push(`/booking/reassign?booking_id=${bookingId}`);
      } else {
        setError(data.error || 'Failed to report emergency');
      }
    } catch (err) {
      setError('Error reporting emergency');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (!emergency) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <Alert variant="destructive">
                <AlertDescription>{error || 'Booking not found'}</AlertDescription>
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
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-slate-100 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Emergency Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-red-700">Report Emergency</h1>
          <p className="text-gray-600">Important: This will trigger immediate worker reassignment</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Booking Details */}
        <Card>
          <CardHeader>
            <CardTitle>Current Booking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500">CUSTOMER</p>
                <p className="text-lg font-semibold">{emergency.customer_name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">SERVICE</p>
                <p className="text-lg font-semibold">{emergency.service_name}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-semibold text-gray-500">SHOP</p>
                <p className="text-lg font-semibold">{emergency.shop_name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warning Card */}
        <Card className="bg-red-50 border-red-300">
          <CardHeader>
            <CardTitle className="text-red-700">⚠️ Important</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>By reporting an emergency:</p>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>Your booking will be reassigned to another worker</li>
              <li>The customer will be notified immediately</li>
              <li>Your emergency will be noted in your record</li>
              <li>A shop manager will follow up with you</li>
            </ul>
          </CardContent>
        </Card>

        {/* Emergency Reason Form */}
        <Card>
          <CardHeader>
            <CardTitle>What's the Emergency?</CardTitle>
            <CardDescription>Please be as specific as possible</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe what happened and why you need to cancel this booking..."
              className="min-h-32"
            />
            <p className="text-xs text-gray-500 mt-2">
              Examples: Bike broke down on the way, Personal emergency at home, Feeling unwell, etc.
            </p>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={submitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmitEmergency}
            disabled={submitting || !reason.trim()}
            variant="destructive"
            className="flex-1"
          >
            {submitting ? 'Reporting...' : 'Report Emergency'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function WorkerEmergency() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WorkerEmergencyContent />
    </Suspense>
  );
}
