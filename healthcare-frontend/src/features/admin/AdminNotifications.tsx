import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { RefreshCw, Mail } from 'lucide-react';
import { useEmailLogs, useRetryAllEmails } from './hooks/useAdminAPI';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';

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
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications Monitor</h1>
          <p className="text-slate-400 text-sm">Monitor email delivery logs and retry failed messages.</p>
        </div>
        <Button onClick={handleRetry} isLoading={isRetrying} variant="secondary">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry Failed Emails
        </Button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-end">
          <select 
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="SENT">Sent</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12"><Spinner size="lg" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Recipient</th>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Retries</th>
                  <th className="px-6 py-4 font-semibold">Sent At</th>
                  <th className="px-6 py-4 font-semibold">Error Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {emails?.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white flex items-center gap-2">
                        <Mail className="h-4 w-4 text-slate-500" />
                        {log.recipientEmail}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{log.emailType}</td>
                    <td className="px-6 py-4">
                      {log.status === 'SENT' ? <Badge variant="success">SENT</Badge> : 
                       log.status === 'FAILED' ? <Badge variant="danger">FAILED</Badge> : 
                       <Badge variant="warning">PENDING</Badge>}
                    </td>
                    <td className="px-6 py-4">{log.retryCount}/3</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.sentAt ? format(parseISO(log.sentAt), 'MMM d, h:mm a') : '-'}
                    </td>
                    <td className="px-6 py-4 text-xs text-red-400 max-w-xs truncate" title={log.errorMessage}>
                      {log.errorMessage || '-'}
                    </td>
                  </tr>
                ))}
                {(!emails || emails.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No email logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotifications;
