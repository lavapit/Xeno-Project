import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMatchingCustomers } from '@/lib/segmentHelper';

export async function GET() {
  try {
    const segments = await prisma.segment.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    const segmentsWithCount = await Promise.all(
      segments.map(async (segment) => {
        const matches = await getMatchingCustomers(segment.filterQuery);
        return {
          ...segment,
          customerCount: matches.length,
        };
      })
    );

    return NextResponse.json(segmentsWithCount);
  } catch (error: any) {
    console.error('Error fetching segments:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, nlQuery, filterQuery } = body;

    if (!name || !filterQuery) {
      return NextResponse.json({ error: 'Name and filterQuery are required' }, { status: 400 });
    }

    const segment = await prisma.segment.create({
      data: {
        name,
        description: description || '',
        nlQuery: nlQuery || '',
        filterQuery,
      },
    });

    return NextResponse.json(segment, { status: 201 });
  } catch (error: any) {
    console.error('Error creating segment:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
