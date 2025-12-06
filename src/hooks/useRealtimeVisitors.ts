import { useState, useEffect, useCallback } from 'react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/realtime-visitors`;

// Generate a unique session ID for this browser tab
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('visitor-session-id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    sessionStorage.setItem('visitor-session-id', sessionId);
  }
  return sessionId;
};

export const useRealtimeVisitors = () => {
  const [activeUsers, setActiveUsers] = useState<number>(16); // Default fallback before first fetch (minimum 16)
  const [isLoading, setIsLoading] = useState(true);

  // Send heartbeat to track this session (with AbortController support)
  const sendHeartbeat = useCallback(async (signal?: AbortSignal) => {
    try {
      const sessionId = getSessionId();
      const page = window.location.pathname;

      await fetch(`${FUNCTION_URL}?action=heartbeat&page=${encodeURIComponent(page)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ sessionId }),
        signal, // Pass AbortSignal to cancel request on unmount
      });
    } catch (error) {
      // Only log error if it's not an abort error
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Failed to send heartbeat:', error);
      }
    }
  }, []);

  // Fetch current active user count (with AbortController support)
  const fetchActiveUsers = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(`${FUNCTION_URL}?action=count`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        signal, // Pass AbortSignal to cancel request on unmount
      });

      if (!response.ok) {
        throw new Error('Failed to fetch active users');
      }

      const data = await response.json();

      // Only update state if the component is still mounted (signal not aborted)
      if (!signal?.aborted) {
        setActiveUsers(data.activeUsers);
        setIsLoading(false);
      }
    } catch (error) {
      // Only log error if it's not an abort error
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Failed to fetch active users:', error);
        // Keep the previous value or use fallback
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    }
  }, []);

  useEffect(() => {
    // Create AbortController for this effect
    const abortController = new AbortController();
    const signal = abortController.signal;

    // Initial heartbeat and fetch
    sendHeartbeat(signal);
    fetchActiveUsers(signal);

    // Send heartbeat every 30 seconds
    const heartbeatInterval = setInterval(() => sendHeartbeat(signal), 30000);

    // Fetch active users every 8 seconds (compound of last 30 minutes with fluctuations)
    const fetchInterval = setInterval(() => fetchActiveUsers(signal), 8000);

    // Cleanup on unmount
    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(fetchInterval);
      // Abort all pending requests
      abortController.abort();
    };
  }, [sendHeartbeat, fetchActiveUsers]);

  return { activeUsers, isLoading };
};
