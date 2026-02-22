'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, AlertTriangle, TrendingUp, Store, DollarSign, Users, BarChart3, Shield, Activity, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface Shop {
  shop_id: string;
  shop_name: string;
  location: string;
  owner_email: string;
  status: 'active' | 'paused' | 'suspended';
  total_bookings: number;
  completed_bookings: number;
  rating: number;
  revenue: number;
  no_show_rate: number;
  abuse_score: number;
  workers_count: number;
  created_at: string;
}

interface ShopRequest {
  request_id: number;
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  shop_name: string;
  phone_number: string;
  location: string;
  aadhaar_card_photo?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface AdminMetrics {
  total_shops: number;
  active_shops: number;
  paused_shops: number;
  total_revenue: number;
  total_bookings: number;
  average_rating: number;
  high_risk_shops: number;
}

interface AbuseTrend {
  shop_id: string;
  shop_name: string;
  abuse_type: string;
  count: number;
  severity: 'low' | 'medium' | 'high';
  last_incident: string;
}

interface RevenueData {
  date: string;
  revenue: number;
  bookings: number;
  shop_commission: number;
  platform_commission: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, token, logout, isLoading } = useAuth();

  const [shops, setShops] = useState<Shop[]>([]);
  const [requests, setRequests] = useState<ShopRequest[]>([]);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [abuseTrends, setAbuseTrends] = useState<AbuseTrend[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedShop, setSelectedShop] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused' | 'suspended'>('all');
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);

  // Protect route - redirect if not admin
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/sign-in');
    }
  }, [user, isLoading, router]);

  // Fetch data on mount
  useEffect(() => {
    if (user && token) {
      fetchShops();
      fetchRequests();
      fetchMetrics();
      fetchAbuseTrends();
      fetchRevenueData();

      // Auto-refresh shops and metrics every 10 seconds (but not requests - manual refresh only)
      const interval = setInterval(() => {
        fetchShops();
        fetchMetrics();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [user, token]);


  const fetchShops = async () => {
    try {
      const response = await fetch('/api/admin/shops', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch shops');

      const data = await response.json();
      setShops(data.shops || []);
      setLoadingShops(false);
    } catch (error) {
      console.error('Shops fetch error:', error);
      toast.error('Failed to load shops');
      setLoadingShops(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/admin/analytics/metrics', {
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

  const fetchAbuseTrends = async () => {
    try {
      const response = await fetch('/api/admin/analytics/abuse-trends', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch abuse trends');

      const data = await response.json();
      setAbuseTrends(data.trends || []);
    } catch (error) {
      console.error('Abuse trends fetch error:', error);
    }
  };

  const fetchRevenueData = async () => {
    try {
      const response = await fetch('/api/admin/analytics/revenue', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch revenue');

      const data = await response.json();
      setRevenueData(data.data || []);
    } catch (error) {
      console.error('Revenue data fetch error:', error);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoadingRequests(true);
      const response = await fetch('/api/admin/shop-requests', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch requests');

      const data = await response.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Requests fetch error:', error);
      toast.error('Failed to load shop requests');
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleApproveRequest = async (requestId: number) => {
    try {
      setApprovingId(requestId);
      const response = await fetch(`/api/admin/shop-requests/${requestId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'approve' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve request');
      }

      const data = await response.json();
      toast.success(`Shop request approved! Owner ID: ${data.owner_id}, Shop ID: ${data.shop_id}`);
      await fetchRequests();
    } catch (error) {
      console.error('Approve error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to approve request');
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectRequest = async (requestId: number, reason: string = 'Rejected by admin') => {
    try {
      setRejectingId(requestId);
      const response = await fetch(`/api/admin/shop-requests/${requestId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reject', reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reject request');
      }

      toast.success('Shop request rejected');
      await fetchRequests();
    } catch (error) {
      console.error('Reject error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reject request');
    } finally {
      setRejectingId(null);
    }
  };

  const handleToggleShopStatus = async (shopId: string, newStatus: 'active' | 'paused' | 'suspended') => {
    try {
      const response = await fetch(`/api/admin/shops/${shopId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update shop status');

      toast.success(`Shop status updated to ${newStatus}`);
      await fetchShops();
    } catch (error) {
      console.error('Status update error:', error);
      toast.error('Failed to update shop status');
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

  if (!user || user.role !== 'admin') {
    return null;
  }

  const filteredShops =
    filterStatus === 'all'
      ? shops
      : shops.filter((s) => s.status === filterStatus);

  const highRiskShops = shops.filter((s) => s.abuse_score > 70);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Platform Governance & Monitoring</p>
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
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-7">
            <Card className="border-l-4 border-l-brand-blue bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Total Shops</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.total_shops}</p>
                </div>
                <Store className="h-5 w-5 text-brand-blue" />
              </div>
            </Card>

            <Card className="border-l-4 border-l-green-500 bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.active_shops}</p>
                </div>
                <Activity className="h-5 w-5 text-green-600" />
              </div>
            </Card>

            <Card className="border-l-4 border-l-yellow-400 bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Paused</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.paused_shops}</p>
                </div>
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              </div>
            </Card>

            <Card className="border-l-4 border-l-red-500 bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">High Risk</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.high_risk_shops}</p>
                </div>
                <Shield className="h-5 w-5 text-red-600" />
              </div>
            </Card>

            <Card className="border-l-4 border-l-purple-500 bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.total_bookings}</p>
                </div>
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
            </Card>

            <Card className="border-l-4 border-l-brand-orange bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Avg Rating</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.average_rating.toFixed(1)}</p>
                </div>
                <TrendingUp className="h-5 w-5 text-brand-orange" />
              </div>
            </Card>

            <Card className="border-l-4 border-l-cyan-500 bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">₹{(metrics.total_revenue / 100000).toFixed(1)}L</p>
                </div>
                <DollarSign className="h-5 w-5 text-cyan-600" />
              </div>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 bg-white">
            <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-brand-blue">
              Overview
            </TabsTrigger>
            <TabsTrigger value="requests" className="data-[state=active]:border-b-2 data-[state=active]:border-brand-blue">
              Requests ({requests.filter(r => r.status === 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="shops" className="data-[state=active]:border-b-2 data-[state=active]:border-brand-blue">
              Shops ({filteredShops.length})
            </TabsTrigger>
            <TabsTrigger value="abuse" className="data-[state=active]:border-b-2 data-[state=active]:border-brand-blue">
              Abuse Trends ({abuseTrends.length})
            </TabsTrigger>
            <TabsTrigger value="revenue" className="data-[state=active]:border-b-2 data-[state=active]:border-brand-blue">
              Revenue
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* High Risk Shops */}
              <Card className="border-l-4 border-l-red-500 bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">⚠️ High Risk Shops ({highRiskShops.length})</h3>
                  <Shield className="h-5 w-5 text-red-600" />
                </div>
                {highRiskShops.length > 0 ? (
                  <div className="space-y-3">
                    {highRiskShops.slice(0, 5).map((shop) => (
                      <div key={shop.shop_id} className="flex items-center justify-between rounded-lg bg-red-50 p-3">
                        <div>
                          <p className="font-medium text-gray-900">{shop.shop_name}</p>
                          <p className="text-xs text-gray-600">Abuse Score: {shop.abuse_score}/100</p>
                        </div>
                        <Button
                          onClick={() => handleToggleShopStatus(shop.shop_id, 'suspended')}
                          size="sm"
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Suspend
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">No high-risk shops detected</p>
                )}
              </Card>

              {/* Top Shops */}
              <Card className="border-l-4 border-l-green-500 bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">⭐ Top Performing Shops</h3>
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                {shops.length > 0 ? (
                  <div className="space-y-3">
                    {shops
                      .sort((a, b) => b.rating - a.rating)
                      .slice(0, 5)
                      .map((shop) => (
                        <div key={shop.shop_id} className="flex items-center justify-between rounded-lg bg-green-50 p-3">
                          <div>
                            <p className="font-medium text-gray-900">{shop.shop_name}</p>
                            <p className="text-xs text-gray-600">Rating: ⭐ {shop.rating.toFixed(1)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-green-600">{shop.completed_bookings} jobs</p>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">No shops available</p>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            {/* Refresh Button */}
            <div className="flex justify-end">
              <Button
                onClick={fetchRequests}
                disabled={loadingRequests}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loadingRequests ? 'animate-spin' : ''}`} />
                {loadingRequests ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>

            {loadingRequests ? (
              <div className="flex justify-center py-12">
                <div className="text-center">
                  <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-blue border-r-transparent"></div>
                  <p className="text-gray-600">Loading shop requests...</p>
                </div>
              </div>
            ) : requests.length === 0 ? (
              <Card className="border border-gray-200 bg-white p-8 text-center">
                <p className="text-gray-600">No shop registration requests at this time</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {requests
                  .filter((r) => r.status === 'pending')
                  .map((request) => (
                    <Card key={request.request_id} className="border border-gray-200 bg-white p-6">
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {/* Left Column - Request Info */}
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-semibold text-gray-900">Owner Information</h3>
                            <div className="mt-2 space-y-2 text-sm">
                              <p className="text-gray-600">
                                <span className="font-medium text-gray-900">Name:</span> {request.owner_name}
                              </p>
                              <p className="text-gray-600">
                                <span className="font-medium text-gray-900">Email:</span> {request.owner_email}
                              </p>
                              <p className="text-gray-600">
                                <span className="font-medium text-gray-900">Phone:</span> {request.owner_phone}
                              </p>
                            </div>
                          </div>

                          <div>
                            <h3 className="font-semibold text-gray-900">Shop Information</h3>
                            <div className="mt-2 space-y-2 text-sm">
                              <p className="text-gray-600">
                                <span className="font-medium text-gray-900">Shop Name:</span> {request.shop_name}
                              </p>
                              <p className="text-gray-600">
                                <span className="font-medium text-gray-900">Phone:</span> {request.phone_number}
                              </p>
                              <p className="text-gray-600">
                                <span className="font-medium text-gray-900">Location:</span> {request.location}
                              </p>
                            </div>
                          </div>

                          <div className="text-xs text-gray-500">
                            Submitted: {new Date(request.created_at).toLocaleDateString()} at{' '}
                            {new Date(request.created_at).toLocaleTimeString()}
                          </div>
                        </div>

                        {/* Right Column - Actions */}
                        <div className="flex flex-col justify-between">
                          <div className="rounded-lg bg-blue-50 p-4">
                            <p className="text-sm text-gray-700">
                              Review the request details on the left. Once approved, the owner will receive a temporary password via email.
                            </p>
                          </div>

                          <div className="mt-4 flex gap-3">
                            <Button
                              onClick={() => handleApproveRequest(request.request_id)}
                              disabled={approvingId === request.request_id || rejectingId === request.request_id}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                              {approvingId === request.request_id ? (
                                <>
                                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></div>
                                  Approving...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Approve
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={() => handleRejectRequest(request.request_id)}
                              disabled={rejectingId === request.request_id || approvingId === request.request_id}
                              variant="outline"
                              className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                            >
                              {rejectingId === request.request_id ? (
                                <>
                                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-r-transparent"></div>
                                  Rejecting...
                                </>
                              ) : (
                                <>
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Reject
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>

          {/* Shops Tab */}
          <TabsContent value="shops" className="space-y-4">
            {/* Filter Buttons */}
            <div className="flex gap-2">
              {(['all', 'active', 'paused', 'suspended'] as const).map((status) => (
                <Button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  variant={filterStatus === status ? 'default' : 'outline'}
                  className={filterStatus === status ? 'bg-brand-blue' : ''}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>

            {/* Shops Table */}
            {loadingShops ? (
              <div className="flex justify-center py-8">
                <div className="text-center">
                  <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-blue border-r-transparent"></div>
                  <p className="text-gray-600">Loading shops...</p>
                </div>
              </div>
            ) : filteredShops.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                <table className="w-full">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Shop Name</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Owner</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Rating</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Bookings</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Revenue</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Risk Score</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredShops.map((shop) => (
                      <tr key={shop.shop_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{shop.shop_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{shop.owner_email}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              shop.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : shop.status === 'paused'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {shop.status.charAt(0).toUpperCase() + shop.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">⭐ {shop.rating.toFixed(1)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {shop.completed_bookings}/{shop.total_bookings}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">₹{(shop.revenue / 1000).toFixed(1)}K</td>
                        <td className="px-6 py-4">
                          <div
                            className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                              shop.abuse_score > 70
                                ? 'bg-red-100 text-red-800'
                                : shop.abuse_score > 40
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {shop.abuse_score}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex gap-2">
                            {shop.status === 'active' ? (
                              <Button
                                size="sm"
                                onClick={() => handleToggleShopStatus(shop.shop_id, 'paused')}
                                className="bg-yellow-600 hover:bg-yellow-700"
                              >
                                Pause
                              </Button>
                            ) : shop.status === 'paused' ? (
                              <Button
                                size="sm"
                                onClick={() => handleToggleShopStatus(shop.shop_id, 'active')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Activate
                              </Button>
                            ) : null}
                            {shop.status !== 'suspended' && (
                              <Button
                                size="sm"
                                onClick={() => handleToggleShopStatus(shop.shop_id, 'suspended')}
                                variant="destructive"
                              >
                                Suspend
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Card className="bg-white p-12 text-center">
                <p className="text-gray-600">No shops found with current filter</p>
              </Card>
            )}
          </TabsContent>

          {/* Abuse Trends Tab */}
          <TabsContent value="abuse" className="space-y-4">
            {abuseTrends.length > 0 ? (
              <div className="space-y-4">
                {abuseTrends.map((trend, idx) => (
                  <Card key={idx} className={`border-l-4 bg-white p-6 ${
                    trend.severity === 'high' ? 'border-l-red-500' :
                    trend.severity === 'medium' ? 'border-l-yellow-500' :
                    'border-l-blue-500'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{trend.shop_name}</h3>
                          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            trend.severity === 'high' ? 'bg-red-100 text-red-800' :
                            trend.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {trend.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          <strong>Issue:</strong> {trend.abuse_type}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Count:</strong> {trend.count} incidents
                        </p>
                        <p className="text-xs text-gray-500">
                          Last incident: {new Date(trend.last_incident).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Investigate
                        </Button>
                        {trend.severity === 'high' && (
                          <Button size="sm" className="bg-red-600 hover:bg-red-700">
                            Take Action
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-white p-12 text-center">
                <AlertTriangle className="mb-4 h-12 w-12 text-gray-400" />
                <p className="text-gray-600">No abuse trends detected</p>
              </Card>
            )}
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-4">
            {revenueData.length > 0 ? (
              <div className="space-y-4">
                <Card className="bg-white p-6">
                  <h3 className="mb-4 font-semibold text-gray-900">Daily Revenue Breakdown</h3>
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full">
                      <thead className="border-b border-gray-200 bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Bookings</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Total Revenue</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Platform (30%)</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Shop (70%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {revenueData.slice(-7).map((data, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">{new Date(data.date).toLocaleDateString()}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{data.bookings}</td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">₹{(data.revenue / 1000).toFixed(1)}K</td>
                            <td className="px-6 py-4 text-sm font-medium text-cyan-600">₹{(data.platform_commission / 1000).toFixed(1)}K</td>
                            <td className="px-6 py-4 text-sm font-medium text-green-600">₹{(data.shop_commission / 1000).toFixed(1)}K</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            ) : (
              <Card className="bg-white p-12 text-center">
                <DollarSign className="mb-4 h-12 w-12 text-gray-400" />
                <p className="text-gray-600">No revenue data available</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

