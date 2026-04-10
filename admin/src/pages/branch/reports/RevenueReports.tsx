import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const PERIODS = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'All Time', value: 'all' },
];

export default function RevenueReports() {
  const [period, setPeriod] = useState('month');

  const { data, isLoading } = useQuery({
    queryKey: ['branch-report-revenue', period],
    queryFn: () => api.get('/branch-admin/reports/revenue', { params: { period } }).then((r) => r.data),
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold">Revenue Reports</h2>
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
            <div className="bg-white rounded-xl border p-4"><p className="text-sm text-muted-foreground">Total Sales</p><p className="text-2xl font-bold mt-1 text-green-600">{formatCurrency(data?.total_sales ?? 0)}</p><p className="text-xs text-muted-foreground">{data?.sales_count ?? 0} transactions</p></div>
            <div className="bg-white rounded-xl border p-4"><p className="text-sm text-muted-foreground">Total Expenses</p><p className="text-2xl font-bold mt-1 text-red-500">{formatCurrency(data?.total_expenses ?? 0)}</p><p className="text-xs text-muted-foreground">{data?.expense_count ?? 0} records</p></div>
            <div className="bg-white rounded-xl border p-4 col-span-2"><p className="text-sm text-muted-foreground">Net Income</p><p className={`text-3xl font-bold mt-1 ${(data?.net ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(data?.net ?? 0)}</p></div>
          </div>

          {/* 7-day trend */}
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold mb-4">7-Day Sales vs Expenses</h3>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data?.trend ?? []} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradSales" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} /><stop offset="95%" stopColor="#22c55e" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gradExpenses" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => formatCurrency(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="sales" name="Sales" stroke="#22c55e" fill="url(#gradSales)" strokeWidth={2} />
                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" fill="url(#gradExpenses)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payment methods */}
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold mb-4">Sales by Payment Method</h3>
              <div className="space-y-3">
                {(data?.by_payment_method ?? []).map((pm: any) => (
                  <div key={pm.method}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize">{pm.method.replace(/_/g, ' ')}</span>
                      <span className="font-semibold">{formatCurrency(pm.amount)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.max(2, (pm.amount / (data?.total_sales || 1)) * 100)}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{pm.count} transactions</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Expenses by category */}
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold mb-4">Expenses by Category</h3>
              <div className="space-y-3">
                {(data?.expenses_by_category ?? []).map((ec: any) => (
                  <div key={ec.category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize">{ec.category}</span>
                      <span className="font-semibold">{formatCurrency(ec.amount)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-red-400 rounded-full" style={{ width: `${Math.max(2, (ec.amount / (data?.total_expenses || 1)) * 100)}%` }} />
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
