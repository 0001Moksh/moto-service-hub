'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';

interface WorkerStatus {
  worker_id: string;
  worker_name: string;
  is_available: boolean;
  unavailable_reason?: string;
  active_bookings_count: number;
  rating: number;
  phone: string;
}

export default function WorkerStatus() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [status, setStatus] = useState<WorkerStatus | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'worker') {
      router.push('/sign-in');
      return;
    }

    const fetchStatus = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/worker/status', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok && data.worker) {
          setStatus(data.worker);
          setIsAvailable(data.worker.is_available);
          setReason(data.worker.unavailable_reason || '');
        } else {
          setError(data.error || 'Failed to fetch status');
        }
      } catch (err) {
        setError('Error fetching worker status');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [user, router]);

  const handleStatusChange = async (newAvailable: boolean) => {
    if (!newAvailable && !reason.trim()) {
      setError('Please provide a reason for unavailability');
      return;
    }

    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/worker/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          is_available: newAvailable,
          unavailable_reason: newAvailable ? null : reason
        })
      });

      const data = await response.json();
      if (response.ok) {
        setIsAvailable(newAvailable);
        setSuccess(
          newAvailable
            ? 'You are now available for bookings'
            : 'You are now unavailable. We will reassign your pending bookings.'
        );
        
        // Reset reason after marking available
        if (newAvailable) {
          setReason('');
        }
      } else {
        setError(data.error || 'Failed to update status');
      }
    } catch (err) {
      setError('Error updating status');
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (!status) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <Alert variant="destructive">
                <AlertDescription>{error || 'Worker status not found'}</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-slate-100 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">My Availability</h1>
          <p className="text-gray-600">Manage your working status and availability</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-300 bg-green-100">
            <AlertDescription className="text-green-900">✓ {success}</AlertDescription>
          </Alert>
        )}

        {/* Current Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Current Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-lg font-semibold">{status.worker_name}</p>
                <p className="text-sm text-gray-600">📱 {status.phone}</p>
              </div>
              <Badge
                className={`text-lg py-2 px-4 ${
                  isAvailable
                    ? 'bg-green-600 text-white'
                    : 'bg-red-600 text-white'
                }`}
              >
                {isAvailable ? '✓ Available' : '✗ Unavailable'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-xs font-semibold text-gray-500">RATING</p>
                <p className="text-2xl font-bold">⭐ {status.rating.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">ACTIVE BOOKINGS</p>
                <p className="text-2xl font-bold">{status.active_bookings_count}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Availability Toggle */}
        <Card>
          <CardHeader>
            <CardTitle>Availability Settings</CardTitle>
            <CardDescription>
              {isAvailable
                ? 'You are currently accepting new bookings'
                : 'You are not accepting new bookings'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg">
              <div>
                <p className="font-semibold">Available for Bookings</p>
                <p className="text-sm text-gray-600">
                  {isAvailable
                    ? 'You will receive new booking requests'
                    : 'You will not receive new booking requests'}
                </p>
              </div>
              <Switch
                checked={isAvailable}
                onCheckedChange={handleStatusChange}
                disabled={updating}
              />
            </div>

            {!isAvailable && (
              <div className="space-y-2 p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm font-semibold text-red-700">Reason for Unavailability</p>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="E.g., Bike broke down, Personal emergency, Feeling unwell..."
                  className="min-h-24"
                  disabled={updating}
                />
                <p className="text-xs text-gray-600">
                  This helps customers and shop managers understand your situation
                </p>
              </div>
            )}

            {isAvailable && !updating && status.unavailable_reason && (
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-sm">
                  <span className="font-semibold">Previous reason:</span>{' '}
                  {status.unavailable_reason}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Important Notes */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-900">⚠️ Important</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-yellow-900">
            <p>
              • When you mark yourself unavailable, your pending bookings will be automatically
              reassigned to other workers
            </p>
            <p>
              • Customers will be notified of the new worker assignment
            </p>
            <p>
              • Shop managers will be alerted about the reassignments
            </p>
            <p>
              • Please update your status as soon as you're available again
            </p>
          </CardContent>
        </Card>

        {/* Action Button */}
        <Button
          onClick={() => router.push('/worker/dashboard')}
          variant="outline"
          className="w-full"
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
