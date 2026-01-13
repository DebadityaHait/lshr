'use client';

import { useState, FormEvent } from 'react';
import { useParams } from 'next/navigation';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

export default function SubmitPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [link, setLink] = useState('');
  const [state, setState] = useState<SubmitState>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!link.trim()) {
      setError('Please enter a link');
      return;
    }

    try {
      setState('submitting');
      setError(null);

      const response = await fetch(`/api/submit/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ link: link.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send link');
      }

      setState('success');
      setLink('');
    } catch (err) {
      console.error('Error submitting link:', err);
      setError(err instanceof Error ? err.message : 'Failed to send link');
      setState('error');
    }
  };

  const handleReset = () => {
    setState('idle');
    setError(null);
    setLink('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Send Link to PC
            </h1>
            <p className="text-gray-600 text-sm">
              Paste or enter the link you want to send
            </p>
          </div>

          {state === 'idle' || state === 'submitting' || state === 'error' ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="link" className="block text-sm font-medium text-gray-700 mb-2">
                  Link URL
                </label>
                <input
                  type="text"
                  id="link"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-gray-900"
                  disabled={state === 'submitting'}
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={state === 'submitting' || !link.trim()}
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                {state === 'submitting' ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </span>
                ) : (
                  'Send to PC'
                )}
              </button>
            </form>
          ) : (
            <div className="text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Link Sent!
                </h2>
                <p className="text-gray-600">
                  Your link has been sent to your PC and should open automatically.
                </p>
              </div>
              <button
                onClick={handleReset}
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                Send Another Link
              </button>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center text-xs text-gray-500 space-y-2">
              <p>🔒 Your link is transmitted securely</p>
              <p>⏱️ Session expires after 5 minutes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
