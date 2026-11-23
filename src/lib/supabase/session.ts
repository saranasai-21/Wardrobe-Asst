/**
 * Single Active Session & Persistent Auth Manager
 * Ensures:
 * 1. User stays always logged in on this browser (persistent cookie + 1 year expiration)
 * 2. If logged in on another device/browser, the previous session is invalidated & forced out.
 */

import { createClient } from './client';
import { UserSessionRecord } from '@/types/database';

const SESSION_COOKIE_NAME = 'vault_session_id';
const BROADCAST_CHANNEL_NAME = 'wardrobelab_session_sync';

/**
 * Generate a cryptographically secure random session ID
 */
export function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
}

/**
 * Get the current device's local session ID from cookie / storage
 */
export function getLocalSessionId(): string | null {
  if (typeof window === 'undefined') return null;

  // 1. Check document.cookie
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${SESSION_COOKIE_NAME}=`));
  if (match) {
    return match.split('=')[1];
  }

  // 2. Check localStorage fallback
  return localStorage.getItem(SESSION_COOKIE_NAME);
}

/**
 * Save the session ID locally with 1-year persistent expiration
 */
export function setLocalSessionId(sessionId: string): void {
  if (typeof window === 'undefined') return;

  // 1 Year persistent cookie
  const oneYearSeconds = 60 * 60 * 24 * 365;
  document.cookie = `${SESSION_COOKIE_NAME}=${sessionId}; path=/; max-age=${oneYearSeconds}; SameSite=Lax`;

  try {
    localStorage.setItem(SESSION_COOKIE_NAME, sessionId);
  } catch (e) {
    // Ignore storage quota errors
  }
}

/**
 * Clear local session ID on explicit logout
 */
export function clearLocalSessionId(): void {
  if (typeof window === 'undefined') return;
  document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
  try {
    localStorage.removeItem(SESSION_COOKIE_NAME);
  } catch (e) {}
}

/**
 * Register a newly created active session in Supabase & notify other tabs
 */
export async function registerNewActiveSession(
  userId: string,
  newSessionId?: string
): Promise<string> {
  const sessionId = newSessionId || generateSessionId();
  setLocalSessionId(sessionId);

  // Broadcast to other open tabs/windows on this machine to log out if they had an older session
  notifyLocalTabsOfNewLogin(userId, sessionId);

  // Sync with Supabase PostgreSQL
  const supabase = createClient();
  try {
    const { error } = await supabase.from('user_sessions').upsert(
      {
        user_id: userId,
        session_id: sessionId,
        device_info: typeof navigator !== 'undefined' ? navigator.userAgent : 'Browser',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    if (error) {
      console.warn('Could not record active session to Supabase:', error.message);
    }
  } catch (err) {
    console.warn('Active session sync warning:', err);
  }

  return sessionId;
}

/**
 * Check if this local device session is still the single active session
 */
export async function verifyActiveSession(
  userId: string,
  currentLocalSessionId: string
): Promise<boolean> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('session_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      // In case table or connection is not reachable, do not force logout
      return true;
    }

    if (!data) {
      // No active session record registered yet, so current session is valid
      return true;
    }

    // Check if the session in the database matches this device
    return data.session_id === currentLocalSessionId;
  } catch (err) {
    return true;
  }
}

/**
 * BroadcastChannel for instant real-time notification across tabs/windows
 */
let sessionChannel: BroadcastChannel | null = null;

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    return null;
  }
  if (!sessionChannel) {
    sessionChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  }
  return sessionChannel;
}

export function notifyLocalTabsOfNewLogin(userId: string, newSessionId: string): void {
  const channel = getBroadcastChannel();
  if (channel) {
    channel.postMessage({
      type: 'NEW_LOGIN',
      userId,
      newSessionId,
      timestamp: Date.now(),
    });
  }
}

export function subscribeToSessionChannel(
  currentUserId: string,
  onConcurrentLoginDetected: () => void
): () => void {
  const channel = getBroadcastChannel();
  if (!channel) return () => {};

  const listener = (event: MessageEvent) => {
    const { type, userId, newSessionId } = event.data || {};
    const localId = getLocalSessionId();

    if (
      type === 'NEW_LOGIN' &&
      userId === currentUserId &&
      newSessionId &&
      localId &&
      newSessionId !== localId
    ) {
      onConcurrentLoginDetected();
    }
  };

  channel.addEventListener('message', listener);

  return () => {
    channel.removeEventListener('message', listener);
  };
}
