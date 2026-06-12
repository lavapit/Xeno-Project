import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        segment: true,
        messages: {
          include: {
            customer: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
          orderBy: {
            updatedAt: 'desc',
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const totalMessages = campaign.messages.length;
    
    const statusCounts = campaign.messages.reduce((acc, msg) => {
      acc[msg.status] = (acc[msg.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sent = statusCounts['sent'] || 0;
    const delivered = statusCounts['delivered'] || 0;
    const opened = statusCounts['opened'] || 0;
    const read = statusCounts['read'] || 0;
    const clicked = statusCounts['clicked'] || 0;
    const failed = statusCounts['failed'] || 0;
    const pending = statusCounts['pending'] || 0;

    return NextResponse.json({
      ...campaign,
      stats: {
        total: totalMessages,
        sent,
        delivered,
        opened,
        read,
        clicked,
        failed,
        pending,
      },
    });
  } catch (error: any) {
    console.error('Error fetching campaign details:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
