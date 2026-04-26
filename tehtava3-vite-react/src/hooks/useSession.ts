import { useState, useEffect } from 'react';
import type { Session } from '../types/Session';
import { subscribeToSession } from '../services/gameSessionService';

/**
 * Real-time session listener hook.
 * Returns null while loading or when session does not exist.
 */
export function useSession(sessionId: string | null): Session | null {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setSession(null);
      return;
    }
    const unsub = subscribeToSession(sessionId, setSession);
    return unsub;
  }, [sessionId]);

  return session;
}
