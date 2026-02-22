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

interface ExtraService {
  service_id: string;
  service_name: string;
  cost: number;
  estimated_time: number;
}

interface ServiceProgress {
  booking_id: string;
  customer_name: string;
  service_name: string;
  base_cost: number;
  started_at: string;
  estimated_completion_time: string;
  elapsed_minutes: number;
  available_extra_services: ExtraService[];
}

export default function ServiceProgress() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking_id');

  const [service, setService] = useState<ServiceProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [completing, setCompleting] = useState(false);
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

    const fetchProgress = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`/api/bookings/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok && data.booking) {
          setService(data.booking);
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

    fetchProgress();
    const interval = setInterval(fetchProgress, 10000);
    return () => clearInterval(interval);
  }, [user, router, bookingId]);

  const handleAddExtraServices = async () => {
    if (selectedExtras.length === 0) {
      setError('Select at least one extra service');
      return;
    }

    setAdding(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/bookings/${bookingId}/extra-services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          extra_services: selectedExtras,
          notes
        })
      });

      const data = await response.json();
      if (response.ok) {
        setSelectedExtras([]);
        setNotes('');
        alert(`Added ${selectedExtras.length} extra service(s)`);
      } else {
        setError(data.error || 'Failed to add extra services');
      }
    } catch (err) {
      setError('Error adding extra services');
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const handleCompleteService = async () => {
    if (!service) return;

    setCompleting(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/bookings/${bookingId}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          completed_at: new Date().toISOString(),
          notes
        })
      });

      const data = await response.json();
      if (response.ok) {
        router.push(`/service/complete?booking_id=${bookingId}`);
      } else {
        setError(data.error || 'Failed to complete service');
      }
    } catch (err) {
      setError('Error completing service');
      console.error(err);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
        <div className="max-w-4xl mx-auto">
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

  const totalExtraCost = service.available_extra_services
    .filter(s => selectedExtras.includes(s.service_id))
    .reduce((sum, s) => sum + s.cost, 0);

  const totalCost = service.base_cost + totalExtraCost;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Service in Progress</CardTitle>
            <CardDescription>Booking ID: {bookingId}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Customer</p>
                <p className="text-xl font-semibold">{service.customer_name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Elapsed Time</p>
                <p className="text-2xl font-bold text-orange-600">{service.elapsed_minutes}m</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Service Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Service Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500">SERVICE</p>
                <p className="text-lg font-semibold">{service.service_name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">BASE COST</p>
                <p className="text-lg font-semibold">₹{service.base_cost}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Extra Services */}
        {service.available_extra_services.length > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-xl">Additional Services Available</CardTitle>
              <CardDescription>Discovered during inspection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                {service.available_extra_services.map(extra => (
                  <div key={extra.service_id} className="flex items-center gap-3 p-3 bg-white rounded border">
                    <input
                      type="checkbox"
                      id={extra.service_id}
                      checked={selectedExtras.includes(extra.service_id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedExtras([...selectedExtras, extra.service_id]);
                        } else {
                          setSelectedExtras(selectedExtras.filter(id => id !== extra.service_id));
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <label htmlFor={extra.service_id} className="font-semibold cursor-pointer">
                        {extra.service_name}
                      </label>
                      <p className="text-sm text-gray-600">~{extra.estimated_time} min</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">+₹{extra.cost}</p>
                    </div>
                  </div>
                ))}
              </div>

              {selectedExtras.length > 0 && (
                <Button
                  onClick={handleAddExtraServices}
                  disabled={adding}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {adding ? 'Adding...' : `Add Selected (₹${totalExtraCost})`}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Work Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Work Notes</CardTitle>
            <CardDescription>Add any observations or additional work done</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., 'Found oil leak, also cleaned air filter...'"
              className="min-h-24"
            />
          </CardContent>
        </Card>

        {/* Cost Breakdown */}
        <Card className="bg-gradient-to-br from-slate-50 to-gray-100">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Base Service Cost</span>
                <span className="font-semibold">₹{service.base_cost}</span>
              </div>
              {totalExtraCost > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span>Extra Services</span>
                  <span className="font-semibold">+₹{totalExtraCost}</span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between text-lg">
                <span className="font-semibold">Total Due</span>
                <span className="font-bold text-green-600">₹{totalCost}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        <Button
          onClick={handleCompleteService}
          disabled={completing}
          className="w-full h-12 text-lg bg-green-600 hover:bg-green-700"
        >
          {completing ? 'Completing...' : '✓ Service Complete'}
        </Button>
      </div>
    </div>
  );
}
