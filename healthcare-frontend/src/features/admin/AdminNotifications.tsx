import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { RefreshCw, Mail, Search } from 'lucide-react';
import { useEmailLogs, useRetryAllEmails } from './hooks/useAdminAPI';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { Pagination } from '../../components/ui/Pagination';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/Table';
import { Tabs } from '../../components/ui/Tabs';
import { Reveal } from '../../lib/motion/Reveal';
import { useToast } from '../../contexts/ToastContext';

const STATUS_TABS = [
  { label: 'All', id: '' },
  { label: 'Sent', id: 'SENT' },
  { label: 'Pending', id: 'PENDING' },
  { label: 'Failed', id: 'FAILED' },
];

const PAGE_SIZE = 15;

export const AdminNotifications: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const { toast } = useToast();

  const { data: emails, isLoading } = useEmailLogs(statusFilter || undefined);
  const { mutateAsync: retryEmails, isPending: isRetrying } = useRetryAllEmails();

  const handleRetry = async () => {
    try {
      await retryEmails();
      toast('Retry job triggered. Logs will update shortly.', 'success');
    } catch {
      toast('Failed to trigger retry job.', 'error');
    }
  };

  /* Client-side search */
  const filtered = (emails ?? []).filter((log: any) => {
    const q = search.toLowerCase();
    return (
      !q ||
      log.recipientEmail?.toLowerCase().includes(q) ||
      log.emailType?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const statusVariant = (s: string) => {
    if (s === 'SENT') return 'success';
    if (s === 'FAILED') return 'danger';
    return 'warning';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6 md:p-8">
      {/* Header */}
      <Reveal>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-semibold text-ink mb-1">Email Monitor</h1>
            <p className="text-ink/50 font-body text-sm">Track email delivery and retry failed messages.</p>
          </div>
          <Button variant="secondary" onClick={handleRetry} isLoading={isRetrying} className="flex-shrink-0">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Failed Emails
          </Button>
        </div>
      </Reveal>

      {/* Filters */}
      <Reveal delay={0.05}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Tabs
            tabs={STATUS_TABS}
            activeTab={statusFilter}
            onChange={id => { setStatusFilter(id); setPage(0); }}
            layoutId="notif-tabs"
          />
          <div className="relative flex-shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink/30 pointer-events-none" />
            <input
              type="text"
              placeholder="Search recipient, type…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              className="pl-8 pr-3 h-9 text-xs font-body rounded-lg bg-surface border border-ink/10 text-ink placeholder:text-ink/30 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all w-52"
            />
          </div>
        </div>
      </Reveal>

      {/* Table */}
      <Reveal delay={0.1}>
        <Card noPadding>
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
            </div>
          ) : paged.length === 0 ? (
            <div className="py-16">
              <EmptyState icon={Mail} title="No email logs" description="No emails match the current filter." />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Recipient</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Retries</TableHead>
                    <TableHead className="hidden lg:table-cell">Sent At</TableHead>
                    <TableHead className="pr-6 hidden lg:table-cell">Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-ink/30 flex-shrink-0" />
                          <span className="text-sm font-medium text-ink truncate max-w-xs">
                            {log.recipientEmail}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-mono bg-bg px-2 py-0.5 rounded border border-ink/5 text-ink/70">
                          {log.emailType}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(log.status)} className="text-[10px]">
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-ink/60">
                        {log.retryCount}/3
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-ink/60 whitespace-nowrap">
                        {log.sentAt ? format(parseISO(log.sentAt), 'MMM d, h:mm a') : '—'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell pr-6">
                        {log.errorMessage ? (
                          <span
                            className="text-xs text-danger font-medium truncate block max-w-[200px]"
                            title={log.errorMessage}
                          >
                            {log.errorMessage}
                          </span>
                        ) : (
                          <span className="text-xs text-ink/30">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </>
          )}
        </Card>
      </Reveal>
    </div>
  );
};

export default AdminNotifications;
