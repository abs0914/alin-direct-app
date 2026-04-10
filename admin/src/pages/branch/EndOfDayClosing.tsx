import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CheckCircle, AlertTriangle, Lock } from 'lucide-react';

export default function EndOfDayClosing() {
  const qc = useQueryClient();
  const [openingBalance, setOpeningBalance] = useState('');
  const [actualCash, setActualCash] = useState('');
  const [managerNotes, setManagerNotes] = useState('');

  // Load today's summary for reference figures
  const { data: summary } = useQuery({
    queryKey: ['branch-daily-summary'],
    queryFn: () => api.get('/branch-admin/daily-summary').then((r) => r.data),
    refetchInterval: 30_000,
  });

  // Load existing closing record
  const { data: closingData, isLoading } = useQuery({
    queryKey: ['branch-eod-closing-today'],
    queryFn: () => api.get('/branch-admin/daily-closing/today').then((r) => r.data),
  });

  const closing = closingData?.closing;

  const save = useMutation({
    mutationFn: (payload: any) => api.post('/branch-admin/daily-closing', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['branch-eod-closing-today'] }),
  });

  const ob = parseFloat(openingBalance) || 0;
  const cashSales = summary?.cash_sales ?? 0;
  const cashExpenses = summary?.cash_expenses ?? 0;
  const expectedCash = ob + cashSales - cashExpenses;
  const ac = parseFloat(actualCash);
  const variance = !isNaN(ac) ? ac - expectedCash : null;

  const today = new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (isLoading) return <div className="p-6 text-muted-foreground">Loading…</div>;

  if (closing?.status === 'closed') {
    return (
      <div className="p-6 max-w-xl">
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-start gap-4">
          <CheckCircle className="text-green-600 shrink-0 mt-0.5" size={24} />
          <div>
            <h2 className="font-semibold text-green-900">Day is Closed</h2>
            <p className="text-green-700 text-sm mt-1">{today}</p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Opening Balance</span><span className="font-medium">{formatCurrency(closing.opening_balance)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total Cash Sales</span><span className="font-medium">{formatCurrency(closing.total_cash_sales)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total Cash Expenses</span><span className="font-medium">{formatCurrency(closing.total_cash_expenses)}</span></div>
              <div className="flex justify-between border-t pt-2"><span className="text-muted-foreground">Expected Cash</span><span className="font-semibold">{formatCurrency(closing.expected_cash)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Actual Cash</span><span className="font-semibold">{closing.actual_cash != null ? formatCurrency(closing.actual_cash) : '—'}</span></div>
              {closing.variance != null && (
                <div className={`flex justify-between font-semibold ${Number(closing.variance) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  <span>Variance</span><span>{formatCurrency(closing.variance)}</span>
                </div>
              )}
              {closing.manager_notes && <div className="mt-2 bg-white rounded p-2 text-muted-foreground">{closing.manager_notes}</div>}
            </div>
            <p className="text-xs text-muted-foreground mt-4">Closed at {formatDate(closing.closed_at)}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">End-of-Day Closing</h2>
        <p className="text-muted-foreground text-sm">{today}</p>
      </div>

      {/* Reference totals */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 text-sm space-y-2">
        <h3 className="font-semibold text-blue-900 mb-3">Today's Reference Figures</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><span className="text-muted-foreground">Total Sales</span><p className="font-semibold text-lg">{formatCurrency(summary?.sales_total ?? 0)}</p></div>
          <div><span className="text-muted-foreground">Total Expenses</span><p className="font-semibold text-lg">{formatCurrency(summary?.expense_total ?? 0)}</p></div>
          <div><span className="text-muted-foreground">Cash Sales</span><p className="font-medium">{formatCurrency(summary?.cash_sales ?? 0)}</p></div>
          <div><span className="text-muted-foreground">Cash Expenses</span><p className="font-medium">{formatCurrency(summary?.cash_expenses ?? 0)}</p></div>
          <div><span className="text-muted-foreground">Digital Sales</span><p className="font-medium">{formatCurrency(summary?.digital_sales ?? 0)}</p></div>
          <div><span className="text-muted-foreground">Digital Expenses</span><p className="font-medium">{formatCurrency(summary?.digital_expenses ?? 0)}</p></div>
        </div>
      </div>

      {/* Closing Form */}
      <div className="bg-white rounded-xl border p-6 space-y-5">
        <h3 className="font-semibold">Cash Reconciliation</h3>
        <div>
          <label className="block text-sm font-medium mb-1">Opening Balance (PHP) <span className="text-red-500">*</span></label>
          <input type="number" min="0" step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="0.00" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} />
          <p className="text-xs text-muted-foreground mt-1">Cash on hand at start of day.</p>
        </div>

        {/* Calculated expected cash */}
        {openingBalance && (
          <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
            <div className="flex justify-between"><span className="text-muted-foreground">Opening Balance</span><span>{formatCurrency(ob)}</span></div>
            <div className="flex justify-between text-green-700"><span>+ Cash Sales</span><span>{formatCurrency(cashSales)}</span></div>
            <div className="flex justify-between text-red-700"><span>− Cash Expenses</span><span>{formatCurrency(cashExpenses)}</span></div>
            <div className="flex justify-between font-semibold border-t pt-2"><span>Expected Cash</span><span>{formatCurrency(expectedCash)}</span></div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Actual Cash Count (PHP)</label>
          <input type="number" min="0" step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Count cash in drawer…" value={actualCash} onChange={(e) => setActualCash(e.target.value)} />
        </div>

        {/* Variance display */}
        {variance !== null && (
          <div className={`rounded-lg p-3 text-sm flex items-center gap-2 ${Math.abs(variance) < 0.01 ? 'bg-green-50 text-green-800' : variance > 0 ? 'bg-blue-50 text-blue-800' : 'bg-red-50 text-red-800'}`}>
            {Math.abs(variance) < 0.01 ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
            <span>Variance: <strong>{formatCurrency(variance)}</strong> {variance > 0.01 ? '(over)' : variance < -0.01 ? '(short)' : '(balanced)'}</span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Manager Notes</label>
          <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} placeholder="Any discrepancies, notes for HQ…" value={managerNotes} onChange={(e) => setManagerNotes(e.target.value)} />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            disabled={save.isPending || !openingBalance}
            onClick={() => save.mutate({ opening_balance: ob, actual_cash: actualCash ? ac : null, manager_notes: managerNotes, status: 'open' })}
            className="flex-1 border rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            Save Draft
          </button>
          <button
            disabled={save.isPending || !openingBalance}
            onClick={() => save.mutate({ opening_balance: ob, actual_cash: actualCash ? ac : null, manager_notes: managerNotes, status: 'closed' })}
            className="flex-1 bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Lock size={14} /> {save.isPending ? 'Closing…' : 'Close Day'}
          </button>
        </div>
      </div>
    </div>
  );
}
