'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FilePlus,
  FileText,
  BarChart3,
  Upload,
  Settings,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/prescriptions/new', label: 'New Prescription', icon: FilePlus },
  { href: '/prescriptions', label: 'All Prescriptions', icon: FileText },
  { href: '/reports', label: 'Reports & Analytics', icon: BarChart3 },
  { href: '/import', label: 'Import Data', icon: Upload },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'h-screen bg-card border-r flex flex-col transition-all duration-200',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      <div className="flex items-center gap-2 p-4 border-b">
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)}>
          <Menu className="h-5 w-5" />
        </Button>
        {!collapsed && (
          <span className="font-bold text-lg text-primary">HealthCamp</span>
        )}
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t">
        <div
          className={cn(
            'flex items-center gap-3 px-3 py-2 text-xs text-muted-foreground',
            collapsed && 'justify-center'
          )}
        >
          {!collapsed && <span>SSA Patel Nagar</span>}
        </div>
      </div>
    </aside>
  );
}
