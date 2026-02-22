import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function getDateRange(range: string) {
  const endDate = new Date();
  const startDate = new Date();

  if (range === '7d') {
    startDate.setDate(startDate.getDate() - 7);
  } else if (range === '30d') {
    startDate.setDate(startDate.getDate() - 30);
  } else if (range === '90d') {
    startDate.setDate(startDate.getDate() - 90);
  } else if (range === 'all') {
    startDate.setFullYear(startDate.getFullYear() - 10);
  }

  return {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0]
  };
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as any;

    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Only admin can export' }, { status: 403 });
    }

    const { data_types, date_range, format } = await request.json();

    if (!data_types || !Array.isArray(data_types) || data_types.length === 0) {
      return NextResponse.json({ error: 'data_types required' }, { status: 400 });
    }

    const dateRange = getDateRange(date_range || '30d');
    const exportData: any = {};

    // Export bookings
    if (data_types.includes('bookings')) {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, status, rating, created_at, customer:customers(name, email), worker:workers(name), shop:shops(name)')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);

      exportData.bookings = bookings;
    }

    // Export revenue
    if (data_types.includes('revenue')) {
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, total_amount, platform_commission, shop_payout, created_at, booking:bookings(shop:shops(name))')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);

      exportData.revenue = invoices;
    }

    // Export workers
    if (data_types.includes('workers')) {
      const { data: workers } = await supabase
        .from('workers')
        .select('id, name, rating, is_available, response_time_minutes, created_at');

      exportData.workers = workers;
    }

    // Export customers
    if (data_types.includes('customers')) {
      const { data: customers } = await supabase
        .from('customers')
        .select('id, name, email, phone, total_spent, created_at');

      exportData.customers = customers;
    }

    // Export invoices
    if (data_types.includes('invoices')) {
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);

      exportData.invoices = invoices;
    }

    // Export cancellations
    if (data_types.includes('cancellations')) {
      const { data: cancellations } = await supabase
        .from('cancellations')
        .select('*')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);

      exportData.cancellations = cancellations;
    }

    // Format data
    let fileContent: string;
    let mimeType: string;
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `moto-analytics-${timestamp}.${format}`;

    if (format === 'json') {
      fileContent = JSON.stringify(exportData, null, 2);
      mimeType = 'application/json';
    } else {
      // Convert to CSV
      const csvRows = ['Type,Data'];
      Object.entries(exportData).forEach(([type, data]: any) => {
        if (Array.isArray(data)) {
          csvRows.push(`${type},"${data.length} records"`);
          if (data.length > 0) {
            const headers = Object.keys(data[0]);
            csvRows.push(`\n${type} - Details:`);
            csvRows.push(headers.join(','));
            data.forEach((row: any) => {
              csvRows.push(
                headers.map((h) => {
                  const val = row[h];
                  const strVal = typeof val === 'object' ? JSON.stringify(val) : String(val || '');
                  return `"${strVal.replace(/"/g, '""')}"`;
                }).join(',')
              );
            });
          }
        }
      });
      fileContent = csvRows.join('\n');
      mimeType = 'text/csv';
    }

    // Log export
    await supabase.from('admin_logs').insert({
      action: 'DATA_EXPORTED',
      resource_type: 'analytics',
      resource_id: filename,
      details: {
        data_types: data_types,
        date_range: date_range,
        format: format
      },
      performed_by: payload.id,
      created_at: new Date().toISOString()
    });

    // Return file
    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
