'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';

interface Bike {
  id: string;
  model: string;
  license_plate: string;
  year: number;
}

interface Shop {
  shop_id: string;
  shop_name: string;
  location: string;
  distance?: number;
}

interface Service {
  service_id: string;
  service_name: string;
  service_type: string;
  estimated_time: number;
  base_cost: number;
}

export default function CreateBooking() {
  const { user } = useAuth();
  const router = useRouter();
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [selectedBike, setSelectedBike] = useState('');
  const [selectedShop, setSelectedShop] = useState('');
  const [shops, setShops] = useState<Shop[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'customer') {
      router.push('/sign-in');
      return;
    }

    const fetchBikes = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/customer/bikes', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok && data.bikes) {
          setBikes(data.bikes);
        }
      } catch (err) {
        console.error('Error fetching bikes:', err);
      }
    };

    const fetchShops = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/shops?status=active&limit=20', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok && data.shops) {
          setShops(data.shops);
        }
      } catch (err) {
        console.error('Error fetching shops:', err);
      }
    };

    Promise.all([fetchBikes(), fetchShops()]).finally(() => setLoading(false));
  }, [user, router]);

  useEffect(() => {
    if (!selectedShop) {
      setServices([]);
      return;
    }

    const fetchServices = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`/api/shops/${selectedShop}/services`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok && data.services) {
          setServices(data.services);
        }
      } catch (err) {
        console.error('Error fetching services:', err);
      }
    };

    fetchServices();
  }, [selectedShop]);

  const handleCreateBooking = async () => {
    if (!selectedBike || !selectedShop || !selectedService) {
      setError('Please select bike, shop, and service');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          bike_id: selectedBike,
          shop_id: selectedShop,
          service_id: selectedService,
          customer_id: user?.id
        })
      });

      const data = await response.json();
      if (response.ok && data.booking_id) {
        router.push(`/booking/confirm?booking_id=${data.booking_id}`);
      } else {
        setError(data.error || 'Failed to create booking');
      }
    } catch (err) {
      setError('Error creating booking');
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Book a Service</CardTitle>
            <CardDescription>Select your bike, shop, and desired service</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Bike Selection */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Select Your Bike</label>
              {bikes.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No bikes found. Please add a bike in your profile first.
                  </AlertDescription>
                </Alert>
              ) : (
                <Select value={selectedBike} onValueChange={setSelectedBike}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a bike" />
                  </SelectTrigger>
                  <SelectContent>
                    {bikes.map(bike => (
                      <SelectItem key={bike.id} value={bike.id}>
                        {bike.model} ({bike.license_plate}) - {bike.year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Shop Selection */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Select a Shop</label>
              {shops.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No shops available. Please try again later.
                  </AlertDescription>
                </Alert>
              ) : (
                <Select value={selectedShop} onValueChange={setSelectedShop}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a shop" />
                  </SelectTrigger>
                  <SelectContent>
                    {shops.map(shop => (
                      <SelectItem key={shop.shop_id} value={shop.shop_id}>
                        {shop.shop_name} - {shop.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Service Selection */}
            {selectedShop && services.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-semibold">Select a Service</label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map(service => (
                      <SelectItem key={service.service_id} value={service.service_id}>
                        {service.service_name} (~{service.estimated_time}min, ₹{service.base_cost})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Booking Summary */}
            {selectedBike && selectedShop && selectedService && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="space-y-2 text-sm">
                    <p><span className="font-semibold">Bike:</span> {bikes.find(b => b.id === selectedBike)?.model}</p>
                    <p><span className="font-semibold">Shop:</span> {shops.find(s => s.shop_id === selectedShop)?.shop_name}</p>
                    <p><span className="font-semibold">Service:</span> {services.find(s => s.service_id === selectedService)?.service_name}</p>
                    <p><span className="font-semibold">Est. Time:</span> {services.find(s => s.service_id === selectedService)?.estimated_time} minutes</p>
                    <p className="text-lg font-bold text-blue-700">
                      Cost: ₹{services.find(s => s.service_id === selectedService)?.base_cost}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateBooking}
                disabled={submitting || !selectedBike || !selectedShop || !selectedService}
                className="flex-1"
              >
                {submitting ? 'Creating...' : 'Continue to Confirmation'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
