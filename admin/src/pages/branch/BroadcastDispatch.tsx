import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/DataTable';
import { Radio, Truck, CheckCircle, RefreshCw } from 'lucide-react';

interface Job {
  id: string; tracking_uuid: string; status: string; vehicle_type: string;
  pickup_address: string; dropoff_address: string; total_price: number;
  created_at: string; rider?: { user?: { name: string } };
}

interface Rider {
  id: string; vehicle_type: string; plate_number: string; rating: number; total_deliveries: number;
  user?: { name: string; phone: string };
}

const VEHICLE_TYPES = ['', 'motorcycle', 'mpv', 'van', 'truck'];

export default function BroadcastDispatch() {
  const qc = useQueryClient();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [selectedRiders, setSelectedRiders] = useState<string[]>([]);
  const [timeout, setTimeout] = useState(60);
  const [lastBroadcast, setLastBroadcast] = useState<{ broadcast_to: number } | null>(null);

  // Pending/broadcasting jobs
  const { data: jobs = [], isLoading: jobsLoading, refetch: refetchJobs } = useQuery<Job[]>({
    queryKey: ['dispatch-jobs'],
    queryFn: () => api.get('/branch-admin/jobs', { params: { status: 'pending' } }).then((r) => r.data.data ?? []),
    refetchInterval: 15_000,
  });

  // Available riders
  const { data: riders = [], isLoading: ridersLoading, refetch: refetchRiders } = useQuery<Rider[]>({
    queryKey: ['dispatch-available-riders', vehicleFilter],
    queryFn: () => api.get('/branch-admin/riders/available', { params: vehicleFilter ? { vehicle_type: vehicleFilter } : {} }).then((r) => r.data.data ?? []),
    refetchInterval: 15_000,
  });

  const broadcast = useMutation({
    mutationFn: ({ jobId, riderIds, timeoutSeconds }: { jobId: string; riderIds: string[]; timeoutSeconds: number }) =>
      api.post(`/branch-admin/jobs/${jobId}/broadcast`, {
        vehicle_type: vehicleFilter || undefined,
        timeout_seconds: timeoutSeconds,
        limit: riderIds.length > 0 ? undefined : 20,
      }),
    onSuccess: (res) => {
      setLastBroadcast(res.data);
      setSelectedJob(null);
      setSelectedRiders([]);
      qc.invalidateQueries({ queryKey: ['dispatch-jobs'] });
    },
  });

  function toggleRider(id: string) {
    setSelectedRiders((prev) => prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Broadcast Dispatch</h2>
          <p className="text-muted-foreground text-sm">Select a pending job, choose riders, then broadcast.</p>
        </div>
        <button onClick={() => { refetchJobs(); refetchRiders(); }} className="flex items-center gap-2 border rounded-lg px-3 py-1.5 text-sm hover:bg-gray-50">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {lastBroadcast && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 text-green-800 text-sm">
          <CheckCircle size={18} />
          <span>Broadcasted to <strong>{lastBroadcast.broadcast_to}</strong> rider(s). Waiting for acceptance…</span>
          <button onClick={() => setLastBroadcast(null)} className="ml-auto text-green-600 hover:text-green-800 text-xs underline">Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Jobs */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Package size={16} /> Pending Jobs ({jobs.length})</h3>
          {jobsLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : jobs.length === 0 ? (
            <div className="border rounded-xl p-6 text-center text-muted-foreground text-sm">No pending jobs</div>
          ) : (
            <div className="space-y-2 max-h-[480px] overflow-y-auto">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
                  className={`border rounded-xl p-4 cursor-pointer transition-colors ${selectedJob?.id === job.id ? 'border-primary bg-primary/5' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-mono text-xs text-muted-foreground">{job.tracking_uuid.slice(0, 8)}</span>
                    <StatusBadge status={job.status} />
                  </div>
                  <p className="text-sm truncate"><span className="text-muted-foreground">From:</span> {job.pickup_address}</p>
                  <p className="text-sm truncate"><span className="text-muted-foreground">To:</span> {job.dropoff_address}</p>
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span className="capitalize">{job.vehicle_type}</span>
                    <span className="font-semibold text-foreground">{formatCurrency(job.total_price)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Riders */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2"><Truck size={16} /> Online Riders ({riders.length})</h3>
            <select value={vehicleFilter} onChange={(e) => setVehicleFilter(e.target.value)} className="border rounded-md px-2 py-1 text-xs">
              {VEHICLE_TYPES.map((v) => <option key={v} value={v}>{v || 'All vehicles'}</option>)}
            </select>
          </div>
          {ridersLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : riders.length === 0 ? (
            <div className="border rounded-xl p-6 text-center text-muted-foreground text-sm">No riders online</div>
          ) : (
            <div className="space-y-2 max-h-[480px] overflow-y-auto">
              {riders.map((rider) => (
                <div
                  key={rider.id}
                  onClick={() => toggleRider(rider.id)}
                  className={`border rounded-xl p-3 cursor-pointer transition-colors flex items-center gap-3 ${selectedRiders.includes(rider.id) ? 'border-primary bg-primary/5' : 'hover:bg-gray-50'}`}
                >
                  <div className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${selectedRiders.includes(rider.id) ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                    {selectedRiders.includes(rider.id) && <svg viewBox="0 0 12 12" className="w-3 h-3 text-white"><polyline stroke="currentColor" strokeWidth="2" fill="none" points="1,6 4,9 11,2" /></svg>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{rider.user?.name}</p>
                    <p className="text-xs text-muted-foreground">{rider.plate_number} · <span className="capitalize">{rider.vehicle_type}</span></p>
                  </div>
                  <div className="text-right text-xs">
                    <p>⭐ {Number(rider.rating).toFixed(1)}</p>
                    <p className="text-muted-foreground">{rider.total_deliveries} trips</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Broadcast Panel */}
      {selectedJob && (
        <div className="bg-white border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold flex items-center gap-2"><Radio size={16} /> Ready to Broadcast</h3>
          <div className="text-sm space-y-1">
            <p><span className="text-muted-foreground">Job:</span> {selectedJob.tracking_uuid.slice(0, 8)} — {selectedJob.pickup_address} → {selectedJob.dropoff_address}</p>
            <p><span className="text-muted-foreground">Target:</span> {selectedRiders.length > 0 ? `${selectedRiders.length} selected rider(s)` : `All ${riders.length} online rider(s)`}</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Acceptance Timeout (seconds)</label>
            <input type="number" min="15" max="300" className="w-32 border rounded-lg px-3 py-1.5 text-sm" value={timeout} onChange={(e) => setTimeout(parseInt(e.target.value) || 60)} />
          </div>
          <button
            disabled={broadcast.isPending}
            onClick={() => broadcast.mutate({ jobId: selectedJob.id, riderIds: selectedRiders, timeoutSeconds: timeout })}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            <Radio size={16} /> {broadcast.isPending ? 'Broadcasting…' : 'Send Broadcast'}
          </button>
        </div>
      )}
    </div>
  );
}

// Re-export Package icon used in JSX above
function Package({ size, className }: { size: number; className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16.5 9.4 7.55 4.24" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" x2="12" y1="22" y2="12" /></svg>;
}
