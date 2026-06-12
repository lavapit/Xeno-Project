import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMatchingCustomers } from '@/lib/segmentHelper';
import { sendToChannelService } from '@/lib/channel';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: { segment: true },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (campaign.status !== 'draft') {
      return NextResponse.json({ error: 'Campaign has already been sent' }, { status: 400 });
    }

    const matchedCustomers = await getMatchingCustomers(campaign.segment.filterQuery);

    if (matchedCustomers.length === 0) {
      return NextResponse.json({ error: 'No customers found in this segment' }, { status: 400 });
    }

    await prisma.campaign.update({
      where: { id },
      data: {
        status: 'sending',
        sentAt: new Date(),
      },
    });

    // Start sending messages in the background (fire-and-forget)
    (async () => {
      try {
        let sentCount = 0;
        let failedCount = 0;

        for (const customer of matchedCustomers) {
          const message = await prisma.message.create({
            data: {
              campaignId: campaign.id,
              customerId: customer.id,
              channel: campaign.channel,
              status: 'pending',
            },
          });

          const recipient = campaign.channel === 'email' ? customer.email : (customer.phone || customer.email);

          const result = await sendToChannelService(
            message.id,
            recipient,
            campaign.message,
            campaign.channel
          );

          if (result.success) {
            await prisma.message.update({
              where: { id: message.id },
              data: { status: 'sent', sentAt: new Date() },
            });
            sentCount++;
          } else {
            await prisma.message.update({
              where: { id: message.id },
              data: { status: 'failed' },
            });
            failedCount++;
          }
        }

        // Once the initialization/sending loop is complete, mark the campaign status
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: 'sent' },
        });

        console.log(`Campaign ${campaign.name} sending completed: ${sentCount} sent, ${failedCount} failed.`);
      } catch (err) {
        console.error(`Error in async campaign send:`, err);
      }
    })();

    return NextResponse.json({ success: true, message: 'Campaign sending started' });
  } catch (error: any) {
    console.error('Error sending campaign:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
