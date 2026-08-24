import React from 'react';
import { cn } from '../../lib/utils';
import { ChevronUp, ChevronDown } from 'lucide-react';

export const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="w-full overflow-auto">
      <table ref={ref} className={cn('w-full caption-bottom text-sm font-body', className)} {...props} />
    </div>
  )
);
Table.displayName = 'Table';

export const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn('[&_tr]:border-b border-ink/5 bg-surface-hover/50', className)} {...props} />
  )
);
TableHeader.displayName = 'TableHeader';

export const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
  )
);
TableBody.displayName = 'TableBody';

export const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn('border-b border-ink/5 transition-colors hover:bg-surface-hover/80 data-[state=selected]:bg-surface-hover', className)}
      {...props}
    />
  )
);
TableRow.displayName = 'TableRow';

export const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement> & { sortDirection?: 'asc' | 'desc' | false }>(
  ({ className, children, sortDirection, ...props }, ref) => (
    <th
      ref={ref}
      className={cn('h-12 px-4 text-left align-middle font-display font-medium text-ink/70 [&:has([role=checkbox])]:pr-0', className)}
      {...props}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortDirection === 'asc' && <ChevronUp className="w-4 h-4" />}
        {sortDirection === 'desc' && <ChevronDown className="w-4 h-4" />}
      </div>
    </th>
  )
);
TableHead.displayName = 'TableHead';

export const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn('p-4 align-middle text-ink [&:has([role=checkbox])]:pr-0', className)} {...props} />
  )
);
TableCell.displayName = 'TableCell';
