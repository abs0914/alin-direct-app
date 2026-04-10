import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { api } from '@/lib/api';
import { DataTable, StatusBadge, PageHeader } from '@/components/DataTable';
import { formatDate } from '@/lib/utils';
import { Eye, X, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface Rider {
  id: string;
  vehicle_type: string; plate_number: string; vehicle_brand?: string; vehicle_model?: string; vehicle_color?: string;
  status: string; availability: string; rating: number; total_deliveries: number;
  license_url?: string; or_cr_url?: string; nbi_clearance_url?: string; selfie_url?: string;
  kyc_verified_at?: string;
  maya_wallet_id?: string; maya_phone?: string;
  terms_accepted: boolean; terms_accepted_at?: string;
  created_at: string;
  user?: { name: string; phone: string; email: string };
}

function KycImage({ label, url }: { label: string; url?: string }) {
  if (!url) return <div className="border rounded-lg p-3 flex flex-col items-center gap-1 bg-gray-50"><span className="text-xs text-muted-foreground">{label}</span><span className="text-xs">No file</span></div>;
  return (
    <div className="border rounded-lg p-2 flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <a href={url} target="_blank" rel="noopener noreferrer">
        <img src={url} alt={label} className="rounded object-cover h-28 w-full" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        <span className="text-xs text-blue-600 hover:underline">Open full size ↗</span>
      </a>
    </div>
  );
}

function RiderDetailModal({ rider, onClose, onStatusChange, updating }: {
  rider: Rider;
  onClose: () => void;
  onStatusChange: (status: string) => void;
  updating: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="font-semibold text-lg">{rider.user?.name}</h2>
            <div className="flex gap-2 mt-1">
              <StatusBadge status={rider.status} />
              <StatusBadge status={rider.availability} />
            </div>
          </div>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6 space-y-5 text-sm">
          {/* Contact */}
          <section>
            <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">Contact</h3>
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-muted-foreground">Phone</span><p>{rider.user?.phone ?? '—'}</p></div>
              <div><span className="text-muted-foreground">Email</span><p>{rider.user?.email ?? '—'}</p></div>
            </div>
          </section>
          {/* Vehicle */}
          <section>
            <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">Vehicle</h3>
            <div className="grid grid-cols-3 gap-2">
              <div><span className="text-muted-foreground">Type</span><p className="capitalize">{rider.vehicle_type}</p></div>
              <div><span className="text-muted-foreground">Plate</span><p>{rider.plate_number ?? '—'}</p></div>
              <div><span className="text-muted-foreground">Brand</span><p>{rider.vehicle_brand ?? '—'}</p></div>
              <div><span className="text-muted-foreground">Model</span><p>{rider.vehicle_model ?? '—'}</p></div>
              <div><span className="text-muted-foreground">Color</span><p>{rider.vehicle_color ?? '—'}</p></div>
            </div>
          </section>
          {/* Performance */}
          <section>
            <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">Performance</h3>
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-muted-foreground">Rating</span><p>⭐ {Number(rider.rating).toFixed(1)}</p></div>
              <div><span className="text-muted-foreground">Total Deliveries</span><p>{rider.total_deliveries}</p></div>
            </div>
          </section>
          {/* Payment */}
          {(rider.maya_wallet_id || rider.maya_phone) && (
            <section>
              <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">Maya Wallet</h3>
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Wallet ID</span><p>{rider.maya_wallet_id ?? '—'}</p></div>
                <div><span className="text-muted-foreground">Maya Phone</span><p>{rider.maya_phone ?? '—'}</p></div>
              </div>
            </section>
          )}
          {/* Terms */}
          <section>
            <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">Compliance</h3>
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-muted-foreground">Terms Accepted</span><p>{rider.terms_accepted ? `✅ ${formatDate(rider.terms_accepted_at)}` : '❌ Not accepted'}</p></div>
              <div><span className="text-muted-foreground">KYC Verified</span><p>{rider.kyc_verified_at ? `✅ ${formatDate(rider.kyc_verified_at)}` : '⏳ Pending'}</p></div>
              <div><span className="text-muted-foreground">Joined</span><p>{formatDate(rider.created_at)}</p></div>
            </div>
          </section>
          {/* KYC Documents */}
          <section>
            <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3">KYC Documents</h3>
            <div className="grid grid-cols-2 gap-3">
              <KycImage label="Driver's License" url={rider.license_url} />
              <KycImage label="OR/CR" url={rider.or_cr_url} />
              <KycImage label="NBI Clearance" url={rider.nbi_clearance_url} />
              <KycImage label="Selfie with ID" url={rider.selfie_url} />
            </div>
          </section>
          {/* Actions */}
          <section className="border-t pt-4">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3">Actions</h3>
            <div className="flex flex-wrap gap-2">
              {rider.status === 'pending' && (
                <>
                  <button disabled={updating} onClick={() => onStatusChange('approved')} className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50">
                    <CheckCircle size={14} /> Approve
                  </button>
                  <button disabled={updating} onClick={() => onStatusChange('rejected')} className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50">
                    <XCircle size={14} /> Reject
                  </button>
                </>
              )}
              {rider.status === 'approved' && (
                <button disabled={updating} onClick={() => onStatusChange('suspended')} className="flex items-center gap-1.5 bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50">
                  <AlertTriangle size={14} /> Suspend
                </button>
              )}
              {rider.status === 'suspended' && (
                <button disabled={updating} onClick={() => onStatusChange('approved')} className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50">
                  <CheckCircle size={14} /> Reinstate
                </button>
              )}
              {rider.status !== 'blacklisted' && (
                <button disabled={updating} onClick={() => onStatusChange('blacklisted')} className="flex items-center gap-1.5 bg-gray-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50">
                  <XCircle size={14} /> Blacklist
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// ── Dummy Riders (fallback when API is offline) ─────────────────────
const DUMMY_RIDERS: Rider[] = [
  { id: '1', vehicle_type: 'motorcycle', plate_number: 'ABC 1234', vehicle_brand: 'Honda', vehicle_model: 'Click 125i', vehicle_color: 'Black', status: 'approved', availability: 'online', rating: 4.8, total_deliveries: 156, terms_accepted: true, terms_accepted_at: '2025-06-01T08:00:00Z', kyc_verified_at: '2025-06-02T10:00:00Z', created_at: '2025-05-28T09:00:00Z', user: { name: 'Mark Gonzales', phone: '+63 917 111 2222', email: 'mark.g@email.com' } },
  { id: '2', vehicle_type: 'motorcycle', plate_number: 'DEF 5678', vehicle_brand: 'Yamaha', vehicle_model: 'Mio Aerox', vehicle_color: 'Blue', status: 'approved', availability: 'online', rating: 4.6, total_deliveries: 98, terms_accepted: true, terms_accepted_at: '2025-07-10T08:00:00Z', kyc_verified_at: '2025-07-11T14:00:00Z', created_at: '2025-07-08T10:30:00Z', user: { name: 'Jason Ramos', phone: '+63 918 222 3333', email: 'jason.r@email.com' } },
  { id: '3', vehicle_type: 'motorcycle', plate_number: 'GHI 9012', vehicle_brand: 'Suzuki', vehicle_model: 'Raider 150', vehicle_color: 'Red', status: 'approved', availability: 'offline', rating: 4.9, total_deliveries: 234, terms_accepted: true, terms_accepted_at: '2025-04-15T08:00:00Z', kyc_verified_at: '2025-04-16T09:00:00Z', created_at: '2025-04-12T11:00:00Z', user: { name: 'Carlo Mendoza', phone: '+63 919 333 4444', email: 'carlo.m@email.com' } },
  { id: '4', vehicle_type: 'car', plate_number: 'JKL 3456', vehicle_brand: 'Toyota', vehicle_model: 'Vios', vehicle_color: 'White', status: 'pending', availability: 'offline', rating: 0, total_deliveries: 0, terms_accepted: true, terms_accepted_at: '2026-03-20T08:00:00Z', created_at: '2026-03-18T15:00:00Z', user: { name: 'Dennis Aquino', phone: '+63 920 444 5555', email: 'dennis.a@email.com' } },
  { id: '5', vehicle_type: 'motorcycle', plate_number: 'MNO 7890', vehicle_brand: 'Honda', vehicle_model: 'TMX 125', vehicle_color: 'Black', status: 'suspended', availability: 'offline', rating: 3.2, total_deliveries: 45, terms_accepted: true, terms_accepted_at: '2025-08-01T08:00:00Z', kyc_verified_at: '2025-08-02T10:00:00Z', created_at: '2025-07-25T09:00:00Z', user: { name: 'Ryan Torres', phone: '+63 921 555 6666', email: 'ryan.t@email.com' } },
  { id: '6', vehicle_type: 'motorcycle', plate_number: 'PQR 1122', vehicle_brand: 'Yamaha', vehicle_model: 'NMAX', vehicle_color: 'Gray', status: 'approved', availability: 'online', rating: 4.5, total_deliveries: 67, terms_accepted: true, terms_accepted_at: '2025-11-05T08:00:00Z', kyc_verified_at: '2025-11-06T11:00:00Z', created_at: '2025-11-01T08:00:00Z', user: { name: 'Miguel Flores', phone: '+63 922 666 7777', email: 'miguel.f@email.com' } },
];

export default function RiderListBranch() {
  const qc = useQueryClient();
  const [detail, setDetail] = useState<Rider | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['branch-riders'],
    queryFn: () => api.get('/branch-admin/riders').then((r) => r.data.data ?? r.data).catch(() => DUMMY_RIDERS),
    initialData: DUMMY_RIDERS,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/branch-admin/riders/${id}/status`, { status }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['branch-riders'] });
      setDetail((prev) => prev ? { ...prev, status: vars.status } : null);
    },
  });

  const filtered = statusFilter ? (data ?? []).filter((r: Rider) => r.status === statusFilter) : (data ?? []);

  const columns: ColumnDef<Rider>[] = [
    { accessorFn: (r) => r.user?.name, header: 'Name' },
    { accessorFn: (r) => r.user?.phone, header: 'Phone' },
    { accessorKey: 'vehicle_type', header: 'Vehicle', cell: ({ getValue }) => <span className="capitalize text-xs">{getValue<string>()}</span> },
    { accessorKey: 'plate_number', header: 'Plate', cell: ({ getValue }) => getValue<string>() ?? '—' },
    { accessorKey: 'status', header: 'Status', cell: ({ getValue }) => <StatusBadge status={getValue<string>()} /> },
    { accessorKey: 'availability', header: 'Online', cell: ({ getValue }) => <StatusBadge status={getValue<string>()} /> },
    { accessorKey: 'rating', header: 'Rating', cell: ({ getValue }) => `⭐ ${Number(getValue<number>()).toFixed(1)}` },
    { accessorKey: 'total_deliveries', header: 'Trips' },
    { accessorKey: 'created_at', header: 'Joined', cell: ({ getValue }) => formatDate(getValue<string>()) },
    {
      id: 'actions', header: '', cell: ({ row }) => (
        <button onClick={() => setDetail(row.original)} className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full hover:bg-blue-100">
          <Eye size={12} /> View
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Riders"
        subtitle="Branch rider roster"
        action={
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-md px-3 py-2 text-sm">
            <option value="">All statuses</option>
            {['pending', 'approved', 'suspended', 'rejected', 'blacklisted'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        }
      />
      <div className="p-6">
        <DataTable columns={columns} data={filtered} isLoading={isLoading} />
      </div>

      {detail && (
        <RiderDetailModal
          rider={detail}
          onClose={() => setDetail(null)}
          updating={updateStatus.isPending}
          onStatusChange={(status) => updateStatus.mutate({ id: detail.id, status })}
        />
      )}
    </div>
  );
}
