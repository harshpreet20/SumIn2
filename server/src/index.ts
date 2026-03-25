import http from 'http';
import { app } from './app.js';
import { setupWebSocketServer } from './sync/ws-server.js';
import { advertiseMdns } from './discovery/mdns.js';
import { getDb } from './db/connection.js';

const PORT = parseInt(process.env.PORT || '3001');
const HOST = process.env.HOST || '0.0.0.0';

// Initialize database
getDb();
console.log('Database initialized');

// Create HTTP server
const server = http.createServer(app);

// Attach WebSocket server
setupWebSocketServer(server, '/sync');

// Start server
server.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
  console.log(`WebSocket sync at ws://${HOST}:${PORT}/sync`);

  // Start mDNS advertisement
  advertiseMdns(PORT);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down...');
  server.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Shutting down...');
  server.close();
  process.exit(0);
});
