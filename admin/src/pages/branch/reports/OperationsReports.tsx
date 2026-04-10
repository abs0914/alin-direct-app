import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

const PIE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
const STATUS_COLORS: Record<string, string> = { pending: '#f59e0b', broadcasting: '#60a5fa', in_transit: '#3b82f6', delivered: '#22c55e', failed: '#ef4444', cancelled: '#9ca3af' };

export default function OperationsReports() {
  const { data, isLoading } = useQuery({
    queryKey: ['branch-report-operations'],
    queryFn: () => api.get('/branch-admin/reports/operations').then((r) => r.data),
    refetchInterval: 60_000,
  });

  const expensePieData = (data?.expenses_by_category ?? []).map((e: any) => ({ name: e.category, value: e.amount }));
  const paymentPieData = (data?.payment_methods ?? []).map((p: any) => ({ name: p.method, value: p.amount }));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Operations Reports</h2>
        <p className="text-muted-foreground text-sm">Month-to-date overview with 7-day trend</p>
      </div>

      {isLoading ? <div className="text-muted-foreground text-sm">Loading…</div> : (
        <>
          {/* 7-day trend */}
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold mb-4">7-Day Sales vs Expenses Trend</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data?.trend ?? []} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => formatCurrency(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="sales" name="Sales" fill="#22c55e" radius={[3, 3, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Delivery status pie */}
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold mb-4">Deliveries by Status (MTD)</h3>
              {Object.keys(data?.jobs_by_status ?? {}).length === 0 ? (
                <p className="text-sm text-muted-foreground">No delivery data.</p>
              ) : (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width={140} height={140}>
                    <PieChart>
                      <Pie data={Object.entries(data?.jobs_by_status ?? {}).map(([k, v]) => ({ name: k, value: v as number }))} dataKey="value" cx="50%" cy="50%" outerRadius={60} innerRadius={30}>
                        {Object.entries(data?.jobs_by_status ?? {}).map(([k]) => (
                          <Cell key={k} fill={STATUS_COLORS[k] ?? '#9ca3af'} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 flex-1">
                    {Object.entries(data?.jobs_by_status ?? {}).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] ?? '#9ca3af' }} />
                          <span className="capitalize">{status.replace(/_/g, ' ')}</span>
                        </div>
                        <span className="font-semibold">{count as number}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Payment method pie */}
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold mb-4">Sales by Payment Method (MTD)</h3>
              {paymentPieData.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sales data.</p>
              ) : (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width={140} height={140}>
                    <PieChart>
                      <Pie data={paymentPieData} dataKey="value" cx="50%" cy="50%" outerRadius={60} innerRadius={30}>
                        {paymentPieData.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 flex-1">
                    {paymentPieData.map((pm: any, i: number) => (
                      <div key={pm.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span className="capitalize">{pm.name.replace(/_/g, ' ')}</span>
                        </div>
                        <span className="font-semibold">{formatCurrency(pm.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Expense categories */}
          {expensePieData.length > 0 && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold mb-4">Expenses by Category (MTD)</h3>
              <div className="space-y-3">
                {(data?.expenses_by_category ?? []).map((ec: any, i: number) => {
                  const totalExp = (data?.expenses_by_category ?? []).reduce((s: number, x: any) => s + x.amount, 0);
                  return (
                    <div key={ec.category}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize">{ec.category}</span>
                        <div className="flex gap-3">
                          <span className="text-muted-foreground">{ec.count} records</span>
                          <span className="font-semibold">{formatCurrency(ec.amount)}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.max(1, (ec.amount / totalExp) * 100)}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
