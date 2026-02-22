'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Clock, MapPin, Bike, Phone, Star, TrendingUp, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Job {
  booking_id: string;
  customer_name: string;
  customer_phone: string;
  bike_model: string;
  bike_color: string;
  service_type: string;
  shop_location: string;
  service_at: string;
  status: 'pending' | 'accepted' | 'arrived' | 'in-progress' | 'completed';
  estimated_duration: number;
  customer_rating?: number;
}

interface WorkerMetrics {
  total_jobs: number;
  completed_jobs: number;
  rating: number;
  total_earnings: number;
  completion_rate: number;
  average_service_duration: number;
  cancellations: number;
}

interface WorkerAvailability {
  worker_id: string;
  is_available: boolean;
  working_hours_start: string;
  working_hours_end: string;
  total_slots: number;
  available_slots: number;
}

export default function WorkerDashboard() {
  const router = useRouter();
  const { user, token, logout, isLoading } = useAuth();
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [metrics, setMetrics] = useState<WorkerMetrics | null>(null);
  const [availability, setAvailability] = useState<WorkerAvailability | null>(null);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [activeTab, setActiveTab] = useState('available');

  // Protect route - redirect if not worker
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'worker')) {
      router.push('/sign-in');
    }
  }, [user, isLoading, router]);

  // Fetch available jobs
  useEffect(() => {
    if (user && token) {
      fetchJobs();
      fetchMetrics();
      fetchAvailability();

      // Refresh jobs every 5 seconds for real-time updates
      const interval = setInterval(() => {
        fetchJobs();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [user, token]);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/worker/jobs', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch jobs');

      const data = await response.json();
      setJobs(data.jobs || []);
      setLoadingJobs(false);
    } catch (error) {
      console.error('Jobs fetch error:', error);
      toast.error('Failed to load jobs');
      setLoadingJobs(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/worker/performance', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch metrics');

      const data = await response.json();
      setMetrics(data.metrics);
    } catch (error) {
      console.error('Metrics fetch error:', error);
    }
  };

  const fetchAvailability = async () => {
    try {
      const response = await fetch('/api/worker/availability', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch availability');

      const data = await response.json();
      setAvailability(data.availability);
    } catch (error) {
      console.error('Availability fetch error:', error);
    }
  };

  const handleAcceptJob = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/worker/jobs/${bookingId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to accept job');
      }

      toast.success('Job accepted! Head to the shop.');
      await fetchJobs();
    } catch (error) {
      console.error('Accept job error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to accept job');
    }
  };

  const handleRejectJob = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/worker/jobs/${bookingId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to reject job');

      toast.success('Job rejected');
      await fetchJobs();
    } catch (error) {
      console.error('Reject job error:', error);
      toast.error('Failed to reject job');
    }
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/worker/jobs/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      toast.success('Status updated');
      await fetchJobs();
    } catch (error) {
      console.error('Status update error:', error);
      toast.error('Failed to update status');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-blue border-r-transparent"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'worker') {
    return null;
  }

  const pendingJobs = jobs.filter((j) => j.status === 'pending');
  const acceptedJobs = jobs.filter((j) => ['accepted', 'arrived', 'in-progress'].includes(j.status));
  const completedJobs = jobs.filter((j) => j.status === 'completed');

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Worker Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome, {user.email}</p>
            </div>
            <Button
              onClick={logout}
              variant="outline"
              className="flex items-center gap-2 border-gray-300 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Metrics Cards */}
        {metrics && (
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card className="border-l-4 border-l-brand-blue bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                  <p className="text-3xl font-bold text-gray-900">{metrics.total_jobs}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <Bike className="h-6 w-6 text-brand-blue" />
                </div>
              </div>
            </Card>

            <Card className="border-l-4 border-l-green-500 bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-3xl font-bold text-gray-900">{metrics.completed_jobs}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="border-l-4 border-l-yellow-400 bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rating</p>
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <p className="text-3xl font-bold text-gray-900">{metrics.rating.toFixed(1)}</p>
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
                  <Star className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
            </Card>

            <Card className="border-l-4 border-l-purple-500 bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Earnings</p>
                  <p className="text-3xl font-bold text-gray-900">₹{metrics.total_earnings.toLocaleString()}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </Card>

            <Card className="border-l-4 border-l-brand-orange bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-3xl font-bold text-gray-900">{(metrics.completion_rate * 100).toFixed(0)}%</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                  <TrendingUp className="h-6 w-6 text-brand-orange" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Availability Status */}
        {availability && (
          <Card className="mb-8 border-l-4 border-l-cyan-500 bg-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`h-4 w-4 rounded-full ${availability.is_available ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {availability.is_available ? 'Currently Available' : 'Currently Offline'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Working: {availability.working_hours_start} - {availability.working_hours_end}
                  </p>
                  <p className="text-sm text-gray-600">
                    Slots: {availability.available_slots} / {availability.total_slots} available
                  </p>
                </div>
              </div>
              <Button className="bg-brand-blue hover:bg-blue-700">Update Availability</Button>
            </div>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="available" className="space-y-4" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 bg-white">
            <TabsTrigger value="available" className="data-[state=active]:border-b-2 data-[state=active]:border-brand-blue data-[state=active]:bg-white">
              Available ({pendingJobs.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="data-[state=active]:border-b-2 data-[state=active]:border-brand-blue data-[state=active]:bg-white">
              Active ({acceptedJobs.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:border-b-2 data-[state=active]:border-brand-blue data-[state=active]:bg-white">
              Completed ({completedJobs.length})
            </TabsTrigger>
          </TabsList>

          {/* Available Jobs Tab */}
          <TabsContent value="available" className="space-y-4">
            {loadingJobs ? (
              <div className="flex justify-center py-8">
                <div className="text-center">
                  <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-blue border-r-transparent"></div>
                  <p className="text-gray-600">Loading jobs...</p>
                </div>
              </div>
            ) : pendingJobs.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                {pendingJobs.map((job) => (
                  <Card key={job.booking_id} className="overflow-hidden border-l-4 border-l-brand-blue bg-white p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{job.customer_name}</h3>
                        <p className="text-sm text-gray-600">{job.service_type} Service</p>
                      </div>
                      <div className="rounded-lg bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-800">
                        Pending
                      </div>
                    </div>

                    <div className="mb-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Bike className="h-4 w-4" />
                        <span>{job.bike_color} {job.bike_model}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{job.shop_location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{job.customer_phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(job.service_at).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAcceptJob(job.booking_id)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        Accept Job
                      </Button>
                      <Button
                        onClick={() => handleRejectJob(job.booking_id)}
                        variant="outline"
                        className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                      >
                        Reject
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-white p-12 text-center">
                <AlertCircle className="mb-4 h-12 w-12 text-gray-400" />
                <p className="text-gray-600">No available jobs right now</p>
                <p className="text-sm text-gray-500">Check back soon for new bookings</p>
              </Card>
            )}
          </TabsContent>

          {/* Active Jobs Tab */}
          <TabsContent value="active" className="space-y-4">
            {acceptedJobs.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                {acceptedJobs.map((job) => (
                  <Card key={job.booking_id} className="overflow-hidden border-l-4 border-l-blue-600 bg-white p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{job.customer_name}</h3>
                        <p className="text-sm text-gray-600">{job.service_type} Service</p>
                      </div>
                      <div className={`rounded-lg px-3 py-1 text-sm font-semibold ${
                        job.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                        job.status === 'arrived' ? 'bg-cyan-100 text-cyan-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                      </div>
                    </div>

                    <div className="mb-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Bike className="h-4 w-4" />
                        <span>{job.bike_color} {job.bike_model}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{job.shop_location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>Est. {job.estimated_duration} mins</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {job.status === 'accepted' && (
                        <Button
                          onClick={() => handleUpdateStatus(job.booking_id, 'arrived')}
                          className="flex-1 bg-brand-blue hover:bg-blue-700"
                        >
                          Mark as Arrived
                        </Button>
                      )}
                      {job.status === 'arrived' && (
                        <Button
                          onClick={() => handleUpdateStatus(job.booking_id, 'in-progress')}
                          className="flex-1 bg-brand-blue hover:bg-blue-700"
                        >
                          Start Service
                        </Button>
                      )}
                      {job.status === 'in-progress' && (
                        <Button
                          onClick={() => handleUpdateStatus(job.booking_id, 'completed')}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          Complete Service
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-white p-12 text-center">
                <AlertCircle className="mb-4 h-12 w-12 text-gray-400" />
                <p className="text-gray-600">No active jobs</p>
                <p className="text-sm text-gray-500">Accept a job to get started</p>
              </Card>
            )}
          </TabsContent>

          {/* Completed Jobs Tab */}
          <TabsContent value="completed" className="space-y-4">
            {completedJobs.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                {completedJobs.map((job) => (
                  <Card key={job.booking_id} className="overflow-hidden border-l-4 border-l-green-500 bg-white p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{job.customer_name}</h3>
                        <p className="text-sm text-gray-600">{job.service_type} Service</p>
                      </div>
                      <div className="rounded-lg bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
                        Completed
                      </div>
                    </div>

                    <div className="mb-4 flex items-center gap-1">
                      {job.customer_rating && (
                        <>
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < Math.floor(job.customer_rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                            />
                          ))}
                          <span className="ml-2 text-sm text-gray-600">{job.customer_rating}/5</span>
                        </>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Bike className="h-4 w-4" />
                        <span>{job.bike_color} {job.bike_model}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(job.service_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-white p-12 text-center">
                <AlertCircle className="mb-4 h-12 w-12 text-gray-400" />
                <p className="text-gray-600">No completed jobs yet</p>
                <p className="text-sm text-gray-500">Your completed jobs will appear here</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
