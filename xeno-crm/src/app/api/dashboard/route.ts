import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const totalCustomers = await prisma.customer.count();
    const activeSegments = await prisma.segment.count();
    const campaignsSent = await prisma.campaign.count({
      where: {
        status: { in: ['sent', 'sending'] }
      }
    });

    const totalDelivered = await prisma.message.count({
      where: {
        status: { in: ['delivered', 'opened', 'read', 'clicked'] }
      }
    });

    const totalOpened = await prisma.message.count({
      where: {
        status: { in: ['opened', 'read', 'clicked'] }
      }
    });

    const averageOpenRate = totalDelivered > 0 
      ? Math.round((totalOpened / totalDelivered) * 100) 
      : 0;

    const recentCampaignsRaw = await prisma.campaign.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        segment: {
          select: { name: true }
        },
        messages: {
          select: { status: true }
        }
      }
    });

    const recentCampaigns = recentCampaignsRaw.map(campaign => {
      const total = campaign.messages.length;
      const statusCounts = campaign.messages.reduce((acc, msg) => {
        acc[msg.status] = (acc[msg.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const delivered = (statusCounts['delivered'] || 0) + (statusCounts['opened'] || 0) + (statusCounts['read'] || 0) + (statusCounts['clicked'] || 0);
      const opened = (statusCounts['opened'] || 0) + (statusCounts['read'] || 0) + (statusCounts['clicked'] || 0);

      return {
        id: campaign.id,
        name: campaign.name,
        channel: campaign.channel,
        status: campaign.status,
        createdAt: campaign.createdAt,
        segmentName: campaign.segment.name,
        total,
        delivered,
        opened
      };
    });

    const allStatuses = ['pending', 'sent', 'delivered', 'opened', 'read', 'clicked', 'failed'];
    const statusCountsRaw = await prisma.message.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    const statusCounts = allStatuses.reduce((acc, status) => {
      const found = statusCountsRaw.find(s => s.status === status);
      acc[status] = found ? found._count.id : 0;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      totalCustomers,
      activeSegments,
      campaignsSent,
      averageOpenRate,
      recentCampaigns,
      statusCounts
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
