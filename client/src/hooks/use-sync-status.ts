'use client';

import { useState, useEffect } from 'react';
import { onSyncStatusChange, initSync } from '@/lib/sync';

export type SyncStatus = 'connected' | 'disconnected' | 'connecting';

export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>('connecting');

  useEffect(() => {
    initSync();
    const unsub = onSyncStatusChange(setStatus);
    return unsub;
  }, []);

  return status;
}
