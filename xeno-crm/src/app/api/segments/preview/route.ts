import { NextRequest, NextResponse } from 'next/server';
import { getMatchingCustomers } from '@/lib/segmentHelper';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filterQuery } = body;

    if (filterQuery === undefined) {
      return NextResponse.json({ error: 'filterQuery is required' }, { status: 400 });
    }

    const matchedCustomers = await getMatchingCustomers(filterQuery);

    const count = matchedCustomers.length;
    const sample = matchedCustomers.slice(0, 5).map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      city: c.city,
      channel: c.channel,
      totalSpend: parseFloat(c.orders.reduce((sum, o) => sum + o.amount, 0).toFixed(2)),
      orderCount: c.orders.length
    }));

    return NextResponse.json({
      count,
      sample
    });
  } catch (error: any) {
    console.error('Error previewing segment:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
