import { RefreshCw, BrainCircuit, AlertTriangle } from 'lucide-react';
import { useFailedLLMSummaries, useRetryLLM } from './hooks/useAdminAPI';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { Card } from '../../components/ui/Card';
import { Reveal } from '../../lib/motion/Reveal';

export const AdminLLMMonitor: React.FC = () => {
  const { data: failedSummaries, isLoading } = useFailedLLMSummaries();
  const { mutateAsync: retryLLM, isPending: isRetrying } = useRetryLLM();

  const handleRetry = async (id: string, type: 'pre-visit' | 'post-visit') => {
    try {
      await retryLLM({ id, type });
      alert(`Retry triggered for ${type} summary.`);
    } catch (e) {
      alert('Failed to trigger LLM retry.');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-8">
      <Reveal>
        <div>
          <h1 className="text-3xl text-ink font-display mb-2">LLM Processing Monitor</h1>
          <p className="text-ink/60 font-body">Monitor and retry failed AI-powered patient summaries.</p>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <Card className="p-0 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center p-12"><Spinner size="lg" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-ink">
                <thead className="bg-bg text-xs uppercase text-ink/50 font-bold border-b border-ink/5 tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-bold">Appointment ID</th>
                    <th className="px-6 py-4 font-bold">Summary Type</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold">Retries</th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5 bg-surface">
                  {failedSummaries?.map((summary: any) => (
                    <tr key={summary.id} className="hover:bg-accent/5 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-ink/50 font-medium">
                        {summary.appointmentId || summary.id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <BrainCircuit className="h-4 w-4 text-ink/40" />
                          <span className="font-bold text-ink">
                            {summary.type === 'pre-visit' ? 'Pre-Visit (Symptom Analysis)' : 'Post-Visit (Clinical Notes)'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="danger">FAILED</Badge>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {summary.retryCount || 0} / 3
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => handleRetry(summary.id, summary.type)}
                          isLoading={isRetrying}
                        >
                          <RefreshCw className="h-3 w-3 mr-2" />
                          Retry
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {(!failedSummaries || failedSummaries.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center text-ink/50">
                          <AlertTriangle className="h-10 w-10 text-success/50 mb-3" />
                          <p className="text-ink/60 font-bold">All systems healthy</p>
                          <p className="text-xs mt-1 font-medium text-ink/40">No failed LLM summaries detected.</p>
                        </div>
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

export default AdminLLMMonitor;
