import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const PERIODS = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'All Time', value: 'all' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  broadcasting: 'bg-blue-100 text-blue-800',
  accepted: 'bg-indigo-100 text-indigo-800',
  in_transit: 'bg-blue-200 text-blue-900',
  delivered: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-700',
};

export default function DeliveryReports() {
  const [period, setPeriod] = useState('today');

  const { data, isLoading } = useQuery({
    queryKey: ['branch-report-deliveries', period],
    queryFn: () => api.get('/branch-admin/reports/deliveries', { params: { period } }).then((r) => r.data),
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold">Delivery Reports</h2>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {PERIODS.map((p) => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${period === p.value ? 'bg-white shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >{p.label}</button>
          ))}
        </div>
      </div>

      {isLoading ? <div className="text-muted-foreground text-sm">Loading…</div> : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border p-4"><p className="text-sm text-muted-foreground">Total Jobs</p><p className="text-3xl font-bold mt-1">{data?.total ?? 0}</p></div>
            <div className="bg-white rounded-xl border p-4"><p className="text-sm text-muted-foreground">Delivered</p><p className="text-3xl font-bold mt-1 text-green-600">{data?.by_status?.delivered ?? 0}</p></div>
            <div className="bg-white rounded-xl border p-4"><p className="text-sm text-muted-foreground">Failed</p><p className="text-3xl font-bold mt-1 text-red-500">{data?.by_status?.failed ?? 0}</p></div>
            <div className="bg-white rounded-xl border p-4"><p className="text-sm text-muted-foreground">Revenue</p><p className="text-2xl font-bold mt-1">{formatCurrency(data?.revenue ?? 0)}</p></div>
          </div>

          {/* 7-day trend chart */}
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold mb-4">7-Day Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data?.trend ?? []} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="total" name="Total" fill="#94a3b8" radius={[3, 3, 0, 0]} />
                <Bar dataKey="delivered" name="Delivered" fill="#22c55e" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status breakdown */}
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold mb-4">By Status</h3>
              <div className="space-y-2">
                {Object.entries(data?.by_status ?? {}).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700'}`}>{status.replace(/_/g, ' ')}</span>
                    <span className="font-semibold">{count as number}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Vehicle breakdown */}
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold mb-4">By Vehicle</h3>
              <div className="space-y-2">
                {Object.entries(data?.by_vehicle ?? {}).map(([vehicle, count]) => (
                  <div key={vehicle} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{vehicle}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 bg-blue-400 rounded" style={{ width: `${Math.max(8, ((count as number) / (data?.total || 1)) * 100)}px` }} />
                      <span className="font-semibold w-8 text-right">{count as number}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
