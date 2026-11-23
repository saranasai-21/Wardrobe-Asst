'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  getLocalSessionId,
  clearLocalSessionId,
  verifyActiveSession,
  subscribeToSessionChannel,
} from '@/lib/supabase/session';

interface SessionGuardProps {
  userId: string;
}

export function SessionGuard({ userId }: SessionGuardProps) {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (!userId || userId === 'guest-user' || userId === 'demo-user-id') return;

    let isMounted = true;
    const localSessionId = getLocalSessionId();

    const handleForceLogout = async () => {
      clearLocalSessionId();
      try {
        await supabase.auth.signOut();
      } catch (e) {}

      if (isMounted) {
        router.push('/login?reason=concurrent_session');
        router.refresh();
      }
    };

    // 1. Instant Cross-Tab / Cross-Window BroadcastChannel sync
    const unsubscribeBroadcast = subscribeToSessionChannel(userId, () => {
      handleForceLogout();
    });

    // 2. Supabase Realtime channel across different devices/browsers
    const realtimeChannel = supabase
      .channel(`active-session-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_sessions',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          const newSessionId = payload.new?.session_id;
          const currentLocalId = getLocalSessionId();
          if (newSessionId && currentLocalId && newSessionId !== currentLocalId) {
            handleForceLogout();
          }
        }
      )
      .subscribe();

    // 3. Periodic verification heartbeat (every 15s) in case websocket reconnects
    const interval = setInterval(async () => {
      const currentLocalId = getLocalSessionId();
      if (!currentLocalId) return;

      const isValid = await verifyActiveSession(userId, currentLocalId);
      if (!isValid) {
        handleForceLogout();
      }
    }, 15000);

    return () => {
      isMounted = false;
      unsubscribeBroadcast();
      clearInterval(interval);
      supabase.removeChannel(realtimeChannel);
    };
  }, [userId, router, supabase]);

  return null;
}
