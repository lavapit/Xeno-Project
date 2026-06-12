import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, status } = body;

    if (!messageId || !status) {
      return NextResponse.json({ error: 'messageId and status are required' }, { status: 400 });
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        status,
      },
    });

    return NextResponse.json({ success: true, message: 'Status updated', data: updatedMessage });
  } catch (error: any) {
    console.error('Error in receipt webhook:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
