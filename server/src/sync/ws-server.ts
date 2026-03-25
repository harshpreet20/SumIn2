import { WebSocketServer, WebSocket } from 'ws';
import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import { getDb } from '../db/connection.js';

const messageSync = 0;
const messageAwareness = 1;

interface WSConnection extends WebSocket {
  isAlive?: boolean;
  docName?: string;
}

// In-memory Yjs documents
const docs = new Map<string, Y.Doc>();
const conns = new Map<string, Set<WSConnection>>();

function getOrCreateDoc(docName: string): Y.Doc {
  let doc = docs.get(docName);
  if (!doc) {
    doc = new Y.Doc();
    docs.set(docName, doc);

    // Load persisted state
    try {
      const db = getDb();
      const row = db.prepare('SELECT state FROM sync_metadata WHERE doc_name = ?').get(docName) as { state: Buffer } | undefined;
      if (row) {
        Y.applyUpdate(doc, new Uint8Array(row.state));
      }
    } catch {
      // No persisted state yet
    }

    // Persist on updates
    doc.on('update', () => {
      try {
        const db = getDb();
        const state = Y.encodeStateAsUpdate(doc!);
        db.prepare(`
          INSERT OR REPLACE INTO sync_metadata (doc_name, state, updated_at)
          VALUES (?, ?, datetime('now'))
        `).run(docName, Buffer.from(state));
      } catch (error) {
        console.error('Failed to persist Yjs state:', error);
      }
    });
  }
  return doc;
}

function broadcastUpdate(docName: string, update: Uint8Array, origin: WSConnection): void {
  const clients = conns.get(docName);
  if (!clients) return;

  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, messageSync);
  syncProtocol.writeUpdate(encoder, update);
  const message = encoding.toUint8Array(encoder);

  for (const client of clients) {
    if (client !== origin && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

export function setupWebSocketServer(server: any, path: string = '/sync'): WebSocketServer {
  const wss = new WebSocketServer({ server, path });

  wss.on('connection', (ws: WSConnection, req) => {
    const docName = new URL(req.url || '/', `http://${req.headers.host}`).searchParams.get('room') || 'prescriptions';
    ws.docName = docName;
    ws.isAlive = true;

    const doc = getOrCreateDoc(docName);

    // Track connection
    if (!conns.has(docName)) {
      conns.set(docName, new Set());
    }
    conns.get(docName)!.add(ws);

    // Send initial sync
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageSync);
    syncProtocol.writeSyncStep1(encoder, doc);
    ws.send(encoding.toUint8Array(encoder));

    ws.on('message', (data: Buffer) => {
      try {
        const decoder = decoding.createDecoder(new Uint8Array(data));
        const messageType = decoding.readVarUint(decoder);

        switch (messageType) {
          case messageSync: {
            const encoder = encoding.createEncoder();
            encoding.writeVarUint(encoder, messageSync);
            syncProtocol.readSyncMessage(decoder, encoder, doc, ws);
            if (encoding.length(encoder) > 1) {
              ws.send(encoding.toUint8Array(encoder));
            }
            break;
          }
          case messageAwareness: {
            // Broadcast awareness to all other clients
            const clients = conns.get(docName);
            if (clients) {
              for (const client of clients) {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                  client.send(data);
                }
              }
            }
            break;
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    // Listen for doc updates to broadcast
    const updateHandler = (update: Uint8Array, origin: any) => {
      if (origin !== ws) {
        broadcastUpdate(docName, update, ws);
      }
    };
    doc.on('update', updateHandler);

    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('close', () => {
      const clients = conns.get(docName);
      if (clients) {
        clients.delete(ws);
        if (clients.size === 0) {
          conns.delete(docName);
        }
      }
      doc.off('update', updateHandler);
    });
  });

  // Heartbeat
  const interval = setInterval(() => {
    wss.clients.forEach((ws: WSConnection) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => clearInterval(interval));

  console.log(`WebSocket sync server ready on ${path}`);
  return wss;
}

export function getConnectedClients(): number {
  let total = 0;
  for (const clients of conns.values()) {
    total += clients.size;
  }
  return total;
}
