'use client';

import { Package, Plus } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
}

const DefaultIcon = Package;

export function EmptyState({
  icon: Icon = DefaultIcon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="p-4 rounded-full bg-muted/50 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      {description && <p className="text-muted-foreground text-sm mb-6 max-w-sm">{description}</p>}
      {action && action.href && (
        <Link href={action.href}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {action.label}
          </Button>
        </Link>
      )}
      {action && !action.href && action.onClick && (
        <Button onClick={action.onClick}>
          <Plus className="mr-2 h-4 w-4" />
          {action.label}
        </Button>
      )}
    </div>
  );
}
