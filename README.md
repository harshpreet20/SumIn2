# SumIn2

Offline-first prescription management system for healthcare camps. Works entirely on a local network (LAN) with no internet required. Doctors create prescriptions on any device, data syncs in real-time across all connected devices via CRDTs, and prescriptions print directly to CUPS printers.

## Features

- **Offline-First** — Full functionality without network. Data stored locally in IndexedDB via Dexie.js
- **Real-Time LAN Sync** — Yjs CRDTs ensure conflict-free sync across all devices on the same network
- **CUPS Printing** — Print prescriptions directly to connected printers with automatic load balancing
- **PWA** — Install as a native-like app on any device (mobile, tablet, desktop)
- **Data Import** — Upload historical patient data from CSV, Excel, or PDF files
- **Health Analytics** — Trends, demographics, department breakdowns, and area health metrics
- **Keyboard-First UX** — Command palette (Cmd+K), auto-focus, tab navigation for fast data entry
- **Multi-Platform** — Works on macOS, Windows, and Linux simultaneously
- **mDNS Discovery** — Devices auto-discover the server via `healthcamp.local`

## Architecture

```
                        LAN (WiFi / Hotspot)

  ┌──────────┐    ┌──────────┐    ┌──────────┐
  │ Doctor 1 │    │ Doctor 2 │    │ Doctor N │    (PWA in browser)
  │ IndexedDB│    │ IndexedDB│    │ IndexedDB│
  └────┬─────┘    └────┬─────┘    └────┬─────┘
       │               │               │
       └───────────┬───┴───────────────┘
             WebSocket + REST
       ┌───────────┴───────────┐
       │    Node.js Server     │
       │  Express  │ WebSocket │
       │  SQLite   │ CUPS      │
       │  mDNS     │           │
       └───────────┬───────────┘
                   │
            ┌──────┴──────┐
            │   Printers  │
            │  (via CUPS) │
            └─────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TailwindCSS 4, shadcn/ui |
| Local DB | Dexie.js (IndexedDB) |
| Sync | Yjs (CRDT) + WebSocket |
| Backend | Express 4, better-sqlite3 |
| Printing | CUPS via `lp` command |
| Discovery | Bonjour/mDNS (Avahi) |
| Forms | React Hook Form + Zod |
| Charts | Recharts |

## Prerequisites

- **Node.js** >= 22
- **npm** >= 10
- **CUPS** (for printing) — pre-installed on most Linux/macOS systems
- **Avahi** (for mDNS discovery) — `sudo apt install avahi-daemon` on Debian/Ubuntu

## Quick Start

```bash
# Clone
git clone https://github.com/harshpreet20/SumIn2.git
cd SumIn2

# Install all dependencies (root + client + server)
npm install

# Run both client and server
npm run dev
```

The client runs at **http://localhost:3000** and the server at **http://localhost:3001**.

## Available Scripts

### Root

| Script | Command | Description |
|--------|---------|-------------|
| `npm run dev` | `concurrently` | Run client + server together |
| `npm run dev:client` | `npm -w client run dev` | Run client only |
| `npm run dev:server` | `npm -w server run dev` | Run server only |
| `npm run build` | `npm -w client run build` | Build client for production |
| `npm run start` | `npm -w server run start` | Start server in production |

### Client (`client/`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js dev server (port 3000) |
| `npm run build` | Build static export to `out/` |
| `npm run lint` | Run ESLint |

### Server (`server/`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start with file watching (tsx watch) |
| `npm run start` | Start server (tsx) |
| `npm run build` | Compile TypeScript to `dist/` |

## Project Structure

```
SumIn2/
├── package.json                 # Monorepo workspace config
├── client/                      # Next.js PWA frontend
│   ├── src/
│   │   ├── app/                 # Pages (dashboard, prescriptions, reports, import)
│   │   ├── components/          # UI components (forms, tables, layout, dashboard)
│   │   ├── hooks/               # React hooks (sync status, prescriptions)
│   │   ├── lib/                 # Core libs (db.ts, sync.ts, api.ts)
│   │   └── types/               # TypeScript types
│   └── public/                  # PWA manifest, service worker, icons
├── server/                      # Express backend
│   ├── src/
│   │   ├── routes/              # REST endpoints
│   │   ├── db/                  # SQLite schema + connection
│   │   ├── sync/                # Yjs WebSocket server
│   │   ├── print/               # CUPS integration + load balancer
│   │   ├── import/              # CSV/Excel/PDF parser
│   │   ├── analytics/           # Health metrics + trends
│   │   └── discovery/           # mDNS advertisement
│   └── templates/               # Print templates (A4 HTML)
└── shared/                      # Shared types between client/server
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard — stats, recent prescriptions, quick actions |
| `/prescriptions` | All prescriptions — searchable, sortable table |
| `/prescriptions/new` | New prescription form (keyboard-optimized) |
| `/import` | Upload CSV/Excel/PDF historical patient data |
| `/reports` | Analytics — trends, demographics, department stats |

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server HTTP port |
| `HOST` | `0.0.0.0` | Server bind address |

### Departments

12 departments are configured by default (editable via settings):

1. General Medicine
2. Gynecologist (Women)
3. Dental (Teeth)
4. Ophthalmologist (Eye)
5. Ortho & Physio (Bones)
6. Psychology/Counseling
7. Physiotherapy
8. Acupressure
9. ECG
10. BP & Sugar
11. Pharmacy
12. Medico Legal Aid

Departments are stored in the server's `camp_config` table and can be updated via `PUT /api/config`.

### Registration Numbers

Auto-generated in the format `HC-YYYYMMDD-NNN` (e.g., `HC-20260328-001`). The server assigns the next sequential number.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/prescriptions` | List prescriptions (pagination, search) |
| `GET` | `/api/prescriptions/:id` | Get single prescription |
| `POST` | `/api/prescriptions` | Create prescription |
| `PUT` | `/api/prescriptions/:id` | Update prescription |
| `POST` | `/api/prescriptions/:id/print` | Print via CUPS |
| `GET` | `/api/print/status/:jobId` | Print job status |
| `GET` | `/api/printers` | List CUPS printers |
| `POST` | `/api/import` | Upload data file (multipart) |
| `GET` | `/api/analytics/trends` | Health trend data |
| `GET` | `/api/analytics/departments` | Department statistics |
| `GET` | `/api/analytics/demographics` | Demographics breakdown |
| `GET` | `/api/config` | Get camp config |
| `PUT` | `/api/config` | Update camp config |

**WebSocket:** `ws://<server>:3001/sync` — Yjs sync protocol

## Printing Setup

1. Ensure CUPS is installed and running:
   ```bash
   sudo systemctl start cups
   ```
2. Add your printer(s) via CUPS web interface at `http://localhost:631` or via `lpadmin`
3. The server auto-detects all CUPS printers via `lpstat`
4. When multiple printers are available, the load balancer routes jobs to the printer with the shortest queue

## Deploying for a Health Camp

1. **Server machine** — Run the server on a laptop connected to printer(s):
   ```bash
   cd SumIn2
   npm install
   npm run dev
   ```

2. **Set hostname** (for mDNS discovery):
   ```bash
   sudo hostnamectl set-hostname healthcamp
   sudo systemctl enable --now avahi-daemon
   ```

3. **Create a WiFi hotspot** or connect all devices to the same router/switch

4. **Client devices** — Open a browser on any device and navigate to:
   - `http://healthcamp.local:3000` (if mDNS works), or
   - `http://<server-ip>:3000` (use the server's LAN IP address)

5. **Install as PWA** — Click "Add to Home Screen" in the browser for a native app experience

All devices work offline. Data syncs automatically when connected to the LAN.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open command palette |
| `Cmd/Ctrl + N` | New prescription |
| `Cmd/Ctrl + P` | Print current prescription |
| `Tab` | Next field in form |
| `Escape` | Close modal / command palette |

## License

MIT
