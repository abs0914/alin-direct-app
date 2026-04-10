/**
 * Delivery Jobs list (HQ) — replaces Filament DeliveryJobResource
 */
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { api } from '@/lib/api';
import { DataTable, StatusBadge, PageHeader } from '@/components/DataTable';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Job {
  id: string;
  tracking_uuid: string;
  status: string;
  vehicle_type: string;
  pickup_address: string;
  dropoff_address: string;
  total_price: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
  branch?: { name: string };
  rider?: { user?: { name: string } };
}

const columns: ColumnDef<Job>[] = [
  { accessorKey: 'tracking_uuid', header: 'Tracking', cell: ({ getValue }) => <span className="font-mono text-xs">{getValue<string>().slice(0, 8)}…</span> },
  { accessorKey: 'status', header: 'Status', cell: ({ getValue }) => <StatusBadge status={getValue<string>()} /> },
  { accessorKey: 'vehicle_type', header: 'Vehicle', cell: ({ getValue }) => <span className="capitalize">{getValue<string>()}</span> },
  { accessorFn: (r) => r.branch?.name, header: 'Branch' },
  { accessorFn: (r) => r.rider?.user?.name, header: 'Rider', cell: ({ getValue }) => getValue<string>() ?? '—' },
  { accessorKey: 'pickup_address', header: 'Pickup', cell: ({ getValue }) => <span className="max-w-[150px] truncate block">{getValue<string>()}</span> },
  { accessorKey: 'total_price', header: 'Total', cell: ({ getValue }) => formatCurrency(getValue<number>()) },
  { accessorKey: 'payment_method', header: 'Payment', cell: ({ getValue }) => <span className="uppercase text-xs">{getValue<string>()}</span> },
  { accessorKey: 'payment_status', header: 'Paid', cell: ({ getValue }) => <StatusBadge status={getValue<string>()} /> },
  { accessorKey: 'created_at', header: 'Date', cell: ({ getValue }) => formatDate(getValue<string>()) },
];

export default function DeliveryJobListHQ() {
  const { data, isLoading } = useQuery({
    queryKey: ['hq-jobs'],
    queryFn: () => api.get('/admin/jobs').then((r) => r.data.data ?? r.data),
    initialData: [],
  });

  return (
    <div>
      <PageHeader title="Delivery Jobs" subtitle="All jobs across the network" />
      <div className="p-6">
        <DataTable columns={columns} data={data ?? []} isLoading={isLoading} />
      </div>
    </div>
  );
}
