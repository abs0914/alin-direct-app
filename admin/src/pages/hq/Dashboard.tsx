import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Truck, Users, Package, DollarSign } from 'lucide-react';

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="bg-white rounded-lg border p-5 flex items-center gap-4">
      <div className={`p-3 rounded-full ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

export default function HQDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['hq-stats'],
    queryFn: () => api.get('/admin/stats').then((r) => r.data),
    placeholderData: { total_branches: 0, total_riders: 0, total_jobs_today: 0, total_revenue_today: 0 },
  });

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">HQ Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Branches" value={stats?.total_branches ?? 0} icon={Package} color="bg-blue-500" />
        <StatCard label="Active Riders" value={stats?.total_riders ?? 0} icon={Truck} color="bg-green-500" />
        <StatCard label="Jobs Today" value={stats?.total_jobs_today ?? 0} icon={Users} color="bg-orange-500" />
        <StatCard label="Revenue Today" value={formatCurrency(stats?.total_revenue_today ?? 0)} icon={DollarSign} color="bg-purple-500" />
      </div>
      <p className="text-muted-foreground text-sm">More analytics widgets coming soon.</p>
    </div>
  );
}
