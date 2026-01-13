'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

type SessionState = 'loading' | 'ready' | 'waiting' | 'received' | 'error';

interface SessionData {
  sessionId: string;
  url: string;
  expiresAt: number;
}

export default function Home() {
  const [state, setState] = useState<SessionState>('loading');
  const [session, setSession] = useState<SessionData | null>(null);
  const [receivedLink, setReceivedLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  const createNewSession = async () => {
    try {
      setState('loading');
      setError(null);
      setReceivedLink(null);

      // Close existing EventSource if any
      if (eventSource) {
        eventSource.close();
      }

      const response = await fetch('/api/session', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const data = await response.json();
      setSession(data);
      setState('ready');

      // Start listening for links
      listenForLink(data.sessionId);
    } catch (err) {
      console.error('Error creating session:', err);
      setError('Failed to create session. Please try again.');
      setState('error');
    }
  };

  const listenForLink = (sessionId: string) => {
    setState('waiting');

    // Add a small delay to ensure session is created before SSE connects
    setTimeout(() => {
      const es = new EventSource(`/api/listen/${sessionId}`);

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'connected':
              console.log('SSE connected for session:', sessionId);
              break;
            case 'link':
              setReceivedLink(data.link);
              setState('received');
              // Open link in new tab
              window.open(data.link, '_blank', 'noopener,noreferrer');
              es.close();
              break;
            case 'timeout':
              setError('Session expired. Please generate a new code.');
              setState('error');
              es.close();
              break;
            case 'error':
              console.error('SSE error:', data.message);
              setError(data.message || 'An error occurred');
              setState('error');
              es.close();
              break;
          }
        } catch (err) {
          console.error('Error parsing SSE message:', err);
        }
      };

      es.onerror = (err) => {
        console.error('SSE connection error:', err);
        setError('Connection lost. Please generate a new code.');
        setState('error');
        es.close();
      };

      setEventSource(es);
    }, 100); // 100ms delay to avoid race condition
  };

  useEffect(() => {
    createNewSession();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getTimeRemaining = () => {
    if (!session) return '';
    const remaining = Math.max(0, session.expiresAt - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining());
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              QR Link Share
            </h1>
            <p className="text-gray-600">
              Share links from your mobile device to this PC
            </p>
          </div>

          {state === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mb-4"></div>
              <p className="text-gray-600">Generating QR code...</p>
            </div>
          )}

          {(state === 'ready' || state === 'waiting') && session && (
            <div className="flex flex-col items-center">
              <div className="bg-white p-6 rounded-xl shadow-inner mb-6">
                <QRCodeSVG
                  value={session.url}
                  size={256}
                  level="M"
                  includeMargin={true}
                />
              </div>

              <div className="text-center mb-6">
                <p className="text-lg font-semibold text-gray-800 mb-2">
                  Scan this QR code with your mobile device
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Or visit: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{session.url}</code>
                </p>
                {timeRemaining && (
                  <p className="text-sm text-gray-500">
                    Expires in: <span className="font-mono font-semibold">{timeRemaining}</span>
                  </p>
                )}
              </div>

              {state === 'waiting' && (
                <div className="flex items-center justify-center space-x-2 mb-6">
                  <div className="animate-pulse h-3 w-3 bg-indigo-600 rounded-full"></div>
                  <p className="text-gray-600">Waiting for link...</p>
                </div>
              )}

              <button
                onClick={createNewSession}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                Generate New Code
              </button>
            </div>
          )}

          {state === 'received' && receivedLink && (
            <div className="text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Link Received!
                </h2>
                <p className="text-gray-600 mb-4">
                  Opening in new tab...
                </p>
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <p className="text-sm text-gray-500 mb-1">Received link:</p>
                  <a
                    href={receivedLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 break-all text-sm font-mono"
                  >
                    {receivedLink}
                  </a>
                </div>
              </div>
              <button
                onClick={createNewSession}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                Share Another Link
              </button>
            </div>
          )}

          {state === 'error' && (
            <div className="text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
                  <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Error
                </h2>
                <p className="text-red-600 mb-6">
                  {error}
                </p>
              </div>
              <button
                onClick={createNewSession}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        <div className="text-center mt-6 text-sm text-gray-600">
          <p>Safe and secure • No authentication required • Auto-expires in 5 minutes</p>
        </div>
      </div>
    </div>
  );
}
