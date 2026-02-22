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

interface CompletionData {
  booking_id: string;
  invoice_id: string;
  customer_name: string;
  service_name: string;
  base_cost: number;
  extra_charges: number;
  total_amount: number;
  payment_status: 'pending' | 'paid';
  completed_at: string;
  service_duration_minutes: number;
}

export default function ServiceComplete() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking_id');

  const [completion, setCompletion] = useState<CompletionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || (user.role !== 'worker' && user.role !== 'customer')) {
      router.push('/sign-in');
      return;
    }

    if (!bookingId) {
      router.push(`/${user?.role}/dashboard`);
      return;
    }

    const fetchCompletion = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`/api/bookings/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok && data.booking) {
          setCompletion(data.booking);
        } else {
          setError(data.error || 'Failed to fetch completion details');
        }
      } catch (err) {
        setError('Error fetching completion details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletion();
  }, [user, router, bookingId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (!completion) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <Alert variant="destructive">
                <AlertDescription>{error || 'Service data not found'}</AlertDescription>
              </Alert>
              <Button onClick={() => router.push(`/${user?.role}/dashboard`)} className="mt-4">
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-slate-100 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Success Header */}
        <div className="text-center space-y-3">
          <div className="text-6xl animate-bounce">✅</div>
          <h1 className="text-3xl font-bold">Service Completed!</h1>
          <p className="text-gray-600">Thank you for your excellent service</p>
        </div>

        {/* Service Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Service Summary</CardTitle>
            <CardDescription>Booking ID: {bookingId}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500">CUSTOMER</p>
                <p className="text-lg font-semibold">{completion.customer_name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">SERVICE</p>
                <p className="text-lg font-semibold">{completion.service_name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">DURATION</p>
                <p className="text-lg font-semibold">{completion.service_duration_minutes} minutes</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">COMPLETED</p>
                <p className="text-lg font-semibold">
                  {new Date(completion.completed_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Preview */}
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Invoice Details</CardTitle>
                <CardDescription>Invoice ID: {completion.invoice_id}</CardDescription>
              </div>
              <Badge variant={completion.payment_status === 'paid' ? 'default' : 'secondary'}>
                {completion.payment_status === 'paid' ? '✓ Paid' : 'Pending Payment'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 bg-white p-4 rounded">
              <div className="flex justify-between">
                <span>Base Service Cost</span>
                <span className="font-semibold">₹{completion.base_cost}</span>
              </div>
              {completion.extra_charges > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span>Extra Services</span>
                  <span className="font-semibold">+₹{completion.extra_charges}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between text-lg">
                <span className="font-semibold">Total Amount</span>
                <span className="font-bold text-green-600">₹{completion.total_amount}</span>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white p-4 rounded space-y-2 text-sm">
              <p><span className="font-semibold">Payment Method:</span> UPI / Card</p>
              <p><span className="font-semibold">Platform Commission:</span> ₹{Math.round(completion.total_amount * 0.30)}</p>
              <p><span className="font-semibold">Shop Commission:</span> ₹{Math.round(completion.total_amount * 0.70)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={() => window.open(`/invoice?booking_id=${bookingId}`, '_blank')}
            className="h-12"
          >
            📄 View Invoice
          </Button>
          <Button
            onClick={() => router.push(`/${user?.role}/dashboard`)}
            className="h-12 bg-blue-600 hover:bg-blue-700"
          >
            Back to Dashboard
          </Button>
        </div>

        {/* Feedback Prompt (Customer Only) */}
        {user?.role === 'customer' && (
          <Card className="bg-purple-50 border-purple-200">
            <CardHeader>
              <CardTitle>Help Us Improve</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">Your feedback helps us maintain service quality</p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/feedback?booking_id=${bookingId}`)}
              >
                ⭐ Rate Your Experience
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
