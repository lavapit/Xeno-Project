import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { segmentDescription, channel, brandName = 'Velara' } = body;

    if (!segmentDescription || !channel) {
      return NextResponse.json({ error: 'segmentDescription and channel are required' }, { status: 400 });
    }

    const systemInstruction = `You are a marketing copywriter for ${brandName}, a premium DTC fashion brand.
Write a short, warm, personalized message for this audience: ${segmentDescription}
Channel: ${channel}
Rules:
- WhatsApp: conversational, under 160 chars, can use 1-2 emojis, direct.
- SMS: under 140 chars, no emojis, include a clear CTA.
- Email: slightly longer, friendly subject line + 2-3 sentence body.

You must return a valid JSON object matching the requested schema.`;

    const responseSchema = {
      type: "OBJECT",
      properties: {
        subject: { type: "STRING", description: "Subject line of the message (only for email, leave empty for whatsapp/sms)" },
        body: { type: "STRING", description: "Main text content of the message" }
      },
      required: ["subject", "body"]
    };

    const aiResponseText = await callGemini(
      `Generate a message for: ${segmentDescription} on channel: ${channel}`,
      systemInstruction,
      responseSchema
    );

    let result: any = {};
    try {
      result = JSON.parse(aiResponseText);
      if (!result.body) {
        result = {
          subject: result.subject || "",
          body: result.text || result.message || aiResponseText
        };
      }
    } catch (e) {
      result = {
        subject: "",
        body: aiResponseText
      };
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in AI message route:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
