import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { RefreshCw, Mail } from 'lucide-react';
import { useEmailLogs, useRetryAllEmails } from './hooks/useAdminAPI';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { Reveal } from '../../lib/motion/Reveal';

export const AdminNotifications: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  const { data: emails, isLoading } = useEmailLogs(statusFilter);
  const { mutateAsync: retryEmails, isPending: isRetrying } = useRetryAllEmails();

  const handleRetry = async () => {
    try {
      await retryEmails();
      alert('Retry job triggered successfully. Logs will update shortly.');
    } catch (e) {
      alert('Failed to trigger retry job.');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-8">
      <Reveal className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-ink font-display mb-2">Notifications Monitor</h1>
          <p className="text-ink/60 font-body">Monitor email delivery logs and retry failed messages.</p>
        </div>
        <Button onClick={handleRetry} isLoading={isRetrying} variant="secondary">
          <RefreshCw className="h-5 w-5 mr-2" />
          Retry Failed Emails
        </Button>
      </Reveal>

      <Reveal delay={0.1}>
        <Card className="p-0 overflow-hidden">
          <div className="p-6 border-b border-ink/5 flex justify-end bg-bg">
            <div className="w-48">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { label: 'All Statuses', value: '' },
                  { label: 'Pending', value: 'PENDING' },
                  { label: 'Sent', value: 'SENT' },
                  { label: 'Failed', value: 'FAILED' },
                ]}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center p-12"><Spinner size="lg" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-ink">
                <thead className="bg-bg text-xs uppercase text-ink/50 font-bold border-b border-ink/5 tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-bold">Recipient</th>
                    <th className="px-6 py-4 font-bold">Type</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold">Retries</th>
                    <th className="px-6 py-4 font-bold">Sent At</th>
                    <th className="px-6 py-4 font-bold">Error Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5 bg-surface">
                  {emails?.map(log => (
                    <tr key={log.id} className="hover:bg-accent/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-ink flex items-center gap-2">
                          <Mail className="h-4 w-4 text-ink/40" />
                          {log.recipientEmail}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">{log.emailType}</td>
                      <td className="px-6 py-4">
                        {log.status === 'SENT' ? <Badge variant="success">SENT</Badge> : 
                         log.status === 'FAILED' ? <Badge variant="danger">FAILED</Badge> : 
                         <Badge variant="warning">PENDING</Badge>}
                      </td>
                      <td className="px-6 py-4 font-medium">{log.retryCount}/3</td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-ink/60">
                        {log.sentAt ? format(parseISO(log.sentAt), 'MMM d, h:mm a') : '-'}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-danger max-w-xs truncate" title={log.errorMessage}>
                        {log.errorMessage || '-'}
                      </td>
                    </tr>
                  ))}
                  {(!emails || emails.length === 0) && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-ink/50 font-medium">
                        No email logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </Reveal>
    </div>
  );
};

export default AdminNotifications;
