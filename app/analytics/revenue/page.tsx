'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';

interface RevenueAnalytics {
  total_revenue: number;
  platform_commission: number;
  shop_payouts: number;
  average_transaction: number;
  revenue_by_service: Array<{ service: string; revenue: number; percentage: number }>;
  revenue_by_shop: Array<{ shop: string; revenue: number; percentage: number }>;
  monthly_growth: number;
  commission_split: { platform: number; shop: number };
}

export default function RevenueAnalytics() {
  const { user } = useAuth();
  const router = useRouter();

  const [analytics, setAnalytics] = useState<RevenueAnalytics | null>(null);
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
        const response = await fetch(`/api/analytics/revenue-breakdown?range=${timeRange}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok && data.analytics) {
          setAnalytics(data.analytics);
        } else {
          setError(data.error || 'Failed to fetch analytics');
        }
      } catch (err) {
        setError('Error fetching revenue analytics');
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
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-slate-100 p-6">
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
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Revenue Analytics</h1>
            <p className="text-gray-600 mt-1">Platform revenue and commission breakdown</p>
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
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-emerald-600">
                ${analytics.total_revenue.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Platform Commission</p>
              <p className="text-2xl font-bold text-blue-600">
                ${analytics.platform_commission.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Shop Payouts</p>
              <p className="text-2xl font-bold text-purple-600">
                ${analytics.shop_payouts.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Avg Transaction</p>
              <p className="text-2xl font-bold text-orange-600">
                ${analytics.average_transaction.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Commission Split */}
        <Card>
          <CardHeader>
            <CardTitle>Commission Split</CardTitle>
            <CardDescription>Revenue distribution between platform and shops</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <p className="font-semibold text-blue-900">Platform Commission</p>
                <p className="text-sm text-blue-700">{analytics.commission_split.platform}%</p>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                ${analytics.platform_commission.toFixed(2)}
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div>
                <p className="font-semibold text-purple-900">Shop Payouts</p>
                <p className="text-sm text-purple-700">{analytics.commission_split.shop}%</p>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                ${analytics.shop_payouts.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Service */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Service</CardTitle>
            <CardDescription>Top performing services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.revenue_by_service.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                  <div className="flex-1">
                    <p className="font-semibold">{item.service}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold text-lg">${item.revenue.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{item.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Shop */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Shop</CardTitle>
            <CardDescription>Top performing shops</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.revenue_by_shop.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                  <div className="flex-1">
                    <p className="font-semibold">{item.shop}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-emerald-600 h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold text-lg">${item.revenue.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{item.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Growth Indicator */}
        {analytics.monthly_growth !== 0 && (
          <Card className={analytics.monthly_growth > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Monthly Growth</p>
                  <p className={`text-3xl font-bold ${analytics.monthly_growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {analytics.monthly_growth > 0 ? '↑' : '↓'} {Math.abs(analytics.monthly_growth).toFixed(1)}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Compared to Previous Month</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {analytics.monthly_growth > 0 ? 'Positive trend' : 'Needs attention'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
