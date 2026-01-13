import { NextResponse } from 'next/server';
import { generateSessionId, getSessionExpiration } from '@/lib/utils';
import { createSession } from '@/lib/storage';
import { checkRateLimit } from '@/lib/rate-limiter';

export async function POST(request: Request) {
  try {
    // Get client IP for rate limiting
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    
    // Rate limiting: 10 sessions per minute per IP
    if (!checkRateLimit(`session-${ip}`, 10, 60000)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Generate session
    const sessionId = generateSessionId();
    const expiresAt = getSessionExpiration();
    
    // Store session
    await createSession(sessionId, expiresAt);
    
    return NextResponse.json({
      sessionId,
      expiresAt,
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/submit/${sessionId}`,
    });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
