import { getSession } from '@/lib/storage';

export async function GET(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  const { sessionId } = params;

  // Set up SSE headers
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Helper function to send SSE message
      const sendMessage = (data: Record<string, unknown>) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // Send initial connection message
      sendMessage({ type: 'connected', sessionId });

      // Poll for link updates
      const pollInterval = 1000; // Check every second
      const maxDuration = 5 * 60 * 1000; // 5 minutes max
      const startTime = Date.now();

      const poll = async () => {
        try {
          // Check if we've exceeded max duration
          if (Date.now() - startTime > maxDuration) {
            sendMessage({ type: 'timeout', message: 'Session expired' });
            controller.close();
            return;
          }

          // Get session data
          const session = await getSession(sessionId);

          if (!session) {
            // Only send error after a few attempts to avoid race conditions
            const elapsed = Date.now() - startTime;
            if (elapsed > 3000) { // Wait 3 seconds before reporting error
              console.log(`Session ${sessionId} not found after ${elapsed}ms`);
              sendMessage({ type: 'error', message: 'Session not found or expired' });
              controller.close();
            } else {
              // Keep polling, session might not be created yet
              setTimeout(poll, pollInterval);
            }
            return;
          }

          // Check if link has been submitted
          if (session.link) {
            sendMessage({ type: 'link', link: session.link });
            controller.close();
            return;
          }

          // Continue polling
          setTimeout(poll, pollInterval);
        } catch (error) {
          console.error('Error polling session:', error);
          sendMessage({ type: 'error', message: 'Internal server error' });
          controller.close();
        }
      };

      // Start polling
      poll();
    },
    cancel() {
      // Cleanup when client disconnects
      console.log(`SSE connection closed for session: ${sessionId}`);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering in nginx
    },
  });
}
