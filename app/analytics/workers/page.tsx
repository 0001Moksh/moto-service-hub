'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';

interface WorkerMetrics {
  worker_id: string;
  worker_name: string;
  rating: number;
  total_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  completion_rate: number;
  average_rating: number;
  earnings: number;
  active_status: boolean;
}

interface WorkerAnalytics {
  top_workers: WorkerMetrics[];
  total_active_workers: number;
  average_completion_rate: number;
  average_earnings: number;
  top_performer: WorkerMetrics | null;
}

export default function WorkerPerformance() {
  const { user } = useAuth();
  const router = useRouter();

  const [analytics, setAnalytics] = useState<WorkerAnalytics | null>(null);
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
        const response = await fetch(`/api/analytics/worker-performance?range=${timeRange}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok && data.analytics) {
          setAnalytics(data.analytics);
        } else {
          setError(data.error || 'Failed to fetch analytics');
        }
      } catch (err) {
        setError('Error fetching worker performance');
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
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-slate-100 p-6">
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
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Worker Performance</h1>
            <p className="text-gray-600 mt-1">Worker metrics and performance analysis</p>
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

        {/* Platform Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Active Workers</p>
              <p className="text-3xl font-bold text-amber-600">
                {analytics.total_active_workers}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Avg Completion Rate</p>
              <p className="text-3xl font-bold text-green-600">
                {analytics.average_completion_rate.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Avg Monthly Earnings</p>
              <p className="text-3xl font-bold text-emerald-600">
                ${analytics.average_earnings.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Top Performer */}
        {analytics.top_performer && (
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <CardHeader>
              <CardTitle className="text-amber-900">🏆 Top Performer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-amber-900">
                    {analytics.top_performer.worker_name}
                  </p>
                  <p className="text-sm text-amber-700 mt-2">
                    ⭐ {analytics.top_performer.rating.toFixed(1)} Rating
                  </p>
                  <p className="text-sm text-amber-700">
                    {analytics.top_performer.completed_bookings} completed bookings
                  </p>
                </div>
                <div className="text-right">
                  <Badge className="bg-amber-600 text-lg py-2 px-3">
                    {analytics.top_performer.completion_rate.toFixed(1)}% Completion
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Workers */}
        <Card>
          <CardHeader>
            <CardTitle>All Workers</CardTitle>
            <CardDescription>Individual worker performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.top_workers.map((worker, idx) => (
                <div key={worker.worker_id} className="p-4 bg-slate-50 rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-lg">
                        {idx + 1}. {worker.worker_name}
                      </p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="secondary">⭐ {worker.rating.toFixed(1)}</Badge>
                        <Badge variant={worker.active_status ? 'default' : 'destructive'}>
                          {worker.active_status ? 'Available' : 'Unavailable'}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-emerald-600">
                        ${worker.earnings.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">This month</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="p-2 bg-white rounded">
                      <p className="text-gray-600">Completed</p>
                      <p className="font-bold">{worker.completed_bookings}</p>
                    </div>
                    <div className="p-2 bg-white rounded">
                      <p className="text-gray-600">Cancelled</p>
                      <p className="font-bold text-red-600">{worker.cancelled_bookings}</p>
                    </div>
                    <div className="p-2 bg-white rounded">
                      <p className="text-gray-600">Completion Rate</p>
                      <p className="font-bold text-green-600">
                        {worker.completion_rate.toFixed(1)}%
                      </p>
                    </div>
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
