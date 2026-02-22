'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';

interface InvoiceData {
  invoice_id: string;
  booking_id: string;
  customer_name: string;
  customer_email: string;
  shop_name: string;
  service_name: string;
  base_cost: number;
  extra_charges: number;
  total_amount: number;
  platform_commission: number;
  shop_commission: number;
  issued_date: string;
  status: 'draft' | 'issued' | 'paid';
  payment_method?: string;
  paid_date?: string;
  line_items: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
}

function InvoicePageContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking_id');

  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bookingId) {
      setError('Booking ID is required');
      setLoading(false);
      return;
    }

    const fetchInvoice = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`/api/invoices/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok && data.invoice) {
          setInvoice(data.invoice);
        } else {
          setError(data.error || 'Failed to fetch invoice');
        }
      } catch (err) {
        setError('Error fetching invoice');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-2xl mx-auto">
          <Alert variant="destructive">
            <AlertDescription>{error || 'Invoice not found'}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // TODO: Implement PDF download
    alert('PDF download feature coming soon');
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Print Actions */}
        <div className="flex gap-2 mb-6 print:hidden">
          <Button
            onClick={handlePrint}
            variant="outline"
            className="flex-1"
          >
            🖨 Print
          </Button>
          <Button
            onClick={handleDownload}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            📥 Download PDF
          </Button>
        </div>

        {/* Invoice Document */}
        <Card className="border-2 print:border-0">
          <CardContent className="pt-8">
            {/* Header */}
            <div className="mb-8 pb-8 border-b-2">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h1 className="text-4xl font-bold text-blue-600">MOTO SERVICE HUB</h1>
                  <p className="text-gray-600">Professional Motorcycle Service Platform</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">INVOICE</p>
                  <p className="text-gray-600">Invoice ID: {invoice.invoice_id}</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="inline-block">
                <span className={`px-4 py-2 rounded-full font-semibold ${
                  invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                  invoice.status === 'issued' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {invoice.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Invoice Info */}
            <div className="grid grid-cols-3 gap-8 mb-8">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">BILL FROM</p>
                <p className="font-semibold">{invoice.shop_name}</p>
                <p className="text-sm text-gray-600">Service Shop</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">BILL TO</p>
                <p className="font-semibold">{invoice.customer_name}</p>
                <p className="text-sm text-gray-600">{invoice.customer_email}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">DATE</p>
                <p className="font-semibold">{new Date(invoice.issued_date).toLocaleDateString()}</p>
                <p className="text-xs font-semibold text-gray-500 mt-2 mb-1">BOOKING ID</p>
                <p className="font-semibold">{invoice.booking_id}</p>
              </div>
            </div>

            {/* Service Details */}
            <div className="mb-8 pb-8 border-b-2">
              <p className="text-xs font-semibold text-gray-500 mb-2">SERVICE</p>
              <p className="text-xl font-semibold">{invoice.service_name}</p>
            </div>

            {/* Line Items */}
            <table className="w-full mb-8">
              <thead>
                <tr className="border-b-2">
                  <th className="text-left py-2 font-semibold">Description</th>
                  <th className="text-center py-2 font-semibold w-24">Qty</th>
                  <th className="text-right py-2 font-semibold w-32">Rate</th>
                  <th className="text-right py-2 font-semibold w-32">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.line_items.map((item, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-3">{item.description}</td>
                    <td className="text-center py-3">{item.quantity}</td>
                    <td className="text-right py-3">₹{item.rate}</td>
                    <td className="text-right py-3 font-semibold">₹{item.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Summary */}
            <div className="mb-8 max-w-sm ml-auto space-y-2 p-4 bg-gray-50 rounded">
              <div className="flex justify-between">
                <span>Base Cost</span>
                <span className="font-semibold">₹{invoice.base_cost}</span>
              </div>
              {invoice.extra_charges > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span>Extra Services</span>
                  <span className="font-semibold">₹{invoice.extra_charges}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between text-lg font-bold">
                <span>Total Amount Due</span>
                <span className="text-green-600">₹{invoice.total_amount}</span>
              </div>
            </div>

            {/* Commission Breakdown (Admin View) */}
            {user?.role === 'admin' && (
              <div className="mb-8 p-4 bg-blue-50 rounded space-y-2 text-sm border-l-4 border-blue-600">
                <p className="font-semibold">Commission Breakdown</p>
                <div className="flex justify-between">
                  <span>Platform Commission (30%)</span>
                  <span>₹{invoice.platform_commission}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shop Commission (70%)</span>
                  <span>₹{invoice.shop_commission}</span>
                </div>
              </div>
            )}

            {/* Payment Info */}
            {invoice.status === 'paid' && (
              <div className="mb-8 p-4 bg-green-50 rounded space-y-1 border-l-4 border-green-600">
                <p className="font-semibold">Payment Received</p>
                <p className="text-sm text-gray-600">
                  Payment Method: {invoice.payment_method || 'Online'}
                </p>
                {invoice.paid_date && (
                  <p className="text-sm text-gray-600">
                    Paid Date: {new Date(invoice.paid_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="border-t-2 pt-8 text-center text-gray-600 text-sm space-y-2">
              <p>Thank you for your business!</p>
              <p>For any queries, contact: support@motohub.com | +91-XXXX-XXXX-XXXX</p>
              <p className="text-xs mt-4">This is a digitally generated invoice</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none;
          }
          .print\\:border-0 {
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function InvoicePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InvoicePageContent />
    </Suspense>
  );
}
