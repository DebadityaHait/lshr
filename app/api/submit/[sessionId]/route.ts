import { NextResponse } from 'next/server';
import { isValidUrl, sanitizeUrl } from '@/lib/utils';
import { getSession, storeLink } from '@/lib/storage';
import { checkRateLimit } from '@/lib/rate-limiter';

export async function POST(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    
    // Rate limiting: 5 submissions per minute per session
    if (!checkRateLimit(`submit-${sessionId}`, 5, 60000)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { link } = body;

    if (!link || typeof link !== 'string') {
      return NextResponse.json(
        { error: 'Link is required' },
        { status: 400 }
      );
    }

    // Sanitize and validate URL
    let sanitizedUrl: string;
    try {
      sanitizedUrl = sanitizeUrl(link);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid URL protocol' },
        { status: 400 }
      );
    }

    if (!isValidUrl(sanitizedUrl)) {
      return NextResponse.json(
        { error: 'Invalid URL format. Please provide a valid http or https URL.' },
        { status: 400 }
      );
    }

    // Check if session exists
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or expired' },
        { status: 404 }
      );
    }

    // Store the link
    const success = await storeLink(sessionId, sanitizedUrl);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to store link. Session may have expired.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Link sent successfully',
    });
  } catch (error) {
    console.error('Error submitting link:', error);
    return NextResponse.json(
      { error: 'Failed to submit link' },
      { status: 500 }
    );
  }
}
