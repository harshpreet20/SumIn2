'use client';

import { useSyncStatus } from '@/hooks/use-sync-status';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onOpenCommandPalette: () => void;
}

export function Header({ onOpenCommandPalette }: HeaderProps) {
  const syncStatus = useSyncStatus();

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="text-muted-foreground gap-2"
          onClick={onOpenCommandPalette}
        >
          <Search className="h-4 w-4" />
          <span className="text-xs">Search...</span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <div
            className={cn(
              'h-2.5 w-2.5 rounded-full',
              syncStatus === 'connected' && 'bg-green-500',
              syncStatus === 'disconnected' && 'bg-red-500',
              syncStatus === 'connecting' && 'bg-yellow-500 animate-pulse'
            )}
          />
          <span className="text-muted-foreground text-xs">
            {syncStatus === 'connected' && 'Synced'}
            {syncStatus === 'disconnected' && 'Offline'}
            {syncStatus === 'connecting' && 'Connecting...'}
          </span>
          {syncStatus === 'connected' ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : syncStatus === 'connecting' ? (
            <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
        </div>
      </div>
    </header>
  );
}
