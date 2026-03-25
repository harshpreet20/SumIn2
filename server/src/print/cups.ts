import { execSync } from 'child_process';
import { writeFileSync, unlinkSync, mkdirSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const TEMP_DIR = path.join(process.cwd(), 'tmp');

export function printHtml(html: string, printerName: string): { success: boolean; jobId?: string; error?: string } {
  try {
    mkdirSync(TEMP_DIR, { recursive: true });
    const tmpFile = path.join(TEMP_DIR, `print-${uuidv4()}.html`);
    writeFileSync(tmpFile, html, 'utf-8');

    try {
      const cmd = printerName
        ? `lp -d "${printerName}" -o media=A4 -o fit-to-page "${tmpFile}"`
        : `lp -o media=A4 -o fit-to-page "${tmpFile}"`;

      const output = execSync(cmd, { encoding: 'utf-8', timeout: 30000 });
      const jobMatch = output.match(/request id is (\S+)/);
      const jobId = jobMatch ? jobMatch[1] : undefined;

      return { success: true, jobId };
    } finally {
      try { unlinkSync(tmpFile); } catch { /* ignore */ }
    }
  } catch (error: any) {
    return { success: false, error: error.message || String(error) };
  }
}

export function getJobStatus(jobId: string): string {
  try {
    const output = execSync(`lpstat -o 2>/dev/null`, { encoding: 'utf-8' });
    if (output.includes(jobId)) {
      return 'printing';
    }
    return 'done';
  } catch {
    return 'unknown';
  }
}
