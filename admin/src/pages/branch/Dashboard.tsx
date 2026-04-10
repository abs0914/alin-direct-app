import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { cn, formatCurrency } from '@/lib/utils';
import {
  Truck, DollarSign, Package, Users, Search, Loader2,
  ShoppingBag, ArrowRight, MapPin, Clock, CheckCircle2, AlertCircle,
} from 'lucide-react';

// ── Stat Card ───────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: string | number; icon: any; color: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
      <div className={cn('p-3 rounded-full', color)}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

// ── Quick Service Cards ─────────────────────────────────────────────
const QUICK_SERVICES = [
  { slug: 'cargo-parcel-delivery', name: 'Parcel Delivery', logo: '/logos/alincargo logo.png', initials: 'AC', color: '#E85D04' },
  { slug: 'cebuana-bills-payment', name: 'Bills Payment', logo: '/logos/cebuana logo.png', initials: 'CL', color: '#1B2D6B' },
  { slug: 'ecpay-load', name: 'E-Load', logo: '/logos/ecpay logo.png', initials: 'EP', color: '#4CAF50' },
  { slug: 'ecpay-cash-in', name: 'Cash In', logo: '/logos/ecpay logo.png', initials: 'EP', color: '#4CAF50' },
  { slug: 'stronghold-pa', name: 'Accident Insurance', logo: '/logos/stronghold logo.png', initials: 'SI', color: '#F5A010' },
  { slug: 'cebuana-domestic-remittance', name: 'Remittance', logo: '/logos/cebuana logo.png', initials: 'CL', color: '#1B2D6B' },
];

function ServiceLogo({ src, color, initials }: { src: string; color: string; initials: string }) {
  const [err, setErr] = useState(false);
  if (err) {
    return (
      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0"
        style={{ backgroundColor: color }}>{initials}</div>
    );
  }
  return (
    <img src={src} alt="" className="w-9 h-9 object-contain rounded-lg border border-border bg-white p-0.5 shrink-0"
      onError={() => setErr(true)} />
  );
}

// ── Tracking status helpers ─────────────────────────────────────────
const STATUS_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  pending:      { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
  broadcasting: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  accepted:     { icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  picked_up:    { icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' },
  in_transit:   { icon: Truck, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
  delivered:    { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
  cancelled:    { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
  failed:       { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
};

// ── Main ────────────────────────────────────────────────────────────
export default function BranchDashboard() {
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ['branch-stats'],
    queryFn: () => api.get('/branch-admin/stats').then((r) => r.data),
    placeholderData: { active_riders: 3, jobs_today: 12, revenue_today: 4850, pending_jobs: 2 },
  });

  // ── Parcel Tracking ──
  const [trackingInput, setTrackingInput] = useState('');
  const [trackingQuery, setTrackingQuery] = useState('');

  const { data: trackResult, isLoading: tracking, isError: trackErr, isFetched } = useQuery({
    queryKey: ['track-parcel', trackingQuery],
    queryFn: () => api.get(`/branch-admin/bookings/track`, { params: { q: trackingQuery } }).then((r) => r.data?.data ?? r.data),
    enabled: !!trackingQuery,
    retry: false,
  });

  const doTrack = () => { if (trackingInput.trim()) setTrackingQuery(trackingInput.trim()); };

  const statusCfg = trackResult?.status ? STATUS_CONFIG[trackResult.status] ?? STATUS_CONFIG.pending : null;
  const StatusIcon = statusCfg?.icon ?? Clock;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Branch Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Overview & quick actions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Riders" value={stats?.active_riders ?? 0} icon={Truck} color="bg-green-500" />
        <StatCard label="Jobs Today" value={stats?.jobs_today ?? 0} icon={Package} color="bg-blue-500" />
        <StatCard label="Pending Jobs" value={stats?.pending_jobs ?? 0} icon={Users} color="bg-yellow-500" />
        <StatCard label="Revenue Today" value={formatCurrency(stats?.revenue_today ?? 0)} icon={DollarSign} color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT — Tracking */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Search size={16} className="text-primary" /> Parcel Tracking
            </h3>
            <div className="flex gap-2">
              <input
                className="flex-1 border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                placeholder="Enter Booking # or Parcel #…"
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && doTrack()}
              />
              <button onClick={doTrack} disabled={!trackingInput.trim() || tracking}
                className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2">
                {tracking ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                Track
              </button>
            </div>

            {/* Result */}
            {tracking && (
              <div className="mt-4 flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin text-primary" />
              </div>
            )}

            {trackErr && isFetched && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-center">
                <AlertCircle size={24} className="mx-auto text-red-400 mb-2" />
                <p className="text-sm font-medium text-red-700">Booking not found</p>
                <p className="text-xs text-red-500 mt-1">Check the booking or parcel number and try again.</p>
              </div>
            )}

            {trackResult && !tracking && (
              <div className={cn('mt-4 rounded-lg border p-4', statusCfg?.bg ?? 'bg-muted')}>
                <div className="flex items-start gap-3">
                  <StatusIcon size={20} className={statusCfg?.color ?? 'text-muted-foreground'} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground">
                        {trackResult.booking_number ?? trackResult.tracking_number ?? 'N/A'}
                      </p>
                      <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full capitalize', statusCfg?.color, statusCfg?.bg)}>
                        {trackResult.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {trackResult.sender_name && (
                        <p className="flex items-center gap-1.5"><Users size={12} /> <span className="font-medium text-foreground">{trackResult.sender_name}</span> → {trackResult.receiver_name ?? '—'}</p>
                      )}
                      {(trackResult.pickup_address || trackResult.dropoff_address) && (
                        <p className="flex items-start gap-1.5"><MapPin size={12} className="mt-0.5 shrink-0" /> {trackResult.pickup_address ?? ''} → {trackResult.dropoff_address ?? ''}</p>
                      )}
                      {trackResult.rider_name && (
                        <p className="flex items-center gap-1.5"><Truck size={12} /> Rider: <span className="font-medium text-foreground">{trackResult.rider_name}</span></p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Quick Services */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <ShoppingBag size={16} className="text-primary" /> Quick Services
              </h3>
              <button onClick={() => navigate('/branch/sales/create')}
                className="text-xs text-primary hover:underline flex items-center gap-1">
                All Services <ArrowRight size={12} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {QUICK_SERVICES.map((svc) => (
                <button key={svc.slug}
                  onClick={() => navigate('/branch/sales/create', { state: { preselect: svc.slug } })}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-accent/50 transition-all text-left group">
                  <ServiceLogo src={svc.logo} color={svc.color} initials={svc.initials} />
                  <span className="text-xs font-medium text-foreground group-hover:text-primary leading-tight">{svc.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
