import React from 'react';
import { BrainCircuit, RefreshCw, CheckCircle } from 'lucide-react';
import { useFailedLLMSummaries, useRetryLLM } from './hooks/useAdminAPI';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/Table';
import { Reveal } from '../../lib/motion/Reveal';
import { useToast } from '../../contexts/ToastContext';

export const AdminLLMMonitor: React.FC = () => {
  const { data: failedSummaries, isLoading } = useFailedLLMSummaries();
  const { mutateAsync: retryLLM, isPending: isRetrying } = useRetryLLM();
  const { toast } = useToast();

  const handleRetry = async (id: string, type: 'pre-visit' | 'post-visit') => {
    try {
      await retryLLM({ id, type });
      toast(`Retry triggered for ${type} summary.`, 'success');
    } catch {
      toast('Failed to trigger LLM retry.', 'error');
    }
  };

  const typeLabel = (t: string) =>
    t === 'pre-visit' ? 'Pre-Visit · Symptom Analysis' : 'Post-Visit · Clinical Notes';

  const list = failedSummaries ?? [];
  const count = list.length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6 md:p-8">
      {/* Header */}
      <Reveal>
        <div>
          <h1 className="text-3xl font-display font-semibold text-ink mb-1">LLM Processing Monitor</h1>
          <p className="text-ink/50 font-body text-sm">Monitor and retry failed AI-powered patient summaries.</p>
        </div>
      </Reveal>

      {/* Health banner if all good */}
      {!isLoading && count === 0 && (
        <Reveal delay={0.06}>
          <div className="flex items-center gap-3 p-5 rounded-xl bg-success/8 border border-success/20">
            <div className="h-9 w-9 rounded-full bg-success/15 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm font-display font-semibold text-ink">All systems healthy</p>
              <p className="text-xs text-ink/50 font-body">No failed LLM summaries detected. All AI processing is running normally.</p>
            </div>
          </div>
        </Reveal>
      )}

      {/* Failed summaries table */}
      <Reveal delay={0.08}>
        <Card noPadding>
          {/* Card header */}
          <div className="px-6 py-4 border-b border-ink/5 flex items-center justify-between">
            <h2 className="text-sm font-display font-semibold text-ink flex items-center gap-2">
              <BrainCircuit className="h-4 w-4 text-accent" />
              Failed Summaries
              {count > 0 && (
                <Badge variant="danger" className="text-[10px] ml-1">{count}</Badge>
              )}
            </h2>
            {count > 0 && (
              <p className="text-xs text-ink/40 font-body">Max 3 retries per job</p>
            )}
          </div>

          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
            </div>
          ) : count > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Appointment ID</TableHead>
                  <TableHead>Summary Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Retries</TableHead>
                  <TableHead className="pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((summary: any) => {
                  const maxed = (summary.retryCount ?? 0) >= 3;
                  return (
                    <TableRow key={summary.id}>
                      <TableCell className="pl-6">
                        <span className="font-mono text-xs text-ink/50 bg-bg px-2 py-0.5 rounded border border-ink/5">
                          {(summary.appointmentId || summary.id)?.slice(0, 12)}…
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <BrainCircuit className="h-3.5 w-3.5 text-accent/60 flex-shrink-0" />
                          <span className="text-sm font-medium text-ink">
                            {typeLabel(summary.type)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="danger" className="text-[10px]">FAILED</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {/* Mini progress dots */}
                          {[0, 1, 2].map(n => (
                            <span
                              key={n}
                              className={`h-2 w-2 rounded-full ${n < (summary.retryCount ?? 0) ? 'bg-danger' : 'bg-ink/10'}`}
                            />
                          ))}
                          <span className="text-xs text-ink/50 ml-1">{summary.retryCount ?? 0}/3</span>
                        </div>
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={maxed || isRetrying}
                          isLoading={isRetrying}
                          onClick={() => handleRetry(summary.id, summary.type)}
                          className="text-xs"
                        >
                          <RefreshCw className="h-3 w-3 mr-1.5" />
                          {maxed ? 'Max Retries' : 'Retry'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm text-ink/40 font-body">No failed summaries to display.</p>
            </div>
          )}
        </Card>
      </Reveal>
    </div>
  );
};

export default AdminLLMMonitor;
