import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const orderCount = customer.orders.length;
    const totalSpend = customer.orders.reduce((sum, order) => sum + order.amount, 0);

    return NextResponse.json({
      ...customer,
      totalSpend: parseFloat(totalSpend.toFixed(2)),
      orderCount,
    });
  } catch (error: any) {
    console.error('Error fetching customer:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
