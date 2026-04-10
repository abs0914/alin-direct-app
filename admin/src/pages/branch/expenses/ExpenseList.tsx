import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { api } from '@/lib/api';
import { DataTable, PageHeader } from '@/components/DataTable';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

interface Expense {
  id: string;
  category: string;
  vendor_name: string;
  amount: number;
  payment_method: string;
  description: string;
  created_by?: { name: string };
  created_at: string;
}

const CATEGORIES = ['utilities', 'supplies', 'salaries', 'rent', 'maintenance', 'other'];
const PAYMENT_METHODS = ['cash', 'gcash', 'bank_transfer', 'check', 'other'];

const defaultForm = { category: 'supplies', vendor_name: '', amount: '', payment_method: 'cash', description: '' };

function ExpenseModal({ initial, onClose, onSave, saving }: {
  initial?: typeof defaultForm & { id?: string };
  onClose: () => void;
  onSave: (data: typeof defaultForm & { id?: string }) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState(initial ?? defaultForm);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">{initial?.id ? 'Edit Expense' : 'Add Expense'}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.category} onChange={(e) => set('category', e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Vendor / Payee</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Meralco, supplier name…" value={form.vendor_name} onChange={(e) => set('vendor_name', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Amount (PHP)</label>
            <input type="number" min="0" step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="0.00" value={form.amount} onChange={(e) => set('amount', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Payment Method</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.payment_method} onChange={(e) => set('payment_method', e.target.value)}>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} placeholder="Notes…" value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border rounded-lg px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
          <button
            disabled={saving || !form.amount}
            onClick={() => onSave({ ...form, id: initial?.id })}
            className="flex-1 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ExpenseList() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<null | 'create' | Expense>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['branch-expenses'],
    queryFn: () => api.get('/branch-admin/expenses').then((r) => r.data.data ?? r.data),
    initialData: [],
  });

  const save = useMutation({
    mutationFn: (payload: any) =>
      payload.id
        ? api.put(`/branch-admin/expenses/${payload.id}`, payload)
        : api.post('/branch-admin/expenses', payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['branch-expenses'] }); setModal(null); },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/branch-admin/expenses/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['branch-expenses'] }); setDeleteId(null); },
  });

  const columns: ColumnDef<Expense>[] = [
    { accessorKey: 'category', header: 'Category', cell: ({ getValue }) => <span className="capitalize">{getValue<string>()}</span> },
    { accessorKey: 'vendor_name', header: 'Vendor', cell: ({ getValue }) => getValue<string>() ?? '—' },
    { accessorKey: 'amount', header: 'Amount', cell: ({ getValue }) => formatCurrency(getValue<number>()) },
    { accessorKey: 'payment_method', header: 'Payment', cell: ({ getValue }) => <span className="capitalize">{getValue<string>().replace(/_/g, ' ')}</span> },
    { accessorKey: 'description', header: 'Description', cell: ({ getValue }) => <span className="max-w-[200px] truncate block">{getValue<string>() ?? '—'}</span> },
    { accessorFn: (r) => r.created_by?.name, header: 'By', cell: ({ getValue }) => getValue<string>() ?? '—' },
    { accessorKey: 'created_at', header: 'Date', cell: ({ getValue }) => formatDate(getValue<string>()) },
    {
      id: 'actions', header: '', cell: ({ row }) => (
        <div className="flex gap-2">
          <button onClick={() => setModal(row.original)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500"><Pencil size={14} /></button>
          <button onClick={() => setDeleteId(row.original.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Expenses"
        subtitle="Branch expense records"
        action={
          <button onClick={() => setModal('create')} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90">
            <Plus size={16} /> Add Expense
          </button>
        }
      />
      <div className="p-6">
        <DataTable columns={columns} data={data ?? []} isLoading={isLoading} />
      </div>

      {(modal === 'create' || (modal && typeof modal === 'object')) && (
        <ExpenseModal
          initial={modal !== 'create' ? { id: (modal as Expense).id, category: (modal as Expense).category, vendor_name: (modal as Expense).vendor_name ?? '', amount: String((modal as Expense).amount), payment_method: (modal as Expense).payment_method, description: (modal as Expense).description ?? '' } : undefined}
          onClose={() => setModal(null)}
          saving={save.isPending}
          onSave={(data) => save.mutate({ category: data.category, vendor_name: data.vendor_name, amount: parseFloat(data.amount as any), payment_method: data.payment_method, description: data.description, id: data.id })}
        />
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="font-semibold mb-2">Delete Expense?</h3>
            <p className="text-sm text-muted-foreground mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 border rounded-lg px-4 py-2 text-sm">Cancel</button>
              <button onClick={() => remove.mutate(deleteId!)} disabled={remove.isPending} className="flex-1 bg-red-600 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50">
                {remove.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
