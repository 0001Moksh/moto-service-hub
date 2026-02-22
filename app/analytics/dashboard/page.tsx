'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface DashboardMetrics {
  total_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  total_revenue: number;
  platform_commission: number;
  average_rating: number;
  active_workers: number;
  active_shops: number;
  bookings_this_month: number;
  revenue_this_month: number;
  completion_rate: number;
  cancellation_rate: number;
}

export default function AnalyticsDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!user) {
      router.push('/sign-in');
      return;
    }

    // Only admin can access analytics dashboard
    if (user.role !== 'admin') {
      router.push('/customer/dashboard');
      return;
    }

    const fetchMetrics = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/analytics/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok && data.metrics) {
          setMetrics(data.metrics);
        } else {
          setError(data.error || 'Failed to fetch metrics');
        }
      } catch (err) {
        setError('Error fetching analytics');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();

    // Refresh metrics every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-slate-100 p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <Alert variant="destructive">
                <AlertDescription>{error || 'Analytics data not found'}</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Real-time platform metrics and insights</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-3xl font-bold text-blue-600">{metrics.total_bookings}</p>
              <p className="text-xs text-gray-500 mt-2">
                This month: {metrics.bookings_this_month}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-3xl font-bold text-green-600">
                {metrics.completion_rate.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {metrics.completed_bookings} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-emerald-600">
                ${metrics.total_revenue.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Commission: ${metrics.platform_commission.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Platform Rating</p>
              <p className="text-3xl font-bold text-yellow-600">
                ⭐ {metrics.average_rating.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Avg across all services
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="bg-slate-50">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Active Shops</p>
              <p className="text-2xl font-bold">{metrics.active_shops}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-50">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Active Workers</p>
              <p className="text-2xl font-bold">{metrics.active_workers}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-50">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Cancellation Rate</p>
              <p className="text-2xl font-bold text-red-600">
                {metrics.cancellation_rate.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="bookings">Bookings</TabsTrigger>
                <TabsTrigger value="revenue">Revenue</TabsTrigger>
                <TabsTrigger value="export">Export</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-semibold text-blue-900">Revenue This Month</p>
                    <p className="text-2xl font-bold text-blue-600 mt-2">
                      ${metrics.revenue_this_month.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-semibold text-green-900">Completion Trend</p>
                    <p className="text-2xl font-bold text-green-600 mt-2">↑ Stable</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="bookings" className="space-y-4 mt-4">
                <Button onClick={() => router.push('/analytics/bookings')}>
                  View Booking Trends →
                </Button>
              </TabsContent>

              <TabsContent value="revenue" className="space-y-4 mt-4">
                <Button onClick={() => router.push('/analytics/revenue')}>
                  View Revenue Analysis →
                </Button>
              </TabsContent>

              <TabsContent value="export" className="space-y-4 mt-4">
                <Button onClick={() => router.push('/analytics/export')}>
                  Go to Data Export →
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/analytics/bookings')}
            className="h-20 flex flex-col items-center justify-center"
          >
            <p className="text-lg">📊</p>
            <p className="text-sm mt-1">Booking Trends</p>
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/analytics/revenue')}
            className="h-20 flex flex-col items-center justify-center"
          >
            <p className="text-lg">💰</p>
            <p className="text-sm mt-1">Revenue</p>
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/analytics/workers')}
            className="h-20 flex flex-col items-center justify-center"
          >
            <p className="text-lg">👷</p>
            <p className="text-sm mt-1">Workers</p>
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/analytics/customers')}
            className="h-20 flex flex-col items-center justify-center"
          >
            <p className="text-lg">👥</p>
            <p className="text-sm mt-1">Customers</p>
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/analytics/export')}
            className="h-20 flex flex-col items-center justify-center"
          >
            <p className="text-lg">📥</p>
            <p className="text-sm mt-1">Export Data</p>
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/admin/dashboard')}
            className="h-20 flex flex-col items-center justify-center"
          >
            <p className="text-lg">⚙️</p>
            <p className="text-sm mt-1">Back to Admin</p>
          </Button>
        </div>
      </div>
    </div>
  );
}
