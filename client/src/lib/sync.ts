'use client';

import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/sync';

let doc: Y.Doc | null = null;
let wsProvider: any = null;
let idbProvider: IndexeddbPersistence | null = null;
let statusListeners: ((status: 'connected' | 'disconnected' | 'connecting') => void)[] = [];

export function getDoc(): Y.Doc {
  if (!doc) {
    doc = new Y.Doc();
  }
  return doc;
}

export function getPrescriptionsArray(): Y.Array<any> {
  return getDoc().getArray('prescriptions');
}

export async function initSync(): Promise<void> {
  if (typeof window === 'undefined') return;

  const ydoc = getDoc();

  // IndexedDB persistence for offline
  idbProvider = new IndexeddbPersistence('healthcamp-sync', ydoc);

  // WebSocket connection
  connectWebSocket(ydoc);
}

function connectWebSocket(ydoc: Y.Doc): void {
  if (typeof window === 'undefined') return;

  const roomParam = encodeURIComponent('prescriptions');
  const wsUrl = `${WS_URL}?room=${roomParam}`;

  try {
    const ws = new WebSocket(wsUrl);
    let connected = false;

    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
      connected = true;
      notifyStatus('connected');

      // Send sync step 1
      const encoder = createSyncStep1(ydoc);
      ws.send(encoder);
    };

    ws.onmessage = (event) => {
      try {
        const data = new Uint8Array(event.data);
        handleSyncMessage(ydoc, data, ws);
      } catch (e) {
        console.error('Sync message error:', e);
      }
    };

    ws.onclose = () => {
      connected = false;
      notifyStatus('disconnected');
      // Reconnect after delay
      setTimeout(() => connectWebSocket(ydoc), 3000);
    };

    ws.onerror = () => {
      notifyStatus('disconnected');
    };

    wsProvider = ws;
  } catch {
    notifyStatus('disconnected');
    setTimeout(() => connectWebSocket(ydoc), 3000);
  }
}

// Simplified sync protocol helpers
function createSyncStep1(doc: Y.Doc): Uint8Array {
  const stateVector = Y.encodeStateVector(doc);
  // messageSync = 0, syncStep1 = 0
  const data = new Uint8Array(2 + stateVector.length);
  data[0] = 0; // messageSync
  data[1] = 0; // syncStep1
  data.set(stateVector, 2);
  return data;
}

function handleSyncMessage(doc: Y.Doc, data: Uint8Array, ws: WebSocket): void {
  if (data.length < 2) return;
  const messageType = data[0];
  if (messageType !== 0) return; // only handle sync messages

  const syncType = data[1];
  const payload = data.slice(2);

  switch (syncType) {
    case 0: // syncStep1 - they sent state vector, reply with update
      {
        const update = Y.encodeStateAsUpdate(doc, payload);
        const stateVector = Y.encodeStateVector(doc);
        // Send syncStep2 (update)
        const resp = new Uint8Array(2 + update.length);
        resp[0] = 0;
        resp[1] = 1; // syncStep2
        resp.set(update, 2);
        ws.send(resp);
        // Also send our state vector as syncStep1
        const sv = new Uint8Array(2 + stateVector.length);
        sv[0] = 0;
        sv[1] = 0;
        sv.set(stateVector, 2);
        ws.send(sv);
      }
      break;
    case 1: // syncStep2 - apply update
    case 2: // update
      Y.applyUpdate(doc, payload);
      break;
  }
}

export function onSyncStatusChange(listener: (status: 'connected' | 'disconnected' | 'connecting') => void): () => void {
  statusListeners.push(listener);
  return () => {
    statusListeners = statusListeners.filter(l => l !== listener);
  };
}

function notifyStatus(status: 'connected' | 'disconnected' | 'connecting'): void {
  for (const listener of statusListeners) {
    listener(status);
  }
}

export function addPrescriptionToSync(prescription: any): void {
  const arr = getPrescriptionsArray();
  arr.push([prescription]);

  // Broadcast update if connected
  if (wsProvider && wsProvider.readyState === WebSocket.OPEN) {
    const update = Y.encodeStateAsUpdate(getDoc());
    const msg = new Uint8Array(2 + update.length);
    msg[0] = 0; // messageSync
    msg[1] = 2; // update
    msg.set(update, 2);
    wsProvider.send(msg);
  }
}

export function destroySync(): void {
  if (wsProvider) {
    wsProvider.close();
    wsProvider = null;
  }
  if (idbProvider) {
    idbProvider.destroy();
    idbProvider = null;
  }
  if (doc) {
    doc.destroy();
    doc = null;
  }
}
