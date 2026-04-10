import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/DataTable';

export default function RiderPerformance() {
  const { data, isLoading } = useQuery({
    queryKey: ['branch-report-riders'],
    queryFn: () => api.get('/branch-admin/reports/riders').then((r) => r.data),
    refetchInterval: 60_000,
  });

  const statusColors: Record<string, string> = {
    approved: 'bg-green-500', pending: 'bg-yellow-500', suspended: 'bg-orange-500', rejected: 'bg-red-500', blacklisted: 'bg-gray-700',
  };
  const vehicleColors: Record<string, string> = { motorcycle: 'bg-blue-500', mpv: 'bg-indigo-500', van: 'bg-purple-500', truck: 'bg-pink-500' };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Rider Performance</h2>
        <p className="text-muted-foreground text-sm">Real-time rider roster and rankings</p>
      </div>

      {isLoading ? <div className="text-muted-foreground text-sm">Loading…</div> : (
        <>
          {/* Summary row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border p-4 text-center"><p className="text-3xl font-bold">{data?.total ?? 0}</p><p className="text-sm text-muted-foreground mt-1">Total Riders</p></div>
            <div className="bg-white rounded-xl border p-4 text-center"><p className="text-3xl font-bold text-green-600">{data?.by_status?.approved ?? 0}</p><p className="text-sm text-muted-foreground mt-1">Approved</p></div>
            <div className="bg-white rounded-xl border p-4 text-center"><p className="text-3xl font-bold text-yellow-500">{data?.by_status?.pending ?? 0}</p><p className="text-sm text-muted-foreground mt-1">Pending KYC</p></div>
            <div className="bg-white rounded-xl border p-4 text-center"><p className="text-3xl font-bold text-blue-600">{data?.online_count ?? 0}</p><p className="text-sm text-muted-foreground mt-1">Online Now</p></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status distribution */}
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold mb-4">Status Distribution</h3>
              <div className="space-y-3">
                {Object.entries(data?.by_status ?? {}).map(([status, count]) => (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize">{status}</span>
                      <span className="font-semibold">{count as number}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${statusColors[status] ?? 'bg-gray-400'}`} style={{ width: `${Math.max(2, ((count as number) / (data?.total || 1)) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Vehicle distribution */}
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold mb-4">Fleet by Vehicle</h3>
              <div className="space-y-3">
                {Object.entries(data?.by_vehicle ?? {}).map(([vehicle, count]) => (
                  <div key={vehicle}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize">{vehicle}</span>
                      <span className="font-semibold">{count as number}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${vehicleColors[vehicle] ?? 'bg-gray-400'}`} style={{ width: `${Math.max(2, ((count as number) / (data?.total || 1)) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Performers */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="px-5 py-4 border-b"><h3 className="font-semibold">Top Performers (by Deliveries)</h3></div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['#', 'Rider', 'Vehicle', 'Plate', 'Rating', 'Deliveries', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.top_performers ?? []).map((r: any, i: number) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 text-muted-foreground font-mono">#{i + 1}</td>
                    <td className="px-4 py-3 font-medium">{r.name}</td>
                    <td className="px-4 py-3 capitalize">{r.vehicle_type}</td>
                    <td className="px-4 py-3 font-mono text-xs">{r.plate_number ?? '—'}</td>
                    <td className="px-4 py-3">⭐ {r.rating.toFixed(1)}</td>
                    <td className="px-4 py-3 font-semibold">{r.total_deliveries}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.availability} /></td>
                  </tr>
                ))}
                {(data?.top_performers ?? []).length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No data yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
