'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  FilePlus,
  FileText,
  BarChart3,
  Upload,
  Printer,
} from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();

  const navigate = (path: string) => {
    onOpenChange(false);
    router.push(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => navigate('/')}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </CommandItem>
          <CommandItem onSelect={() => navigate('/prescriptions/new')}>
            <FilePlus className="mr-2 h-4 w-4" />
            New Prescription
          </CommandItem>
          <CommandItem onSelect={() => navigate('/prescriptions')}>
            <FileText className="mr-2 h-4 w-4" />
            All Prescriptions
          </CommandItem>
          <CommandItem onSelect={() => navigate('/reports')}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Reports & Analytics
          </CommandItem>
          <CommandItem onSelect={() => navigate('/import')}>
            <Upload className="mr-2 h-4 w-4" />
            Import Data
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => navigate('/prescriptions/new')}>
            <FilePlus className="mr-2 h-4 w-4" />
            Create New Prescription (⌘N)
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
