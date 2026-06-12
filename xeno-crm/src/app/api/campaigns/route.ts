import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const campaigns = await prisma.campaign.findMany({
      include: {
        segment: {
          select: {
            name: true,
            nlQuery: true,
          },
        },
        messages: {
          select: {
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedCampaigns = campaigns.map((campaign) => {
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

      const { messages, ...campaignData } = campaign;

      return {
        ...campaignData,
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
      };
    });

    return NextResponse.json(formattedCampaigns);
  } catch (error: any) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, segmentId, message, channel } = body;

    if (!name || !segmentId || !message || !channel) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const campaign = await prisma.campaign.create({
      data: {
        name,
        segmentId,
        message,
        channel,
        status: 'draft',
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
