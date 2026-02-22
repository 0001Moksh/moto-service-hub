'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';

interface BookingTrend {
  date: string;
  total_bookings: number;
  completed: number;
  cancelled: number;
  pending: number;
}

interface BookingAnalytics {
  trends: BookingTrend[];
  peak_day: string;
  peak_count: number;
  average_daily: number;
  busiest_hour: number;
  most_popular_service: string;
  most_popular_shop: string;
}

export default function BookingTrends() {
  const { user } = useAuth();
  const router = useRouter();

  const [analytics, setAnalytics] = useState<BookingAnalytics | null>(null);
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
        const response = await fetch(`/api/analytics/booking-trends?range=${timeRange}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok && data.analytics) {
          setAnalytics(data.analytics);
        } else {
          setError(data.error || 'Failed to fetch analytics');
        }
      } catch (err) {
        setError('Error fetching booking trends');
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
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-slate-100 p-6">
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Booking Trends</h1>
            <p className="text-gray-600 mt-1">Historical booking patterns and analysis</p>
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Peak Day</p>
              <p className="text-2xl font-bold text-purple-600">{analytics.peak_day}</p>
              <p className="text-xs text-gray-500 mt-1">{analytics.peak_count} bookings</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Daily Average</p>
              <p className="text-2xl font-bold text-blue-600">{analytics.average_daily}</p>
              <p className="text-xs text-gray-500 mt-1">bookings per day</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Busiest Hour</p>
              <p className="text-2xl font-bold text-orange-600">
                {analytics.busiest_hour}:00
              </p>
              <p className="text-xs text-gray-500 mt-1">Peak booking time</p>
            </CardContent>
          </Card>
        </div>

        {/* Top Items */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Most Popular Service</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className="text-base py-2 px-3">
                {analytics.most_popular_service}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Busiest Shop</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="text-base py-2 px-3">
                {analytics.most_popular_shop}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Trend Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Breakdown</CardTitle>
            <CardDescription>Booking status by day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-2 px-4 font-semibold">Date</th>
                    <th className="text-center py-2 px-4 font-semibold text-blue-600">Total</th>
                    <th className="text-center py-2 px-4 font-semibold text-green-600">✓ Completed</th>
                    <th className="text-center py-2 px-4 font-semibold text-orange-600">⏳ Pending</th>
                    <th className="text-center py-2 px-4 font-semibold text-red-600">✗ Cancelled</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.trends.map((trend, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-50' : ''}>
                      <td className="py-3 px-4">{new Date(trend.date).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-center font-semibold">
                        {trend.total_bookings}
                      </td>
                      <td className="py-3 px-4 text-center text-green-600">
                        {trend.completed}
                      </td>
                      <td className="py-3 px-4 text-center text-orange-600">
                        {trend.pending}
                      </td>
                      <td className="py-3 px-4 text-center text-red-600">
                        {trend.cancelled}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
