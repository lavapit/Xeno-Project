import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const total = await prisma.customer.count({ where });

    const customers = await prisma.customer.findMany({
      where,
      skip,
      take: limit,
      include: {
        orders: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedCustomers = customers.map((customer) => {
      const orderCount = customer.orders.length;
      const totalSpend = customer.orders.reduce((sum, order) => sum + order.amount, 0);
      const lastOrderAt = orderCount > 0 ? customer.orders[0].createdAt : null;

      // Omit detailed orders array in the list view
      const { orders, ...customerData } = customer;

      return {
        ...customerData,
        totalSpend: parseFloat(totalSpend.toFixed(2)),
        orderCount,
        lastOrderAt,
      };
    });

    return NextResponse.json({
      customers: formattedCustomers,
      total,
    });
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, channel, city } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        phone,
        channel: channel || 'whatsapp',
        city,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    console.error('Error creating customer:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
