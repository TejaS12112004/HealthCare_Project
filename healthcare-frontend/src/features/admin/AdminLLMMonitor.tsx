import { RefreshCw, BrainCircuit, AlertTriangle } from 'lucide-react';
import { useFailedLLMSummaries, useRetryLLM } from './hooks/useAdminAPI';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';

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
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">LLM Processing Monitor</h1>
        <p className="text-slate-400 text-sm">Monitor and retry failed AI-powered patient summaries.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-12"><Spinner size="lg" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Appointment ID</th>
                  <th className="px-6 py-4 font-semibold">Summary Type</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Retries</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {failedSummaries?.map((summary: any) => (
                  <tr key={summary.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      {summary.appointmentId || summary.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <BrainCircuit className="h-4 w-4 text-slate-500" />
                        <span className="font-medium text-slate-300">
                          {summary.type === 'pre-visit' ? 'Pre-Visit (Symptom Analysis)' : 'Post-Visit (Clinical Notes)'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="danger">FAILED</Badge>
                    </td>
                    <td className="px-6 py-4">
                      {summary.retryCount || 0} / 3
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => handleRetry(summary.id, summary.type)}
                        disabled={isRetrying}
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
                      <div className="flex flex-col items-center justify-center text-slate-500">
                        <AlertTriangle className="h-10 w-10 text-emerald-500/50 mb-3" />
                        <p className="text-slate-400 font-medium">All systems healthy</p>
                        <p className="text-xs mt-1">No failed LLM summaries detected.</p>
                      </div>
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

export default AdminLLMMonitor;
