'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';

interface CustomerMetrics {
  total_customers: number;
  new_customers_this_month: number;
  returning_customers: number;
  average_bookings_per_customer: number;
  total_spent_average: number;
  cancellation_rate: number;
  top_customer: {
    name: string;
    total_bookings: number;
    total_spent: number;
  } | null;
}

interface CustomerAnalytics {
  metrics: CustomerMetrics;
  booking_frequency: Array<{ range: string; customers: number }>;
  service_preferences: Array<{ service: string; customers: number; percentage: number }>;
  location_distribution: Array<{ location: string; customers: number; percentage: number }>;
}

export default function CustomerBehavior() {
  const { user } = useAuth();
  const router = useRouter();

  const [analytics, setAnalytics] = useState<CustomerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/sign-in');
      return;
    }

    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`/api/analytics/customer-behavior?range=${timeRange}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok && data.analytics) {
          setAnalytics(data.analytics);
        } else {
          setError(data.error || 'Failed to fetch analytics');
        }
      } catch (err) {
        setError('Error fetching customer behavior');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user, router, timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-slate-100 p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <Alert variant="destructive">
                <AlertDescription>{error || 'Analytics not found'}</AlertDescription>
              </Alert>
              <Button onClick={() => router.back()} className="mt-4">
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { metrics } = analytics;

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Customer Behavior</h1>
            <p className="text-gray-600 mt-1">Customer insights and patterns</p>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            ← Back
          </Button>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              onClick={() => setTimeRange(range)}
            >
              {range === '7d' ? 'Last 7 days' : range === '30d' ? 'Last 30 days' : 'Last 90 days'}
            </Button>
          ))}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Total Customers</p>
              <p className="text-3xl font-bold text-rose-600">{metrics.total_customers}</p>
              <p className="text-xs text-gray-500 mt-1">
                +{metrics.new_customers_this_month} new
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Returning Rate</p>
              <p className="text-3xl font-bold text-blue-600">
                {((metrics.returning_customers / metrics.total_customers) * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {metrics.returning_customers} customers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Avg Bookings</p>
              <p className="text-3xl font-bold text-emerald-600">
                {metrics.average_bookings_per_customer.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500 mt-1">per customer</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Cancellation Rate</p>
              <p className="text-3xl font-bold text-red-600">
                {metrics.cancellation_rate.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">of all bookings</p>
            </CardContent>
          </Card>
        </div>

        {/* Top Customer */}
        {metrics.top_customer && (
          <Card className="bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200">
            <CardHeader>
              <CardTitle className="text-rose-900">⭐ VIP Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-rose-900">
                    {metrics.top_customer.name}
                  </p>
                  <p className="text-sm text-rose-700 mt-2">
                    {metrics.top_customer.total_bookings} total bookings
                  </p>
                </div>
                <div className="text-right">
                  <Badge className="bg-rose-600 text-lg py-2 px-3">
                    ${metrics.top_customer.total_spent.toFixed(2)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Booking Frequency */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Frequency</CardTitle>
            <CardDescription>Customer segmentation by booking frequency</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.booking_frequency.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                  <p className="font-semibold">{item.range}</p>
                  <Badge variant="secondary" className="text-base py-1 px-3">
                    {item.customers} customers
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Service Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Service Preferences</CardTitle>
            <CardDescription>Most demanded services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.service_preferences.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">{item.service}</p>
                    <p className="text-sm text-gray-600">{item.percentage.toFixed(1)}%</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-pink-600 h-2 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{item.customers} customers</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Location Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Geographic Distribution</CardTitle>
            <CardDescription>Customers by location</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.location_distribution.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                  <div className="flex-1">
                    <p className="font-semibold">{item.location}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold">{item.customers}</p>
                    <p className="text-xs text-gray-500">{item.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
