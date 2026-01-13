import { randomUUID } from 'crypto';

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return randomUUID();
}

/**
 * Validate URL format
 */
export function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Sanitize URL to prevent XSS
 */
export function sanitizeUrl(urlString: string): string {
  const url = urlString.trim();
  // Prevent javascript: and data: protocols
  if (url.toLowerCase().startsWith('javascript:') || 
      url.toLowerCase().startsWith('data:') ||
      url.toLowerCase().startsWith('vbscript:')) {
    throw new Error('Invalid URL protocol');
  }
  return url;
}

/**
 * Calculate session expiration timestamp (5 minutes from now)
 */
export function getSessionExpiration(): number {
  return Date.now() + (5 * 60 * 1000); // 5 minutes in milliseconds
}

/**
 * Check if session has expired
 */
export function isSessionExpired(expirationTimestamp: number): boolean {
  return Date.now() > expirationTimestamp;
}
