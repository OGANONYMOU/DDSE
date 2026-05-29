// Supabase Realtime subscription hook.
// Subscribes to a postgres_changes channel for a given table and returns
// a live event stream. Falls back gracefully when Supabase is unavailable.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase, supabaseMisconfigured } from '../lib/supabase';

export type RealtimeEvent<T = Record<string, unknown>> = {
  type:      'INSERT' | 'UPDATE' | 'DELETE';
  table:     string;
  record:    T;
  oldRecord: Partial<T>;
  receivedAt: number;
};

export type RealtimeStatus = 'connecting' | 'connected' | 'disconnected' | 'disabled';

export interface UseRealtimeOptions {
  table:   string;
  schema?: string;
  filter?: string;
  enabled?: boolean;
}

export interface UseRealtimeReturn<T = Record<string, unknown>> {
  events:      RealtimeEvent<T>[];
  latest:      RealtimeEvent<T> | null;
  status:      RealtimeStatus;
  clearEvents: () => void;
}

export function useRealtime<T = Record<string, unknown>>({
  table,
  schema  = 'public',
  filter,
  enabled = true,
}: UseRealtimeOptions): UseRealtimeReturn<T> {
  const [events,  setEvents]  = useState<RealtimeEvent<T>[]>([]);
  const [status,  setStatus]  = useState<RealtimeStatus>('disabled');
  const channelRef            = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const MAX_EVENTS            = 50;

  const clearEvents = useCallback(() => setEvents([]), []);

  useEffect(() => {
    if (!enabled || supabaseMisconfigured) {
      setStatus('disabled');
      return;
    }

    setStatus('connecting');

    const channelName = `ddse:${schema}:${table}${filter ? ':' + filter : ''}`;
    const channel = supabase.channel(channelName);

    channel
      .on(
        'postgres_changes' as Parameters<typeof channel.on>[0],
        {
          event:  '*',
          schema,
          table,
          ...(filter ? { filter } : {}),
        } as Parameters<typeof channel.on>[1],
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const event: RealtimeEvent<T> = {
            type:       payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            table:      payload.table,
            record:     (payload.new ?? {}) as T,
            oldRecord:  (payload.old ?? {}) as Partial<T>,
            receivedAt: Date.now(),
          };
          setEvents((prev) => [event, ...prev].slice(0, MAX_EVENTS));
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED')    setStatus('connected');
        if (status === 'CLOSED')        setStatus('disconnected');
        if (status === 'CHANNEL_ERROR') setStatus('disconnected');
      });

    channelRef.current = channel;

    return () => {
      void supabase.removeChannel(channel);
      channelRef.current = null;
      setStatus('disabled');
    };
  }, [table, schema, filter, enabled]);

  return {
    events,
    latest:      events[0] ?? null,
    status,
    clearEvents,
  };
}

// Convenience: watch multiple tables at once
export function useRealtimeMulti(
  tables: UseRealtimeOptions[],
): { events: RealtimeEvent[]; status: RealtimeStatus } {
  const [allEvents, setAllEvents] = useState<RealtimeEvent[]>([]);
  const [status,    setStatus]    = useState<RealtimeStatus>('disabled');

  const singleResults = tables.map(
    // Note: hooks can't be called conditionally but we call a fixed-length array
    // eslint-disable-next-line react-hooks/rules-of-hooks
    (opts) => useRealtime(opts)
  );

  useEffect(() => {
    const merged = singleResults
      .flatMap((r) => r.events)
      .sort((a, b) => b.receivedAt - a.receivedAt)
      .slice(0, 100);
    setAllEvents(merged);

    const statuses = singleResults.map((r) => r.status);
    if (statuses.some((s) => s === 'connected'))     setStatus('connected');
    else if (statuses.some((s) => s === 'connecting')) setStatus('connecting');
    else if (statuses.every((s) => s === 'disabled'))  setStatus('disabled');
    else setStatus('disconnected');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [singleResults.map((r) => r.events).join()]);

  return { events: allEvents, status };
}
