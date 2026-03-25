import { execSync } from 'child_process';

interface PrinterInfo {
  name: string;
  queueLength: number;
  isEnabled: boolean;
}

let lastSelectedIndex = 0;

export function getAvailablePrinters(): PrinterInfo[] {
  try {
    const output = execSync('lpstat -p 2>/dev/null || true', { encoding: 'utf-8' });
    const printers: PrinterInfo[] = [];

    for (const line of output.split('\n')) {
      const match = line.match(/^printer\s+(\S+)\s+/);
      if (match) {
        const name = match[1];
        const isEnabled = !line.includes('disabled');
        let queueLength = 0;
        try {
          const queueOutput = execSync(`lpstat -o ${name} 2>/dev/null | wc -l`, { encoding: 'utf-8' });
          queueLength = parseInt(queueOutput.trim()) || 0;
        } catch {
          // ignore
        }
        printers.push({ name, queueLength, isEnabled });
      }
    }
    return printers;
  } catch {
    return [];
  }
}

export function selectBestPrinter(): string | null {
  const printers = getAvailablePrinters().filter(p => p.isEnabled);
  if (printers.length === 0) {
    // Try default printer
    try {
      const output = execSync('lpstat -d 2>/dev/null', { encoding: 'utf-8' });
      const match = output.match(/system default destination:\s+(\S+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  // Find printer with shortest queue
  const minQueue = Math.min(...printers.map(p => p.queueLength));
  const candidates = printers.filter(p => p.queueLength === minQueue);

  // Round-robin among equal candidates
  lastSelectedIndex = (lastSelectedIndex + 1) % candidates.length;
  return candidates[lastSelectedIndex].name;
}
