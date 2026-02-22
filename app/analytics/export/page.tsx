'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { Checkbox } from '@/components/ui/checkbox';

interface ExportOption {
  key: string;
  label: string;
  description: string;
  selected: boolean;
}

export default function DataExport() {
  const { user } = useAuth();
  const router = useRouter();

  const [exportOptions, setExportOptions] = useState<ExportOption[]>([
    {
      key: 'bookings',
      label: 'Booking Data',
      description: 'All bookings with customer, worker, and service details',
      selected: true
    },
    {
      key: 'revenue',
      label: 'Revenue Reports',
      description: 'Revenue breakdown, commissions, and payouts',
      selected: true
    },
    {
      key: 'workers',
      label: 'Worker Performance',
      description: 'Worker metrics, ratings, and earnings',
      selected: true
    },
    {
      key: 'customers',
      label: 'Customer Data',
      description: 'Customer information and behavior metrics',
      selected: true
    },
    {
      key: 'invoices',
      label: 'Invoice Records',
      description: 'All generated invoices and payments',
      selected: false
    },
    {
      key: 'cancellations',
      label: 'Cancellation History',
      description: 'Cancellations, tokens, and refund records',
      selected: false
    }
  ]);

  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/sign-in');
      return;
    }
    setLoading(false);
  }, [user, router]);

  const toggleOption = (key: string) => {
    setExportOptions(
      exportOptions.map((opt) =>
        opt.key === key ? { ...opt, selected: !opt.selected } : opt
      )
    );
  };

  const handleExport = async () => {
    const selectedKeys = exportOptions.filter((opt) => opt.selected).map((opt) => opt.key);

    if (selectedKeys.length === 0) {
      setError('Please select at least one data type to export');
      return;
    }

    setExporting(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          data_types: selectedKeys,
          date_range: dateRange,
          format: format
        })
      });

      if (response.ok) {
        // Get the filename from content-disposition header
        const contentDisposition = response.headers.get('content-disposition');
        const filename = contentDisposition
          ? contentDisposition.split('filename=')[1].replace(/"/g, '')
          : `moto-analytics-export.${format}`;

        // Download the file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to export data');
      }
    } catch (err) {
      setError('Error exporting data');
      console.error(err);
    } finally {
      setExporting(false);
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
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-slate-100 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Data Export</h1>
            <p className="text-gray-600 mt-1">Export analytics and business data</p>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            ← Back
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Data Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Data to Export</CardTitle>
            <CardDescription>Choose which datasets to include</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {exportOptions.map((option) => (
              <div key={option.key} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-slate-50">
                <Checkbox
                  checked={option.selected}
                  onCheckedChange={() => toggleOption(option.key)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-semibold">{option.label}</p>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Date Range Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Date Range</CardTitle>
            <CardDescription>Select the time period for exported data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(['7d', '30d', '90d', 'all'] as const).map((range) => (
              <div
                key={range}
                className={`p-3 border rounded-lg cursor-pointer transition ${
                  dateRange === range
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:bg-slate-50'
                }`}
                onClick={() => setDateRange(range)}
              >
                <p className="font-semibold">
                  {range === '7d'
                    ? 'Last 7 days'
                    : range === '30d'
                      ? 'Last 30 days'
                      : range === '90d'
                        ? 'Last 90 days'
                        : 'All time'}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Export Format */}
        <Card>
          <CardHeader>
            <CardTitle>Export Format</CardTitle>
            <CardDescription>Choose the file format for your export</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(['csv', 'json'] as const).map((fmt) => (
              <div
                key={fmt}
                className={`p-3 border rounded-lg cursor-pointer transition ${
                  format === fmt
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:bg-slate-50'
                }`}
                onClick={() => setFormat(fmt)}
              >
                <p className="font-semibold uppercase">{fmt}</p>
                <p className="text-sm text-gray-600">
                  {fmt === 'csv'
                    ? 'Spreadsheet-compatible format'
                    : 'Machine-readable format'}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Important Notes */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900 space-y-2">
              <p>• All exports are encrypted and secure</p>
              <p>• Include sensitive customer and financial data</p>
              <p>• Access is logged for audit compliance</p>
              <p>• Files are available for 24 hours after generation</p>
            </p>
          </CardContent>
        </Card>

        {/* Export Button */}
        <Button
          onClick={handleExport}
          disabled={exporting}
          size="lg"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {exporting ? (
            <>
              <Spinner className="mr-2" /> Exporting...
            </>
          ) : (
            '📥 Generate Export'
          )}
        </Button>
      </div>
    </div>
  );
}
