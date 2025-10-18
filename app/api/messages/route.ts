import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { messagingService } from '@/lib/services/messaging';
import { sendMessageSchema } from '@/lib/validations/messaging';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = sendMessageSchema.parse(body);

    const message = await messagingService.sendMessage(
      validatedData,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      data: message,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('Thread not found')) {
        return NextResponse.json(
          { error: 'Thread not found' },
          { status: 404 }
        );
      }
      
      if (error.message.includes('not a participant')) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}