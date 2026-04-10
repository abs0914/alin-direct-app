import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { api } from '@/lib/api';
import { DataTable, PageHeader } from '@/components/DataTable';
import { formatDate } from '@/lib/utils';
import { Pencil, X, CreditCard, Shield, Loader2, Download } from 'lucide-react';
import QRCode from 'qrcode';

interface Customer {
  id: string;
  company_name?: string;
  default_address?: string;
  total_bookings: number;
  created_at: string;
  user?: { name: string; phone: string; email: string };
}

function CustomerEditModal({ customer, onClose, onSave, saving }: {
  customer: Customer;
  onClose: () => void;
  onSave: (data: { company_name: string; default_address: string }) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({ company_name: customer.company_name ?? '', default_address: customer.default_address ?? '' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Edit Customer</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="space-y-4 text-sm">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="font-medium">{customer.user?.name}</p>
            <p className="text-muted-foreground">{customer.user?.phone} · {customer.user?.email}</p>
          </div>
          <div>
            <label className="block font-medium mb-1">Company Name</label>
            <input className="w-full border rounded-lg px-3 py-2" placeholder="Optional…" value={form.company_name} onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))} />
          </div>
          <div>
            <label className="block font-medium mb-1">Default Address</label>
            <textarea className="w-full border rounded-lg px-3 py-2" rows={3} value={form.default_address} onChange={(e) => setForm((f) => ({ ...f, default_address: e.target.value }))} />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border rounded-lg px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
          <button disabled={saving} onClick={() => onSave(form)} className="flex-1 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Insurance Card Preview Modal ─────────────────────────────────────
const AMBER = '#F5A010';
const COVERAGE = [
  { benefit: 'Accidental Death', amount: '₱100,000' },
  { benefit: 'Murder & Assault', amount: '₱10,000' },
  { benefit: 'Medical Reimbursement', amount: '₱5,000' },
  { benefit: 'Burial Benefits', amount: '₱5,000' },
];

function getVerifyUrl(policyNumber: string): string {
  return `${window.location.origin}/verify/pai/${policyNumber}`;
}

// ── Canvas Card Renderer ──────────────────────────────────────────
async function renderCardToCanvas(policy: any): Promise<HTMLCanvasElement> {
  const W = 900, H = 560;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Background
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, AMBER);
  grad.addColorStop(1, '#D48A00');
  ctx.fillStyle = grad;
  roundRect(ctx, 0, 0, W, H, 24);
  ctx.fill();

  // White card body
  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, 20, 130, W - 40, H - 150, 16);
  ctx.fill();

  // Header text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText('Stronghold Insurance', 30, 40);
  ctx.font = 'bold 28px system-ui, sans-serif';
  ctx.fillText('Personal Accident Insurance', 30, 75);
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('Underwritten by Stronghold Insurance Company, Inc.', 30, 100);

  // Policy badge
  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, 30, 110, 160, 26, 13);
  ctx.fill();
  ctx.fillStyle = AMBER;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText(policy.policy_number ?? 'PAI-XXXXXX', 48, 128);

  // Status badge
  const status = (policy.status ?? 'active').toUpperCase();
  const isActive = policy.status === 'active';
  ctx.fillStyle = isActive ? '#DEF7EC' : '#FDE8E8';
  roundRect(ctx, W - 140, 110, 110, 26, 13);
  ctx.fill();
  ctx.fillStyle = isActive ? '#03543F' : '#9B1C1C';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText(status, W - 110, 128);

  // Policyholder info
  const leftX = 45, rightX = W / 2 + 20;
  let y = 175;
  ctx.fillStyle = '#6B7280';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('Policyholder', leftX, y);
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText(policy.full_name ?? '—', leftX, y + 20);

  y += 50;
  ctx.fillStyle = '#6B7280';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('Valid From', leftX, y);
  ctx.fillStyle = '#374151';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText(fmtDate(policy.valid_from), leftX, y + 20);

  ctx.fillStyle = '#6B7280';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('Valid Until', rightX, y);
  ctx.fillStyle = '#374151';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText(fmtDate(policy.valid_until), rightX, y + 20);

  // Coverage table
  y += 55;
  ctx.fillStyle = AMBER;
  roundRect(ctx, 40, y, W - 80, 28, 8);
  ctx.fill();
  // Only top corners rounded for header — overwrite bottom with same fill
  ctx.fillRect(40, y + 14, W - 80, 14);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('Coverage Benefits', 55, y + 19);

  y += 28;
  COVERAGE.forEach((c, i) => {
    ctx.fillStyle = i % 2 === 0 ? '#F9FAFB' : '#FFFFFF';
    ctx.fillRect(40, y, W - 80, 30);
    ctx.fillStyle = '#4B5563';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText(c.benefit, 55, y + 20);
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(c.amount, W - 60, y + 20);
    ctx.textAlign = 'left';
    y += 30;
  });

  // Bottom border for table
  ctx.strokeStyle = '#E5E7EB';
  ctx.lineWidth = 1;
  ctx.strokeRect(40, y - 120, W - 80, 120 + 28);

  // QR code — real
  const qrX = W - 150, qrY = H - 130, qrS = 90;
  try {
    const verifyUrl = getVerifyUrl(policy.policy_number ?? 'PAI-000000');
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: qrS * 2,
      margin: 1,
      color: { dark: '#111827', light: '#FFFFFF' },
    });
    const qrImg = await loadImage(qrDataUrl);
    ctx.drawImage(qrImg, qrX, qrY, qrS, qrS);
  } catch {
    // Fallback placeholder if QR generation fails
    ctx.strokeStyle = AMBER;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(qrX, qrY, qrS, qrS);
    ctx.setLineDash([]);
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('QR Code', qrX + qrS / 2, qrY + qrS / 2 - 4);
    ctx.fillText('Verify Policy', qrX + qrS / 2, qrY + qrS / 2 + 10);
    ctx.textAlign = 'left';
  }
  ctx.fillStyle = '#9CA3AF';
  ctx.font = '9px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Scan to verify', qrX + qrS / 2, qrY + qrS + 14);
  ctx.textAlign = 'left';

  // Footer
  ctx.fillStyle = '#9CA3AF';
  ctx.font = '10px system-ui, sans-serif';
  ctx.fillText('ALiN Direct · Powered by Stronghold Insurance', 45, H - 25);

  return canvas;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return '—'; }
}

function InsuranceCardModal({ customerId, onClose }: { customerId: string; onClose: () => void }) {
  const { data: policy, isLoading, isError } = useQuery({
    queryKey: ['customer-pai', customerId],
    queryFn: () => api.get(`/branch-admin/customers/${customerId}/insurance-card`).then((r) => r.data?.data ?? r.data),
  });

  // Generate QR code data URL for the modal preview
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!policy?.policy_number) return;
    const url = getVerifyUrl(policy.policy_number);
    QRCode.toCanvas(qrCanvasRef.current!, url, { width: 96, margin: 1, color: { dark: '#111827', light: '#FFFFFF' } }).catch(() => {});
  }, [policy?.policy_number]);

  const [downloading, setDownloading] = useState(false);
  const handleDownload = useCallback(async () => {
    if (!policy) return;
    setDownloading(true);
    try {
      const canvas = await renderCardToCanvas(policy);
      const link = document.createElement('a');
      link.download = `PAI-Card-${policy.policy_number ?? 'card'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setDownloading(false);
    }
  }, [policy]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Golden header */}
        <div className="px-6 py-5 text-white" style={{ background: `linear-gradient(135deg, ${AMBER}, #D48A00)` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield size={28} />
              <div>
                <p className="text-xs font-medium opacity-80">Stronghold Insurance</p>
                <p className="text-lg font-bold">Personal Accident</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded transition-colors"><X size={18} /></button>
          </div>
        </div>

        <div className="p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin" style={{ color: AMBER }} />
            </div>
          )}

          {isError && (
            <div className="text-center py-10">
              <Shield size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-500 font-medium">No active insurance policy</p>
              <p className="text-xs text-gray-400 mt-1">This customer does not have a PAI enrollment.</p>
            </div>
          )}

          {policy && !isLoading && (
            <div className="space-y-4">
              {/* Policy number badge */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{ backgroundColor: AMBER }}>
                  {policy.policy_number}
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  policy.status === 'active' ? 'bg-green-100 text-green-700' :
                  policy.status === 'expired' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {policy.status?.toUpperCase()}
                </span>
              </div>

              {/* Policyholder details */}
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Policyholder</span>
                  <span className="font-semibold text-gray-900">{policy.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Valid From</span>
                  <span className="font-medium text-gray-700">{formatDate(policy.valid_from)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Valid Until</span>
                  <span className="font-medium text-gray-700">{formatDate(policy.valid_until)}</span>
                </div>
              </div>

              {/* Coverage table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: AMBER }}>
                  Coverage Benefits
                </div>
                <div className="divide-y divide-gray-100">
                  {COVERAGE.map((c) => (
                    <div key={c.benefit} className="flex justify-between px-3 py-2 text-sm">
                      <span className="text-gray-600">{c.benefit}</span>
                      <span className="font-semibold text-gray-900">{c.amount}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center pt-2">
                <canvas ref={qrCanvasRef} className="w-24 h-24 rounded-lg" />
                <p className="text-[10px] text-gray-400 mt-1">Scan to verify policy</p>
              </div>

              {/* Download Card button */}
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-white text-sm font-semibold transition-colors hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: AMBER }}
              >
                {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                {downloading ? 'Generating…' : 'Download Insurance Card'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Dummy Customers (fallback when API is offline) ──────────────────
const DUMMY_CUSTOMERS: Customer[] = [
  { id: '1', company_name: 'Reyes Sari-Sari Store', default_address: '123 Rizal St, Brgy. San Jose, Antipolo, Rizal', total_bookings: 24, created_at: '2025-09-15T08:00:00Z', user: { name: 'Maria Reyes', phone: '+63 917 123 4567', email: 'maria.reyes@email.com' } },
  { id: '2', company_name: 'JD Trading', default_address: '456 Bonifacio Ave, Marikina City', total_bookings: 18, created_at: '2025-10-02T10:30:00Z', user: { name: 'Juan Dela Cruz', phone: '+63 918 234 5678', email: 'juan.dc@email.com' } },
  { id: '3', company_name: undefined, default_address: '789 Mabini Rd, Cainta, Rizal', total_bookings: 7, created_at: '2025-11-20T14:15:00Z', user: { name: 'Angela Santos', phone: '+63 919 345 6789', email: 'angela.santos@email.com' } },
  { id: '4', company_name: 'Pinoy Express Logistics', default_address: '22 Shaw Blvd, Mandaluyong City', total_bookings: 42, created_at: '2025-08-05T09:00:00Z', user: { name: 'Roberto Garcia', phone: '+63 920 456 7890', email: 'roberto.g@email.com' } },
  { id: '5', company_name: undefined, default_address: '55 Katipunan Ave, Quezon City', total_bookings: 3, created_at: '2026-01-10T16:45:00Z', user: { name: 'Patricia Lim', phone: '+63 921 567 8901', email: 'patricia.lim@email.com' } },
  { id: '6', company_name: 'Barangay Fresh Market', default_address: '10 Market St, Brgy. Poblacion, Pasig City', total_bookings: 31, created_at: '2025-07-22T11:20:00Z', user: { name: 'Eduardo Villanueva', phone: '+63 922 678 9012', email: 'ed.villa@email.com' } },
];

// ── Main Component ──────────────────────────────────────────────────
export default function CustomerListBranch() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Customer | null>(null);
  const [viewingCard, setViewingCard] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['branch-customers'],
    queryFn: () => api.get('/branch-admin/customers').then((r) => r.data.data ?? r.data).catch(() => DUMMY_CUSTOMERS),
    initialData: DUMMY_CUSTOMERS,
  });

  const save = useMutation({
    mutationFn: ({ id, ...payload }: any) => api.put(`/branch-admin/customers/${id}`, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['branch-customers'] }); setEditing(null); },
  });

  const columns: ColumnDef<Customer>[] = [
    { accessorFn: (r) => r.user?.name, header: 'Name' },
    { accessorFn: (r) => r.user?.phone, header: 'Phone', cell: ({ getValue }) => getValue<string>() ?? '—' },
    { accessorFn: (r) => r.user?.email, header: 'Email', cell: ({ getValue }) => getValue<string>() ?? '—' },
    { accessorKey: 'company_name', header: 'Company', cell: ({ getValue }) => getValue<string>() ?? '—' },
    { accessorKey: 'default_address', header: 'Default Address', cell: ({ getValue }) => <span className="max-w-[200px] truncate block text-xs">{getValue<string>() ?? '—'}</span> },
    { accessorKey: 'total_bookings', header: 'Bookings' },
    { accessorKey: 'created_at', header: 'Joined', cell: ({ getValue }) => formatDate(getValue<string>()) },
    {
      id: 'actions', header: '', cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button onClick={() => setViewingCard(row.original.id)}
            title="Insurance Card"
            className="p-1.5 rounded hover:bg-amber-50 transition-colors" style={{ color: AMBER }}>
            <CreditCard size={14} />
          </button>
          <button onClick={() => setEditing(row.original)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500"><Pencil size={14} /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Customers" subtitle="Branch customers" />
      <div className="p-6">
        <DataTable columns={columns} data={data ?? []} isLoading={isLoading} />
      </div>
      {editing && (
        <CustomerEditModal
          customer={editing}
          onClose={() => setEditing(null)}
          saving={save.isPending}
          onSave={(d) => save.mutate({ id: editing.id, ...d })}
        />
      )}
      {viewingCard && (
        <InsuranceCardModal customerId={viewingCard} onClose={() => setViewingCard(null)} />
      )}
    </div>
  );
}
