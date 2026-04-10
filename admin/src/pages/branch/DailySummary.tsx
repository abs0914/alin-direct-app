import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, Package, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function StatCard({ label, value, sub, color, icon: Icon }: { label: string; value: string; sub?: string; color: string; icon: any }) {
  return (
    <div className="bg-white rounded-xl border p-5 flex items-start gap-4">
      <div className={`p-3 rounded-full shrink-0 ${color}`}><Icon size={18} className="text-white" /></div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function JobStatusRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div className="flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
        <span className="text-sm capitalize">{label.replace(/_/g, ' ')}</span>
      </div>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

export default function DailySummary() {
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const { data, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['branch-daily-summary'],
    queryFn: () => api.get('/branch-admin/daily-summary').then((r) => r.data),
    refetchInterval: 30_000,
  });

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">Daily Summary</h2>
          <p className="text-muted-foreground text-sm mt-0.5">{today}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Auto-refreshes every 30s</p>
          <p className="text-xs text-muted-foreground">Last updated: {lastUpdated}</p>
          {data?.closing_status === 'none' && (
            <button onClick={() => navigate('/branch/eod-closing')} className="mt-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-90">
              Close Day →
            </button>
          )}
          {data?.closing_status === 'closed' && (
            <span className="mt-2 inline-flex items-center gap-1 text-green-700 text-xs font-medium"><CheckCircle size={12} /> Day Closed</span>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-sm">Loading…</div>
      ) : (
        <>
          {/* Revenue Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Sales" value={formatCurrency(data?.sales_total ?? 0)} sub={`${data?.sales_count ?? 0} transactions`} color="bg-green-500" icon={TrendingUp} />
            <StatCard label="Total Expenses" value={formatCurrency(data?.expense_total ?? 0)} sub={`${data?.expense_count ?? 0} records`} color="bg-red-500" icon={TrendingDown} />
            <StatCard label="Net Income" value={formatCurrency(data?.net ?? 0)} color={(data?.net ?? 0) >= 0 ? 'bg-blue-500' : 'bg-orange-500'} icon={TrendingUp} />
            <StatCard label="Total Jobs" value={String(data?.jobs?.total ?? 0)} sub={`${data?.jobs?.delivered ?? 0} delivered`} color="bg-purple-500" icon={Package} />
          </div>

          {/* Payment split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold mb-4">Sales Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Cash / COD</span><span className="font-semibold">{formatCurrency(data?.cash_sales ?? 0)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Digital (GCash, Maya…)</span><span className="font-semibold">{formatCurrency(data?.digital_sales ?? 0)}</span></div>
                <div className="border-t pt-3 flex justify-between text-sm font-semibold"><span>Total</span><span>{formatCurrency(data?.sales_total ?? 0)}</span></div>
              </div>
            </div>
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold mb-4">Expense Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Cash Expenses</span><span className="font-semibold">{formatCurrency(data?.cash_expenses ?? 0)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Digital Expenses</span><span className="font-semibold">{formatCurrency(data?.digital_expenses ?? 0)}</span></div>
                <div className="border-t pt-3 flex justify-between text-sm font-semibold"><span>Total</span><span>{formatCurrency(data?.expense_total ?? 0)}</span></div>
              </div>
            </div>
          </div>

          {/* Jobs status breakdown */}
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold mb-4">Delivery Jobs Today</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <div>
                <JobStatusRow label="pending" value={data?.jobs?.pending ?? 0} color="bg-yellow-400" />
                <JobStatusRow label="broadcasting" value={data?.jobs?.broadcasting ?? 0} color="bg-blue-400" />
                <JobStatusRow label="in_transit" value={data?.jobs?.in_transit ?? 0} color="bg-blue-600" />
              </div>
              <div>
                <JobStatusRow label="delivered" value={data?.jobs?.delivered ?? 0} color="bg-green-500" />
                <JobStatusRow label="failed" value={data?.jobs?.failed ?? 0} color="bg-red-500" />
                <JobStatusRow label="cancelled" value={data?.jobs?.cancelled ?? 0} color="bg-gray-400" />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
