import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { api } from '@/lib/api';
import { DataTable, PageHeader } from '@/components/DataTable';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Service { id: string; name: string }
interface ServiceCategory { id: string; name: string; services: Service[] }
interface SalesTransaction {
  id: string;
  service?: { name: string; service_category?: { name: string } };
  amount: number;
  payment_method: string;
  customer_name: string;
  reference_number: string;
  notes: string;
  created_by?: { name: string };
  created_at: string;
}

const PAYMENT_METHODS = ['cash', 'gcash', 'maya', 'bank_transfer', 'cod', 'credit_card', 'other'];
const defaultForm = { service_id: '', amount: '', payment_method: 'cash', customer_name: '', reference_number: '', notes: '' };

function SalesModal({ initial, categories, onClose, onSave, saving }: {
  initial?: typeof defaultForm & { id?: string };
  categories: ServiceCategory[];
  onClose: () => void;
  onSave: (data: typeof defaultForm & { id?: string }) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState(initial ?? defaultForm);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const allServices = categories.flatMap((c) => c.services.map((s) => ({ ...s, category: c.name })));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">{initial?.id ? 'Edit Transaction' : 'New Transaction'}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="space-y-4">
          {!initial?.id && (
            <div>
              <label className="block text-sm font-medium mb-1">Service</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.service_id} onChange={(e) => set('service_id', e.target.value)}>
                <option value="">Select a service…</option>
                {categories.map((cat) => (
                  <optgroup key={cat.id} label={cat.name}>
                    {cat.services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
          )}
          {initial?.id && <div><label className="block text-sm font-medium mb-1">Service</label><p className="text-sm text-muted-foreground">{allServices.find((s) => s.id === form.service_id)?.name ?? 'N/A'}</p></div>}
          <div>
            <label className="block text-sm font-medium mb-1">Customer Name</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Walk-in customer name…" value={form.customer_name} onChange={(e) => set('customer_name', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Amount (PHP)</label>
            <input type="number" min="0" step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="0.00" value={form.amount} onChange={(e) => set('amount', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Payment Method</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.payment_method} onChange={(e) => set('payment_method', e.target.value)}>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m.replace(/_/g, ' ').toUpperCase()}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reference No. (optional)</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="GCash ref, receipt no…" value={form.reference_number} onChange={(e) => set('reference_number', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border rounded-lg px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
          <button
            disabled={saving || !form.amount || (!initial?.id && !form.service_id)}
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

export default function SalesTransactionList() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<null | 'create' | SalesTransaction>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const navTo = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['branch-sales'],
    queryFn: () => api.get('/branch-admin/sales').then((r) => r.data.data ?? r.data),
    initialData: [],
  });

  const { data: categories = [] } = useQuery<ServiceCategory[]>({
    queryKey: ['branch-services'],
    queryFn: () => api.get('/branch-admin/services').then((r) => r.data.data ?? []),
  });

  const save = useMutation({
    mutationFn: (payload: any) =>
      payload.id
        ? api.put(`/branch-admin/sales/${payload.id}`, payload)
        : api.post('/branch-admin/sales', payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['branch-sales'] }); setModal(null); },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/branch-admin/sales/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['branch-sales'] }); setDeleteId(null); },
  });

  const columns: ColumnDef<SalesTransaction>[] = [
    { accessorFn: (r) => r.service?.service_category?.name, header: 'Category', cell: ({ getValue }) => getValue<string>() ?? '—' },
    { accessorFn: (r) => r.service?.name, header: 'Service', cell: ({ getValue }) => getValue<string>() ?? '—' },
    { accessorKey: 'customer_name', header: 'Customer', cell: ({ getValue }) => getValue<string>() ?? '—' },
    { accessorKey: 'amount', header: 'Amount', cell: ({ getValue }) => formatCurrency(getValue<number>()) },
    { accessorKey: 'payment_method', header: 'Payment', cell: ({ getValue }) => <span className="capitalize">{getValue<string>().replace(/_/g, ' ')}</span> },
    { accessorKey: 'reference_number', header: 'Reference', cell: ({ getValue }) => getValue<string>() ?? '—' },
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
        title="Sales Transactions"
        subtitle="Branch sales records"
        action={
          <div className="flex gap-2">
            <button onClick={() => navTo('/branch/sales/create')} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90">
              <Plus size={16} /> POS Sale
            </button>
            <button onClick={() => setModal('create')} className="flex items-center gap-2 border border-border px-4 py-2 rounded-md text-sm font-medium hover:bg-muted">
              <Plus size={16} /> Quick Entry
            </button>
          </div>
        }
      />
      <div className="p-6">
        <DataTable columns={columns} data={data ?? []} isLoading={isLoading} />
      </div>

      {(modal === 'create' || (modal && typeof modal === 'object')) && (
        <SalesModal
          categories={categories}
          initial={modal !== 'create' ? {
            id: (modal as SalesTransaction).id,
            service_id: '',
            amount: String((modal as SalesTransaction).amount),
            payment_method: (modal as SalesTransaction).payment_method,
            customer_name: (modal as SalesTransaction).customer_name ?? '',
            reference_number: (modal as SalesTransaction).reference_number ?? '',
            notes: (modal as SalesTransaction).notes ?? '',
          } : undefined}
          onClose={() => setModal(null)}
          saving={save.isPending}
          onSave={(d) => save.mutate({
            service_id: d.service_id,
            amount: parseFloat(d.amount as any),
            payment_method: d.payment_method,
            customer_name: d.customer_name,
            reference_number: d.reference_number,
            notes: d.notes,
            id: d.id,
          })}
        />
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="font-semibold mb-2">Delete Transaction?</h3>
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
