import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { callGemini } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignId } = body;

    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 });
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        segment: true,
        messages: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const totalMessages = campaign.messages.length;
    if (totalMessages === 0) {
      return NextResponse.json({ summary: "No messages sent yet. Send the campaign to generate performance insights." });
    }

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

    const dataPrompt = `
      Campaign Name: ${campaign.name}
      Channel: ${campaign.channel}
      Segment Name: ${campaign.segment.name}
      Segment Query (NL): ${campaign.segment.nlQuery || 'N/A'}
      Message: "${campaign.message}"
      Total Target Audience: ${totalMessages}
      
      Delivery Stats:
      - Sent: ${sent}
      - Delivered: ${delivered}
      - Opened: ${opened}
      - Read: ${read}
      - Clicked: ${clicked}
      - Failed: ${failed}
    `;

    const systemInstruction = `You are a CRM analytics assistant. Analyze the campaign results provided. Write a 2-3 sentence human-readable, professional, and actionable marketing insight summary. Point out any success metrics (like open rates or click-through rates) or failure issues (like bounce rates) and suggest a next step. Keep the tone encouraging and analytical.

Return a JSON object with a single field "summary".`;

    const responseSchema = {
      type: "OBJECT",
      properties: {
        summary: { type: "STRING", description: "A 2-3 sentence analysis and action recommendation based on the campaign stats" }
      },
      required: ["summary"]
    };

    const aiResponseText = await callGemini(
      `Analyze these campaign stats:\n${dataPrompt}`,
      systemInstruction,
      responseSchema
    );

    let result: any = {};
    try {
      result = JSON.parse(aiResponseText);
      if (!result.summary) {
        result = {
          summary: result.text || result.message || aiResponseText
        };
      }
    } catch (e) {
      result = {
        summary: aiResponseText
      };
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in AI insights route:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
