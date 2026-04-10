import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { api } from '@/lib/api';
import { DataTable, StatusBadge, PageHeader } from '@/components/DataTable';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Eye, Pencil, Trash2, X, ChevronDown } from 'lucide-react';

interface Rider { id: string; user?: { name: string }; vehicle_type: string; plate_number: string }
interface Job {
  id: string; tracking_uuid: string; status: string; vehicle_type: string;
  pickup_contact_name: string; pickup_contact_phone: string; pickup_address: string; pickup_notes?: string;
  dropoff_contact_name: string; dropoff_contact_phone: string; dropoff_address: string; dropoff_notes?: string;
  package_description?: string; package_size: string; package_weight_kg?: number; box_type: string;
  total_price: number; payment_method: string; payment_status: string; cod_collected: boolean;
  failure_reason?: string; failure_notes?: string;
  accepted_at?: string; picked_up_at?: string; delivered_at?: string; failed_at?: string; cancelled_at?: string;
  created_at: string;
  rider?: { id: string; user?: { name: string } };
  proof_of_delivery?: { photo_url: string; recipient_name: string; signature_url?: string };
}

const VEHICLE_TYPES = ['motorcycle', 'mpv', 'van', 'truck'];
const PACKAGE_SIZES = ['small', 'medium', 'large', 'xl'];
const BOX_TYPES = ['own_box', 'alin_box'];
const PAYMENT_METHODS = ['cod', 'gcash', 'maya', 'bank_transfer', 'prepaid'];
const JOB_STATUSES = ['pending', 'broadcasting', 'accepted', 'in_transit', 'delivered', 'failed', 'cancelled'];

const defaultJobForm = {
  vehicle_type: 'motorcycle', payment_method: 'cod',
  pickup_contact_name: '', pickup_contact_phone: '', pickup_address: '', pickup_notes: '',
  dropoff_contact_name: '', dropoff_contact_phone: '', dropoff_address: '', dropoff_notes: '',
  package_description: '', package_size: 'small', package_weight_kg: '', box_type: 'own_box', total_price: '',
};

// ── Job Detail / View Modal ────────────────────────────────────────────────────
function JobDetailModal({ job, onClose, onStatusChange }: { job: Job; onClose: () => void; onStatusChange: (status: string, reason?: string) => void }) {
  const [statusPick, setStatusPick] = useState('');
  const [failureReason, setFailureReason] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="font-semibold text-lg">Job #{job.tracking_uuid.slice(0, 8)}</h2>
            <StatusBadge status={job.status} />
          </div>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6 space-y-5 text-sm">
          {/* Pickup */}
          <section>
            <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">Pickup</h3>
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-muted-foreground">Contact</span><p>{job.pickup_contact_name} · {job.pickup_contact_phone}</p></div>
              <div><span className="text-muted-foreground">Address</span><p>{job.pickup_address}</p></div>
              {job.pickup_notes && <div className="col-span-2"><span className="text-muted-foreground">Notes</span><p>{job.pickup_notes}</p></div>}
            </div>
          </section>
          {/* Dropoff */}
          <section>
            <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">Dropoff</h3>
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-muted-foreground">Contact</span><p>{job.dropoff_contact_name} · {job.dropoff_contact_phone}</p></div>
              <div><span className="text-muted-foreground">Address</span><p>{job.dropoff_address}</p></div>
              {job.dropoff_notes && <div className="col-span-2"><span className="text-muted-foreground">Notes</span><p>{job.dropoff_notes}</p></div>}
            </div>
          </section>
          {/* Package */}
          <section>
            <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">Package</h3>
            <div className="grid grid-cols-3 gap-2">
              <div><span className="text-muted-foreground">Size</span><p className="capitalize">{job.package_size}</p></div>
              <div><span className="text-muted-foreground">Weight</span><p>{job.package_weight_kg ? `${job.package_weight_kg} kg` : '—'}</p></div>
              <div><span className="text-muted-foreground">Vehicle</span><p className="capitalize">{job.vehicle_type}</p></div>
              {job.package_description && <div className="col-span-3"><span className="text-muted-foreground">Description</span><p>{job.package_description}</p></div>}
            </div>
          </section>
          {/* Payment */}
          <section>
            <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">Payment</h3>
            <div className="grid grid-cols-3 gap-2">
              <div><span className="text-muted-foreground">Total</span><p className="font-semibold">{formatCurrency(job.total_price)}</p></div>
              <div><span className="text-muted-foreground">Method</span><p className="uppercase">{job.payment_method}</p></div>
              <div><span className="text-muted-foreground">COD Collected</span><p>{job.cod_collected ? '✅ Yes' : '—'}</p></div>
            </div>
          </section>
          {/* Rider */}
          <section>
            <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">Rider</h3>
            <p>{job.rider?.user?.name ?? <span className="text-muted-foreground">Unassigned</span>}</p>
          </section>
          {/* Timestamps */}
          <section>
            <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">Timeline</h3>
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-muted-foreground">Created</span><p>{formatDate(job.created_at)}</p></div>
              {job.accepted_at && <div><span className="text-muted-foreground">Accepted</span><p>{formatDate(job.accepted_at)}</p></div>}
              {job.picked_up_at && <div><span className="text-muted-foreground">Picked Up</span><p>{formatDate(job.picked_up_at)}</p></div>}
              {job.delivered_at && <div><span className="text-muted-foreground">Delivered</span><p>{formatDate(job.delivered_at)}</p></div>}
              {job.failed_at && <div><span className="text-muted-foreground">Failed</span><p>{formatDate(job.failed_at)}</p></div>}
              {job.cancelled_at && <div><span className="text-muted-foreground">Cancelled</span><p>{formatDate(job.cancelled_at)}</p></div>}
            </div>
          </section>
          {/* Failure */}
          {(job.failure_reason || job.failure_notes) && (
            <section className="bg-red-50 rounded-lg p-3">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-red-700 mb-1">Failure</h3>
              <p>{job.failure_reason}</p>
              {job.failure_notes && <p className="text-muted-foreground mt-1">{job.failure_notes}</p>}
            </section>
          )}
          {/* Proof of delivery */}
          {job.proof_of_delivery && (
            <section>
              <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">Proof of Delivery</h3>
              <p className="mb-2 text-muted-foreground">Received by: <strong>{job.proof_of_delivery.recipient_name}</strong></p>
              <img src={job.proof_of_delivery.photo_url} alt="Proof" className="rounded-lg max-h-48 object-contain border" />
            </section>
          )}
          {/* Status update */}
          {!['delivered', 'cancelled'].includes(job.status) && (
            <section className="border-t pt-4">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">Update Status</h3>
              <div className="flex gap-2 flex-wrap">
                {JOB_STATUSES.filter((s) => s !== job.status).map((s) => (
                  <button key={s} onClick={() => setStatusPick(s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${statusPick === s ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-gray-50'}`}
                  >{s.replace(/_/g, ' ')}</button>
                ))}
              </div>
              {statusPick === 'failed' && (
                <input className="mt-2 w-full border rounded-lg px-3 py-2 text-sm" placeholder="Failure reason…" value={failureReason} onChange={(e) => setFailureReason(e.target.value)} />
              )}
              {statusPick && (
                <button
                  onClick={() => { onStatusChange(statusPick, failureReason || undefined); setStatusPick(''); }}
                  className="mt-3 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium"
                >
                  Confirm → {statusPick.replace(/_/g, ' ')}
                </button>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Create / Edit Job Modal ────────────────────────────────────────────────────
function JobFormModal({ initial, riders, onClose, onSave, saving }: {
  initial?: Partial<typeof defaultJobForm> & { id?: string };
  riders: Rider[];
  onClose: () => void;
  onSave: (data: any) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({ ...defaultJobForm, ...initial });
  const [riderId, setRiderId] = useState(initial?.id ? '' : '');
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold text-lg">{initial?.id ? 'Edit Job' : 'New Delivery Job'}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6 space-y-5 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Vehicle Type</label>
              <select className="w-full border rounded-lg px-3 py-2" value={form.vehicle_type} onChange={(e) => set('vehicle_type', e.target.value)}>
                {VEHICLE_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Payment Method</label>
              <select className="w-full border rounded-lg px-3 py-2" value={form.payment_method} onChange={(e) => set('payment_method', e.target.value)}>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m.toUpperCase()}</option>)}
              </select>
            </div>
          </div>
          <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Pickup</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block font-medium mb-1">Contact Name</label><input className="w-full border rounded-lg px-3 py-2" value={form.pickup_contact_name} onChange={(e) => set('pickup_contact_name', e.target.value)} /></div>
            <div><label className="block font-medium mb-1">Contact Phone</label><input className="w-full border rounded-lg px-3 py-2" value={form.pickup_contact_phone} onChange={(e) => set('pickup_contact_phone', e.target.value)} /></div>
          </div>
          <div><label className="block font-medium mb-1">Pickup Address</label><textarea className="w-full border rounded-lg px-3 py-2" rows={2} value={form.pickup_address} onChange={(e) => set('pickup_address', e.target.value)} /></div>
          <div><label className="block font-medium mb-1">Pickup Notes</label><input className="w-full border rounded-lg px-3 py-2" value={form.pickup_notes} onChange={(e) => set('pickup_notes', e.target.value)} /></div>

          <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Dropoff</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block font-medium mb-1">Contact Name</label><input className="w-full border rounded-lg px-3 py-2" value={form.dropoff_contact_name} onChange={(e) => set('dropoff_contact_name', e.target.value)} /></div>
            <div><label className="block font-medium mb-1">Contact Phone</label><input className="w-full border rounded-lg px-3 py-2" value={form.dropoff_contact_phone} onChange={(e) => set('dropoff_contact_phone', e.target.value)} /></div>
          </div>
          <div><label className="block font-medium mb-1">Dropoff Address</label><textarea className="w-full border rounded-lg px-3 py-2" rows={2} value={form.dropoff_address} onChange={(e) => set('dropoff_address', e.target.value)} /></div>
          <div><label className="block font-medium mb-1">Dropoff Notes</label><input className="w-full border rounded-lg px-3 py-2" value={form.dropoff_notes} onChange={(e) => set('dropoff_notes', e.target.value)} /></div>

          <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Package</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-medium mb-1">Size</label>
              <select className="w-full border rounded-lg px-3 py-2" value={form.package_size} onChange={(e) => set('package_size', e.target.value)}>
                {PACKAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="block font-medium mb-1">Weight (kg)</label><input type="number" step="0.1" className="w-full border rounded-lg px-3 py-2" value={form.package_weight_kg} onChange={(e) => set('package_weight_kg', e.target.value)} /></div>
            <div>
              <label className="block font-medium mb-1">Box</label>
              <select className="w-full border rounded-lg px-3 py-2" value={form.box_type} onChange={(e) => set('box_type', e.target.value)}>
                {BOX_TYPES.map((b) => <option key={b} value={b}>{b.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          </div>
          <div><label className="block font-medium mb-1">Package Description</label><input className="w-full border rounded-lg px-3 py-2" value={form.package_description} onChange={(e) => set('package_description', e.target.value)} /></div>
          <div>
            <label className="block font-medium mb-1">Total Price (PHP)</label>
            <input type="number" step="0.01" className="w-full border rounded-lg px-3 py-2" value={form.total_price} onChange={(e) => set('total_price', e.target.value)} />
          </div>
          {riders.length > 0 && (
            <div>
              <label className="block font-medium mb-1">Assign Rider (optional)</label>
              <select className="w-full border rounded-lg px-3 py-2" value={riderId} onChange={(e) => setRiderId(e.target.value)}>
                <option value="">Unassigned</option>
                {riders.map((r) => <option key={r.id} value={r.id}>{r.user?.name} · {r.plate_number} ({r.vehicle_type})</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 border rounded-lg px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
          <button
            disabled={saving || !form.pickup_address || !form.dropoff_address || !form.pickup_contact_name || !form.dropoff_contact_name}
            onClick={() => onSave({ ...form, total_price: parseFloat(form.total_price as any) || 0, package_weight_kg: form.package_weight_kg ? parseFloat(form.package_weight_kg as any) : null, rider_id: riderId || undefined, id: initial?.id })}
            className="flex-1 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Job'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function DeliveryJobListBranch() {
  const qc = useQueryClient();
  const [detail, setDetail] = useState<Job | null>(null);
  const [formModal, setFormModal] = useState<null | 'create' | Job>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['branch-jobs', statusFilter],
    queryFn: () => api.get('/branch-admin/jobs', { params: statusFilter ? { status: statusFilter } : {} }).then((r) => r.data.data ?? r.data),
    initialData: [],
    refetchInterval: 30_000,
  });

  const { data: availableRiders = [] } = useQuery<Rider[]>({
    queryKey: ['branch-available-riders'],
    queryFn: () => api.get('/branch-admin/riders/available').then((r) => r.data.data ?? []),
  });

  const saveJob = useMutation({
    mutationFn: (payload: any) =>
      payload.id ? api.put(`/branch-admin/jobs/${payload.id}`, payload) : api.post('/branch-admin/jobs', payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['branch-jobs'] }); setFormModal(null); },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status, failure_reason }: { id: string; status: string; failure_reason?: string }) =>
      api.put(`/branch-admin/jobs/${id}/status`, { status, failure_reason }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['branch-jobs'] });
      setDetail((prev) => prev ? { ...prev, status: vars.status } : null);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/branch-admin/jobs/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['branch-jobs'] }); setDeleteId(null); },
  });

  const columns: ColumnDef<Job>[] = [
    { accessorKey: 'tracking_uuid', header: 'Tracking', cell: ({ getValue }) => <span className="font-mono text-xs">{getValue<string>().slice(0, 8)}…</span> },
    { accessorKey: 'status', header: 'Status', cell: ({ getValue }) => <StatusBadge status={getValue<string>()} /> },
    { accessorFn: (r) => r.rider?.user?.name, header: 'Rider', cell: ({ getValue }) => getValue<string>() ?? <span className="text-muted-foreground text-xs">Unassigned</span> },
    { accessorKey: 'vehicle_type', header: 'Vehicle', cell: ({ getValue }) => <span className="capitalize text-xs">{getValue<string>()}</span> },
    { accessorKey: 'pickup_address', header: 'Pickup', cell: ({ getValue }) => <span className="max-w-[130px] truncate block text-xs">{getValue<string>()}</span> },
    { accessorKey: 'dropoff_address', header: 'Dropoff', cell: ({ getValue }) => <span className="max-w-[130px] truncate block text-xs">{getValue<string>()}</span> },
    { accessorKey: 'total_price', header: 'Amount', cell: ({ getValue }) => formatCurrency(getValue<number>()) },
    { accessorKey: 'payment_method', header: 'Pay', cell: ({ getValue }) => <span className="uppercase text-xs">{getValue<string>()}</span> },
    { accessorKey: 'created_at', header: 'Date', cell: ({ getValue }) => formatDate(getValue<string>()) },
    {
      id: 'actions', header: '', cell: ({ row }) => (
        <div className="flex gap-1">
          <button onClick={() => setDetail(row.original)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600" title="View"><Eye size={14} /></button>
          <button onClick={() => setFormModal(row.original)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Edit"><Pencil size={14} /></button>
          <button onClick={() => setDeleteId(row.original.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500" title="Delete"><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Delivery Jobs"
        subtitle="Branch delivery jobs — live view"
        action={
          <div className="flex gap-3">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-md px-3 py-2 text-sm">
              <option value="">All statuses</option>
              {JOB_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
            <button onClick={() => setFormModal('create')} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90">
              <Plus size={16} /> New Job
            </button>
          </div>
        }
      />
      <div className="p-6">
        <DataTable columns={columns} data={data ?? []} isLoading={isLoading} />
      </div>

      {detail && (
        <JobDetailModal
          job={detail}
          onClose={() => setDetail(null)}
          onStatusChange={(status, reason) => updateStatus.mutate({ id: detail.id, status, failure_reason: reason })}
        />
      )}

      {(formModal === 'create' || (formModal && typeof formModal === 'object')) && (
        <JobFormModal
          riders={availableRiders}
          initial={formModal !== 'create' ? { ...(formModal as Job), package_weight_kg: (formModal as Job).package_weight_kg != null ? String((formModal as Job).package_weight_kg) : '', total_price: String((formModal as Job).total_price) } : undefined}
          onClose={() => setFormModal(null)}
          saving={saveJob.isPending}
          onSave={(d) => saveJob.mutate(d)}
        />
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="font-semibold mb-2">Delete Delivery Job?</h3>
            <p className="text-sm text-muted-foreground mb-5">This cannot be undone.</p>
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
